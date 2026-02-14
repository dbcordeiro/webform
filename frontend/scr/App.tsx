// App.tsx
import { useState } from "react";
import FormBuilder from "./FormBuilder";
import FormRenderer from "./FormRenderer";
import FormBuilderWrapper from "./FormBuilderWrapper";
import { Field } from "./types";

export default function App() {
  const [formId, setFormId] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);

  return (
    <div style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
      <h1>Dynamic Web Form</h1>

      {!formId ? (
        <FormBuilderWrapper
          onFormCreated={(id, fields) => {
            setFormId(id);
            setFields(fields);
          }}
        />
      ) : (
        <FormRenderer formId={formId} fields={fields} />
      )}
    </div>
  );
}
