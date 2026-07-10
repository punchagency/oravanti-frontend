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
import type { ReactNode } from "react";

interface WorkflowActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmIcon?: ReactNode;
  colorPalette?: string;
  notesRequired: boolean;
  placeholder: string;
  onConfirm: (notes: string) => void;
  isPending: boolean;
}

export function WorkflowActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmIcon,
  colorPalette,
  notesRequired,
  placeholder,
  onConfirm,
  isPending,
}: WorkflowActionDialogProps) {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(notes);
    setNotes("");
  };

  const canConfirm = notesRequired ? notes.trim().length > 0 : true;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) setNotes("");
        onOpenChange(details.open);
      }}
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
                {title}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3} align="stretch">
                <Text fontSize="12px" color="fg.muted">
                  {description}
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
                    {notesRequired ? "Feedback (required)" : "Notes (optional)"}
                  </Text>
                  <Textarea
                    placeholder={placeholder}
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
                colorPalette={colorPalette}
                size="sm"
                fontSize="12px"
                h="32px"
                onClick={handleConfirm}
                loading={isPending}
                disabled={!canConfirm}
              >
                {confirmIcon}
                {confirmLabel}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
