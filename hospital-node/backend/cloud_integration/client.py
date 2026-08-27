import logging
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Tuple, Optional
from django.conf import settings

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT_SECONDS = 5.0


def _get_cloud_url(endpoint: str) -> str:
    base_url = getattr(settings, 'RESPIRA_CLOUD_URL', 'http://127.0.0.1:8002/api').rstrip('/')
    endpoint_path = endpoint if endpoint.startswith('/') else f'/{endpoint}'
    return f"{base_url}{endpoint_path}"


def post_cloud_request(endpoint: str, data: Dict[str, Any], headers: Optional[Dict[str, str]] = None) -> Tuple[bool, Optional[Dict[str, Any]], str]:
    """
    Sends an HTTP POST request to the Cloud Control Plane safely.
    Returns: (success: bool, response_data: dict, error_message: str)
    """
    url = _get_cloud_url(endpoint)
    req_headers = {'Content-Type': 'application/json'}
    if headers:
        req_headers.update(headers)

    body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers=req_headers, method='POST')

    try:
        with urllib.request.urlopen(req, timeout=DEFAULT_TIMEOUT_SECONDS) as response:
            res_body = response.read().decode('utf-8')
            res_data = json.loads(res_body) if res_body else {}
            return True, res_data, ""
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8') if e.fp else ""
        try:
            err_data = json.loads(err_body)
            err_msg = err_data.get('error') or err_data.get('detail') or str(err_data)
        except Exception:
            err_msg = f"HTTP Error {e.code}: {e.reason}"
        logger.warning(f"[Cloud Client] HTTP {e.code} error requesting {url}: {err_msg}")
        return False, None, err_msg
    except urllib.error.URLError as e:
        err_msg = f"Network connection failed: {e.reason}"
        logger.warning(f"[Cloud Client] Connection error requesting {url}: {err_msg}")
        return False, None, err_msg
    except TimeoutError:
        err_msg = "Connection timed out connecting to Cloud Control Plane."
        logger.warning(f"[Cloud Client] Timeout error requesting {url}")
        return False, None, err_msg
    except Exception as e:
        err_msg = f"Unexpected client error: {str(e)}"
        logger.warning(f"[Cloud Client] Error requesting {url}: {err_msg}")
        return False, None, err_msg
