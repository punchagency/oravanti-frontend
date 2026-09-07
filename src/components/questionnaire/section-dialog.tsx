import { SubmitWhenValid, TextAreaField } from "@/components/ui/bound-fields";
import { Button, Dialog, Portal, Text, VStack } from "@chakra-ui/react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

/**
 * Write or rename a section.
 *
 * A section is a title and a sentence of context, so this is deliberately two
 * fields — the questions inside it are added from the list, not from here.
 * Neither one is offered for one of Oravanti's sections: a firm extends the
 * questionnaire rather than rewording it, so the callers do not open this
 * dialog on a locked row at all.
 *
 * Both are multi-line boxes. A section's title is a heading a client reads —
 * "Time outside the United States since becoming a permanent resident" — and a
 * single-line input showed it through a slot narrower than the sentence.
 */

/** Lines given to each box. See the note above. */
const PROSE_ROWS = 5;

type Values = { title: string; description: string };

export function SectionDialog({
  section,
  open,
  onOpenChange,
  onSubmit,
  isPending,
  scopeNote,
}: {
  /**
   * Present when renaming; absent when adding.
   *
   * Declared as the two fields this dialog reads rather than as `CaseSection`,
   * so a firm's section, a matter's and the platform's all satisfy it without
   * an adapter at the call site. Same reasoning as `QuestionDialog`.
   */
  section?: { title: string; description: string | null } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    title: string;
    description: string | null;
  }) => Promise<unknown>;
  isPending: boolean;
  /** One line saying how far this reaches, e.g. "every matter of this type". */
  scopeNote?: string;
}) {
  const isEdit = Boolean(section);

  /**
   * Re-seeded from the section whenever a different one is opened.
   *
   * `values` is react-hook-form's own re-seed and it applies while rendering,
   * so the boxes are right on the first painted frame instead of flashing the
   * previous section's. Memoized because a fresh object every render would
   * re-seed on every render and throw away what is being typed.
   */
  const values = useMemo(
    () => ({
      title: section?.title ?? "",
      description: section?.description ?? "",
    }),
    [section?.title, section?.description],
  );

  // `onChange` so `SubmitWhenValid` can see validity as it is typed.
  const { control, getValues, reset } = useForm<Values>({
    defaultValues: values,
    values,
    mode: "onChange",
  });

  // Reopening the same section starts from what is stored, not from edits that
  // were abandoned last time. `values` cannot do this on its own: it re-seeds
  // when the section changes, and reopening the same one changes nothing.
  useEffect(() => {
    if (open) reset(values);
  }, [open, reset, values]);

  const handleSave = async () => {
    const draft = getValues();
    await onSubmit({
      title: draft.title.trim(),
      description: draft.description.trim() || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
      size="sm"
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="420px"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            bg="bg"
          >
            <Dialog.Header>
              <Dialog.Title fontSize="14px" fontWeight="600">
                {isEdit ? "Edit section" : "Add a section"}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3.5} align="stretch">
                {scopeNote && (
                  <Text fontSize="12px" color="fg.muted" lineHeight="17px">
                    {scopeNote}
                  </Text>
                )}

                <TextAreaField
                  control={control}
                  name="title"
                  label="Title"
                  autoFocus
                  rows={PROSE_ROWS}
                  placeholder="Employment history"
                  rules={{ required: "A title is needed." }}
                />

                <TextAreaField
                  control={control}
                  name="description"
                  label="What this section is for (optional)"
                  rows={PROSE_ROWS}
                  placeholder="Shown above the questions, so whoever answers knows why they are being asked."
                />
              </VStack>
            </Dialog.Body>

            <Dialog.Footer gap={2}>
              <Dialog.ActionTrigger asChild>
                <Button
                  variant="outline"
                  borderColor="border"
                  size="sm"
                  fontSize="12px"
                  h="32px"
                >
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <SubmitWhenValid
                control={control}
                isPending={isPending}
                onClick={handleSave}
              >
                {isEdit ? "Save changes" : "Add section"}
              </SubmitWhenValid>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
