import FormBuilder from "./FormBuilder";
import { Field } from "./types";

interface Props {
  onFormCreated: (id: string, fields: Field[]) => void;
}

export default function FormBuilderWrapper({ onFormCreated }: Props) {
  return <FormBuilder onFormCreated={onFormCreated} />;
}
