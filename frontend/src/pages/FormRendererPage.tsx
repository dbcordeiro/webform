import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getForm } from "../api";
import { Field } from "../types";
import FormRenderer from "../components/FormRenderer";
export default function FormRendererPage() {
  const { formId } = useParams<{ formId: string }>();
  const [fields, setFields] = useState<Field[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!formId) return;

    const load = async () => {
      try {
        const data = await getForm(formId);
        setFields(data.fields);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load form");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [formId]);

  if (loading) return <p>Loading form…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="card">
      <h2>Fill the form</h2>
      <FormRenderer formId={formId!} fields={fields} />
    </div>
  );
}
