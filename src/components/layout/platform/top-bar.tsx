import { Box, Button, Flex, Menu, Portal, Text } from "@chakra-ui/react";
import { Check, ChevronRight, Monitor, Moon, PanelLeftOpen, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { AvatarChip } from "@/components/layout/shared/avatar-chip";
import { useNav, usePageTitle } from "@/components/layout/shared/use-nav";
import { useColorMode } from "@/hooks/use-color-mode";
import { useSignOut } from "@/hooks/useSignOut";
import { useAuthStore } from "@/store/auth-store";

/**
 * The CRM's top bar.
 *
 * The client portal's, with the two things an operator does not have taken
 * out: there is no client record to read a name and avatar from, and no
 * profile page to link to — the tier has one kind of account and nothing about
 * it is self-service, by design. What is left is the page title, appearance,
 * and the way out.
 */
export function PlatformTopBar() {
  const { onMobileOpen } = useNav();
  const { title: pageTitle, isVisible: pageTitleVisible } = usePageTitle();
  const user = useAuthStore((s) => s.user);
  const signOutMutation = useSignOut();
  const { setTheme } = useTheme();
  const { colorMode } = useColorMode();

  const displayName = user?.name || "Oravanti";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
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
            <AvatarChip src="" alt={displayName} fallback={initials} />
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content
              w="240px"
              maxW="full"
              bg="bg.panel"
              border="1px solid"
              borderColor="border"
              borderRadius="lg"
              p="4px"
            >
              <Flex align="center" gap="10px" px="12px" py="8px">
                <AvatarChip src="" alt={displayName} fallback={initials} />
                <Box minW={0}>
                  <Text m={0} color="fg" fontSize="13px" fontWeight={500} truncate>
                    {displayName}
                  </Text>
                  {/* Not the account type verbatim: "platform_admin" is a
                      column value, and the person reading it is the platform
                      admin. */}
                  <Text m={0} color="fg.subtle" fontSize="11px">
                    Oravanti operator
                  </Text>
                </Box>
              </Flex>
              <Menu.Separator borderColor="border" />
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
                  <ChevronRight size={14} />
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
                        onClick={() => setTheme("light")}
                        bg="transparent"
                        color="fg"
                        borderRadius="md"
                        px="12px"
                        py="8px"
                        gap="8px"
                        fontSize="13px"
                        _hover={{ bg: "bg.hover" }}
                      >
                        <Sun size={15} />
                        <Text m={0} flex="1">
                          Light mode
                        </Text>
                        {colorMode === "light" && <Check size={14} />}
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
                        <Moon size={15} />
                        <Text m={0} flex="1">
                          Dark mode
                        </Text>
                        {colorMode === "dark" && <Check size={14} />}
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
                        <Monitor size={15} />
                        <Text m={0} flex="1">
                          System
                        </Text>
                        {colorMode === "system" && <Check size={14} />}
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
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
