
import json
from firebase_functions import https_fn

def handle_cors(req: https_fn.Request) -> https_fn.Response | None:
    """Handles CORS preflight requests."""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '3600',
    }
    if req.method == 'OPTIONS':
        return https_fn.Response('', status=204, headers=headers)
    return None

def get_cors_headers():
    """Returns CORS headers to include in all responses."""
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

def validate_request(req: https_fn.Request) -> tuple[dict | None, https_fn.Response | None]:
    """Validates the request and returns the data or an error response."""
    cors_headers = get_cors_headers()
    cors_headers['Content-Type'] = 'application/json'

    if req.method != 'POST':
        return None, https_fn.Response(
            json.dumps({'success': False, 'error': 'Method not allowed'}),
            status=405,
            headers=cors_headers
        )

    try:
        request_data = req.get_json()
        if not request_data or 'prompt' not in request_data:
            return None, https_fn.Response(
                json.dumps({'success': False, 'error': 'Missing prompt in request body'}),
                status=400,
                headers=cors_headers
            )

        prompt = request_data['prompt']
        if not prompt or not isinstance(prompt, str) or len(prompt.strip()) == 0:
            return None, https_fn.Response(
                json.dumps({'success': False, 'error': 'Prompt cannot be empty'}),
                status=400,
                headers=cors_headers
            )

        if len(prompt) > 2000:
            return None, https_fn.Response(
                json.dumps({'success': False, 'error': 'Prompt too long (max 2000 characters)'}),
                status=400,
                headers=cors_headers
            )

        return request_data, None
    except Exception as e:
        return None, https_fn.Response(
            json.dumps({'success': False, 'error': f'Invalid request: {str(e)}'}),
            status=400,
            headers=cors_headers
        )
