import { SubmitWhenValid, TextAreaField } from "@/components/ui/bound-fields";
import { Button, Dialog, Portal, Text, VStack } from "@chakra-ui/react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

/**
 * Name a part, or rename one.
 *
 * ─── Where a part lives, which is two places ────────────────────────────────
 *
 * A part is primarily the distinct `partLabel` values on a form's fields —
 * that is what the extraction produces and what fixes the order they appear
 * in. `form_parts` holds the two things a field cannot: the part's
 * **description**, and the existence of a part that has **no fields yet**, so
 * one can be named and then filled rather than the other way round.
 *
 * So this dialog writes a row either way, and renaming additionally rewrites
 * every field in the part — Part 9 of the I-485 is 172 of them, and renaming
 * those one at a time is a job that ends, on the first interruption, with one
 * part having become two.
 *
 * The name box is multi-line because a USCIS part name is a sentence: "Part 3.
 * Biographic Information" is the short kind, and "Part 8. Statement, Contact
 * Information, Declaration, Certification, and Signature of the Applicant" is
 * not unusual.
 */

/** Lines given to the name box. A part name is a sentence, not a word. */
const NAME_ROWS = 4;

/** And the description is a paragraph — what the part is for, in full. */
const DESCRIPTION_ROWS = 5;

type Values = { name: string; description: string };

export function PartDialog({
  /** The part being renamed or described; absent when naming a new one. */
  part,
  formCode,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  part?: { partLabel: string | null; description: string | null };
  formCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    name: string;
    description: string | null;
  }) => Promise<unknown> | void;
  isPending: boolean;
}) {
  const isRename = part !== undefined;
  const partLabel = part?.partLabel ?? null;

  const values = useMemo<Values>(
    () => ({
      name: part?.partLabel ?? "",
      description: part?.description ?? "",
    }),
    [part?.partLabel, part?.description],
  );

  // `onChange` so `SubmitWhenValid` can see validity as it is typed.
  const { control, getValues, reset } = useForm<Values>({
    defaultValues: values,
    values,
    mode: "onChange",
  });

  // Reopening starts from what is stored, not from an abandoned edit.
  useEffect(() => {
    if (open) reset(values);
  }, [open, reset, values]);

  const handleSave = async () => {
    const draft = getValues();
    await onSubmit({
      name: draft.name.trim(),
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
            maxW="460px"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            bg="bg"
          >
            <Dialog.Header>
              <Dialog.Title fontSize="14px" fontWeight="600">
                {isRename ? "Edit part" : `Add a part to ${formCode}`}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3.5} align="stretch">
                <Text fontSize="12px" color="fg.muted" lineHeight="17px">
                  {isRename
                    ? partLabel === null
                      ? `Naming the fields on the ${formCode} that carry no part. Every one of them moves into the part you name here, for every firm.`
                      : `Every field in this part is renamed with it, for every firm on the platform. What was typed into them on any matter is left alone.`
                    : `Named now and filled after. The part appears on ${formCode} straight away, empty, ready for its first field.`}
                </Text>

                <TextAreaField
                  control={control}
                  name="name"
                  label="Name of the part"
                  autoFocus
                  rows={NAME_ROWS}
                  placeholder="Part 3. Biographic Information"
                  rules={{ required: "A name is needed." }}
                />

                <TextAreaField
                  control={control}
                  name="description"
                  label="What this part is for (optional)"
                  rows={DESCRIPTION_ROWS}
                  placeholder="What the form's own instructions say this part covers, and anything a paralegal filling it should know first."
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
                {isRename ? "Save name" : "Add part"}
              </SubmitWhenValid>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
