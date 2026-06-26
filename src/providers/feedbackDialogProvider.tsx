import { useFeedbackStore } from "@/store/feedback-store";
import { Button, Dialog, Portal, Stack, Text } from "@chakra-ui/react";

export function FeedbackDialogProvider({ children }: { children: React.ReactNode }) {
  const { isOpen, title, description, variant, close } = useFeedbackStore();

  return (
    <>
      {children}
      <Dialog.Root open={isOpen}>
        <Portal>
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
                <Button
                  color={{
                    _dark: variant === "error" ? "fg" : "white",
                    _light: variant === "error" ? "white" : "fg",
                  }}
                  bg={variant === "error" ? "red.500" : "brand.solid"}
                  onClick={close}
                >
                  OK
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
