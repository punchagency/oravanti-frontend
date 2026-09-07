import {
  Button,
  Dialog,
  Portal,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";

/**
 * Answering a mark, or sending it back.
 *
 * The same shape as marking, and for the same reason: both are a sentence
 * somebody else will read. Resolving without saying what changed is the state
 * this whole feature exists to prevent, so the note is required here too.
 */
export function CorrectionNoteDialog({
  open,
  onOpenChange,
  mode,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "resolve" | "reopen";
  isPending: boolean;
  onSubmit: (note: string) => void;
}) {
  const [note, setNote] = useState("");

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setNote("");
  }

  const resolving = mode === "resolve";

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
                {resolving ? "Resolve correction" : "Reopen correction"}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body pb={4}>
              <VStack align="stretch" gap={2}>
                <Text fontSize="13px" color="fg.muted" lineHeight="18px">
                  {resolving
                    ? "Say what you changed. The reviewing attorney reads this rather than diffing the form, and it stays on the record."
                    : "Say what is still wrong. The package goes back to changes requested and any approval is withdrawn."}
                </Text>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    resolving
                      ? "Corrected the spelling to match the passport bio page."
                      : "The date still reads 1990 — the passport says 1991."
                  }
                  rows={4}
                  fontSize="13px"
                  autoFocus
                />
              </VStack>
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
              <Button
                layerStyle={resolving ? "brand-button" : undefined}
                colorPalette={resolving ? undefined : "orange"}
                size="sm"
                fontSize="13px"
                loading={isPending}
                disabled={note.trim().length === 0}
                onClick={() => onSubmit(note.trim())}
              >
                {resolving ? "Resolve" : "Reopen"}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
