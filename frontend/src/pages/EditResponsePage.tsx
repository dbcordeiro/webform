import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getForm, getResponse } from "../api";
import FormRenderer from "../components/FormRenderer";
import { Field } from "../types";

export default function EditResponsePage() {
  const { id: formId, responseId } = useParams<{ id: string; responseId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [fields, setFields] = useState<Field[]>([]);
  const [initialValues, setInitialValues] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formId || !responseId || !token) {
      setError("Missing form, response, or edit token.");
      setLoading(false);
      return;
    }
    Promise.all([getForm(formId), getResponse(formId, responseId, token)])
      .then(([formData, responseData]) => {
        setFields(formData.fields ?? []);
        setInitialValues((responseData.answers as Record<string, string | number>) ?? {});
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [formId, responseId, token]);

  if (loading) return <div className="page-center"><div className="card"><p className="loading-text">Loading…</p></div></div>;
  if (error) return <div className="page-center"><div className="card"><p className="error-text">{error}</p></div></div>;
  if (!formId || !responseId) return <div className="page-center"><div className="card"><p className="error-text">Missing form or response ID</p></div></div>;

  return (
    <div className="page-center">
      <div className="card card--renderer">
        <h2 className="page-title">Edit your response</h2>
        <FormRenderer
          formId={formId}
          fields={fields}
          initialValues={initialValues}
          responseId={responseId}
          editToken={token}
        />
      </div>
    </div>
  );
}
