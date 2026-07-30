import { Drawer, Flex, IconButton, Text, chakra } from "@chakra-ui/react";
import { X } from "lucide-react";
import { useNav } from "./nav-context";
import { NavContent } from "./nav-content";

export function MobileNavDrawer() {
  const { mobileOpen, onMobileClose } = useNav();

  return (
    <Drawer.Root
      open={mobileOpen}
      onOpenChange={(e) => {
        if (!e.open) onMobileClose();
      }}
      placement="start"
    >
      <Drawer.Positioner>
        <Drawer.Backdrop backdropFilter="blur(1.5px)" />
        <Drawer.Content>
          <Flex direction="column" h="100%" bg="bg">
            <Flex
              align="center"
              justify="space-between"
              px="14px"
              pt="18px"
              pb="14px"
              borderBottom="1px solid"
              borderColor="border"
            >
              <Flex align="center" gap="8px">
                <chakra.img
                  src="/oravanti_logo.png"
                  alt="Oravanti"
                  h="24px"
                  w="auto"
                />
                <Text textStyle="label" color="fg" m={0}>
                  Oravanti
                </Text>
              </Flex>
              <Drawer.CloseTrigger asChild>
                <IconButton
                  variant="ghost"
                  size="sm"
                  color="fg.muted"
                  _hover={{ color: "fg" }}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </IconButton>
              </Drawer.CloseTrigger>
            </Flex>
            <NavContent onNavigate={onMobileClose} />
          </Flex>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}
