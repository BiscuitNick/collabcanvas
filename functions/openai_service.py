
import os
import json
import time
from openai import OpenAI
from prompts import CANVAS_SYSTEM_PROMPT

client = None

def get_openai_client():
    """Initialize OpenAI client lazily"""
    global client
    if client is None:
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OpenAI API key not found.")
        client = OpenAI(api_key=api_key)
    return client

def get_canvas_tools():
    """Returns the tools schema for the canvas."""
    return [
        {
            "type": "function",
            "function": {
                "name": "createShape",
                "description": "Create a new shape on the canvas",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "shapeType": {"type": "string", "enum": ["rectangle", "circle", "text"]},
                        "x": {"type": "number"},
                        "y": {"type": "number"},
                        "width": {"type": "number"},
                        "height": {"type": "number"},
                        "fill": {"type": "string"},
                        "text": {"type": "string"},
                        "fontSize": {"type": "number"},
                    },
                    "required": ["shapeType", "x", "y", "width", "height", "fill"],
                },
            },
        },
    ]

def text_to_canvas_commands(prompt: str, model: str) -> dict:
    """Converts a natural language prompt to canvas commands using OpenAI."""
    start_time = time.time()
    try:
        openai_client = get_openai_client()
        response = openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": CANVAS_SYSTEM_PROMPT},
                {"role": "user", "content": f"{prompt}\n\nPlease generate ALL requested shapes in this single response."},
            ],
            tools=get_canvas_tools(),
            tool_choice="auto",
            max_completion_tokens=16000,
            temperature=1.0,
        )
        end_time = time.time()
        api_duration = (end_time - start_time) * 1000

        message = response.choices[0].message
        usage = response.usage
        debug_info = {
            "tokens_used": usage.total_tokens if usage else None,
            "prompt_tokens": usage.prompt_tokens if usage else None,
            "completion_tokens": usage.completion_tokens if usage else None,
            "model": model,
            "response_time_ms": api_duration,
            "function_calls": len(message.tool_calls) if message.tool_calls else 0,
        }

        if message.tool_calls:
            canvas_commands = []
            for tool_call in message.tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)
                if function_name == "createShape":
                    command = {
                        "action": "create",
                        "type": function_args["shapeType"],
                        "x": function_args["x"],
                        "y": function_args["y"],
                        "width": function_args["width"],
                        "height": function_args["height"],
                        "fill": function_args["fill"],
                    }
                    if function_args["shapeType"] == "text":
                        command["text"] = function_args.get("text", "")
                        command["fontSize"] = function_args.get("fontSize", 16)
                    canvas_commands.append(command)
            return {"success": True, "data": {"commands": canvas_commands}, "debug": debug_info}
        else:
            return {"success": True, "data": {"commands": []}, "debug": debug_info}

    except Exception as e:
        return {"success": False, "error": str(e)}
