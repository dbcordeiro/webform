// FormRenderer.tsx
import { useState, FormEvent } from "react";
import { submitForm } from "./api";
import { Field } from "./types";

interface Props {
  formId: string;
  fields: Field[];
}

function getValueKey(field: Field, index: number): string {
  return field.id ?? `${index}-${field.label}`;
}

export default function FormRenderer({ formId, fields }: Props) {
  const [values, setValues] = useState<Record<string, string | number>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const payload: Record<string, string | number> = {};
    fields.forEach((f, i) => {
      const key = getValueKey(f, i);
      const v = values[key];
      if (v !== undefined && v !== "") payload[f.label] = v;
    });
    try {
      await submitForm(formId, payload);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {fields.map((field, index) => {
        const valueKey = getValueKey(field, index);
        const raw = values[valueKey];
        const displayValue = raw === undefined || raw === null ? "" : String(raw);
        return (
          <div key={field.id ?? `${index}-${field.label}`}>
            <label>{field.label}</label>
            <input
              type={field.type}
              required
              value={displayValue}
              onChange={(e) =>
                setValues({
                  ...values,
                  [valueKey]:
                    field.type === "number"
                      ? Number(e.target.value)
                      : e.target.value
                })
              }
            />
          </div>
        );
      })}

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>Submitted successfully.</p>}
      <button type="submit">Submit</button>
    </form>
  );
}
