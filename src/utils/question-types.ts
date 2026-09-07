import type { QuestionType } from "@/api/questionnaires";
import type { FormSelectOption } from "@/components/ui/form-select";

/**
 * The answer types a question can have, named once.
 *
 * The enum is shared with form fields on the backend, and the words a person
 * reads for it should be shared too — otherwise "Yes / No" in one dialog is
 * "Yes/No" in another and "yes_no" on the list in between. Every select that
 * offers a type and every badge that reports one reads from here.
 *
 * Types the platform seeds but nobody authors by hand — `matrix_grid`,
 * `signature`, `rating_scale` — have labels but are absent from
 * `AUTHORABLE_TYPES`: a firm should not be able to create one from a dropdown,
 * but a seeded question that is one still has to describe itself.
 */

const LABELS: Record<QuestionType, string> = {
  short_text: "Short text",
  long_text: "Long text",
  number: "Number",
  email: "Email",
  phone: "Phone",
  date: "Date",
  time: "Time",
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  dropdown: "Dropdown",
  rating_scale: "Rating",
  file_upload: "Document",
  yes_no: "Yes / No",
  matrix_grid: "Grid",
  signature: "Signature",
  repeat_group: "Repeating list",
};

/**
 * What to call this answer type. Falls through to the raw value rather than
 * throwing, so a type added by a newer backend deployment renders as itself
 * instead of blanking the row.
 */
export const questionTypeLabel = (type: string): string =>
  LABELS[type as QuestionType] ?? type.replace(/_/g, " ");

/** The types a firm may choose when writing a question, in the order offered. */
export const AUTHORABLE_TYPES: QuestionType[] = [
  "short_text",
  "long_text",
  "number",
  "date",
  "yes_no",
  "email",
  "phone",
  "dropdown",
  "multiple_choice",
  "file_upload",
];

export const QUESTION_TYPE_OPTIONS: FormSelectOption[] = AUTHORABLE_TYPES.map(
  (type) => ({ label: LABELS[type], value: type }),
);

/** Whether this type needs a list of choices before it can be answered. */
export const needsChoices = (type: QuestionType) =>
  type === "dropdown" || type === "single_choice" || type === "multiple_choice";
