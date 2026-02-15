# Lambda code and API Gateway setup

Use this after the test Lambda (webform-post-test) returned 201. Put the full code in **ingest_data_forms** and point all routes to it.

---

## 1. Lambda: ingest_data_forms

### 1.1 Code (paste into Lambda console)

- **File in Lambda:** `lambda_function.py` (default).
- **Handler:** `lambda_function.lambda_handler`.
- Replace the entire editor contents with the code from **[backend/app.py](../backend/app.py)** in this repo (the version without any bypass).

Or copy the full code below (same as backend/app.py, no bypass).

### 1.2 Environment variables (required)

In **Lambda** → **Configuration** → **Environment variables** → **Edit**, add:

| Key               | Value                |
|-------------------|----------------------|
| `FORMS_TABLE`     | Your forms table name (e.g. `webform-forms`) |
| `RESPONSES_TABLE` | Your responses table name (e.g. `webform-responses`) |

### 1.3 Permissions

- **Execution role:** must allow DynamoDB (e.g. `dynamodb:PutItem`, `dynamodb:GetItem` on the two tables).
- **Resource-based policy:** API Gateway must be allowed to invoke this function (same as for webform-post-test). If you already have statements for `arn:aws:execute-api:us-east-1:513734873949:guv2yhb3e4/*`, keep them. When you re-attach **ingest_data_forms** to the route, API Gateway can add the permission if prompted.

---

## 2. API Gateway: routes and integrations

### 2.1 Routes (HTTP API)

You should have exactly these **three** routes:

| Method | Route path    | Purpose        |
|--------|---------------|----------------|
| POST   | `/forms`      | Create form    |
| GET    | `/forms/{id}` | Get form by id |
| POST   | `/submit/{id}`| Submit response for form `{id}` |

Path parameters: `{id}` (or `{id}` under `/forms` and under `/submit`) as your API shows.

### 2.2 Integrations (all use the same Lambda)

- **Integration type:** Lambda.
- **Lambda function:** `ingest_data_forms` (region: e.g. us-east-1).
- **Payload format version:** **2.0** (required for HTTP API v2 event shape).

Attach **one** Lambda integration (ingest_data_forms, payload 2.0) and use it for all three routes:

| Route           | Integration              |
|-----------------|--------------------------|
| POST /forms     | ingest_data_forms (2.0)  |
| GET /forms/{id} | ingest_data_forms (2.0)  |
| POST /submit/{id}| ingest_data_forms (2.0)  |

### 2.3 Steps in API Gateway console

1. **API Gateway** → your API (e.g. webform_api) → **Routes**.
2. **POST /forms**
   - Click **POST /forms** → **Attach integration** (or **Edit**).
   - Choose existing integration: **ingest_data_forms** (Payload 2.0), or create one: Integration type **Lambda**, Lambda **ingest_data_forms**, Payload **2.0**, then attach to this route.
   - If prompted, allow API Gateway to add Lambda invoke permission.
3. **GET /forms/{id}**
   - Same: attach integration **ingest_data_forms** (Payload 2.0).
4. **POST /submit/{id}**
   - Same: attach integration **ingest_data_forms** (Payload 2.0).

### 2.4 CORS (optional)

If the frontend calls the API from a browser, CORS should be enabled for your API. In **API Gateway** → **CORS** (or per-route): allow the methods and headers you use (e.g. GET, POST, Content-Type). Your current CORS (e.g. Allow-Origin *) is fine for development.

---

## 3. Test after setup

```bash
# Create form
curl -X POST "https://guv2yhb3e4.execute-api.us-east-1.amazonaws.com/forms" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Form","fields":[{"id":"1","label":"Name","type":"text"}]}'
# Expect: 201 and {"form_id":"<uuid>"}

# Get form (use form_id from above)
curl "https://guv2yhb3e4.execute-api.us-east-1.amazonaws.com/forms/<form_id>"
# Expect: 200 and {"form_id":"...","fields":[...]}

# Submit response
curl -X POST "https://guv2yhb3e4.execute-api.us-east-1.amazonaws.com/submit/<form_id>" \
  -H "Content-Type: application/json" \
  -d '{"Name":"Alice"}'
# Expect: 201 and {"status":"submitted"}
```

---

## 4. Optional: remove test Lambda

You can delete **webform-post-test** and its log group if you no longer need them. All traffic should go to **ingest_data_forms**.
