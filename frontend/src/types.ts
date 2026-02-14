export interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "number" | "textarea";
  required: boolean;
}

export interface FormDefinition {
  id: string;
  title: string;
  fields: FormField[];
}
