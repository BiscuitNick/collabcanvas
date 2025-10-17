
from firebase_functions import https_fn
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app
import json
from utils import handle_cors, validate_request
from openai_service import text_to_canvas_commands
from replicate_service import text_to_canvas_commands_replicate

set_global_options(max_instances=10)
initialize_app()

@https_fn.on_request()
def hello_world(req: https_fn.Request) -> https_fn.Response:
    cors_response = handle_cors(req)
    if cors_response:
        return cors_response

    response_data = {"hello": "world"}
    return https_fn.Response(
        json.dumps(response_data),
        status=200,
        headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ''}
    )

@https_fn.on_request(secrets=["OPENAI_API_KEY"])
def ai_text_to_canvas(req: https_fn.Request) -> https_fn.Response:
    cors_response = handle_cors(req)
    if cors_response:
        return cors_response

    request_data, error_response = validate_request(req)
    if error_response:
        return error_response

    prompt = request_data['prompt']
    model = request_data.get('model', 'gpt-5-mini')

    result = text_to_canvas_commands(prompt, model)

    if result['success']:
        return https_fn.Response(
            json.dumps(result),
            status=200,
            headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ''}
        )
    else:
        return https_fn.Response(
            json.dumps({'success': False, 'error': result['error']}),
            status=500,
            headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ''}
        )

@https_fn.on_request(secrets=["REPLICATE_API_TOKEN"])
def ai_text_to_canvas_replicate(req: https_fn.Request) -> https_fn.Response:
    cors_response = handle_cors(req)
    if cors_response:
        return cors_response

    request_data, error_response = validate_request(req)
    if error_response:
        return error_response

    prompt = request_data['prompt']
    model = request_data.get('model', 'gpt-5-mini')

    result = text_to_canvas_commands_replicate(prompt, model)

    if result['success']:
        return https_fn.Response(
            json.dumps(result),
            status=200,
            headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ''}
        )
    else:
        return https_fn.Response(
            json.dumps({'success': False, 'error': result['error']}),
            status=500,
            headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ''}
        )
