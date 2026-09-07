import {
  Button,
  Checkbox,
  Field,
  Input,
  Text,
  Textarea,
} from "@chakra-ui/react";
import type { ReactNode } from "react";
import {
  useController,
  useFormState,
  type Control,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from "react-hook-form";

import { FormSelect, type FormSelectOption } from "./form-select";
import { SearchableSelect, type SearchableOption } from "./searchable-select";

/**
 * Form controls bound to react-hook-form, one component per control.
 *
 * ─── Why each control is its own component ──────────────────────────────────
 *
 * The alternative — a `useState` per box in the dialog that renders them — is
 * what these replace, and it is slower than it looks. State lives in the
 * component that declares it, so a keystroke in *one* box re-renders the whole
 * dialog: every other input, every select's collection, every hint. On a nine
 * field dialog that is nine controls rebuilt per character, and the typing
 * visibly trails the keyboard.
 *
 * `useController` subscribes the component it is called in, and nothing else.
 * Putting it in a leaf is therefore the whole trick: a keystroke re-renders one
 * control. That is the same division the questionnaire and the Forms tab
 * already use for their rows — see `use-draft-form` for the long version — and
 * these components are how a dialog gets it without hand-writing a leaf per box.
 *
 * The rule that keeps it true: **never read `watch()`, `formState` or
 * `useWatch` in the component that renders the controls.** That resubscribes
 * the parent and puts every re-render straight back. Anything that needs to see
 * across fields is a leaf too — `SubmitWhenValid` below, `UnsavedBar`,
 * `SubmitGate`.
 */

/*
 * `field.ref` is deliberately not forwarded. react-hook-form uses it for one
 * thing — focusing the first invalid box when `handleSubmit` rejects — and
 * these controls are saved by reading `getValues()` behind a button that is
 * disabled until the form is valid, so nothing ever rejects. Forwarding it also
 * trips `react-hooks/refs`, which then reads every `input.x` on the element as
 * a ref access during render.
 */
type Bound<T extends FieldValues, N extends Path<T>> = {
  control: Control<T>;
  name: N;
  /** Validation, in react-hook-form's own vocabulary. Messages are shown below the box. */
  rules?: RegisterOptions<T, N>;
  label: string;
  /** Shown under the box, in the muted voice — what this is for, not what went wrong. */
  hint?: ReactNode;
  disabled?: boolean;
};

/** A single-line box. */
export function TextField<T extends FieldValues, N extends Path<T>>({
  control,
  name,
  rules,
  label,
  hint,
  disabled,
  placeholder,
  autoFocus,
  mono,
  transform,
}: Bound<T, N> & {
  placeholder?: string;
  autoFocus?: boolean;
  /** For identifiers — a field key, a form code — which read wrongly in prose type. */
  mono?: boolean;
  /** Applied on the way in, e.g. upper-casing a form code as it is typed. */
  transform?: (value: string) => string;
}) {
  const { field: input, fieldState } = useController({ control, name, rules });

  return (
    <Field.Root invalid={Boolean(fieldState.error)} disabled={disabled}>
      <Field.Label fontSize="12px" color="fg.muted">
        {label}
      </Field.Label>
      <Input
        size="sm"
        fontSize="13px"
        fontFamily={mono ? "mono" : undefined}
        autoFocus={autoFocus}
        placeholder={placeholder}
        name={input.name}
        value={(input.value as string) ?? ""}
        onChange={(e) =>
          input.onChange(transform ? transform(e.target.value) : e.target.value)
        }
        onBlur={input.onBlur}
      />
      {hint && (
        <Text fontSize="11px" color="fg.muted" mt={1} lineHeight="15px">
          {hint}
        </Text>
      )}
      {fieldState.error?.message && (
        <Field.ErrorText fontSize="11px">
          {fieldState.error.message}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
}

/** A multi-line box. */
export function TextAreaField<T extends FieldValues, N extends Path<T>>({
  control,
  name,
  rules,
  label,
  hint,
  disabled,
  placeholder,
  rows = 3,
  autoFocus,
}: Bound<T, N> & {
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
}) {
  const { field: input, fieldState } = useController({ control, name, rules });

  return (
    <Field.Root invalid={Boolean(fieldState.error)} disabled={disabled}>
      <Field.Label fontSize="12px" color="fg.muted">
        {label}
      </Field.Label>
      <Textarea
        size="sm"
        fontSize="13px"
        rows={rows}
        autoFocus={autoFocus}
        placeholder={placeholder}
        name={input.name}
        value={(input.value as string) ?? ""}
        onChange={input.onChange}
        onBlur={input.onBlur}
      />
      {hint && (
        <Text fontSize="11px" color="fg.muted" mt={1} lineHeight="15px">
          {hint}
        </Text>
      )}
      {fieldState.error?.message && (
        <Field.ErrorText fontSize="11px">
          {fieldState.error.message}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
}

/**
 * A dropdown.
 *
 * `options` must be referentially stable — `FormSelect` is memoized and rebuilds
 * its whole collection when the array identity changes. A module-level constant
 * or a `useMemo` in the caller; never an array literal in the JSX.
 */
export function SelectField<T extends FieldValues, N extends Path<T>>({
  control,
  name,
  rules,
  label,
  hint,
  disabled,
  options,
  placeholder,
}: Bound<T, N> & { options: FormSelectOption[]; placeholder?: string }) {
  const { field: input, fieldState } = useController({ control, name, rules });

  return (
    <Field.Root invalid={Boolean(fieldState.error)} disabled={disabled}>
      <Field.Label fontSize="12px" color="fg.muted">
        {label}
      </Field.Label>
      <FormSelect
        options={options}
        value={(input.value as string) ?? ""}
        onChange={input.onChange}
        placeholder={placeholder}
        disabled={disabled}
        invalid={Boolean(fieldState.error)}
        ariaLabel={label}
      />
      {hint && (
        <Text fontSize="11px" color="fg.muted" mt={1} lineHeight="15px">
          {hint}
        </Text>
      )}
      {fieldState.error?.message && (
        <Field.ErrorText fontSize="11px">
          {fieldState.error.message}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
}

/**
 * A dropdown you can search.
 *
 * `SelectField` above is right for a closed handful — an answer type, a
 * section. This one is for the lists where scrolling is not a way to find
 * anything: the form-field vocabulary is well over a thousand names. Same
 * stability rule as `SelectField` — `options` must be a `useMemo` or a
 * module constant, never an array literal in the JSX.
 */
export function SearchableSelectField<
  T extends FieldValues,
  N extends Path<T>,
>({
  control,
  name,
  rules,
  label,
  hint,
  disabled,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  loading,
}: Bound<T, N> & {
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  loading?: boolean;
}) {
  const { field: input, fieldState } = useController({ control, name, rules });

  return (
    <Field.Root invalid={Boolean(fieldState.error)} disabled={disabled}>
      <Field.Label fontSize="12px" color="fg.muted">
        {label}
      </Field.Label>
      <SearchableSelect
        options={options}
        value={(input.value as string) ?? ""}
        onChange={input.onChange}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        loading={loading}
        disabled={disabled}
        invalid={Boolean(fieldState.error)}
        ariaLabel={label}
        // The value is what was chosen, and it stays readable when the
        // catalogue has not arrived yet — a key is text, not an opaque id.
        selectedLabel={(input.value as string) ?? ""}
      />
      {hint && (
        <Text fontSize="11px" color="fg.muted" mt={1} lineHeight="15px">
          {hint}
        </Text>
      )}
      {fieldState.error?.message && (
        <Field.ErrorText fontSize="11px">
          {fieldState.error.message}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
}

/** A tickbox. Its label is the sentence beside it, so it takes children rather than `label`. */
export function CheckboxField<T extends FieldValues>({
  control,
  name,
  disabled,
  children,
}: {
  control: Control<T>;
  name: Path<T>;
  disabled?: boolean;
  children: ReactNode;
}) {
  const { field: input } = useController({ control, name });

  return (
    <Checkbox.Root
      size="sm"
      disabled={disabled}
      checked={Boolean(input.value)}
      onCheckedChange={(details) => input.onChange(Boolean(details.checked))}
    >
      <Checkbox.HiddenInput name={input.name} onBlur={input.onBlur} />
      <Checkbox.Control />
      <Checkbox.Label fontSize="13px" fontWeight="400">
        {children}
      </Checkbox.Label>
    </Checkbox.Root>
  );
}

/**
 * The save button, disabled until the form could actually be saved.
 *
 * A leaf for the same reason `UnsavedBar` is one: validity changes on every
 * keystroke, so reading it beside the controls would re-render all of them and
 * undo the point of the components above. The form must be created with
 * `mode: "onChange"` — react-hook-form only keeps `isValid` current in that
 * mode.
 */
export function SubmitWhenValid<T extends FieldValues>({
  control,
  isPending,
  onClick,
  children,
}: {
  control: Control<T>;
  isPending?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const { isValid } = useFormState({ control });

  return (
    <Button
      layerStyle="brand-button"
      size="sm"
      fontSize="12px"
      h="32px"
      disabled={!isValid}
      loading={isPending}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
