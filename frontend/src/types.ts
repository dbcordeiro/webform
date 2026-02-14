/** Simple field shape used by FormBuilder / FormRenderer (id, label, type). */
export interface Field {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "email" | "textarea";
}

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
