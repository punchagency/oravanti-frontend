import { act, renderHook } from "@testing-library/react";
import { useController } from "react-hook-form";
import { describe, expect, it } from "vitest";

import {
  changedEntries,
  fieldName,
  useDraftForm,
  type DraftValues,
} from "./use-draft-form";

/**
 * Field keys are dotted by design — `beneficiary.date_of_birth` names a datum
 * and the dots are its structure. React Hook Form reads a field name as a
 * *path*, so an unescaped key makes `defaultValues` and the bound field point
 * at two different places: every default resolves to `undefined`, no stored
 * value reaches a control, and every field reports itself dirty.
 *
 * That shipped once, as "everything says unsaved" on the Forms tab. These
 * tests exist so it cannot ship again — none of it is visible to the type
 * checker, since every key is just a `string`.
 */
describe("useDraftForm with dotted field keys", () => {
  const stored: DraftValues = {
    "beneficiary.date_of_birth": "1990-01-01",
    "beneficiary.given_name": "Ada",
    "petitioner.mailing_address.city": "Austin",
    plain_key: "no dots here",
  };

  const keys = Object.keys(stored);

  /**
   * Binds every key the way a row does — `useController`, not `register`.
   * That distinction is the bug: registering a field seeds a value at the
   * nested path while the default sits at the flat one, and the mismatch is
   * what marks an untouched field dirty. A `register`-based test misses it.
   *
   * `keys` is fixed for the life of the test, so the loop of hooks is stable.
   */
  const useRows = (values: DraftValues) => {
    const form = useDraftForm(values);
    const rows = keys.map((key) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useController({ control: form.control, name: fieldName(key) }),
    );
    return { form, rows };
  };

  const render = (values: DraftValues = stored) =>
    renderHook(({ v }) => useRows(v), { initialProps: { v: values } });

  it("gives every bound row its stored value", () => {
    const { result } = render();

    expect(result.current.rows.map((r) => r.field.value)).toEqual(
      keys.map((key) => stored[key]),
    );
  });

  it("marks no row dirty until one is edited", () => {
    const { result } = render();

    expect(result.current.rows.map((r) => r.fieldState.isDirty)).toEqual(
      keys.map(() => false),
    );
    expect(changedEntries(result.current.form)).toEqual([]);
  });

  it("marks only the edited row dirty, leaving its siblings clean", () => {
    const { result } = render();

    act(() => {
      result.current.rows[0].field.onChange("1991-02-03");
    });

    // Siblings under the same `beneficiary.` prefix must stay clean — they are
    // separate fields, not branches of one.
    expect(result.current.rows.map((r) => r.fieldState.isDirty)).toEqual([
      true,
      false,
      false,
      false,
    ]);
  });

  it("reports only the edited field, under its real key", () => {
    const { result } = render();

    act(() => {
      result.current.rows[0].field.onChange("1991-02-03");
    });

    expect(changedEntries(result.current.form)).toEqual([
      { key: "beneficiary.date_of_birth", value: "1991-02-03" },
    ]);
  });

  /**
   * The reported symptom, reproduced. A controlled select renders
   * `value={input.value ?? FALLBACK}` and echoes that value back through
   * `onChange` as it mounts. When the default reaches the field, the echo is
   * a no-op and the row stays clean. When it does not, `input.value` is
   * `undefined`, the row echoes the *fallback* instead, and every untouched
   * row on the form lights up `unsaved`.
   */
  it("stays clean when a control echoes its own value back on mount", () => {
    const { result } = render();

    act(() => {
      for (const row of result.current.rows) {
        row.field.onChange(row.field.value ?? "__fallback__");
      }
    });

    expect(result.current.rows.map((r) => r.fieldState.isDirty)).toEqual(
      keys.map(() => false),
    );
    expect(changedEntries(result.current.form)).toEqual([]);
  });
  it("keeps values flat rather than nesting them into objects", () => {
    const { result } = render();

    // `{ beneficiary: { date_of_birth: ... } }` is what a raw dotted name
    // produces, and it is what breaks the comparison against the defaults.
    expect(result.current.form.getValues()).not.toHaveProperty("beneficiary");
  });

  it("does not carry dirt across a change of subject", () => {
    const { result, rerender } = render();

    const next: DraftValues = {
      ...stored,
      "beneficiary.given_name": "Grace",
    };
    rerender({ v: next });

    expect(changedEntries(result.current.form)).toEqual([]);
    expect(result.current.rows[1].field.value).toBe("Grace");
  });

  /*
    The bug this file's docblock describes, wearing a different hat.

    `beneficiary.address_history[2].city` names one entry of a repeating answer
    — the I-485 carries 80 such fields — and `[` is RHF path syntax exactly as
    `.` is. Unescaped, the draft held an *array* at the bare base, so
    `dirtyFields` reported one key for however many entries had been typed into
    and a whole-form Save sent `beneficiary.address_history`: a datum the form
    has no box for, which the server refused, naming a key nobody had typed.

    Saving one field at a time never reads `dirtyFields`, which is why it kept
    working and made the whole-form Save look like the broken one.
  */
  it("round-trips a key that names one entry of a repeating answer", () => {
    const indexed: DraftValues = {
      "beneficiary.address_history[2].city": "Brooklyn",
    };
    const form = renderHook(() => useDraftForm(indexed));

    // The stored value reaches the control, which is the half that fails
    // silently: an unescaped key resolves to `undefined` and the row renders
    // empty over an answer the client gave.
    expect(
      form.result.current.getValues()[
        fieldName("beneficiary.address_history[2].city")
      ],
    ).toBe("Brooklyn");

    act(() => {
      form.result.current.setValue(
        fieldName("beneficiary.address_history[2].city"),
        "Queens",
        { shouldDirty: true },
      );
    });

    expect(changedEntries(form.result.current)).toEqual([
      { key: "beneficiary.address_history[2].city", value: "Queens" },
    ]);
    // Not an array at the base, which is what the server was being sent.
    expect(form.result.current.getValues()).not.toHaveProperty("beneficiary");
  });

  it("round-trips a key that already contains a percent sign", () => {
    // Hoisted: an object literal written inside the hook callback is a new
    // reference every render, which re-runs the re-seed effect forever.
    const odd: DraftValues = { "odd%2Ekey.here": "value" };
    const form = renderHook(() => useDraftForm(odd));

    act(() => {
      form.result.current.setValue(fieldName("odd%2Ekey.here"), "changed", {
        shouldDirty: true,
      });
    });

    expect(changedEntries(form.result.current)).toEqual([
      { key: "odd%2Ekey.here", value: "changed" },
    ]);
  });
});
