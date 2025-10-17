
import os
import json
import time
import replicate
import re
from prompts import get_canvas_system_prompt

def text_to_canvas_commands_replicate(prompt: str, model: str) -> dict:
    """Converts a natural language prompt to canvas commands using Replicate."""
    start_time = time.time()
    try:
        api_token = os.environ.get('REPLICATE_API_TOKEN')
        if not api_token:
            return {"success": False, "error": "Replicate API token not configured"}

        input_payload = {
            "prompt": prompt,
            "messages": [],
            "verbosity": "low",
            "image_input": [],
            "system_prompt": get_canvas_system_prompt(),
            "reasoning_effort": "minimal",
        }

        raw_output = replicate.run(
            f"openai/{model}",
            input=input_payload,
            api_token=api_token,
        )
        end_time = time.time()
        api_duration = (end_time - start_time) * 1000

        if isinstance(raw_output, list):
            response_text = ''.join(raw_output)
        else:
            response_text = str(raw_output)

        try:
            cleaned_response = response_text.strip()
            canvas_commands = json.loads(cleaned_response)
            if not isinstance(canvas_commands, list):
                canvas_commands = [canvas_commands]
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

        debug_info = {
            "provider": "replicate",
            "model": f"openai/{model}",
            "response_time_ms": api_duration,
            "raw_response_length": len(response_text),
            "raw_output": raw_output,
            "raw_output_type": str(type(raw_output)),
            "processed_response": response_text,
        }

        return {"success": True, "data": {"commands": canvas_commands}, "debug": debug_info}

    except Exception as e:
        return {"success": False, "error": str(e)}
