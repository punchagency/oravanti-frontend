import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { useState } from "react";
import TwoFactorAuth from "./two-factor-auth";

const ManageTwoFactorAuthentication = () => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <Dialog.Root
      placement="center"
      motionPreset="slide-in-bottom"
      open={showDialog}
      onOpenChange={({ open }) => setShowDialog(open)}
    >
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          width={{ base: "full", md: "auto" }}
        >
          Manage 2FA Settings
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Manage 2FA Settings</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <TwoFactorAuth onDone={() => setShowDialog(false)} />
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default ManageTwoFactorAuthentication;
