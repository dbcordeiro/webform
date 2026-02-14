const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

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
  const res = await fetch(`${base}/forms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error("Failed to create form");
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
    throw new Error("Failed to submit form");
  }

  return res.json();
}

async function getForm(formId: string) {
  const base = ensureApiUrl();
  const res = await fetch(`${base}/forms/${formId}`);

  if (!res.ok) {
    throw new Error("Form not found");
  }

  return res.json();
}

export { createForm, submitForm, getForm };
