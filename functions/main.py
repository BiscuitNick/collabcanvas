# Firebase Functions for HTTP API
from firebase_functions import https_fn
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app
import json
import os
import time
from openai import OpenAI
import replicate
from prompts import get_canvas_system_prompt, CANVAS_SYSTEM_PROMPT

# For cost control, you can set the maximum number of containers that can be
# running at the same time. This helps mitigate the impact of unexpected
# traffic spikes by instead downgrading performance. This limit is a per-function
# limit. You can override the limit for each function using the max_instances
# parameter in the decorator, e.g. @https_fn.on_request(max_instances=5).
set_global_options(max_instances=10)

# Initialize Firebase Admin SDK
initialize_app()

# OpenAI client will be initialized lazily when needed
client = None

def get_openai_client():
    """Initialize OpenAI client lazily"""
    global client
    if client is None:
        # Get API key from Firebase Functions secrets
        api_key = os.environ.get('OPENAI_API_KEY')
        
        if not api_key:
            raise ValueError("OpenAI API key not found. Please ensure OPENAI_API_KEY is configured as a secret in Firebase Functions.")

        client = OpenAI(api_key=api_key)
    return client


@https_fn.on_request()
def hello_world(req: https_fn.Request) -> https_fn.Response:
    """
    Simple hello world function that returns { "hello": "world" }
    """
    # Set CORS headers for web requests
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
    
    # Handle preflight OPTIONS request
    if req.method == 'OPTIONS':
        return https_fn.Response('', status=204, headers=headers)
    
    # Return the hello world response
    response_data = {"hello": "world"}
    
    return https_fn.Response(
        json.dumps(response_data),
        status=200,
        headers={**headers, 'Content-Type': 'application/json'}
    )


@https_fn.on_request(secrets=["OPENAI_API_KEY"])
def ai_text_to_canvas(req: https_fn.Request) -> https_fn.Response:
    """
    AI Canvas Agent that converts natural language to canvas commands
    """
    # Set CORS headers for web requests
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
    
    # Log function start
    print("=" * 60)
    print("🤖 AI Canvas Agent Function Started")
    print("=" * 60)
    
    # Handle preflight OPTIONS request
    if req.method == 'OPTIONS':
        return https_fn.Response('', status=204, headers=headers)
    
    # Only allow POST requests
    if req.method != 'POST':
        return https_fn.Response(
            json.dumps({'success': False, 'error': 'Method not allowed'}),
            status=405,
            headers={**headers, 'Content-Type': 'application/json'}
        )
    
    try:
        # Parse request body
        request_data = req.get_json()
        if not request_data or 'prompt' not in request_data:
            return https_fn.Response(
                json.dumps({'success': False, 'error': 'Missing prompt in request body'}),
                status=400,
                headers={**headers, 'Content-Type': 'application/json'}
            )
        
        prompt = request_data['prompt']
        model = request_data.get('model', 'gpt-5-mini')  # Default to gpt-5-mini
        
        # Validate prompt
        if not prompt or not isinstance(prompt, str) or len(prompt.strip()) == 0:
            return https_fn.Response(
                json.dumps({'success': False, 'error': 'Prompt cannot be empty'}),
                status=400,
                headers={**headers, 'Content-Type': 'application/json'}
            )
        
        # Limit prompt length to prevent abuse
        if len(prompt) > 2000:
            return https_fn.Response(
                json.dumps({'success': False, 'error': 'Prompt too long (max 2000 characters)'}),
                status=400,
                headers={**headers, 'Content-Type': 'application/json'}
            )
        
        # Define the canvas tools schema for function calling
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "createShape",
                    "description": "Create a new shape on the canvas",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "shapeType": {
                                "type": "string",
                                "enum": ["rectangle", "circle", "text"],
                                "description": "Type of shape to create"
                            },
                            "x": {
                                "type": "number",
                                "description": "X position on canvas"
                            },
                            "y": {
                                "type": "number", 
                                "description": "Y position on canvas"
                            },
                            "width": {
                                "type": "number",
                                "description": "Width of the shape"
                            },
                            "height": {
                                "type": "number",
                                "description": "Height of the shape"
                            },
                            "fill": {
                                "type": "string",
                                "description": "Fill color (hex code like #FF0000)"
                            },
                            "text": {
                                "type": "string",
                                "description": "Text content (only for text shapes)"
                            },
                            "fontSize": {
                                "type": "number",
                                "description": "Font size (only for text shapes)"
                            }
                        },
                        "required": ["shapeType", "x", "y", "width", "height", "fill"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "moveShape",
                    "description": "Move an existing shape to a new position",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "shapeId": {
                                "type": "string",
                                "description": "ID of the shape to move"
                            },
                            "x": {
                                "type": "number",
                                "description": "New X position"
                            },
                            "y": {
                                "type": "number",
                                "description": "New Y position"
                            }
                        },
                        "required": ["shapeId", "x", "y"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "resizeShape",
                    "description": "Resize an existing shape",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "shapeId": {
                                "type": "string",
                                "description": "ID of the shape to resize"
                            },
                            "width": {
                                "type": "number",
                                "description": "New width"
                            },
                            "height": {
                                "type": "number",
                                "description": "New height"
                            }
                        },
                        "required": ["shapeId", "width", "height"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "rotateShape",
                    "description": "Rotate an existing shape",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "shapeId": {
                                "type": "string",
                                "description": "ID of the shape to rotate"
                            },
                            "rotation": {
                                "type": "number",
                                "description": "Rotation angle in degrees"
                            }
                        },
                        "required": ["shapeId", "rotation"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "getCanvasState",
                    "description": "Get the current state of all shapes on the canvas",
                    "parameters": {
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                }
            }
        ]
        
        # Call OpenAI API with function calling
        # Record start time
        start_time = time.time()
        
        try:
            openai_client = get_openai_client()
            
            # Log the start of OpenAI API call
            print(f"🚀 Starting OpenAI API call for prompt: '{prompt[:50]}{'...' if len(prompt) > 50 else ''}'")
            print(f"📊 Request details - Model: {model}, Max tokens: 16000, Temperature: 1.0")
            
            response = openai_client.chat.completions.create(
                model=model,  # Use the selected model
                messages=[
                    {
                        "role": "system", 
                        "content": CANVAS_SYSTEM_PROMPT
                    },
                    {
                        "role": "user", 
                        "content": f"{prompt}\n\nPlease generate ALL requested shapes in this single response. Do not limit the number of shapes you create."
                    }
                ],
                tools=tools,
                tool_choice="auto",
                max_completion_tokens=16000,
                temperature=1.0  # GPT-5 models only support default temperature of 1.0
            )
            
            # Calculate and log the completion time
            end_time = time.time()
            api_duration = (end_time - start_time) * 1000  # Convert to milliseconds
            
            print(f"✅ OpenAI API call completed successfully!")
            print(f"⏱️  API call duration: {api_duration:.2f}ms")
            
            # Process the response
            message = response.choices[0].message
            
            # Extract debugging information
            usage = response.usage
            debug_info = {
                "tokens_used": usage.total_tokens if usage else None,
                "prompt_tokens": usage.prompt_tokens if usage else None,
                "completion_tokens": usage.completion_tokens if usage else None,
                "model": model,
                "response_time_ms": None,  # Could add timing if needed
                "function_calls": len(message.tool_calls) if message.tool_calls else 0
            }
            
            # Log token usage details
            if usage:
                print(f"📈 Token usage - Total: {usage.total_tokens}, Prompt: {usage.prompt_tokens}, Completion: {usage.completion_tokens}")
            else:
                print("⚠️  No token usage information available")
            
            # Log function calls
            function_calls_count = len(message.tool_calls) if message.tool_calls else 0
            print(f"🔧 Function calls generated: {function_calls_count}")
            
            if message.tool_calls:
                # Extract function calls and convert to canvas commands
                print(f"🔄 Processing {len(message.tool_calls)} function calls...")
                canvas_commands = []
                for i, tool_call in enumerate(message.tool_calls, 1):
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)
                    
                    print(f"  📝 Processing call {i}/{len(message.tool_calls)}: {function_name}")
                    
                    # Convert function calls to canvas command format
                    if function_name == "createShape":
                        command = {
                            "action": "create",
                            "type": function_args["shapeType"],
                            "x": function_args["x"],
                            "y": function_args["y"],
                            "width": function_args["width"],
                            "height": function_args["height"],
                            "fill": function_args["fill"]
                        }
                        
                        # Add text-specific properties
                        if function_args["shapeType"] == "text":
                            command["text"] = function_args.get("text", "")
                            command["fontSize"] = function_args.get("fontSize", 16)
                        
                        canvas_commands.append(command)
                    
                    elif function_name == "moveShape":
                        canvas_commands.append({
                            "action": "move",
                            "shapeId": function_args["shapeId"],
                            "x": function_args["x"],
                            "y": function_args["y"]
                        })
                    
                    elif function_name == "resizeShape":
                        canvas_commands.append({
                            "action": "resize",
                            "shapeId": function_args["shapeId"],
                            "width": function_args["width"],
                            "height": function_args["height"]
                        })
                    
                    elif function_name == "rotateShape":
                        canvas_commands.append({
                            "action": "rotate",
                            "shapeId": function_args["shapeId"],
                            "rotation": function_args["rotation"]
                        })
                
                # Log final results
                print(f"🎯 Successfully generated {len(canvas_commands)} canvas commands")
                print(f"📤 Returning response to client...")
                
                # Return successful response with canvas commands
                return https_fn.Response(
                    json.dumps({
                        'success': True,
                        'data': {
                            'commands': canvas_commands,
                            'message': f"Successfully processed: {prompt}"
                        },
                        'debug': debug_info
                    }),
                    status=200,
                    headers={**headers, 'Content-Type': 'application/json'}
                )
            else:
                # No function calls made; attempt to parse JSON commands from the text content
                content_text = message.content or ""
                preview = content_text[:100] + ("..." if len(content_text) > 100 else "")
                print(f"💬 No function calls made; attempting JSON parse from text: '{preview}'")

                parsed_commands = []
                try:
                    cleaned = content_text.strip()
                    parsed_commands = json.loads(cleaned)
                    if not isinstance(parsed_commands, list):
                        parsed_commands = [parsed_commands]
                except Exception:
                    # Try extracting a JSON array from the content
                    import re
                    json_match = re.search(r'\[[\s\S]*?\]', content_text, re.DOTALL)
                    if json_match:
                        try:
                            parsed_commands = json.loads(json_match.group().strip())
                            if not isinstance(parsed_commands, list):
                                parsed_commands = [parsed_commands]
                        except Exception:
                            pass

                return https_fn.Response(
                    json.dumps({
                        'success': True,
                        'data': {
                            'commands': parsed_commands,
                            'message': f"Successfully processed: {prompt}"
                        },
                        'debug': debug_info
                    }),
                    status=200,
                    headers={**headers, 'Content-Type': 'application/json'}
                )
            
        except Exception as openai_error:
            end_time = time.time()
            api_duration = (end_time - start_time) * 1000  # Convert to milliseconds
            print(f"❌ OpenAI API error after {api_duration:.2f}ms: {str(openai_error)}")
            return https_fn.Response(
                json.dumps({
                    'success': False,
                    'error': f'OpenAI API error: {str(openai_error)}'
                }),
                status=500,
                headers={**headers, 'Content-Type': 'application/json'}
            )
    
    except Exception as e:
        print(f"💥 Function error: {str(e)}")
        return https_fn.Response(
            json.dumps({
                'success': False,
                'error': f'Internal server error: {str(e)}'
            }),
            status=500,
            headers={**headers, 'Content-Type': 'application/json'}
        )




@https_fn.on_request(secrets=["REPLICATE_API_TOKEN"])
def ai_text_to_canvas_replicate(req: https_fn.Request) -> https_fn.Response:
    """
    AI Canvas Agent using Replicate.com API that converts natural language to canvas commands
    """
    # Set CORS headers for web requests
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
    
    # Log function start
    print("=" * 60)
    print("🤖 AI Canvas Agent Function Started (Replicate)")
    print("=" * 60)
    
    # Handle preflight OPTIONS request
    if req.method == 'OPTIONS':
        return https_fn.Response('', status=204, headers=headers)
    
    # Only allow POST requests
    if req.method != 'POST':
        return https_fn.Response(
            json.dumps({'success': False, 'error': 'Method not allowed'}),
            status=405,
            headers={**headers, 'Content-Type': 'application/json'}
        )
    
    try:
        # Parse request body
        request_data = req.get_json()
        if not request_data or 'prompt' not in request_data:
            return https_fn.Response(
                json.dumps({'success': False, 'error': 'Missing prompt in request body'}),
                status=400,
                headers={**headers, 'Content-Type': 'application/json'}
            )
        
        prompt = request_data['prompt']
        model = request_data.get('model', 'gpt-5-mini')  # Default to gpt-5-mini
        
        # Validate prompt
        if not prompt or not isinstance(prompt, str) or len(prompt.strip()) == 0:
            return https_fn.Response(
                json.dumps({'success': False, 'error': 'Prompt cannot be empty'}),
                status=400,
                headers={**headers, 'Content-Type': 'application/json'}
            )
        
        # Limit prompt length to prevent abuse
        if len(prompt) > 2000:
            return https_fn.Response(
                json.dumps({'success': False, 'error': 'Prompt too long (max 2000 characters)'}),
                status=400,
                headers={**headers, 'Content-Type': 'application/json'}
            )
        
        # Get Replicate API token
        api_token = os.environ.get('REPLICATE_API_TOKEN')
        if not api_token:
            return https_fn.Response(
                json.dumps({'success': False, 'error': 'Replicate API token not configured'}),
                status=500,
                headers={**headers, 'Content-Type': 'application/json'}
            )
        
        # Prepare input payload for Replicate
        input_payload = {
            "prompt": prompt,
            "messages": [],
            "verbosity": "low",
            "image_input": [],
            "system_prompt": get_canvas_system_prompt(),
            "reasoning_effort": "minimal",
        }
        
        # Record start time
        start_time = time.time()
        
        try:
            # Log the start of Replicate API call
            print(f"🚀 Starting Replicate API call for prompt: '{prompt[:50]}{'...' if len(prompt) > 50 else ''}'")
            print(f"📊 Request details - Model: openai/{model}, Verbosity: low, Reasoning: minimal")
            
            # Call Replicate API
            raw_output = replicate.run(
                f"openai/{model}",
                input=input_payload,
                api_token=api_token,
            )
            
            # Calculate and log the completion time
            end_time = time.time()
            api_duration = (end_time - start_time) * 1000  # Convert to milliseconds
            
            print(f"✅ Replicate API call completed successfully!")
            print(f"⏱️  API call duration: {api_duration:.2f}ms")
            
            # Process the response
            print(f"🔍 Raw output type: {type(raw_output)}")
            print(f"🔍 Raw output content: {raw_output}")
            
            # Handle different response types from Replicate
            if isinstance(raw_output, list):
                # Join list elements to form complete JSON
                response_text = ''.join(raw_output)
                print(f"📝 Joined list elements: {response_text}")
                print(f"📝 Joined length: {len(response_text)}")
            else:
                response_text = str(raw_output)
                print(f"📝 Non-list response: {response_text}")
            
            print(f"📝 Final processed response: {response_text}")
            print(f"📝 Response length: {len(response_text)}")
            
            # Try to parse the response as JSON
            try:
                # First, try to clean the response text
                cleaned_response = response_text.strip()
                print(f"🔍 Attempting direct JSON parse of: {cleaned_response}")
                
                # Try direct JSON parsing
                canvas_commands = json.loads(cleaned_response)
                if not isinstance(canvas_commands, list):
                    canvas_commands = [canvas_commands]
                print(f"✅ Direct JSON parse successful, found {len(canvas_commands)} commands")
                    
            except json.JSONDecodeError as e:
                print(f"❌ Direct JSON parse failed: {e}")
                print(f"🔍 Trying regex extraction...")
                # If not valid JSON, try to extract JSON from the response
                import re
                
                # Look for JSON array pattern - more comprehensive regex
                json_match = re.search(r'\[[\s\S]*?\]', response_text, re.DOTALL)
                if json_match:
                    json_text = json_match.group().strip()
                    print(f"🔍 Found JSON array pattern: {json_text}")
                    try:
                        canvas_commands = json.loads(json_text)
                        if not isinstance(canvas_commands, list):
                            canvas_commands = [canvas_commands]
                        print(f"✅ Regex JSON parse successful, found {len(canvas_commands)} commands")
                    except json.JSONDecodeError as e:
                        print(f"❌ Regex JSON parse failed: {e}")
                        # Try to find individual command objects with better regex
                        command_matches = re.findall(r'\{[^{}]*"action"[^{}]*\}', response_text, re.DOTALL)
                        print(f"🔍 Found {len(command_matches)} individual command matches")
                        if command_matches:
                            canvas_commands = []
                            for i, match in enumerate(command_matches):
                                print(f"🔍 Processing command {i+1}: {match}")
                                try:
                                    command = json.loads(match)
                                    canvas_commands.append(command)
                                    print(f"✅ Command {i+1} parsed successfully")
                                except json.JSONDecodeError as e:
                                    print(f"❌ Command {i+1} parse failed: {e}")
                                    continue
                        else:
                            print(f"❌ No individual command matches found, creating fallback text shape")
                            # Fallback: create a simple text shape with the response
                            canvas_commands = [{
                                "action": "create",
                                "type": "text",
                                "x": 0,
                                "y": 0,
                                "width": 400,
                                "height": 100,
                                "fill": "#000000",
                                "text": response_text[:100],
                                "fontSize": 16
                            }]
                else:
                    print(f"❌ No JSON array pattern found, creating final fallback text shape")
                    # Fallback: create a simple text shape with the response
                    canvas_commands = [{
                        "action": "create",
                        "type": "text",
                        "x": 0,
                        "y": 0,
                        "width": 400,
                        "height": 100,
                        "fill": "#000000",
                        "text": response_text[:100],
                        "fontSize": 16
                    }]
            
            # Ensure we have a valid commands array
            if 'canvas_commands' not in locals() or not canvas_commands:
                print(f"⚠️  No commands found, creating fallback")
                canvas_commands = [{
                    "action": "create",
                    "type": "text",
                    "x": 0,
                    "y": 0,
                    "width": 400,
                    "height": 100,
                    "fill": "#000000",
                    "text": response_text[:100],
                    "fontSize": 16
                }]
            
            # Log final results
            print(f"🎯 Successfully generated {len(canvas_commands)} canvas commands")
            print(f"📤 Returning response to client...")
            
            # Prepare debug info
            debug_info = {
                "provider": "replicate",
                "model": f"openai/{model}",
                "response_time_ms": api_duration,
                "raw_response_length": len(response_text),
                "raw_output": raw_output,
                "raw_output_type": str(type(raw_output)),
                "processed_response": response_text
            }
            
            # Return successful response with canvas commands
            return https_fn.Response(
                json.dumps({
                    'success': True,
                    'data': {
                        'commands': canvas_commands,
                        'message': f"Successfully processed: {prompt}"
                    },
                    'debug': debug_info
                }),
                status=200,
                headers={**headers, 'Content-Type': 'application/json'}
            )
            
        except Exception as replicate_error:
            end_time = time.time()
            api_duration = (end_time - start_time) * 1000  # Convert to milliseconds
            print(f"❌ Replicate API error after {api_duration:.2f}ms: {str(replicate_error)}")
            return https_fn.Response(
                json.dumps({
                    'success': False,
                    'error': f'Replicate API error: {str(replicate_error)}'
                }),
                status=500,
                headers={**headers, 'Content-Type': 'application/json'}
            )
    
    except Exception as e:
        print(f"💥 Function error: {str(e)}")
        return https_fn.Response(
            json.dumps({
                'success': False,
                'error': f'Internal server error: {str(e)}'
            }),
            status=500,
            headers={**headers, 'Content-Type': 'application/json'}
        )