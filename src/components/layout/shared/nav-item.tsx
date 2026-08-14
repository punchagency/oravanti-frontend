import { type ContextNavigationItem } from "@/utils/navigation";
import { Box, Collapsible, Flex, Text } from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router";
import {
  hasActiveChild,
  iconMap,
} from "@/components/layout/shared/nav-item-utils";

export function NavItem({
  item,
  depth = 0,
  onNavigate,
  collapsed = false,
}: {
  item: ContextNavigationItem;
  depth?: number;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const location = useLocation();
  const Icon = iconMap[item.icon];
  const active = location.pathname === item.path;
  const hasChildren = Boolean(item.children?.length);
  const defaultOpen = hasChildren && hasActiveChild(location.pathname, item);
  const isNested = depth > 0;

  if (hasChildren) {
    return (
      <Collapsible.Root defaultOpen={defaultOpen}>
        <Collapsible.Trigger asChild>
          <NavLink
            to={item.path}
            style={{ textDecoration: "none", display: "block", width: "100%" }}
            onClick={onNavigate}
          >
            <Flex
              align="center"
              gap="8px"
              px={collapsed ? "0" : isNested ? "24px" : "14px"}
              py={isNested ? "4px" : "6px"}
              minH={isNested ? "24px" : "30px"}
              justifyContent={collapsed ? "center" : "flex-start"}
              borderLeft="2px solid"
              borderColor={active ? "brand.solid" : "transparent"}
              bg={active ? "bg.muted" : "transparent"}
              color={active ? "fg" : "fg.muted"}
              fontSize={isNested ? "11px" : "12px"}
              fontWeight={active ? 500 : 400}
              _hover={{ bg: "bg.subtle", color: "fg" }}
              cursor="pointer"
              transition="all 150ms"
            >
              <Icon size={isNested ? 13 : 15} strokeWidth={1.8} />
              <Box
                flex="1"
                overflow="hidden"
                whiteSpace="nowrap"
                opacity={collapsed ? 0 : 1}
                transition="opacity 150ms"
                pointerEvents={collapsed ? "none" : "auto"}
              >
                <Text m={0}>{item.label}</Text>
              </Box>
              {!collapsed && (
                <Collapsible.Indicator>
                  <ChevronDown size={14} />
                </Collapsible.Indicator>
              )}
            </Flex>
          </NavLink>
        </Collapsible.Trigger>
        {!collapsed && (
          <Collapsible.Content>
            {item.children?.map((child) => (
              <NavItem
                key={child.path}
                item={child}
                depth={depth + 1}
                onNavigate={onNavigate}
                collapsed={collapsed}
              />
            ))}
          </Collapsible.Content>
        )}
      </Collapsible.Root>
    );
  }

  return (
    <NavLink
      to={item.path}
      style={{ textDecoration: "none", display: "block", width: "100%" }}
      onClick={onNavigate}
    >
      <Flex
        align="center"
        gap="8px"
        px={collapsed ? "0" : isNested ? "24px" : "14px"}
        py={isNested ? "4px" : "6px"}
        minH={isNested ? "24px" : "30px"}
        justifyContent={collapsed ? "center" : "flex-start"}
        borderLeft="2px solid"
        borderColor={active ? "brand.solid" : "transparent"}
        bg={active ? "bg.muted" : "transparent"}
        color={active ? "fg" : "fg.muted"}
        fontSize={isNested ? "11px" : "12px"}
        fontWeight={active ? 500 : 400}
        _hover={{ bg: "bg.subtle", color: "fg" }}
        cursor="pointer"
        transition="all 150ms"
        rounded={"xs"}
      >
        <Icon size={isNested ? 13 : 15} strokeWidth={1.8} />
        {!collapsed && <Text m={0}>{item.label}</Text>}
      </Flex>
    </NavLink>
  );
}
