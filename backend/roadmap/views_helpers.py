import ast
import json


def parse_roadmap_payload(value):
    if isinstance(value, dict):
        return value
    if not value:
        return {'weeks': [], 'progress': {}}
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, dict) else {'weeks': [], 'progress': {}}
    except (TypeError, json.JSONDecodeError):
        pass
    try:
        parsed = ast.literal_eval(value)
        return parsed if isinstance(parsed, dict) else {'weeks': [], 'progress': {}}
    except (ValueError, SyntaxError):
        return {'weeks': [], 'progress': {}}


def serialize_roadmap_payload(value):
    payload = parse_roadmap_payload(value)
    payload.setdefault('weeks', [])
    payload.setdefault('progress', {})
    return json.dumps(payload)
