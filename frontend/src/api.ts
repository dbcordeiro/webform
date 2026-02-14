const API_URL = import.meta.env.VITE_API_URL;

export async function submitForm(formId: string, payload: any) {
  const res = await fetch(`${API_URL}/submit/${formId}`, {
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
