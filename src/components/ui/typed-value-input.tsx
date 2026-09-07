import { Checkbox, Input, Stack, Textarea } from "@chakra-ui/react";
import { useCallback, useMemo } from "react";
import { DateField } from "./date-field";
import { FormSelect, type FormSelectOption } from "./form-select";
import { TimeField } from "./time-field";

/**
 * One input, chosen by the type of the thing being answered.
 *
 * Questionnaire questions and form fields share a single type vocabulary — the
 * backend gives `form_field_definitions.type` the questionnaire's own enum on
 * purpose — so they share this control too. Without it, "a date is a date
 * picker" would be implemented twice and would drift the first time one side
 * gained a type.
 *
 * Values are strings here and `jsonb` at rest. The two conversions live in
 * `@/utils/answer-value` rather than at each call site, so a yes/no round-trips
 * as a boolean wherever it is rendered.
 */

export type ValueType =
  | "short_text"
  | "long_text"
  | "number"
  | "email"
  | "phone"
  | "date"
  | "time"
  | "single_choice"
  | "multiple_choice"
  | "dropdown"
  | "rating_scale"
  | "file_upload"
  | "yes_no"
  | "matrix_grid"
  | "signature"
  | "repeat_group"
  | (string & {});

const YES_NO: FormSelectOption[] = [
  { label: "Yes", value: "true" },
  { label: "No", value: "false" },
];

const RATINGS: FormSelectOption[] = ["1", "2", "3", "4", "5"].map((n) => ({
  label: n,
  value: n,
}));

export function TypedValueInput({
  type,
  value,
  options,
  onChange,
  onCommit,
  disabled,
  readOnly,
  ariaLabel,
  placeholder,
}: {
  type: ValueType;
  /** Always a string; see `toInputValue`. */
  value: string;
  /** Choices for a choice type, from the question's or field's `config`. */
  options?: string[];
  onChange: (next: string) => void;
  /**
   * Called when the value is settled — on blur for typing, immediately
   * otherwise. Omitted where the surrounding form saves explicitly and a
   * settled value means nothing on its own.
   */
  onCommit?: (next: string) => void;
  disabled?: boolean;
  /**
   * Show the answer without offering to change it.
   *
   * ─── Why this is one control and not each type's own read state ───────────
   *
   * A form being *checked* is read far more often than it is typed into, and it
   * has to read as the document — so the resting state of a form field is the
   * answer sitting in the box it prints from, not a label-and-value list beside
   * it. That is a page of up to 512 controls, which rules out `disabled`: Chakra
   * dims a disabled control on purpose, and a whole form dimmed is a form
   * nobody can proofread.
   *
   * A read-only `Input` keeps full contrast, and it is the same shape for every
   * type — a date, a choice and a name all read as what was answered, which is
   * how they print. The typed control (picker, select, checkboxes) comes back
   * the moment the field is editable, because that is when the *type* is what
   * matters.
   */
  readOnly?: boolean;
  ariaLabel?: string;
  placeholder?: string;
}) {
  // A choice or a date has no meaningful blur-to-commit: the change *is* the
  // decision. Free text waits for blur, or every keystroke would be a request.
  const chooseAndCommit = useCallback(
    (next: string) => {
      onChange(next);
      onCommit?.(next);
    },
    [onChange, onCommit],
  );

  const choices = useMemo<FormSelectOption[]>(() => {
    if (type === "yes_no") return YES_NO;
    if (type === "rating_scale") return RATINGS;
    return (options ?? []).map((option) => ({ label: option, value: option }));
  }, [type, options]);

  if (readOnly) {
    const text = displayText(value, choices);
    const Control = type === "long_text" ? Textarea : Input;
    return (
      <Control
        size="sm"
        fontSize="13px"
        readOnly
        // A short row for a long answer would hide the end of it, and this is
        // the view somebody proofreads from.
        {...(type === "long_text" ? { rows: 2 } : {})}
        aria-label={ariaLabel}
        value={text}
        placeholder="—"
        // Read-only, not disabled: full contrast, no text cursor, and still
        // selectable — copying a receipt number off a filed form is ordinary.
        cursor="default"
        _focusVisible={{ borderColor: "border" }}
        onChange={() => {}}
      />
    );
  }

  if (type === "date") {
    return (
      <DateField value={value} onChange={chooseAndCommit} ariaLabel={ariaLabel} />
    );
  }

  if (type === "time") {
    return (
      <TimeField value={value} onChange={chooseAndCommit} ariaLabel={ariaLabel} />
    );
  }

  if (type === "multiple_choice" && choices.length > 0) {
    const selected = value ? value.split("|") : [];
    return (
      <Stack gap={1.5}>
        {choices.map((choice) => (
          <Checkbox.Root
            key={choice.value}
            size="sm"
            disabled={disabled}
            checked={selected.includes(choice.value)}
            onCheckedChange={(details) => {
              const next = details.checked
                ? [...selected, choice.value]
                : selected.filter((v) => v !== choice.value);
              chooseAndCommit(next.join("|"));
            }}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label fontSize="13px" fontWeight="400">
              {choice.label}
            </Checkbox.Label>
          </Checkbox.Root>
        ))}
      </Stack>
    );
  }

  // A choice type the catalogue gave no options falls through to free text
  // rather than rendering an empty dropdown nobody can answer.
  const isChoice =
    type === "yes_no" ||
    type === "rating_scale" ||
    type === "single_choice" ||
    type === "dropdown";

  if (isChoice && choices.length > 0) {
    return (
      <FormSelect
        options={choices}
        value={value}
        onChange={chooseAndCommit}
        placeholder={placeholder ?? "Select"}
        disabled={disabled}
        ariaLabel={ariaLabel}
      />
    );
  }

  if (type === "long_text") {
    return (
      <Textarea
        size="sm"
        fontSize="13px"
        rows={2}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onCommit?.(value)}
      />
    );
  }

  return (
    <Input
      size="sm"
      fontSize="13px"
      type={htmlInputType(type)}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => onCommit?.(value)}
    />
  );
}

/**
 * What an answer says, for the read-only control.
 *
 * The stored value is the machine's — `true`, or two choices joined on `|` —
 * and the read view is where somebody checks the form against the client's
 * documents, so it shows what a person would read off the paper. Anything the
 * choice list does not recognise falls through unchanged rather than being
 * dropped: a value from an older version of the form is still what is on the
 * matter.
 */
function displayText(value: string, choices: FormSelectOption[]) {
  if (!value) return "";
  const label = (one: string) =>
    choices.find((choice) => choice.value === one)?.label ?? one;
  return value.includes("|")
    ? value.split("|").map(label).join(", ")
    : label(value);
}

const htmlInputType = (type: ValueType) => {
  if (type === "number") return "number";
  if (type === "email") return "email";
  if (type === "phone") return "tel";
  return "text";
};

