import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getForm } from "../api";
import { Field } from "../types";
import FormRenderer from "../components/FormRenderer";
export default function FormRendererPage() {
  const { id: formId } = useParams<{ id: string }>();
  const [fields, setFields] = useState<Field[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!formId) return;

    const load = async () => {
      try {
        const data = await getForm(formId);
        setFields(data.fields ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load form");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [formId]);

  if (loading) return <div className="page-center"><div className="card"><p className="loading-text">Loading form…</p></div></div>;
  if (error) return <div className="page-center"><div className="card"><p className="error-text">{error}</p></div></div>;
  if (!formId) return <div className="page-center"><div className="card"><p className="error-text">Missing form ID</p></div></div>;

  return (
    <div className="page-center">
      <div className="card card--renderer">
        <h2 className="page-title">Fill the form</h2>
        <FormRenderer formId={formId} fields={fields} />
      </div>
    </div>
  );
}
