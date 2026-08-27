import logging
from typing import Tuple
from django.conf import settings
from . import client
from .registration import load_node_credentials, register_node

logger = logging.getLogger(__name__)


def send_heartbeat() -> Tuple[bool, str]:
    """
    Sends an operational heartbeat from Hospital Node to Cloud Control Plane.
    Returns: (success: bool, message: str)
    """
    node_id = getattr(settings, 'RESPIRA_NODE_ID', 'NODE-HOSP-DEMO-01')
    version = getattr(settings, 'RESPIRA_NODE_VERSION', '0.1.0')

    creds = load_node_credentials()
    if not creds or 'node_token' not in creds:
        logger.warning(f"No node credentials found for '{node_id}'. Attempting automatic cloud registration...")
        reg_success, reg_msg = register_node()
        if not reg_success:
            return False, f"Heartbeat aborted. Automatic registration failed: {reg_msg}"
        creds = load_node_credentials()

    token = creds.get('node_token', '') if creds else ''
    headers = {
        'X-Node-Token': token
    }

    payload = {
        "node_id": node_id,
        "installed_version": version
    }

    success, res_data, err_msg = client.post_cloud_request('/nodes/heartbeat/', payload, headers=headers)

    if not success:
        logger.warning(f"[Cloud Heartbeat] Heartbeat for node '{node_id}' failed: {err_msg}")
        return False, f"Heartbeat failed: {err_msg}"

    node_status = res_data.get('node_status', 'UNKNOWN') if res_data else 'UNKNOWN'
    logger.info(f"[Cloud Heartbeat] Heartbeat acknowledged for node '{node_id}'. Cloud Status: {node_status}")
    return True, f"Heartbeat acknowledged. Cloud Node Status: {node_status}"
