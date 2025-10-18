
from firebase_functions import https_fn
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app
import json
from utils import handle_cors, validate_request
from openai_service import text_to_canvas_commands
from replicate_service import text_to_canvas_commands_replicate, generate_image_replicate

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
        headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
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
    selected_content = request_data.get('selectedContent')

    print(f"[OpenAI Endpoint] Request - Model: {model}, Has selected content: {selected_content is not None}")

    result = text_to_canvas_commands(prompt, model, selected_content)

    print(f"[OpenAI Endpoint] Response - Success: {result['success']}, Commands: {len(result.get('data', {}).get('commands', []))}")
    if not result['success']:
        print(f"[OpenAI Endpoint] Error: {result.get('error')}")

    if result['success']:
        return https_fn.Response(
            json.dumps(result),
            status=200,
            headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        )
    else:
        return https_fn.Response(
            json.dumps({'success': False, 'error': result['error']}),
            status=500,
            headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
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
    selected_content = request_data.get('selectedContent')

    print(f"[Replicate Endpoint] Request - Model: {model}, Has selected content: {selected_content is not None}")

    result = text_to_canvas_commands_replicate(prompt, model, selected_content)

    print(f"[Replicate Endpoint] Response - Success: {result['success']}, Commands: {len(result.get('data', {}).get('commands', []))}")
    if not result['success']:
        print(f"[Replicate Endpoint] Error: {result.get('error')}")

    if result['success']:
        return https_fn.Response(
            json.dumps(result),
            status=200,
            headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        )
    else:
        return https_fn.Response(
            json.dumps({'success': False, 'error': result['error']}),
            status=500,
            headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        )

@https_fn.on_request(secrets=["REPLICATE_API_TOKEN"])
def ai_generate_image(req: https_fn.Request) -> https_fn.Response:
    cors_response = handle_cors(req)
    if cors_response:
        return cors_response

    request_data, error_response = validate_request(req)
    if error_response:
        return error_response

    prompt = request_data['prompt']
    model = request_data.get('model', 'seedream-4')

    print(f"[Image Generation Endpoint] Request - Model: {model}, Prompt: {prompt[:50]}...")

    result = generate_image_replicate(prompt, model)

    print(f"[Image Generation Endpoint] Response - Success: {result['success']}")
    if not result['success']:
        print(f"[Image Generation Endpoint] Error: {result.get('error')}")

    if result['success']:
        return https_fn.Response(
            json.dumps(result),
            status=200,
            headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        )
    else:
        return https_fn.Response(
            json.dumps({'success': False, 'error': result['error']}),
            status=500,
            headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        )
