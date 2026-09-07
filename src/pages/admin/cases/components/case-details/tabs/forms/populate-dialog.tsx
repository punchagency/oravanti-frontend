import { usePopulatePreview } from "@/hooks/use-case-details";
import {
  Button,
  Checkbox,
  Dialog,
  Flex,
  HStack,
  Portal,
  ScrollArea,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";

/**
 * Confirming a fill, and deciding what happens to hand edits.
 *
 * The run itself is safe and repeatable, so the dialog is not here to guard
 * against it — it is here because one of its outcomes is not reversible. A
 * hand-edited value the questionnaire disagrees with is normally kept forever,
 * and replacing it destroys something a colleague typed. That is a decision, so
 * it is asked as one, with the count in front of the person making it.
 *
 * The numbers come from a dry run of the same pass that is about to execute,
 * not from a separate estimate, so what the dialog promises is what happens.
 */
export function PopulateDialog({
  caseId,
  open,
  onOpenChange,
  isPending,
  onConfirm,
}: {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: (overrideManual: boolean) => void;
}) {
  const { data: preview, isLoading } = usePopulatePreview(caseId, open);
  const [overrideManual, setOverrideManual] = useState(false);

  // The checkbox is a decision about *this* run. Carrying it across openings
  // would be how somebody replaces an edit they meant to keep.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setOverrideManual(false);
  }

  const conflicts = preview?.conflicts ?? [];
  const willWrite =
    (preview?.filled ?? 0) > 0 ||
    (preview?.updated ?? 0) > 0 ||
    (overrideManual && conflicts.length > 0);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      size="md"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header pb={2}>
              <Dialog.Title fontSize="15px" fontWeight="500">
                Fill from questionnaire
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body pb={4}>
              {isLoading ? (
                <Flex justify="center" py={8}>
                  <Spinner size="sm" />
                </Flex>
              ) : (
                <VStack align="stretch" gap={4}>
                  <Summary
                    filled={preview?.filled ?? 0}
                    updated={preview?.updated ?? 0}
                    skipped={preview?.skipped ?? null}
                  />

                  {conflicts.length > 0 && (
                    <VStack
                      align="stretch"
                      gap={2.5}
                      p={3.5}
                      bg="bg.panel"
                      borderRadius="sm"
                      borderLeft="2px solid"
                      borderLeftColor="orange.solid"
                    >
                      <Text fontSize="13px" color="fg" fontWeight="500">
                        {conflicts.length} field
                        {conflicts.length === 1 ? " was" : "s were"} edited by
                        hand and the questionnaire now disagrees
                      </Text>

                      <ScrollArea.Root maxH="140px">
                        <ScrollArea.Viewport>
                          <ScrollArea.Content>
                            <VStack align="stretch" gap={0.5} pr={2}>
                              {conflicts.map((conflict) => (
                                <Text
                                  key={`${conflict.formCode}${conflict.fieldKey}`}
                                  fontSize="12px"
                                  color="fg.muted"
                                >
                                  {conflict.formCode} · {conflict.fieldKey}
                                </Text>
                              ))}
                            </VStack>
                          </ScrollArea.Content>
                        </ScrollArea.Viewport>
                        <ScrollArea.Scrollbar>
                          <ScrollArea.Thumb />
                        </ScrollArea.Scrollbar>
                      </ScrollArea.Root>

                      <Checkbox.Root
                        size="sm"
                        checked={overrideManual}
                        onCheckedChange={(e) =>
                          setOverrideManual(e.checked === true)
                        }
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label fontSize="13px" fontWeight="400">
                          Replace these with the questionnaire's answers
                        </Checkbox.Label>
                      </Checkbox.Root>

                      <Text fontSize="11px" color="fg.muted" lineHeight="15px">
                        {overrideManual
                          ? "The typed values will be overwritten and cannot be recovered from here. The questionnaire's own history still holds every answer."
                          : "Left unticked, these keep the typed value and stay marked as disagreeing."}
                      </Text>
                    </VStack>
                  )}
                </VStack>
              )}
            </Dialog.Body>

            <Dialog.Footer pt={0} pb={5} gap={2}>
              <Button
                size="sm"
                variant="outline"
                borderColor="border"
                fontSize="13px"
                fontWeight="400"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              {/* Brand amber is the primary action everywhere else, but a run
                  that replaces typed answers has to read as a warning — so the
                  orange palette takes the button over when it would. */}
              <Button
                layerStyle={overrideManual ? undefined : "brand-button"}
                size="sm"
                fontSize="13px"
                colorPalette={overrideManual ? "orange" : undefined}
                loading={isPending}
                disabled={isLoading || !willWrite}
                onClick={() => onConfirm(overrideManual)}
              >
                {overrideManual ? "Fill and replace edits" : "Fill forms"}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

function Summary({
  filled,
  updated,
  skipped,
}: {
  filled: number;
  updated: number;
  skipped: "no forms" | "no answers" | null;
}) {
  if (skipped === "no answers") {
    return (
      <Text fontSize="13px" color="fg.muted" lineHeight="18px">
        The case questionnaire has not been answered yet, so there is nothing to
        carry across.
      </Text>
    );
  }

  if (skipped === "no forms") {
    return (
      <Text fontSize="13px" color="fg.muted" lineHeight="18px">
        This matter has no forms to fill.
      </Text>
    );
  }

  if (filled === 0 && updated === 0) {
    return (
      <Text fontSize="13px" color="fg.muted" lineHeight="18px">
        Every field the questionnaire can fill is already up to date.
      </Text>
    );
  }

  return (
    <HStack gap={5} align="baseline">
      {filled > 0 && <Stat count={filled} label="empty fields to fill" />}
      {updated > 0 && <Stat count={updated} label="fields to update" />}
    </HStack>
  );
}

function Stat({ count, label }: { count: number; label: string }) {
  return (
    <VStack align="flex-start" gap={0}>
      <Text
        fontSize="20px"
        fontWeight="500"
        color="fg"
        lineHeight="24px"
        fontVariantNumeric="tabular-nums"
      >
        {count}
      </Text>
      <Text fontSize="12px" color="fg.muted">
        {label}
      </Text>
    </VStack>
  );
}
