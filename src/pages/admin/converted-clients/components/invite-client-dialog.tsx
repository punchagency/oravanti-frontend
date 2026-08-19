import { useSendClientPortalInvite } from "@/hooks/use-converted-clients";
import type { ConvertedClient } from "@/api/converted-clients";
import {
  Dialog,
  VStack,
  Text,
  Button,
} from "@chakra-ui/react";
import { Mail } from "lucide-react";

interface InviteClientDialogProps {
  client: ConvertedClient;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
}

export function InviteClientDialog({
  client,
  open,
  onOpenChange,
}: InviteClientDialogProps) {
  const inviteMutation = useSendClientPortalInvite();

  function handleInvite() {
    inviteMutation.mutate(client.id, {
      onSuccess: () => {
        onOpenChange({ open: false });
      },
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} placement="center">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="440px">
          <Dialog.Header>
            <Dialog.Title>Send Portal Invitation</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <VStack align="stretch" gap={4}>
              <Text fontSize="13px" color="fg.muted">
                A portal invitation will be sent to{" "}
                <Text as="span" fontWeight="500" color="fg">
                  {client.email}
                </Text>
                . The client will receive an email with a link to sign in and
                access the client portal.
              </Text>
            </VStack>
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </Dialog.CloseTrigger>
            <Button
              size="sm"
              bg="brand.solid"
              color="brand.contrast"
              _hover={{ bg: "brand.500" }}
              onClick={handleInvite}
              loading={inviteMutation.isPending}
            >
              <Mail size={14} />
              Send invitation
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
