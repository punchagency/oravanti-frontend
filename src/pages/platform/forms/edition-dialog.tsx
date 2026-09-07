import { Button, Dialog, Portal, Text, VStack } from "@chakra-ui/react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import { SubmitWhenValid, TextField } from "@/components/ui/bound-fields";
import type { FormEdition } from "@/api/platform";

/**
 * Record an edition of a form, or correct one.
 *
 * ─── Why an edition is its own thing, and not just a blank ──────────────────
 *
 * USCIS prints an edition date at the foot of every page and rejects filings
 * made on a superseded edition. Some transitions come with a grace period in
 * which two are both accepted; others take effect with none at all. So an
 * edition is a *window*, and the window is what decides whether a package
 * drafted today may be built on this blank — which is a fact USCIS publishes
 * months before anybody downloads the PDF.
 *
 * That is why recording an edition and uploading its blank are two steps. An
 * edition with no blank is a legitimate, useful state: it is how the app knows
 * the I-485's 01/20/25 edition stops being accepted on 2026-09-17, before the
 * successor's blank exists anywhere.
 *
 * ─── The edition date is not editable ───────────────────────────────────────
 *
 * It is half the natural key, and every box mapping read off the blank hangs
 * off this row. Changing it would not rename an edition but mislabel one — and
 * the symptom would be a filing printed on a document USCIS will reject, with
 * a correct-looking date on the screen beside it. A wrong edition date is a new
 * row and a re-upload.
 */

type Values = {
  editionDate: string;
  acceptedFrom: string;
  acceptedUntil: string;
  sourceUrl: string;
  verifiedOn: string;
};

const today = () => new Date().toISOString().slice(0, 10);

export function EditionDialog({
  edition,
  formCode,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  /** The edition being corrected; absent when recording a new one. */
  edition?: FormEdition;
  formCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    editionDate: string;
    acceptedFrom: string;
    acceptedUntil: string | null;
    sourceUrl: string | null;
    verifiedOn: string | null;
  }) => Promise<unknown> | void;
  isPending: boolean;
}) {
  const isEdit = edition !== undefined;

  const values = useMemo<Values>(
    () => ({
      editionDate: edition?.editionDate ?? "",
      acceptedFrom: edition?.acceptedFrom ?? "",
      acceptedUntil: edition?.acceptedUntil ?? "",
      sourceUrl: edition?.sourceUrl ?? "",
      verifiedOn: edition?.verifiedOn ?? today(),
    }),
    [edition],
  );

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
      editionDate: draft.editionDate.trim(),
      acceptedFrom: draft.acceptedFrom.trim(),
      // Empty means "no end date set", which is what the column stores and is
      // deliberately not the same as "in force" — an announced-but-not-yet-
      // accepted edition has a null end and a future start.
      acceptedUntil: draft.acceptedUntil.trim() || null,
      sourceUrl: draft.sourceUrl.trim() || null,
      verifiedOn: draft.verifiedOn.trim() || null,
    });
    onOpenChange(false);
  };

  const isoRule = {
    pattern: {
      value: /^\d{4}-\d{2}-\d{2}$/,
      message: "Use the format 2026-09-18.",
    },
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
                {isEdit
                  ? `${formCode} — the ${edition.editionDate} version`
                  : `Add a version of ${formCode}`}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3.5} align="stretch">
                <Text fontSize="12px" color="fg.muted" lineHeight="17px">
                  {isEdit
                    ? "The dates decide whether a filing prepared today can use this version. The version date itself can't change — everything read off its PDF is stored against it."
                    : "The date printed on the form, and the dates it can be filed between. Upload the PDF afterwards. Adding a version whose PDF you don't have yet is normal — it is how the app knows a change is coming."}
                </Text>

                <TextField
                  control={control}
                  name="editionDate"
                  label="Version date"
                  mono
                  autoFocus={!isEdit}
                  disabled={isEdit}
                  placeholder="2026-09-18"
                  hint="Printed on the form itself — usually at the bottom of each page, e.g. “Edition 09/18/26”."
                  rules={{ required: "A version date is needed.", ...isoRule }}
                />

                <TextField
                  control={control}
                  name="acceptedFrom"
                  label="Can be filed from"
                  mono
                  placeholder="2026-09-18"
                  hint="The first date a filing may use this version."
                  rules={{ required: "A start date is needed.", ...isoRule }}
                />

                <TextField
                  control={control}
                  name="acceptedUntil"
                  label="Can be filed until (optional)"
                  mono
                  placeholder="2026-09-17"
                  hint="The last date a filing may use this version. Leave empty if no end date has been announced."
                  rules={isoRule}
                />

                <TextField
                  control={control}
                  name="sourceUrl"
                  label="Source (optional)"
                  placeholder="https://www.uscis.gov/i-485"
                  hint="The page or notice you took these dates from, so somebody can check them again later."
                />

                <TextField
                  control={control}
                  name="verifiedOn"
                  label="Last checked on"
                  mono
                  hint="When somebody last checked these dates against the official source. Out-of-date dates here produce a rejected filing rather than any error on screen."
                  rules={isoRule}
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
                {isEdit ? "Save changes" : "Add version"}
              </SubmitWhenValid>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
