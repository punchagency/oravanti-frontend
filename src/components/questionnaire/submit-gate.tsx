import { fieldName, type DraftForm } from "@/components/questionnaire/use-draft-form";
import { Button, Text, VStack } from "@chakra-ui/react";
import { Send } from "lucide-react";
import { useWatch } from "react-hook-form";

/**
 * The Submit button, enabled only once every required question has an answer.
 *
 * ─── Why this is its own component ──────────────────────────────────────────
 *
 * The gate has to read what is *typed*, not what is stored. Someone who fills
 * the last required question and reaches straight for Submit should find it
 * live — waiting for a save first would make the button feel broken.
 *
 * Reading values is exactly what the container must not do: it would re-render
 * the whole page, and every row on it, on every keystroke. So the read happens
 * here, in a leaf, and `useWatch` is scoped to the required questions alone —
 * typing in an optional field re-renders nothing at all.
 *
 * @param requiredKeys The question ids that must be answered. Must be
 *   referentially stable (build it with `useMemo`), since it is a subscription.
 */
export function SubmitGate({
  control,
  requiredKeys,
  extraMissing = 0,
  isSubmitting,
  onSubmit,
  label = "Submit questionnaire",
}: {
  control: DraftForm["control"];
  requiredKeys: string[];
  /**
   * Required answers that do not live in the form — uploaded files, which are
   * on the server the moment they finish rather than at the next save.
   */
  extraMissing?: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  label?: string;
}) {
  // `useWatch` treats an empty `name` array as "watch everything", which would
  // subscribe this button to the entire form. A questionnaire with no required
  // questions is nothing to watch, so watch one name that cannot exist.
  const names = requiredKeys.length
    ? requiredKeys.map(fieldName)
    : ["__no_required_questions__"];

  const values = useWatch({ control, name: names }) as (string | undefined)[];

  const missing =
    (requiredKeys.length
      ? values.filter((value) => !value || value.trim() === "").length
      : 0) + extraMissing;

  return (
    <VStack gap={1} align={{ base: "stretch", sm: "flex-end" }}>
      <Button
        layerStyle="brand-button"
        size="xs"
        h="36px"
        fontSize="13px"
        fontWeight="400"
        px={4}
        loading={isSubmitting}
        disabled={missing > 0}
        onClick={onSubmit}
      >
        <Send size={13} />
        {label}
      </Button>

      {/* A disabled button with no reason is a dead end. Say what is left. */}
      {missing > 0 && (
        <Text fontSize="11px" color="fg.muted">
          {missing} required {missing === 1 ? "question" : "questions"} left
        </Text>
      )}
    </VStack>
  );
}
