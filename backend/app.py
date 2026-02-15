import json
import os
import re
import uuid
from urllib.parse import parse_qs
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
        if parts[0] in ("prod", "dev", "stage", "v1", "default"):
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


def _get_query_params(event: dict) -> dict:
    """Get query string params from event (REST API, HTTP API v2, or rawQueryString)."""
    qs = event.get("queryStringParameters") or event.get("queryParameters")
    if isinstance(qs, dict):
        return qs
    raw = event.get("rawQueryString") or ""
    if not raw:
        return {}
    try:
        parsed = parse_qs(raw, keep_blank_values=True)
        return {k: (v[0] if v else "") for k, v in parsed.items()}
    except Exception:
        return {}


# Match /forms/{formId}/responses/{responseId} or /response/ (singular), optional trailing slash
_RESPONSE_PATH = re.compile(r"^/forms/([^/]+)/(?:responses?)/([^/]+)/?$")


def _parse_response_route(event: dict, path: str):
    """If this is GET/PUT forms/.../responses/... or .../response/..., return (form_id, response_id). Else (None, None)."""
    path_params = event.get("pathParameters") or {}
    form_id = path_params.get("formId") or path_params.get("form_id")
    response_id = path_params.get("responseId") or path_params.get("response_id")
    if form_id and response_id:
        return form_id, response_id
    m = _RESPONSE_PATH.match(path)
    if m:
        return m.group(1), m.group(2)
    return None, None


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

        # GET/PUT /forms/{formId}/responses/{responseId} – handle before single-form GET so path is matched first
        resp_form_id, resp_response_id = _parse_response_route(event, path)
        if resp_form_id and resp_response_id and method == "GET":
            form_id, response_id = resp_form_id, resp_response_id
            qs = _get_query_params(event)
            token = (qs.get("token") or "").strip()
            if not token:
                return response(403, {"error": "Edit token required"})
            res = responses_table.get_item(Key={"form_id": form_id, "response_id": response_id})
            item = res.get("Item")
            if not item or item.get("edit_token") != token:
                return response(404, {"error": "Response not found or invalid token"})
            return response(200, {"form_id": form_id, "answers": item["answers"], "response_id": response_id})

        if resp_form_id and resp_response_id and method == "PUT":
            form_id, response_id = resp_form_id, resp_response_id
            try:
                body = json.loads(body_str) if body_str else {}
            except json.JSONDecodeError:
                return response(400, {"error": "Invalid JSON"})
            token = (body.get("edit_token") or body.get("token") or "").strip()
            answers = body.get("answers") if isinstance(body.get("answers"), dict) else body
            if not isinstance(answers, dict):
                answers = {}
            if not token:
                return response(403, {"error": "Edit token required"})
            res = responses_table.get_item(Key={"form_id": form_id, "response_id": response_id})
            item = res.get("Item")
            if not item or item.get("edit_token") != token:
                return response(404, {"error": "Response not found or invalid token"})
            try:
                responses_table.update_item(
                    Key={"form_id": form_id, "response_id": response_id},
                    UpdateExpression="SET answers = :a",
                    ExpressionAttributeValues={":a": answers}
                )
            except Exception as db_e:
                return response(200, {"ok": False, "error": type(db_e).__name__, "message": str(db_e)[:500]})
            return response(200, {"status": "updated", "response_id": response_id})

        if method == "GET" and path.startswith("/forms/") and path != "/forms":
            parts = path.rstrip("/").split("/")
            form_id = parts[-1]
            if len(parts) == 3 and parts[1] == "forms":
                res = forms_table.get_item(Key={"form_id": form_id})
                item = res.get("Item")
                if not item:
                    return response(404, {"error": "Form not found"})
                return response(200, {
                    "form_id": item["form_id"],
                    "title": item.get("title", "Untitled"),
                    "fields": item["fields"]
                })

        if method == "PUT" and path.startswith("/forms/") and path != "/forms":
            parts = path.rstrip("/").split("/")
            if len(parts) != 3 or parts[1] != "forms":
                return response(404, {"error": "Not found"})
            form_id = parts[-1]
            try:
                body = json.loads(body_str) if body_str else {}
            except json.JSONDecodeError:
                return response(400, {"error": "Invalid JSON"})
            title = (body.get("title") or "Untitled form") if isinstance(body, dict) else "Untitled form"
            fields = body.get("fields") if isinstance(body, dict) else []
            if not isinstance(fields, list):
                fields = []
            try:
                forms_table.update_item(
                    Key={"form_id": form_id},
                    UpdateExpression="SET #title = :t, #fields = :f",
                    ExpressionAttributeNames={"#title": "title", "#fields": "fields"},
                    ExpressionAttributeValues={":t": title, ":f": fields}
                )
            except Exception as db_e:
                return response(200, {"ok": False, "error": type(db_e).__name__, "message": str(db_e)[:500]})
            return response(200, {"form_id": form_id})

        if method == "POST" and path.startswith("/submit/"):
            form_id = path.rstrip("/").split("/")[-1]
            body = json.loads(body_str) if body_str else {}
            response_id = str(uuid.uuid4())
            edit_token = str(uuid.uuid4())
            try:
                responses_table.put_item(
                    Item={
                        "form_id": form_id,
                        "response_id": response_id,
                        "edit_token": edit_token,
                        "answers": body
                    }
                )
            except Exception as db_e:
                return response(200, {"ok": False, "error": type(db_e).__name__, "message": str(db_e)[:500]})
            return response(201, {"status": "submitted", "response_id": response_id, "edit_token": edit_token})

        return response(404, {"error": "Not found", "path": path, "method": method})

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