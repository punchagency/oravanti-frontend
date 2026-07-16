import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  Portal,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { CheckCircle } from "lucide-react";

interface CompleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  onConfirm: (notes: string) => void;
  isPending: boolean;
}

/**
 * Confirmation dialog shown before marking a lead task as complete.
 *
 * Allows the user to add optional notes explaining what was done.
 * Notes are passed back via the onConfirm callback.
 */
export function CompleteTaskDialog({
  open,
  onOpenChange,
  taskTitle,
  onConfirm,
  isPending,
}: CompleteTaskDialogProps) {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(notes);
    setNotes("");
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
                Submit task
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3} align="stretch">
                <Text fontSize="12px" color="fg.muted">
                  Mark "<Text as="span" fontWeight="500" color="fg">{taskTitle}</Text>" as complete?
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
                    Notes (optional)
                  </Text>
                  <Textarea
                    placeholder="Add notes about this task completion..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    minH="80px"
                    resize="vertical"
                    variant="outline"
                    _focus={{ borderColor: "brand.solid" }}
                  />
                </Box>
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
              <Button
                colorPalette="green"
                size="sm"
                fontSize="12px"
                h="32px"
                onClick={handleConfirm}
                loading={isPending}
              >
                <CheckCircle size={14} />
                Submit
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}