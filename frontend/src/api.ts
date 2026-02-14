import { Field } from "./types";

const API_URL = "https://guv2yhb3e4.execute-api.us-east-1.amazonaws.com";

export async function createForm(payload: {
  fields: Field[];
}): Promise<{ form_id?: string; formId?: string }> {
  const res = await fetch(`${API_URL}/forms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data?.message as string) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export async function submitForm(
  formId: string,
  data: Record<string, string | number>
): Promise<void> {
  const res = await fetch(`${API_URL}/submit/${formId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    let message = `Submit failed (${res.status})`;
    try {
      const err = await res.json();
      if (err?.message) message = err.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
}
