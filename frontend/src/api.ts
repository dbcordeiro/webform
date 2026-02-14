// API Gateway base URL – set in Amplify: Environment variables → VITE_API_URL
// Example: https://guv2yhb3e4.execute-api.us-east-1.amazonaws.com (no trailing slash)
const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

async function getErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return `${fallback} (${res.status})`;
    const data = JSON.parse(text);
    if (data?.message) return data.message;
    if (data?.error) return typeof data.error === "string" ? data.error : JSON.stringify(data.error);
    return `${fallback}: ${text}`;
  } catch {
    return `${fallback} (${res.status})`;
  }
}

function ensureApiUrl(): string {
  if (!API_URL) {
    throw new Error(
      "API URL is not configured. Set VITE_API_URL in your environment (e.g. Amplify environment variables)."
    );
  }
  return API_URL;
}

async function createForm(payload: any) {
  const base = ensureApiUrl();
  const url = `${base}/forms`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const msg = await getErrorMessage(res, "Failed to create form");
    throw new Error(msg);
  }

  return res.json();
}

async function submitForm(formId: string, payload: any) {
  const base = ensureApiUrl();
  const res = await fetch(`${base}/submit/${formId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const msg = await getErrorMessage(res, "Failed to submit form");
    throw new Error(msg);
  }

  return res.json();
}

async function getForm(formId: string) {
  const base = ensureApiUrl();
  const res = await fetch(`${base}/forms/${formId}`);

  if (!res.ok) {
    const msg = await getErrorMessage(res, "Form not found");
    throw new Error(msg);
  }

  return res.json();
}

export { createForm, submitForm, getForm };
