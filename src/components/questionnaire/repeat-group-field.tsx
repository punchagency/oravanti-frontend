import { Box, Button, HStack, IconButton, Stack, Text } from "@chakra-ui/react";
import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";

import type {
  QuestionConfig,
  RepeatGroupItemField,
} from "@/api/questionnaires";
import { TypedValueInput } from "@/components/ui/typed-value-input";
import { parseEntries } from "@/utils/answer-value";

type Entry = Record<string, unknown>;

/**
 * A question that answers more than once — an address history, a list of
 * children, a run of prior employers.
 *
 * ─── Why this is one form control and not a sub-form ────────────────────────
 *
 * It binds to a single react-hook-form field, holding the whole list as JSON.
 * Registering one RHF field per entry per sub-field would put the list's shape
 * into the form state, so adding an entry would mean registering eleven new
 * fields and removing one would mean unregistering eleven and renumbering every
 * entry after it. The list is one answer; it is edited as one value.
 *
 * The cost is that a keystroke re-renders this question — not the page, because
 * the surrounding row subscribes to its own field alone (see `use-draft-form`).
 * An address block is about ten inputs, which is a size that re-renders without
 * anybody noticing.
 *
 * ─── What it does not do ────────────────────────────────────────────────────
 *
 * No per-entry validation and no required-marking beyond the label. The save is
 * the questionnaire's, the entries are dropped if empty (`parseEntries`), and a
 * half-filled address is a legitimate thing to leave overnight — this is a
 * form a client fills over several sittings, not a checkout.
 */
export function RepeatGroupField({
  value,
  onChange,
  config,
  disabled,
}: {
  /** The list as JSON, or "" when unanswered. */
  value: string;
  onChange: (next: string) => void;
  /** The question's own `config`. Read defensively — the column has no schema. */
  config: QuestionConfig | null;
  disabled?: boolean;
}) {
  const fields = useMemo<RepeatGroupItemField[]>(() => {
    const declared = config?.fields;
    if (!Array.isArray(declared)) return [];
    return declared.filter(
      (field): field is RepeatGroupItemField =>
        typeof field?.key === "string" && typeof field?.label === "string",
    );
  }, [config]);

  /*
    Always at least one entry on screen. An empty list would render as a lone
    Add button under a question, which reads as "this does not apply to me"
    rather than as an empty first row waiting to be filled.
  */
  const entries = useMemo<Entry[]>(() => {
    const parsed = value ? (parseEntries(value) ?? []) : [];
    return parsed.length > 0 ? parsed : [{}];
  }, [value]);

  const itemLabel = config?.itemLabel ?? "Entry";
  const atMax = config?.maxItems != null && entries.length >= config.maxItems;

  const commit = (next: Entry[]) => onChange(JSON.stringify(next));

  const setCell = (index: number, key: string, cell: string) =>
    commit(
      entries.map((entry, i) =>
        i === index ? { ...entry, [key]: cell } : entry,
      ),
    );

  // A question whose config is missing or malformed. Says so rather than
  // rendering an Add button that produces entries with no fields in them.
  if (fields.length === 0) {
    return (
      <Text fontSize="12px" color="fg.muted">
        This question is not set up yet. Please tell us and we will fix it.
      </Text>
    );
  }

  return (
    <Stack gap={2.5}>
      {entries.map((entry, index) => (
        <Box
          key={index}
          borderWidth="1px"
          borderColor="border.subtle"
          borderRadius="sm"
          p={3}
          bg="bg.subtle"
        >
          <HStack justify="space-between" align="center" mb={2}>
            <Text fontSize="12px" fontWeight="600" color="fg.muted">
              {itemLabel} {index + 1}
              {index === 0 && (
                <Text as="span" fontWeight="400" color="fg.subtle">
                  {" "}
                  — most recent
                </Text>
              )}
            </Text>

            {/*
              Never on the only entry. Removing it would leave the question
              looking unasked, and there is nothing to undo it with.
            */}
            {entries.length > 1 && (
              <IconButton
                size="xs"
                variant="ghost"
                colorPalette="red"
                disabled={disabled}
                aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}
                onClick={() => commit(entries.filter((_, i) => i !== index))}
              >
                <Trash2 size={13} />
              </IconButton>
            )}
          </HStack>

          <Stack gap={2}>
            {fields.map((field) => (
              <Box key={field.key}>
                <HStack gap={1} align="baseline" mb={1}>
                  <Text fontSize="12px" color="fg.muted">
                    {field.label}
                  </Text>
                  {field.required && (
                    <Text fontSize="10px" color="fg.error" lineHeight="1">
                      required
                    </Text>
                  )}
                </HStack>

                <TypedValueInput
                  type={field.type}
                  value={String(entry[field.key] ?? "")}
                  options={field.config?.options}
                  onChange={(next) => setCell(index, field.key, next)}
                  disabled={disabled}
                  ariaLabel={`${itemLabel} ${index + 1}: ${field.label}`}
                />
              </Box>
            ))}
          </Stack>
        </Box>
      ))}

      <Box>
        <Button
          size="xs"
          variant="outline"
          disabled={disabled || atMax}
          onClick={() => commit([...entries, {}])}
        >
          <Plus size={13} />
          Add another {itemLabel.toLowerCase()}
        </Button>

        {atMax && (
          <Text fontSize="11px" color="fg.muted" mt={1}>
            That is as many as we can record here.
          </Text>
        )}
      </Box>
    </Stack>
  );
}
