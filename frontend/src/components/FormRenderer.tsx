import { useState, FormEvent, useEffect } from "react";
import { submitForm, updateResponse } from "../api";
import { Field } from "../types";

interface Props {
  formId: string;
  fields: Field[];
  /** Prefill for edit-response mode; keys are field labels */
  initialValues?: Record<string, string | number>;
  /** When set, submit updates this response instead of creating one */
  responseId?: string;
  editToken?: string;
}

function getValueKey(field: Field, index: number): string {
  return field.id ?? `${index}-${field.label}`;
}

type FieldType = Field["type"];

function validateFieldValue(type: FieldType, value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;

  switch (type) {
    case "number": {
      const n = Number(trimmed);
      if (Number.isNaN(n)) return "Must be a valid number.";
      return null;
    }
    case "date": {
      const d = new Date(trimmed);
      if (Number.isNaN(d.getTime())) return "Must be a valid date (e.g. YYYY-MM-DD).";
      return null;
    }
    case "email": {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(trimmed)) return "Must be a valid email address.";
      return null;
    }
    case "text":
    case "textarea":
      if (!/^[a-zA-Z]/.test(trimmed)) return "Must start with a letter.";
      return null;
    default:
      return null;
  }
}

export default function FormRenderer({ formId, fields, initialValues, responseId, editToken }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editLink, setEditLink] = useState<string | null>(null);

  const isEditMode = Boolean(responseId && editToken);

  useEffect(() => {
    if (!initialValues || !fields.length) return;
    const next: Record<string, string> = {};
    fields.forEach((f, i) => {
      const key = getValueKey(f, i);
      const v = initialValues[f.label];
      if (v !== undefined && v !== null) next[key] = String(v);
    });
    setValues((prev) => ({ ...prev, ...next }));
  }, [initialValues, fields]);

  const handleBlur = (valueKey: string, type: FieldType, value: string) => {
    const msg = validateFieldValue(type, value);
    setErrors((prev) => (msg ? { ...prev, [valueKey]: msg } : { ...prev, [valueKey]: "" }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const newErrors: Record<string, string> = {};
    fields.forEach((f, i) => {
      const key = getValueKey(f, i);
      const raw = values[key] ?? "";
      const msg = validateFieldValue(f.type, raw);
      if (msg) newErrors[key] = msg;
    });
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) return;

    const payload: Record<string, string | number> = {};
    fields.forEach((f, i) => {
      const key = getValueKey(f, i);
      const raw = (values[key] ?? "").trim();
      if (raw === "") return;
      if (f.type === "number") {
        payload[f.label] = Number(raw);
      } else {
        payload[f.label] = raw;
      }
    });

    try {
      if (isEditMode && responseId && editToken) {
        await updateResponse(formId, responseId, editToken, payload);
        setSuccess(true);
        setEditLink(null);
      } else {
        const data = await submitForm(formId, payload);
        setSuccess(true);
        if (data?.response_id && data?.edit_token) {
          const base = window.location.origin;
          setEditLink(`${base}/forms/${formId}/response/${data.response_id}/edit?token=${encodeURIComponent(data.edit_token)}`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {fields.map((field, index) => {
        const valueKey = getValueKey(field, index);
        const displayValue = values[valueKey] ?? "";
        const fieldError = errors[valueKey];

        return (
          <div key={field.id ?? `${index}-${field.label}`} className="form-group">
            <label htmlFor={valueKey}>{field.label}</label>
            {field.type === "textarea" ? (
              <textarea
                id={valueKey}
                value={displayValue}
                onChange={(e) => setValues({ ...values, [valueKey]: e.target.value })}
                onBlur={(e) => handleBlur(valueKey, field.type, e.target.value)}
                required
                rows={3}
                className={fieldError ? "input-error" : ""}
              />
            ) : (
              <input
                id={valueKey}
                type={field.type === "email" ? "email" : field.type}
                required
                value={displayValue}
                onChange={(e) => setValues({ ...values, [valueKey]: e.target.value })}
                onBlur={(e) => handleBlur(valueKey, field.type, e.target.value)}
                className={fieldError ? "input-error" : ""}
              />
            )}
            {fieldError && <p className="field-error">{fieldError}</p>}
          </div>
        );
      })}

      {error && <p className="form-error">{error}</p>}
      {success && (
        <>
          <p className="form-success">{isEditMode ? "Response updated." : "Submitted successfully."}</p>
          {editLink && (
            <p className="edit-link-hint">
              Save this link to edit your response later:{" "}
              <a href={editLink} target="_blank" rel="noopener noreferrer">{editLink}</a>
            </p>
          )}
        </>
      )}

      <button type="submit">{isEditMode ? "Update response" : "Submit"}</button>
    </form>
  );
}
