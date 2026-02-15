import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getForm } from "../api";
import FormBuilder from "../components/FormBuilder";
import { Field } from "../types";

export default function EditFormPage() {
  const { id: formId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) return;
    getForm(formId)
      .then((data) => {
        setTitle(data.title ?? "");
        setFields(data.fields ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load form"))
      .finally(() => setLoading(false));
  }, [formId]);

  if (loading) return <div className="page-center"><div className="card"><p className="loading-text">Loading form…</p></div></div>;
  if (error) return <div className="page-center"><div className="card"><p className="error-text">{error}</p></div></div>;
  if (!formId) return <div className="page-center"><div className="card"><p className="error-text">Missing form ID</p></div></div>;

  return (
    <div className="page-center">
      <div className="card card--builder">
        <h1 className="page-title">Edit your form</h1>
        <FormBuilder
          formId={formId}
          initialTitle={title}
          initialFields={fields}
          onFormUpdated={() => navigate(`/forms/${formId}`)}
          onFormCreated={() => {}}
        />
      </div>
    </div>
  );
}
