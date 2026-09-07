import { useEffect, useMemo } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

/** What every answer surface edits: one string per question or field key. */
export type DraftValues = Record<string, string>;

export type DraftForm = UseFormReturn<DraftValues>;

/**
 * ─── Why the keys are encoded ───────────────────────────────────────────────
 *
 * React Hook Form reads a field name as a *path*: `a.b` means "property b of
 * object a", and `a[0]` means an array index. Our field keys are dotted by
 * design — `beneficiary.date_of_birth`, `petitioner.mailing_address.city` —
 * because the key names a datum and the dots are what give it structure. Some
 * are bracketed too: `beneficiary.address_history[2].city` names one entry of a
 * repeating answer, and the I-485 carries 80 such fields.
 *
 * Handing one straight to RHF silently breaks the form. `defaultValues` holds
 * the flat string key, the field reads the nested path, and the two never
 * meet: every default resolves to `undefined`, so every field reports itself
 * dirty the moment anything is typed and *no* stored value ever reaches a
 * control. It showed up as "everything says unsaved" on the Forms tab, and not
 * at all on the questionnaire, whose keys are dotless UUIDs.
 *
 * So the key is escaped on the way in and restored on the way out. Percent
 * encoding, because it is reversible and obvious. Callers never see this — they
 * pass real keys and get real keys back — with the single exception of
 * `fieldName`, which is what a row must bind to.
 *
 * ─── Every character RHF reads as syntax, escaped in one pass ───────────────
 *
 * `[` and `]` were not escaped, and the failure was the one above wearing a
 * different hat: `beneficiary.address_history[2].city` reached RHF as an array
 * at `beneficiary%2Eaddress_history`, so `dirtyFields` reported the *array* —
 * one key, the bare base, for however many entries had been typed into.
 * Saving one field at a time never looked at `dirtyFields` and worked; saving a
 * whole form sent `beneficiary.address_history`, which is a datum the form has
 * no box for, and the server refused the batch naming a key nobody had typed.
 *
 * One pass rather than a chain of `.replace`s, because a chain has an ordering
 * rule — `%25` has to be encoded first and decoded last, or an escape gets
 * re-read as one — and that rule is invisible to whoever adds the next
 * character to the list. A single scan cannot re-read its own output.
 */
const RHF_SYNTAX = /[%.[\]]/g;
const ESCAPED = /%(25|2E|5B|5D)/g;

const encodeKey = (key: string) =>
  key.replace(
    RHF_SYNTAX,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );

const decodeKey = (name: string) =>
  name.replace(ESCAPED, (_, hex: string) =>
    String.fromCharCode(parseInt(hex, 16)),
  );

/**
 * The name a row binds to for a given key.
 *
 * Always go through this rather than passing a key to `useController`
 * directly — see the note above for what happens when a dotted key reaches RHF
 * unescaped.
 */
export const fieldName = encodeKey;

/**
 * The draft state behind a questionnaire section or a form.
 *
 * ─── Why react-hook-form and not `useState` ─────────────────────────────────
 *
 * These surfaces put thirty controls on one screen and the container owned a
 * `Record<string, string>` of what had been typed. Every keystroke therefore
 * set state on the container, which re-rendered every row, every dropdown and
 * every date field on the page — so typing lagged behind the keyboard, and the
 * lag grew with the size of the form.
 *
 * React Hook Form keeps values in a ref and publishes changes through
 * subscriptions, so a keystroke re-renders the one field it landed in. The
 * rule that makes that true is *where you subscribe*: read `dirtyFields` in
 * the container and the container re-renders on every keystroke again, which
 * is the whole problem back. Subscriptions belong in leaves — see
 * `UnsavedBar`, which reads the count itself.
 *
 * ─── Staying in step with the server ────────────────────────────────────────
 *
 * `keepDirtyValues` is the load-bearing option. A colleague's edit, or the
 * client's own answer arriving mid-session, has to reach a row nobody is
 * working in — while a row somebody *is* working in must not be overwritten
 * underneath them. That is exactly what it does: untouched fields take the new
 * server value, edited fields are left alone.
 *
 * @param stored The saved values, keyed by question or field. Must be
 *   referentially stable (build it with `useMemo`) — it drives the re-seed.
 */
export function useDraftForm(stored: DraftValues): DraftForm {
  const defaults = useMemo(() => {
    const encoded: DraftValues = {};
    for (const [key, value] of Object.entries(stored)) {
      encoded[encodeKey(key)] = value;
    }
    return encoded;
  }, [stored]);

  const form = useForm<DraftValues>({ defaultValues: defaults });
  const { reset } = form;

  useEffect(() => {
    reset(defaults, { keepDirtyValues: true });
  }, [defaults, reset]);

  return form;
}

/**
 * What changed, as real keys and their current values.
 *
 * Returns entries rather than keys so a caller never has to reach into
 * `getValues()` with an encoded name — which is the one place the escaping
 * above could leak out and be got wrong.
 *
 * Reads `formState` without subscribing to it, so it is safe in an event
 * handler and wrong during render — call it from `onSave`, never in the body
 * of a component. React Hook Form drops a key from `dirtyFields` when its
 * value returns to the default, so typing something and typing it back leaves
 * nothing to save, which is the behaviour a person expects.
 */
export const changedEntries = (
  form: DraftForm,
): { key: string; value: string }[] => {
  const values = form.getValues();
  return Object.keys(form.formState.dirtyFields).map((name) => ({
    key: decodeKey(name),
    value: values[name] ?? "",
  }));
};
