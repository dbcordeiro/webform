import json
import os
import uuid
import boto3

# Table names from env (validated in handler to avoid crash at import)
FORMS_TABLE_NAME = os.environ.get("FORMS_TABLE")
RESPONSES_TABLE_NAME = os.environ.get("RESPONSES_TABLE")

def _headers():
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
    }


def response(status, body):
    """Body must be JSON-serializable; we stringify it for API Gateway."""
    if not isinstance(body, str):
        body = json.dumps(body)
    return {
        "statusCode": int(status),
        "headers": _headers(),
        "body": body
    }

def _normalize_path(path: str) -> str:
    """Strip API Gateway stage prefix if present (e.g. /prod/forms -> /forms)."""
    if path.startswith("/") and path.count("/") > 1:
        parts = path.strip("/").split("/")
        if parts[0] in ("prod", "dev", "stage", "v1"):
            return "/" + "/".join(parts[1:])
    return path


def _parse_event(event: dict) -> tuple[str, str, str]:
    """
    Support both REST API (v1) and HTTP API (v2) payloads.
    Returns (method, path, body_str). Uses only .get() to avoid KeyError.
    """
    if not isinstance(event, dict):
        return "GET", "/", "{}"
    req_ctx = event.get("requestContext") or {}
    http_info = req_ctx.get("http") if isinstance(req_ctx, dict) else {}
    # HTTP API v2 (API Gateway HTTP APIs) – use whenever requestContext.http exists
    if isinstance(http_info, dict):
        method = (http_info.get("method") or req_ctx.get("httpMethod") or "GET").upper()
        path = event.get("rawPath") or http_info.get("path") or event.get("path") or "/"
        path = path if isinstance(path, str) else "/"
        body = event.get("body")
        if body is None:
            body = "{}"
        elif not isinstance(body, str):
            body = "{}"
        if event.get("isBase64Encoded"):
            import base64
            try:
                body = base64.b64decode(body).decode("utf-8")
            except Exception:
                body = "{}"
        return method, _normalize_path(path), body
    # REST API v1
    method = (event.get("httpMethod") or "GET").upper()
    path = _normalize_path(event.get("path") or event.get("rawPath") or "/")
    body = event.get("body") or "{}"
    if not isinstance(body, str):
        body = "{}"
    return method, path, body


def lambda_handler(event, context) -> dict:
    try:
        def err(code: int, error: str, message: str):
            return response(200, {"ok": False, "error": error, "message": message})

        if event is None or not isinstance(event, dict):
            return err(0, "BadEvent", "event is missing or not a dict")

        method, path, body_str = _parse_event(event)

        if not FORMS_TABLE_NAME or not RESPONSES_TABLE_NAME:
            return err(0, "Lambda config", "FORMS_TABLE and RESPONSES_TABLE env vars must be set in Lambda configuration.")

        dynamodb = boto3.resource("dynamodb")
        forms_table = dynamodb.Table(FORMS_TABLE_NAME)
        responses_table = dynamodb.Table(RESPONSES_TABLE_NAME)

        if method == "POST" and path == "/forms":
            try:
                body = json.loads(body_str) if body_str else {}
            except json.JSONDecodeError as je:
                return response(200, {"ok": False, "error": "JSONDecodeError", "message": str(je)})
            form_id = str(uuid.uuid4())
            title = (body.get("title") or "Untitled form") if isinstance(body, dict) else "Untitled form"
            fields = body.get("fields") if isinstance(body, dict) else []
            if not isinstance(fields, list):
                fields = []

            try:
                forms_table.put_item(
                    Item={
                        "form_id": form_id,
                        "title": title,
                        "fields": fields
                    }
                )
            except Exception as db_e:
                return response(200, {
                    "ok": False,
                    "error": type(db_e).__name__,
                    "message": str(db_e)[:500]
                })
            return response(201, {"form_id": form_id})

        if method == "POST" and path.startswith("/submit/"):
            form_id = path.rstrip("/").split("/")[-1]
            body = json.loads(body_str)

            responses_table.put_item(
                Item={
                    "form_id": form_id,
                    "response_id": str(uuid.uuid4()),
                    "answers": body
                }
            )
            return response(201, {"status": "submitted"})

        if method == "GET" and path.startswith("/forms/"):
            form_id = path.rstrip("/").split("/")[-1]

            res = forms_table.get_item(Key={"form_id": form_id})
            item = res.get("Item")

            if not item:
                return response(404, {"error": "Form not found"})

            return response(200, {
                "form_id": item["form_id"],
                "fields": item["fields"]
            })

        return response(404, {"error": "Not found"})

    except Exception as e:
        # Return 200 so API Gateway doesn't replace body with generic "Internal Server Error"
        err_name = type(e).__name__
        err_msg = str(e)
        if not isinstance(err_msg, str):
            err_msg = repr(e)
        err_msg = err_msg[:500]
        try:
            body_str = json.dumps({"ok": False, "error": err_name, "message": err_msg})
        except Exception:
            body_str = '{"ok":false,"error":"' + err_name + '","message":"(could not serialize)"}'
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": body_str
        }