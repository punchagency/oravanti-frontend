import {
  Box,
  Button,
  chakra,
  Dialog,
  HStack,
  Portal,
  Text,
} from "@chakra-ui/react";
import { Copy, X } from "lucide-react";
import { toast } from "sonner";

export type IssuedLink = {
  url: string;
  recipientEmail: string;
  /** False when the notification bounced — the link is then the only route. */
  emailSent: boolean;
  /** A resend replaced a link the client already had; a first send did not. */
  resent: boolean;
};

/**
 * The upload link, shown once.
 *
 * Only the token's hash is stored, so this is the single moment it can be read
 * back — which the copy is worth taking now, and the dialog says so plainly
 * rather than letting the firm discover it by closing and looking for it again.
 */
export function IssuedLinkDialog({
  link,
  onClose,
}: {
  link: IssuedLink | null;
  onClose: () => void;
}) {
  const copy = () => {
    if (!link) return;
    navigator.clipboard.writeText(link.url).then(
      () => toast.success("Upload link copied"),
      () => toast.error("Couldn't reach the clipboard"),
    );
  };

  return (
    <Dialog.Root
      open={link !== null}
      onOpenChange={({ open }) => !open && onClose()}
      placement="center"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="480px"
            border="1px solid"
            borderColor="border"
            borderRadius="14px"
            bg="bg"
            p="0"
            boxShadow="0 24px 70px rgba(0, 0, 0, 0.26)"
          >
            <Dialog.CloseTrigger asChild>
              <chakra.button
                type="button"
                aria-label="Close upload link dialog"
                position="absolute"
                top="22px"
                right="22px"
                display="grid"
                placeItems="center"
                w="32px"
                h="32px"
                border="1px solid"
                borderColor="border"
                borderRadius="8px"
                bg="bg"
                color="fg.muted"
              >
                <X size={16} />
              </chakra.button>
            </Dialog.CloseTrigger>

            {link && (
              <Box p="32px 24px 24px">
                <Dialog.Title
                  color="fg"
                  fontSize="17px"
                  fontWeight="600"
                  lineHeight="1.2"
                >
                  {link.resent ? "Reminder sent" : "Request sent"}
                </Dialog.Title>
                <Text fontSize="13px" color="fg.muted" mt="6px">
                  {link.emailSent
                    ? `${link.recipientEmail} can upload straight from the email. The link below is the same one — share it only with them.`
                    : `The email to ${link.recipientEmail} didn't send. Pass the link below on yourself — share it only with them.`}
                </Text>

                <HStack
                  mt="16px"
                  gap="8px"
                  border="1px solid"
                  borderColor="border"
                  borderRadius="8px"
                  bg="bg.subtle"
                  p="10px 12px"
                >
                  <Text
                    fontSize="12px"
                    color="fg.muted"
                    truncate
                    flex="1"
                    title={link.url}
                  >
                    {link.url}
                  </Text>
                  <Button
                    size="xs"
                    variant="outline"
                    borderColor="border"
                    onClick={copy}
                  >
                    <Copy size={13} />
                    Copy
                  </Button>
                </HStack>

                <Text
                  fontSize="12px"
                  color="fg.muted"
                  mt="10px"
                  lineHeight="1.5"
                >
                  Copy it now if you need it — the link is shown once and is
                  gone when you close this window. Getting it back means
                  resending, which retires this link in turn.
                </Text>

                <Button
                  w="full"
                  mt="20px"
                  h="40px"
                  bg="brand.solid"
                  color="brand.contrast"
                  _hover={{ bg: "brand.600" }}
                  fontWeight="600"
                  onClick={onClose}
                >
                  Done
                </Button>
              </Box>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
