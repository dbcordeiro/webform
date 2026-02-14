import { useNavigate } from "react-router-dom";
import FormBuilder from "../components/FormBuilder";
import { Field } from "../types";

export default function FormBuilderPage() {
  const navigate = useNavigate();

  const handleFormCreated = (formId: string, fields: Field[]) => {
    navigate(`/forms/${formId}`, { state: { fields } });
  };

  return <FormBuilder onFormCreated={handleFormCreated} />;
}
