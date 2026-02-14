from aws_durable_execution_sdk_python.config import Duration
from aws_durable_execution_sdk_python.context import DurableContext, StepContext, durable_step
from aws_durable_execution_sdk_python.execution import durable_execution
import json
import os
import uuid
import boto3

# Read table names from environment variables
FORMS_TABLE = os.environ["FORMS_TABLE"]
RESPONSES_TABLE = os.environ["RESPONSES_TABLE"]

# Create DynamoDB resource
dynamodb = boto3.resource("dynamodb")

forms_table = dynamodb.Table(FORMS_TABLE)
responses_table = dynamodb.Table(RESPONSES_TABLE)

@durable_step
def response(status, body):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }

def _normalize_path(path: str) -> str:
    """Strip API Gateway stage prefix if present (e.g. /prod/forms -> /forms)."""
    if path.startswith("/") and path.count("/") > 1:
        parts = path.strip("/").split("/")
        if parts[0] in ("prod", "dev", "stage", "v1"):
            return "/" + "/".join(parts[1:])
    return path


@durable_execution
def lambda_handler(event, context) -> dict:
    method = event["httpMethod"]
    path = _normalize_path(event.get("path", "") or event.get("rawPath", "/"))

    if method == "POST" and path == "/forms":
        body = json.loads(event.get("body") or "{}")
        form_id = str(uuid.uuid4())
        title = body.get("title") or "Untitled form"
        fields = body.get("fields") or []

        forms_table.put_item(
            Item={
                "form_id": form_id,
                "title": title,
                "fields": fields
            }
        )
        return response(201, {"form_id": form_id})

    if method == "POST" and path.startswith("/submit/"):
        form_id = path.rstrip("/").split("/")[-1]
        body = json.loads(event.get("body") or "{}")

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