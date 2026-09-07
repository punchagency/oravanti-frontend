import { Text } from "@chakra-ui/react";

/**
 * A stored value — a questionnaire answer or a form field — rendered for
 * reading rather than editing.
 *
 * History shows values the questionnaire may no longer be able to produce — a
 * question retyped from a dropdown to free text leaves older answers behind in
 * the old shape — so this reads the value itself rather than trusting the
 * question's current type. Anything it cannot name, it shows as JSON, which is
 * still more use than an empty cell.
 */
export function StoredValueText({
  value,
  muted,
  strike,
}: {
  value: unknown;
  muted?: boolean;
  /** For a previous value being replaced. */
  strike?: boolean;
}) {
  const text = describe(value);
  const isEmpty = text === null;

  return (
    <Text
      as="span"
      fontSize="12px"
      color={isEmpty || muted ? "fg.muted" : "fg"}
      fontStyle={isEmpty ? "italic" : undefined}
      textDecoration={strike ? "line-through" : undefined}
      wordBreak="break-word"
    >
      {text ?? "empty"}
    </Text>
  );
}

function describe(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    return value.length === 0 ? null : value.map(String).join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
