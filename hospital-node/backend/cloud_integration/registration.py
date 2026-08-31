import os
import json
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any
from django.conf import settings
from . import client

logger = logging.getLogger(__name__)

CREDENTIALS_FILE_NAME = '.node_credentials.json'


def get_credentials_path() -> Path:
    base_dir = getattr(settings, 'BASE_DIR', Path(__file__).resolve().parent.parent)
    return Path(base_dir) / CREDENTIALS_FILE_NAME


def load_node_credentials() -> Optional[dict]:
    cred_file = get_credentials_path()
    if not cred_file.exists():
        return None
    try:
        with open(cred_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"Failed to read node credentials file: {e}")
        return None


def save_node_credentials(node_id: str, hospital_code: str, node_token: str) -> bool:
    cred_file = get_credentials_path()
    data = {
        "node_id": node_id,
        "hospital_code": hospital_code,
        "node_token": node_token,
    }
    try:
        with open(cred_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        logger.info(f"Node credentials for '{node_id}' saved securely to {cred_file.name}")
        return True
    except Exception as e:
        logger.error(f"Failed to save node credentials: {e}")
        return False


def register_node() -> Tuple[bool, str]:
    """
    Registers the Hospital Node with the Cloud Control Plane.
    Returns: (success: bool, message: str)
    """
    hosp_code = getattr(settings, 'RESPIRA_HOSPITAL_CODE', 'HOSP-DEMO')
    node_id = getattr(settings, 'RESPIRA_NODE_ID', 'NODE-HOSP-DEMO-01')
    version = getattr(settings, 'RESPIRA_NODE_VERSION', '0.1.0')

    payload = {
        "hospital_code": hosp_code,
        "node_id": node_id,
        "installed_version": version
    }

    logger.info(f"Registering Hospital Node '{node_id}' for hospital [{hosp_code}] with Cloud Control Plane...")
    success, res_data, err_msg = client.post_cloud_request('/nodes/register/', payload)

    if not success:
        return False, f"Cloud registration failed: {err_msg}"

    if not res_data or 'node_credentials' not in res_data:
        return False, "Registration response missing node credentials."

    raw_token = res_data['node_credentials'].get('node_token')
    if not raw_token:
        return False, "No node authentication token returned by Cloud."

    saved = save_node_credentials(node_id=node_id, hospital_code=hosp_code, node_token=raw_token)
    if not saved:
        return False, "Failed to persist node credential locally."

    return True, f"Hospital Node '{node_id}' registered successfully. Credential stored."
