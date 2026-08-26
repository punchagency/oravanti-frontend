import {
  Box,
  Button,
  Dialog,
  Portal,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { Lock } from "lucide-react";
import { useState, type ReactNode } from "react";

/** Matches the backend's `overrideRationale` minimum — see tasks.validation.ts. */
const MIN_RATIONALE = 10;

interface OverrideDialogProps {
  /** The trigger. Self-contained pattern: the dialog owns its own open state. */
  children: ReactNode;
  taskTitle: string;
  /** What the override will do, e.g. "Skip this step" or "Change the due date". */
  action: string;
  onConfirm: (overrideRationale: string) => void;
  isPending?: boolean;
}

/**
 * Collects the rationale required to weaken a locked step.
 *
 * Locked steps are the part of a system template a firm cannot silently edit
 * away — a deadline the practice depends on. The rationale is not paperwork:
 * it is stored on the task and written to the audit trail, and it is the whole
 * reason the override is allowed at all.
 *
 * The submit button stays disabled until the rationale is long enough, so the
 * backend's refusal is something a user can't reach by accident rather than an
 * error they have to read.
 */
export function OverrideDialog({
  children,
  taskTitle,
  action,
  onConfirm,
  isPending = false,
}: OverrideDialogProps) {
  const [open, setOpen] = useState(false);
  const [rationale, setRationale] = useState("");

  const tooShort = rationale.trim().length < MIN_RATIONALE;

  const handleConfirm = () => {
    if (tooShort) return;
    onConfirm(rationale.trim());
    setRationale("");
    setOpen(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open);
        if (!details.open) setRationale("");
      }}
      size="sm"
    >
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="440px"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            bg="bg"
          >
            <Dialog.Header>
              <Dialog.Title fontSize="14px" fontWeight="600">
                <Box as="span" display="inline-flex" alignItems="center" gap={2}>
                  <Lock size={13} />
                  {action}
                </Box>
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3} align="stretch">
                <Text fontSize="12px" color="fg.muted">
                  "
                  <Text as="span" fontWeight="500" color="fg">
                    {taskTitle}
                  </Text>
                  " is a locked step from the firm's template. Record why this
                  change is being made — it is stored with the step and appears
                  in the case's audit trail.
                </Text>

                <Box>
                  <Text
                    fontSize="10px"
                    fontWeight="500"
                    color="fg.subtle"
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                    mb={1}
                  >
                    Reason for override
                  </Text>
                  <Textarea
                    aria-label="Reason for override"
                    placeholder="e.g. Treating physician confirmed MMI early, so the 30-day review no longer applies."
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    minH="90px"
                    resize="vertical"
                    variant="outline"
                    _focus={{ borderColor: "brand.solid" }}
                  />
                  {tooShort && rationale.length > 0 && (
                    <Text fontSize="10px" color="fg.subtle" mt={1}>
                      A little more detail — at least {MIN_RATIONALE} characters.
                    </Text>
                  )}
                </Box>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer gap={2}>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" borderColor="border" size="sm" fontSize="12px" h="32px">
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="orange"
                size="sm"
                fontSize="12px"
                h="32px"
                disabled={tooShort}
                loading={isPending}
                onClick={handleConfirm}
              >
                {action}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
