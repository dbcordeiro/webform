const API_URL = import.meta.env.VITE_API_URL;

export async function createForm(form: any) {
  const res = await fetch(`${API_URL}/forms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form)
  });

  if (!res.ok) {
    throw new Error("Failed to create form");
  }

  return res.json();
}

export async function submitForm(formId: string, data: any) {
  const res = await fetch(`${API_URL}/submit/${formId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error("Failed to submit form");
  }
}
