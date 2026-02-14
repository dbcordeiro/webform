const API_URL = import.meta.env.VITE_API_URL as string;

export async function createForm(payload: any) {
  const res = await fetch(`${API_URL}/forms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Create form failed");
  return res.json();
}

export async function submitForm(formId: string, data: any) {
  const res = await fetch(`${API_URL}/submit/${formId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Submit failed");
}

export async function getForm(formId: string) {
  const res = await fetch(`${API_URL}/forms/${formId}`);
  if (!res.ok) throw new Error("Form not found");
  return res.json();
}
