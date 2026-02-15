# Edit form and edit response

## Text fields: must start with a letter

- **Text** and **Text area** fields are validated so the value **must start with a letter** (a–z, A–Z).
- Examples: "12danillo" is invalid; "Danillo" or "Danillo12" is valid.

## Form: 1–50 questions

- A form must have **at least 1** field (Save is disabled when there are 0).
- A form can have **at most 50** fields. "Add field" is disabled at 50 and a hint is shown.

## Edit the form (add/remove fields, change title)

1. Open the **fill-the-form** page: `/forms/<form_id>`.
2. Click **"Edit form"** (top right). You go to `/builder/edit/<form_id>`.
3. Change title, add or remove fields (use the **×** next to each field to remove).
4. Click **"Update form"**. You are redirected back to the form page.

**Backend:** `PUT /forms/<form_id>` with body `{ "title": "...", "fields": [...] }`.  
**API Gateway:** Add a route **PUT /forms/{id}** and attach the same Lambda (Payload 2.0).

## Edit your response (only by the person who submitted)

1. After submitting, the app shows: **"Save this link to edit your response later: [link]"**.
2. Only that link (with the secret `token`) can load and update that response.
3. Open the link → form is prefilled with your previous answers → change values → click **"Update response"**.

**Backend:**  
- On submit we store `edit_token` with the response and return `response_id` and `edit_token`.  
- `GET /forms/<formId>/responses/<responseId>?token=<edit_token>` returns the response.  
- `PUT /forms/<formId>/responses/<responseId>` with body `{ "edit_token": "...", "answers": {...} }` updates the response.

**API Gateway:** Add routes and attach the same Lambda (Payload 2.0):

- **GET** `/forms/{formId}/responses/{responseId}` (query param `token` is sent by the frontend).
- **PUT** `/forms/{formId}/responses/{responseId}`.

**DynamoDB responses table:**  
- Must have **partition key** `form_id` (String) and **sort key** `response_id` (String).  
- Items must include **edit_token** (String) for new responses (so they can be edited via the link).  
- Lambda env: `RESPONSES_TABLE` (or `RESPONSE_TABLE` if that’s what you use) must point to this table.

## Summary

| Feature | Where |
|--------|--------|
| Text must start with a letter | FormRenderer validation |
| 1–50 questions | FormBuilder: min 1, max 50, remove field (×) |
| Edit form | "Edit form" link on form page → EditFormPage → Update form |
| Edit response (submitter only) | Edit link shown after submit → EditResponsePage (with token in URL) |
