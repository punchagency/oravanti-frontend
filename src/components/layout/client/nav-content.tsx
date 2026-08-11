import {
  Box,
  Badge,
  Collapsible,
  Flex,
  ScrollArea,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router";
import {
  BriefcaseBusiness,
  CalendarDays,
  CreditCard,
  MessageSquareText,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ClientSubItem = {
  label: string;
  path: string;
  badge?: number;
};

type ClientNavItem = {
  label: string;
  icon: LucideIcon;
  children: ClientSubItem[];
};

type ClientNavGroup = {
  items: ClientNavItem[];
};

const CLIENT_NAV: ClientNavGroup[] = [
  {
    items: [
      {
        label: "MY CASE",
        icon: BriefcaseBusiness,
        children: [
          { label: "Overview", path: "/" },
          { label: "My case files", path: "/case-files" },
          { label: "Timeline", path: "/timeline" },
        ],
      },
      {
        label: "APPOINTMENTS",
        icon: CalendarDays,
        children: [
          { label: "Upcoming", path: "/appointments/upcoming", badge: 1 },
          { label: "Past", path: "/appointments/past" },
        ],
      },
      {
        label: "PAYMENTS",
        icon: CreditCard,
        children: [
          { label: "Fee agreement", path: "/payments/fee-agreement" },
          { label: "Payment history", path: "/payments/history", badge: 1 },
        ],
      },
      {
        label: "MESSAGES",
        icon: MessageSquareText,
        children: [{ label: "Inbox", path: "/messages/inbox" }],
      },
      {
        label: "SETTINGS",
        icon: Settings,
        children: [
          { label: "My profile", path: "/settings/profile" },
        ],
      },
    ],
  },
];

function ClientNavItemComponent({
  item,
  onNavigate,
  collapsed = false,
}: {
  item: ClientNavItem;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const location = useLocation();
  const isActive = item.children.some((child) =>
    child.path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(child.path),
  );
  const Icon = item.icon;

  return (
    <Collapsible.Root defaultOpen={isActive}>
      <Collapsible.Trigger asChild>
        <Box
          display="block"
          width="100%"
          style={{ textDecoration: "none" }}
        >
          <Flex
            align="center"
            gap="8px"
            px={collapsed ? "0" : "14px"}
            py="6px"
            minH="30px"
            justifyContent={collapsed ? "center" : "flex-start"}
            color="fg.muted"
            fontSize="12px"
            _hover={{ bg: "bg.subtle", color: "fg" }}
            cursor="pointer"
            transition="all 150ms"
            rounded="xs"
          >
            <Icon size={15} strokeWidth={1.8} />
            {!collapsed && (
              <>
                <Text flex="1" m={0}>
                  {item.label}
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
          <VStack align="stretch" gap={0}>
            {item.children.map((child) => (
              <ClientSubItemComponent
                key={child.path}
                item={child}
                onNavigate={onNavigate}
              />
            ))}
          </VStack>
        </Collapsible.Content>
      )}
    </Collapsible.Root>
  );
}

function ClientSubItemComponent({
  item,
  onNavigate,
}: {
  item: ClientSubItem;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const isActive =
    item.path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.path);

  return (
    <NavLink
      to={item.path}
      style={{ textDecoration: "none", display: "block", width: "100%" }}
      onClick={onNavigate}
    >
      <Flex
        align="center"
        gap="8px"
        px="24px"
        py="4px"
        minH="24px"
        borderLeft="2px solid"
        borderColor={isActive ? "brand.solid" : "transparent"}
        bg={isActive ? "bg.muted" : "transparent"}
        color={isActive ? "fg" : "fg.muted"}
        fontSize="11px"
        fontWeight={isActive ? 500 : 400}
        _hover={{ bg: "bg.subtle", color: "fg" }}
        cursor="pointer"
        transition="all 150ms"
      >
        <Text flex="1" m={0}>
          {item.label}
        </Text>
        {item.badge !== undefined && (
          <Badge
            colorPalette="red"
            size="sm"
            variant="subtle"
            borderRadius="full"
          >
            {item.badge}
          </Badge>
        )}
      </Flex>
    </NavLink>
  );
}

export function ClientNavContent({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <>
      <ScrollArea.Root flex="1" size="xs">
        <ScrollArea.Viewport
          py={3}
          pl={collapsed ? 1 : 2}
          pr={collapsed ? 1 : 2.5}
        >
          <ScrollArea.Content>
            {CLIENT_NAV.map((group, gi) => (
              <Box key={gi}>
                {group.items.map((item) => (
                  <ClientNavItemComponent
                    key={item.label}
                    item={item}
                    onNavigate={onNavigate}
                    collapsed={collapsed}
                  />
                ))}
              </Box>
            ))}
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar>
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>

      {!collapsed && (
        <Flex direction="column" gap="12px" p="8px">
          <Flex
            p="12px"
            borderRadius="md"
            bg="bg.muted"
            direction="column"
            gap="10px"
          >
            <Flex align="center" gap="10px">
              <Box
                w="16px"
                h="16px"
                borderRadius="full"
                bg="fg.subtle"
              />
              <Box>
                <Text
                  textStyle="body-sm"
                  fontWeight={500}
                  color="fg"
                  m={0}
                  lineHeight={1.2}
                >
                  Need help?
                </Text>
                <Text
                  textStyle="body-sm"
                  fontWeight={500}
                  color="fg.subtle"
                  m={0}
                >
                  Contact your firm
                </Text>
              </Box>
            </Flex>
          </Flex>
        </Flex>
      )}
    </>
  );
}
