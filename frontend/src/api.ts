const API_URL = import.meta.env.VITE_API_URL;

async function createForm(payload: any) {
  const res = await fetch(`${API_URL}/forms`, {
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

async function getForm(formId: string) {
  const res = await fetch(`${API_URL}/forms/${formId}`);

  if (!res.ok) {
    throw new Error("Form not found");
  }

  return res.json();
}

export { createForm, submitForm, getForm };
