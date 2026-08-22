import {
  contextNavigation,
  getSectionForPath,
  primaryNavigation,
} from "@/utils/navigation";
import {
  Box,
  Button,
  Collapsible,
  Flex,
  HStack,
  ScrollArea,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";
import { useLocation } from "react-router";
import { NavItem } from "@/components/layout/shared/nav-item";
import { iconMap } from "@/components/layout/shared/nav-item-utils";
import { QuickActions } from "./quick-actions";

export function NavContent({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const location = useLocation();
  const activeSection = getSectionForPath(location.pathname);

  return (
    <>
      <ScrollArea.Root flex="1" size={"xs"}>
        <ScrollArea.Viewport
          py={3}
          pl={collapsed ? 1 : 2}
          pr={collapsed ? 1 : 2.5}
        >
          <ScrollArea.Content>
            {primaryNavigation.map((primary) => {
              const contextGroups = contextNavigation[primary.section];
              const sectionActive = primary.section === activeSection;
              const totalItems = contextGroups.reduce(
                (sum, g) => sum + g.items.length,
                0,
              );

              if (totalItems === 1 && !contextGroups[0].items[0].children) {
                return (
                  <NavItem
                    key={primary.section}
                    item={contextGroups[0].items[0]}
                    onNavigate={onNavigate}
                    collapsed={collapsed}
                  />
                );
              }

              return (
                <Collapsible.Root
                  key={primary.section}
                  defaultOpen={sectionActive}
                >
                  <Collapsible.Trigger asChild>
                    <Box
                      display="block"
                      width="100%"
                      style={{ textDecoration: "none" }}
                    >
                      <Flex
                        align="center"
                        justify={collapsed ? "center" : "flex-start"}
                        gap={collapsed ? "0" : "8px"}
                        px={collapsed ? "0" : "14px"}
                        py="6px"
                        minH="30px"
                        color="fg.muted"
                        fontSize="12px"
                        _hover={{ bg: "bg.subtle", color: "fg" }}
                        cursor="pointer"
                        transition="all 150ms"
                        rounded={"xs"}
                      >
                        {iconMap[primary.icon] &&
                          (() => {
                            const Icon = iconMap[primary.icon];
                            return <Icon size={15} strokeWidth={1.8} />;
                          })()}
                        {!collapsed && (
                          <>
                            <Text flex="1" m={0}>
                              {primary.label}
                            </Text>
                            <Collapsible.Indicator>
                              <ChevronDown size={14} />
                            </Collapsible.Indicator>
                          </>
                        )}
                      </Flex>
                    </Box>
                  </Collapsible.Trigger>
                  {!collapsed && (
                    <Collapsible.Content>
                      {contextGroups.map((group) => (
                        <Box key={group.label}>
                          {contextGroups.length > 1 && (
                            <Text
                              px="14px"
                              pt="10px"
                              pb="4px"
                              color="fg.subtle"
                              fontSize="10px"
                              fontWeight={500}
                              letterSpacing="0"
                              lineHeight={1}
                              textTransform="uppercase"
                              m={0}
                            >
                              {group.label}
                            </Text>
                          )}
                          <VStack align="stretch" gap={0}>
                            {group.items.map((item) => (
                              <NavItem
                                key={item.path}
                                item={item}
                                depth={1}
                                onNavigate={onNavigate}
                                collapsed={collapsed}
                              />
                            ))}
                          </VStack>
                        </Box>
                      ))}
                    </Collapsible.Content>
                  )}
                </Collapsible.Root>
              );
            })}
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar>
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
      <Box
        px={collapsed ? "0" : "8px"}
        py="12px"
        borderTop="1px solid"
        borderColor="border.subtle"
      >
        <QuickActions collapsed={collapsed} />
      </Box>

      {!collapsed && (
        <Flex direction="column" gap="12px" p="8px">
          <Flex
            p="12px"
            borderRadius="md"
            bg="bg.muted"
            direction="column"
            gap="10px"
          >
            <HStack gap="10px">
              <Box
                w="24px"
                h="24px"
                borderRadius="full"
                border="3px solid"
                borderColor="brand.subtle"
                borderTopColor="brand.solid"
              />
              <Box>
                <Text
                  textStyle="body-sm"
                  fontWeight={500}
                  color="fg"
                  m={0}
                  lineHeight={1.2}
                >
                  Advanced free trial
                </Text>
                <Text
                  textStyle="body-sm"
                  fontWeight={500}
                  color="brand.solid"
                  m={0}
                >
                  5 days left
                </Text>
              </Box>
            </HStack>
            <Button h="32px" borderRadius="sm" layerStyle="brand-button">
              Upgrade plan
            </Button>
          </Flex>
        </Flex>
      )}
    </>
  );
}
