import { useState } from "react";
import { createForm } from "../api";
import { Field } from "../types";

type FieldType = Field["type"];

interface Props {
  onFormCreated: (formId: string, fields: Field[]) => void;
}

export default function FormBuilder({ onFormCreated }: Props) {
  const [fields, setFields] = useState<Field[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addField = () => {
    setFields([
      ...fields,
      { id: crypto.randomUUID(), label: "", type: "text" }
    ]);
  };

  const saveForm = async () => {
    setError(null);
    try {
      const data = await createForm({ fields });
      const formId = data.form_id ?? data.formId;
      if (!formId) {
        setError("Invalid response: missing form id");
        return;
      }
      onFormCreated(formId, fields);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  return (
    <div>
      {fields.map((field, index) => (
        <div className="form-group" key={field.id}>
          <label>Field label</label>

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
          </select>
        </div>
      ))}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button className="secondary" onClick={addField}>
        Add field
      </button>

      <button onClick={saveForm} disabled={fields.length === 0}>
        Save form
      </button>
    </div>
  );
}
