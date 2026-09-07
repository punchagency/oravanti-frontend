import type { ValueType } from "@/components/ui/typed-value-input";

/**
 * The two conversions between a stored answer and an editable one.
 *
 * Questionnaire answers and form field values are both `jsonb`: a yes/no is a
 * boolean, a number is a number, a multi-select is an array. Every input
 * control is string-valued. These are the one place that gap is crossed, so an
 * answer keeps its type instead of quietly becoming a string the first time
 * somebody edits it.
 */

/** `jsonb` in, string out. Multi-select joins on `|`, which no option contains. */
export function toInputValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    /*
      Two kinds of array reach here and they are told apart by what is in them,
      because this has no `type` to ask: a multi-select is a list of option
      strings, a repeating answer is a list of entry objects. Joining the second
      on `|` gives "[object Object]" — a client's saved address history coming
      back as that on their next sitting is the bug this branch exists for.
    */
    return isEntryList(value)
      ? JSON.stringify(value)
      : value.map(String).join("|");
  }

  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Whether an array is a repeating answer rather than a multi-select. */
const isEntryList = (value: unknown[]): boolean =>
  value.length > 0 &&
  value.every(
    (entry) =>
      typeof entry === "object" && entry !== null && !Array.isArray(entry),
  );

/** String in, `jsonb` out. An empty string is a cleared answer, not `""`. */
export function fromInputValue(raw: string, type: ValueType): unknown {
  if (raw === "") return null;
  if (type === "yes_no") return raw === "true";
  if (type === "number" || type === "rating_scale") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : raw;
  }
  if (type === "multiple_choice") return raw.split("|");
  if (type === "repeat_group") return parseEntries(raw);
  return raw;
}

/**
 * A repeating answer, on its way back to the array it is stored as.
 *
 * The draft form is `Record<string, string>` — one string per question, which
 * is what lets a keystroke re-render one field instead of thirty (see
 * `use-draft-form`). A repeating answer rides through it as JSON and is parsed
 * back here, so the storage shape stays an array of objects and nothing else in
 * the form machinery has to learn about lists.
 *
 * Malformed JSON becomes `null` rather than throwing: this runs inside the save
 * handler, and one unparseable answer must not take the other twenty with it.
 * Storing null loses that one answer, which the client can see and retype;
 * throwing loses the save, which they cannot.
 */
export function parseEntries(raw: string): Record<string, unknown>[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    // Entries with nothing in them are dropped rather than stored. A person who
    // presses Add and changes their mind has not given an address, and an empty
    // entry would print an empty block on the form and count as answered.
    const entries = parsed.filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === "object" &&
        entry !== null &&
        !Array.isArray(entry) &&
        Object.values(entry).some((v) => v != null && v !== ""),
    );
    return entries.length > 0 ? entries : null;
  } catch {
    return null;
  }
}
