
import os
import json
import time
import replicate
import re
from prompts import get_canvas_system_prompt

def text_to_canvas_commands_replicate(prompt: str, model: str, selected_content=None) -> dict:
    """Converts a natural language prompt to canvas commands using Replicate."""
    start_time = time.time()
    try:
        api_token = os.environ.get('REPLICATE_API_TOKEN')
        if not api_token:
            print("[Replicate Service] API token not configured")
            return {"success": False, "error": "Replicate API token not configured"}

        is_editing = selected_content is not None
        print(f"[Replicate Service] Calling with model: {model}, editing: {is_editing}")

        # Get system prompt with optional selected content context
        system_prompt = get_canvas_system_prompt(selected_content)

        input_payload = {
            "prompt": prompt,
            "messages": [],
            "verbosity": "low",
            "image_input": [],
            "system_prompt": system_prompt,
            "reasoning_effort": "minimal",
        }

        # Use model string as-is if it contains a "/", otherwise prepend "openai/"
        model_path = model if "/" in model else f"openai/{model}"

        print(f"[Replicate Service] Calling with model: {model_path}")

        raw_output = replicate.run(
            model_path,
            input=input_payload,
            api_token=api_token,
        )
        end_time = time.time()
        api_duration = (end_time - start_time) * 1000

        if isinstance(raw_output, list):
            response_text = ''.join(raw_output)
        else:
            response_text = str(raw_output)

        print(f"[Replicate Service] Completed in {api_duration:.0f}ms, response length: {len(response_text)}")

        try:
            cleaned_response = response_text.strip()
            canvas_commands = json.loads(cleaned_response)
            if not isinstance(canvas_commands, list):
                canvas_commands = [canvas_commands]
            print(f"[Replicate Service] Parsed {len(canvas_commands)} commands")
        except json.JSONDecodeError:
            json_match = re.search(r'\[[\s\S]*?\]', response_text, re.DOTALL)
            if json_match:
                json_text = json_match.group().strip()
                try:
                    canvas_commands = json.loads(json_text)
                    if not isinstance(canvas_commands, list):
                        canvas_commands = [canvas_commands]
                except json.JSONDecodeError:
                    command_matches = re.findall(r'\{[^{}]*"action"[^{}]*\}', response_text, re.DOTALL)
                    if command_matches:
                        canvas_commands = []
                        for match in command_matches:
                            try:
                                command = json.loads(match)
                                canvas_commands.append(command)
                            except json.JSONDecodeError:
                                continue
                    else:
                        canvas_commands = [
                            {
                                "action": "create",
                                "type": "text",
                                "x": 0,
                                "y": 0,
                                "width": 400,
                                "height": 100,
                                "fill": "#000000",
                                "text": response_text[:100],
                                "fontSize": 16,
                            }
                        ]
            else:
                canvas_commands = [
                    {
                        "action": "create",
                        "type": "text",
                        "x": 0,
                        "y": 0,
                        "width": 400,
                        "height": 100,
                        "fill": "#000000",
                        "text": response_text[:100],
                        "fontSize": 16,
                    }
                ]

        if 'canvas_commands' not in locals() or not canvas_commands:
            canvas_commands = [
                {
                    "action": "create",
                    "type": "text",
                    "x": 0,
                    "y": 0,
                    "width": 400,
                    "height": 100,
                    "fill": "#000000",
                    "text": response_text[:100],
                    "fontSize": 16,
                }
            ]

        print(f"[Replicate Service] Returning {len(canvas_commands)} commands")

        debug_info = {
            "provider": "replicate",
            "model": model_path,
            "response_time_ms": api_duration,
            "raw_response_length": len(response_text),
            "raw_output": raw_output,
            "raw_output_type": str(type(raw_output)),
            "processed_response": response_text,
        }

        return {"success": True, "data": {"commands": canvas_commands}, "debug": debug_info}

    except Exception as e:
        return {"success": False, "error": str(e)}

def generate_image_replicate(prompt: str, model: str = "seedream-4") -> dict:
    """Generates an image using Replicate image generation models.

    Supported models:
    - seedream-4: bytedance/seedream-4
    - nano-banana: google/nano-banana
    - flux-kontext-pro: black-forest-labs/flux-kontext-pro
    """
    start_time = time.time()
    try:
        api_token = os.environ.get('REPLICATE_API_TOKEN')
        if not api_token:
            print("[Replicate Image Service] API token not configured")
            return {"success": False, "error": "Replicate API token not configured"}

        print(f"[Replicate Image Service] Generating image with model: {model}, prompt: {prompt[:50]}...")

        # Map model names to paths and configure input payloads
        if model == "seedream-4":
            model_path = "bytedance/seedream-4"
            input_payload = {
                "prompt": prompt,
                "size": "2K",
                "width": 2048,
                "height": 2048,
                "max_images": 1,
                "image_input": [],
                "aspect_ratio": "4:3",
                "sequential_image_generation": "disabled"
            }
        elif model == "nano-banana":
            model_path = "google/nano-banana"
            input_payload = {
                "prompt": prompt,
                "image_input": [],
                "aspect_ratio": "match_input_image",
                "output_format": "jpg"
            }
        elif model == "flux-kontext-pro":
            model_path = "black-forest-labs/flux-kontext-pro"
            input_payload = {
                "prompt": prompt,
                "aspect_ratio": "1:1",  # Default since no input_image for now
                "output_format": "jpg",
                "safety_tolerance": 2,
                "prompt_upsampling": False
            }
        else:
            print(f"[Replicate Image Service] Unknown model: {model}")
            return {"success": False, "error": f"Unknown model: {model}"}

        print(f"[Replicate Image Service] Calling model: {model_path}")

        output = replicate.run(
            model_path,
            input=input_payload,
            api_token=api_token,
        )

        end_time = time.time()
        api_duration = (end_time - start_time) * 1000

        # Handle different output formats from different models
        image_url = None
        if isinstance(output, list) and len(output) > 0:
            first_item = output[0]
            # Check if it's already a string URL
            if isinstance(first_item, str):
                image_url = first_item
            # Check if it has a .url() method (file object)
            elif hasattr(first_item, 'url') and callable(first_item.url):
                image_url = first_item.url()
            # Check if it has a url attribute
            elif hasattr(first_item, 'url'):
                image_url = first_item.url
            else:
                print(f"[Replicate Image Service] Unexpected first item type: {type(first_item)}")
                return {"success": False, "error": f"Unexpected output item format: {type(first_item)}"}
        elif isinstance(output, str):
            # Sometimes output is directly a string URL
            image_url = output
        elif hasattr(output, 'url') and callable(output.url):
            # Output is a file object with .url() method
            image_url = output.url()
        elif hasattr(output, 'url'):
            # Output has url attribute
            image_url = output.url
        else:
            print(f"[Replicate Image Service] Unexpected output type: {type(output)}")
            return {"success": False, "error": f"Unexpected output format: {type(output)}"}

        print(f"[Replicate Image Service] Completed in {api_duration:.0f}ms, image URL: {image_url}")

        debug_info = {
            "provider": "replicate",
            "model": model_path,
            "response_time_ms": api_duration,
            "output_type": str(type(output)),
        }

        return {
            "success": True,
            "data": {
                "imageUrl": image_url,
                "prompt": prompt
            },
            "debug": debug_info
        }

    except Exception as e:
        print(f"[Replicate Image Service] Error: {str(e)}")
        return {"success": False, "error": str(e)}
