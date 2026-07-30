import { useColorMode } from "@/hooks/use-color-mode";
import { useSignOut } from "@/hooks/useSignOut";
import { useAuthStore } from "@/store/auth-store";
import { Box, Button, Flex, Menu, Portal, Text } from "@chakra-ui/react";
import {
  Check,
  ChevronRight,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useNav, usePageTitle } from "./nav-context";

export function TopBar() {
  const { collapsed, toggleCollapsed, onMobileOpen } = useNav();
  const { title: pageTitle, isVisible: pageTitleVisible } = usePageTitle();
  const user = useAuthStore((s) => s.user);
  const memberRole = useAuthStore((s) => s.memberRole);
  const signOutMutation = useSignOut();
  const { setTheme } = useTheme();
  const { colorMode } = useColorMode();
  const initials = (user?.name ?? "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Flex
      as="header"
      align="center"
      gap="10px"
      h="52px"
      px={{ base: 2, lg: 3 }}
      borderBottom="1px solid"
      borderColor="border"
      bg="bg"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Button
        display={{ base: "flex", lg: "none" }}
        onClick={onMobileOpen}
        variant="ghost"
        color="fg.muted"
        size="sm"
        p="2"
        _hover={{ color: "fg" }}
      >
        <PanelLeftOpen size={20} />
      </Button>

      <Button
        display={{ base: "none", lg: "flex" }}
        onClick={toggleCollapsed}
        variant="ghost"
        color="fg.muted"
        size="sm"
        p="2"
        _hover={{ color: "fg" }}
      >
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </Button>

      <Box flex="1" overflow="hidden" ml="8px">
        <Text
          textStyle="label"
          color="fg"
          m={0}
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
          opacity={pageTitleVisible ? 0 : 1}
          transform={pageTitleVisible ? "translateY(-4px)" : "translateY(0)"}
          transition="opacity 200ms, transform 200ms"
        >
          {pageTitle}
        </Text>
      </Box>

      <Menu.Root>
        <Menu.Trigger asChild>
          <Button
            variant="ghost"
            p="1"
            borderRadius="full"
            _hover={{ bg: "bg.subtle" }}
          >
            <Box
              display="grid"
              placeItems="center"
              w="28px"
              h="28px"
              borderRadius="full"
              bg="accent.admin"
              color="white"
              fontSize="10px"
              fontWeight={500}
              cursor="pointer"
            >
              {initials || "?"}
            </Box>
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content
              w={"240px"}
              maxW={"full"}
              bg="bg.panel"
              border="1px solid"
              borderColor="border"
              borderRadius="lg"
              p="4px"
            >
              <Flex align="center" gap="10px" px="12px" py="8px">
                <Box
                  display="grid"
                  placeItems="center"
                  w="28px"
                  h="28px"
                  minW="28px"
                  borderRadius="full"
                  bg="accent.admin"
                  color="white"
                  fontSize="10px"
                  fontWeight={500}
                >
                  {initials || "?"}
                </Box>
                <Box>
                  <Text m={0} color="fg" fontSize="13px" fontWeight={500}>
                    {user?.name ?? "User"}
                  </Text>
                  <Text m={0} color="fg.subtle" fontSize="11px">
                    {memberRole ?? ""}
                  </Text>
                </Box>
              </Flex>
              <Menu.Separator borderColor="border" />
              {/* <Menu.Item
                value="profile"
                bg="transparent"
                color="fg"
                borderRadius="md"
                px="12px"
                py="8px"
                gap="8px"
                fontSize="13px"
                _hover={{ bg: "bg.hover" }}
              >
                <Box color="fg">
                  <User size={15} />
                </Box>
                Profile
              </Menu.Item> */}
              {/* <Menu.Item
                value="billing"
                bg="transparent"
                color="fg"
                borderRadius="md"
                px="12px"
                py="8px"
                gap="8px"
                fontSize="13px"
                _hover={{ bg: "bg.hover" }}
              >
                <Box color="fg">
                  <CreditCard size={15} />
                </Box>
                Billing
              </Menu.Item> */}

              <Menu.Root positioning={{ placement: "right-start", gutter: 2 }}>
                <Menu.TriggerItem
                  bg="transparent"
                  color="fg"
                  borderRadius="md"
                  px="12px"
                  py="8px"
                  fontSize="13px"
                  display="flex"
                  alignItems="center"
                  gap="8px"
                  _hover={{ bg: "bg.hover" }}
                >
                  <Text m={0} flex="1">
                    Appearance
                  </Text>
                  <Box color={"fg.subtle"}>
                    <ChevronRight size={14} />
                  </Box>
                </Menu.TriggerItem>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content
                      minW="160px"
                      bg="bg.panel"
                      border="1px solid"
                      borderColor="border"
                      borderRadius="lg"
                      p="4px"
                    >
                      <Menu.Item
                        value="light"
                        closeOnSelect={false}
                        onClick={() => {
                          setTheme("light");
                        }}
                        bg="transparent"
                        color="fg"
                        borderRadius="md"
                        px="12px"
                        py="8px"
                        gap="8px"
                        fontSize="13px"
                        _hover={{ bg: "bg.hover" }}
                      >
                        <Box color="fg">
                          <Sun size={15} />
                        </Box>
                        <Text m={0} flex="1">
                          Light mode
                        </Text>
                        {colorMode === "light" && (
                          <Box color="brand.solid">
                            <Check size={14} />
                          </Box>
                        )}
                      </Menu.Item>
                      <Menu.Item
                        value="dark"
                        closeOnSelect={false}
                        onClick={() => setTheme("dark")}
                        bg="transparent"
                        color="fg"
                        borderRadius="md"
                        px="12px"
                        py="8px"
                        gap="8px"
                        fontSize="13px"
                        _hover={{ bg: "bg.hover" }}
                      >
                        <Box color="fg">
                          <Moon size={15} />
                        </Box>
                        <Text m={0} flex="1">
                          Dark mode
                        </Text>
                        {colorMode === "dark" && (
                          <Box color="brand.solid">
                            <Check size={14} />
                          </Box>
                        )}
                      </Menu.Item>
                      <Menu.Item
                        value="system"
                        closeOnSelect={false}
                        onClick={() => setTheme("system")}
                        bg="transparent"
                        color="fg"
                        borderRadius="md"
                        px="12px"
                        py="8px"
                        gap="8px"
                        fontSize="13px"
                        _hover={{ bg: "bg.hover" }}
                      >
                        <Box color="fg">
                          <Monitor size={15} />
                        </Box>
                        <Text m={0} flex="1">
                          System
                        </Text>
                        {colorMode === "system" && (
                          <Box color="brand.solid">
                            <Check size={14} />
                          </Box>
                        )}
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>

              {/* <Menu.Item
                value="language"
                closeOnSelect={false}
                bg="transparent"
                color="fg"
                borderRadius="md"
                px="12px"
                py="8px"
                gap="8px"
                fontSize="13px"
                _hover={{ bg: "bg.hover" }}
              >
                <Text m={0} flex="1">
                  Language
                </Text>
                <Box color="fg.subtle">
                  <ChevronRight size={14} />
                </Box>
              </Menu.Item>
              <Menu.Item
                value="timezone"
                closeOnSelect={false}
                bg="transparent"
                color="fg"
                borderRadius="md"
                px="12px"
                py="8px"
                gap="8px"
                fontSize="13px"
                _hover={{ bg: "bg.hover" }}
              >
                <Text m={0} flex="1">
                  Timezone
                </Text>
                <Box color="fg.subtle">
                  <ChevronRight size={14} />
                </Box>
              </Menu.Item> */}
              {/* <Menu.Separator borderColor="border" /> */}
              <Menu.Item
                value="logout"
                bg="transparent"
                color="fg.error"
                borderRadius="md"
                px="12px"
                py="8px"
                fontSize="13px"
                _hover={{ bg: "bg.error", color: "fg.error" }}
                onClick={() => signOutMutation.mutate()}
              >
                Log out
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </Flex>
  );
}
