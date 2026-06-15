import { useConfirmStore } from "@/store/confirm-store";
import { Button, Dialog, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export const ConfirmDialogProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { isOpen, title, description, confirmLabel, cancelLabel, loading, _onConfirm, close } =
    useConfirmStore();

  return (
    <>
      {children}
      <Dialog.Root open={isOpen} onOpenChange={close}>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner>
          <Dialog.Content rounded="lg" p="0" mx={{ base: 3, lg: 0 }}>
            <Dialog.Body p="6">
              <Stack gap="3">
                <Dialog.Title fontSize="lg" fontWeight="semibold">
                  {title}
                </Dialog.Title>
                <Text color="fg.muted" fontSize="sm">
                  {description}
                </Text>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer gap="3" p="6" pt="0">
              <Button variant="outline" onClick={close} disabled={loading}>
                {cancelLabel}
              </Button>
              <Button
                color={{ _dark: "white", _light: "white" }}
                bg="red.500"
                _hover={{ bg: "red.600" }}
                onClick={() => {
                  if (_onConfirm) {
                    _onConfirm();
                  }
                }}
                loading={loading}
              >
                {confirmLabel}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
};
