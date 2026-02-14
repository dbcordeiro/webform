import { useParams, useLocation } from "react-router-dom";
import FormRenderer from "../components/FormRenderer";
import { Field } from "../types";

export default function FormRendererPage() {
  const { id } = useParams();
  const location = useLocation();

  const fields = (location.state as { fields: Field[] })?.fields;

  if (!id || !fields) {
    return <p>Form not found</p>;
  }

  return <FormRenderer formId={id} fields={fields} />;
}
