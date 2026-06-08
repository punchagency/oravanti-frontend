import { useFeedbackStore } from "@/store/feedback-store";
import { Button, Dialog, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export const FeedbackDialogProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { isOpen, variant, title, description, close } = useFeedbackStore();

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
                <Text color="fg.subtle" fontSize="sm">
                  {description}
                </Text>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer gap="3" p="6" pt="0">
              <Button
                colorPalette={variant === "error" ? "red" : "blue"}
                onClick={close}
              >
                OK
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
};
