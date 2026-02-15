import { useState, useEffect } from "react";
import { createForm, updateForm } from "../api";
import { Field } from "../types";

type FieldType = Field["type"];

interface Props {
  onFormCreated: (formId: string, fields: Field[]) => void;
  /** Edit mode: existing form id and initial data */
  formId?: string;
  initialTitle?: string;
  initialFields?: Field[];
  onFormUpdated?: (formId: string) => void;
}

export default function FormBuilder({ onFormCreated, formId, initialTitle = "", initialFields = [], onFormUpdated }: Props) {
  const [formTitle, setFormTitle] = useState(initialTitle);
  const [fields, setFields] = useState<Field[]>(initialFields.length ? initialFields : []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTitle) setFormTitle(initialTitle);
    if (initialFields.length) setFields(initialFields);
  }, [initialTitle, initialFields]);

  const MAX_FIELDS = 50;

  const addField = () => {
    if (fields.length >= MAX_FIELDS) return;
    setFields([
      ...fields,
      { id: crypto.randomUUID(), label: "", type: "text" }
    ]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const saveForm = async () => {
    setError(null);
    try {
      if (formId && onFormUpdated) {
        await updateForm(formId, { title: formTitle || "Untitled form", fields });
        onFormUpdated(formId);
      } else {
        const data = await createForm({ title: formTitle || "Untitled form", fields });
        const id =
          data?.form_id ??
          data?.formId ??
          (typeof data?.body === "string" ? (() => {
            try {
              const b = JSON.parse(data.body);
              return b?.form_id ?? b?.formId;
            } catch {
              return undefined;
            }
          })() : undefined);
        if (!id) {
          const msg = data?.message || data?.error
            ? `${data.message || data.error}`
            : "Invalid response: missing form id";
          setError(msg);
          return;
        }
        onFormCreated(id, fields);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  return (
    <div className="form-builder">
      <div className="form-group">
        <label htmlFor="form-title">Form title</label>
        <input
          id="form-title"
          type="text"
          placeholder="e.g. Contact form"
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
        />
      </div>
      {fields.map((field, index) => (
        <div className="form-group form-builder-field" key={field.id}>
          <label>Field label</label>
          <div className="field-row">
            <input
              type="text"
              placeholder="Label"
              value={field.label}
              onChange={(e) => {
                const updated = [...fields];
                updated[index] = { ...updated[index], label: e.target.value };
                setFields(updated);
              }}
            />
            <select
              value={field.type}
              onChange={(e) => {
                const updated = [...fields];
                updated[index] = {
                  ...updated[index],
                  type: e.target.value as FieldType
                };
                setFields(updated);
              }}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="email">Email</option>
              <option value="textarea">Text area</option>
            </select>
            <button
              type="button"
              className="btn-remove"
              onClick={() => removeField(index)}
              title="Remove field"
              aria-label="Remove field"
            >
              ×
            </button>
          </div>
        </div>
      ))}

      {error && <p className="form-error">{error}</p>}

      {fields.length >= MAX_FIELDS && <p className="field-hint">Maximum {MAX_FIELDS} fields.</p>}
      <button className="secondary" onClick={addField} disabled={fields.length >= MAX_FIELDS}>
        Add field
      </button>

      <button onClick={saveForm} disabled={fields.length === 0}>
        {formId && onFormUpdated ? "Update form" : "Save form"}
      </button>
    </div>
  );
}
