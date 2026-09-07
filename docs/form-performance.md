# Forms that don't lag

Notes from making the questionnaire and forms tabs usable. Everything here is
something that actually went wrong in this repo, with the fix that was applied.
Read it before building any screen with more than a handful of inputs.

The one-line version: **a keystroke should re-render one field.** Every problem
below is a variation on failing that.

---

## 1. Never put draft values in container state

This is the big one, and it is what every other item is downstream of.

```tsx
// ✗ What we had
const [drafts, setDrafts] = useState<Record<string, string>>({});

<AnswerRow
  draft={drafts[q.id] ?? stored[q.id]}
  onDraftChange={(next) => setDrafts((c) => ({ ...c, [q.id]: next }))}
/>;
```

The container owns the values, so every keystroke sets state **on the
container**, which re-renders every row, every dropdown and every date picker on
the page. Thirty questions, thirty rows re-rendered per character. Typing
visibly trailed the keyboard, and it got worse as forms got longer.

```tsx
// ✓ What we do now
const form = useDraftForm(stored); // src/components/questionnaire/use-draft-form.ts
<AnswerRow control={form.control} />; // row binds to its own field
```

React Hook Form keeps values in a ref and publishes changes through
subscriptions. Nothing re-renders unless it asked to hear about that field.

**Rule:** if you are writing `useState<Record<string, ...>>` for form values,
stop and reach for `useForm`.

---

## 2. Subscribe in leaves, never in the container

This is the part that is easy to get wrong, and getting it wrong silently
undoes item 1 — the code still uses RHF and still re-renders everything.

```tsx
// ✗ Container re-renders on every keystroke. RHF bought you nothing.
const { dirtyFields } = useFormState({ control: form.control });
return (
  <>
    {rows}
    <UnsavedBar count={Object.keys(dirtyFields).length} />
  </>
);
```

`dirtyFields` changes as soon as any field is touched, so reading it in the
component that renders the rows re-renders the rows.

```tsx
// ✓ The bar reads its own count. It is a leaf, so only the bar re-renders.
<UnsavedBar control={form.control} /> // useFormState lives inside
```

**Which fields are cheap to read where:**

| Read                               | Where                          | Why                               |
| ---------------------------------- | ------------------------------ | --------------------------------- |
| `isDirty`                          | container is fine              | flips false→true once, then stays |
| `dirtyFields`, `errors`, `isValid` | leaf only                      | changes per field                 |
| a single field's value             | leaf only, via `useController` | changes per keystroke             |

The navigation guard needs `isDirty`, so the container reads exactly that and
nothing else. RHF's `formState` is a Proxy: it only subscribes to the keys you
actually destructure, so `const { isDirty } = useFormState(...)` genuinely does
not subscribe to `dirtyFields`.

---

## 3. Bind rows with `useController`, not `Controller` render props

```tsx
function AnswerRow({ question, control }) {
  const { field, fieldState } = useController({ control, name: question.id });
  // field.value, field.onChange, fieldState.isDirty — all scoped to this row
}
```

`useController` gives you the value _and_ the dirty state anywhere in the
component's JSX. A `<Controller render={...}>` only covers what is inside its
render prop, which forces you to either wrap the whole row or thread
`fieldState` around by hand — we had an "unsaved" badge above the input and a
control below it, and one Controller could not serve both.

It also removes three props from every row (`draft`, `isDirty`,
`onDraftChange`), which is what made item 4 impossible to get wrong.

---

## 4. `React.memo` on a row is a trap unless every prop is stable

We memoized `FieldMapRow` and it did nothing, because the call site passed
this:

```tsx
onDraftChange={(next) => onDraftChange(field.fieldKey, next)}   // ✗ new function every render
```

A single inline arrow defeats the comparison entirely, and nothing tells you.
The fix at the time was `useCallback` at the container plus a stable
`(fieldKey, next)` signature — it worked, but it is a rule you have to keep
obeying forever, in every future edit, or the optimization quietly evaporates.

`useController` is better because it removes the need for the memo: the row
subscribes to its own field, so it re-renders when that field changes
regardless of what the parent does.

**Rule:** prefer _not needing_ memo over memo. If you do need it, memo is a
claim about every prop, and inline arrows and object literals break it.

---

## 5. Mount option lists only while the menu is open

Chakra v3's `Select` has **no `lazyMount`**. `Select.Content` and every
`Select.Item` mount with the trigger and sit hidden.

That is invisible with three dropdowns of four options. Our field-sources view
had ~25 dropdowns each offering every question on the matter — several hundred
hidden DOM nodes built before anyone clicked anything, on every render.

```tsx
// ✓ src/components/ui/form-select.tsx
const [open, setOpen] = useState(false);

<Select.Root open={open} onOpenChange={(e) => setOpen(e.open)} collection={collection}>
  ...
  <Select.Content>
    {open && collection.items.map((item) => <Select.Item ... />)}
  </Select.Content>
</Select.Root>
```

The `collection` still holds every item, so `Select.ValueText` resolves the
selected label with the menu shut. Only the rendering waits.

Check this whenever you put a dropdown inside a list.

---

## 6. Fetch per screen, not per package

Not a render problem, but it looks identical to the user — the screen sits
there.

The Forms tab shows **one** form and was fetching the field map for **all six**
plus every question on the matter. The fix was an endpoint that takes a form
code (`GET /cases/:caseId/forms/:formCode/field-map`) and a hook shaped exactly
like the one for values, so opening a form fetches that form.

Two wins: the first paint waits on a sixth of the data, and each form gets its
own cache entry, so going back to one is instant.

**Rule:** the unit you fetch should be the unit you render.

---

## 7. Keep the server and the draft in step with `keepDirtyValues`

The naïve `reset(serverValues)` on every refetch throws away whatever the
person is typing. Not resetting at all means a colleague's edit never appears.

```tsx
useEffect(() => {
  reset(stored, { keepDirtyValues: true });
}, [stored, reset]);
```

Untouched fields take the new server value; edited fields are left alone. This
is the whole reason the "derive the draft from `drafts[id] ?? stored[id]`"
pattern existed, and RHF does it properly.

`stored` **must be referentially stable** — build it with `useMemo` or this
effect runs on every render.

---

## 8. Make submission immediate

Two habits:

**Reset against what you just sent, not what comes back.**

```tsx
onSuccess: () => {
  form.reset(form.getValues()); // fields go clean now
  onSaved?.();
};
```

Waiting for the invalidated query to land leaves the Save button and the
unsaved count showing stale state for the length of a round trip. Resetting to
the submitted values is correct — that _is_ what is stored now — and
`keepDirtyValues` lets the server's copy arrive later without disturbing
anything typed since.

**Send only what changed.** `changedEntries(form)` reads `dirtyFields`, and RHF
drops a key when its value returns to the default — so typing something and
typing it back sends nothing, which is what a person expects.

Read `formState` in an event handler, never during render, or you subscribe to
it and land back in item 2.

---

## 9. A dotted field key is a path to React Hook Form, not a name

This one shipped, and it is the least visible item here — nothing about it is
type-checkable, because every field key is just a `string`.

RHF reads a field name as a **path**: `a.b` means "property `b` of object `a`",
and `a[0]` means an array index. Our form field keys are dotted by design —
`beneficiary.date_of_birth`, `petitioner.mailing_address.city` — because the key
names a datum and the dots are its structure.

Hand one straight to RHF and the form quietly comes apart:

```tsx
// ✗ defaultValues holds the flat string key…
useForm({ defaultValues: { "beneficiary.date_of_birth": "1990-01-01" } });
// …and the field reads the nested path. The two never meet.
useController({ control, name: "beneficiary.date_of_birth" }); // value: undefined
```

Three things break at once, and only the third gets reported:

1. **No stored value reaches the control.** Every default resolves to `undefined`.
2. **Saves send the wrong key.** `dirtyFields` nests too, so `Object.keys()` on it
   yields `"beneficiary"` — a key the server has never heard of.
3. **Every untouched field says "unsaved".** This is the visible symptom, and it
   comes from the interaction with item 1. A controlled select renders
   `value={input.value ?? FALLBACK}` and echoes that value back through
   `onChange` as it mounts. Normally the echo is a no-op. With the default
   missing, `input.value` is `undefined`, so the row echoes the _fallback_ —
   a real change, against a default of `undefined` — and lights up dirty.
   Thirty rows, thirty "unsaved" badges, nobody having typed anything.

The fix is to escape the key on the way in and restore it on the way out, so RHF
only ever sees a name with no path characters in it:

```ts
// src/components/questionnaire/use-draft-form.ts
const encodeKey = (key: string) =>
  key.replace(/%/g, "%25").replace(/\./g, "%2E");
const decodeKey = (name: string) =>
  name.replace(/%2E/g, ".").replace(/%25/g, "%");

export const fieldName = encodeKey; // what a row binds to
```

Percent encoding because it is reversible and obvious; `%` goes first so the two
rules cannot collide. Callers pass real keys and get real keys back —
`changedEntries()` returns `{ key, value }` entries rather than names, so the
encoding cannot leak into a save payload.

```tsx
// ✓ every row, every surface
useController({ control, name: fieldName(field.fieldKey) });
```

**Why it hid for so long:** questionnaire question ids are dotless UUIDs, so the
questionnaire tab was fine and only the Forms tab misbehaved. If one surface
works and its twin doesn't, compare the _shape of the keys_ before anything else.

**Rule:** never pass a key you did not mint yourself to `useController` or
`register` without escaping it. Anything server-defined — a field key, a column
name, a JSON pointer — can contain `.`, `[` or `]`.

---

## Checklist for a new form screen

- [ ] Values live in `useForm`, not `useState`
- [ ] Rows take `control` and call `useController`
- [ ] `dirtyFields` / `errors` are read in leaves; the container reads at most `isDirty`
- [ ] `stored` defaults are `useMemo`'d, and re-seeded with `keepDirtyValues`
- [ ] Dropdowns inside lists don't mount their options until opened
- [ ] The screen fetches what it renders, not its parent's whole collection
- [ ] Save resets against submitted values and sends only the changed keys
- [ ] Server-defined field keys are escaped before they reach RHF (`fieldName`)
- [ ] Deletions go through `useConfirmDialog`

## Where this lives in the repo

| Piece                                 | File                                                     |
| ------------------------------------- | -------------------------------------------------------- |
| The shared draft form                 | `src/components/questionnaire/use-draft-form.ts`         |
| Leaf that reads the unsaved count     | `src/components/questionnaire/unsaved-bar.tsx`           |
| Row bound to one field                | `src/pages/admin/cases/.../questionnaire/answer-row.tsx` |
| Select that mounts options lazily     | `src/components/ui/form-select.tsx`                      |
| Searchable variant                    | `src/components/ui/searchable-select.tsx`                |
| Regression tests for the key escaping | `src/components/questionnaire/use-draft-form.test.tsx`   |
