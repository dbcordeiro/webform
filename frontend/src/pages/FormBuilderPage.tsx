import { useNavigate } from "react-router-dom";
import FormBuilder from "../components/FormBuilder";
import { Field } from "../types";

export default function FormBuilderPage() {
  const navigate = useNavigate();

  const handleFormCreated = (formId: string, fields: Field[]) => {
    navigate(`/forms/${formId}`, { state: { fields } });
  };

  return (
    <div className="page-center">
      <div className="card card--builder">
        <h1 className="page-title">Create your form here</h1>
        <FormBuilder onFormCreated={handleFormCreated} />
      </div>
    </div>
  );
}
