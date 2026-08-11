import {
  type ContextNavigationItem,
  type NavigationIcon,
} from "@/utils/navigation";
import { Box, Collapsible, Flex, Text } from "@chakra-ui/react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpenCheck,
  Bot,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  ChartColumn,
  ChartColumnBig,
  ChartNetwork,
  ChartPie,
  ChevronDown,
  ClipboardList,
  FileClock,
  FilePlus2,
  Files,
  FileText,
  Folder,
  FolderOpen,
  Gavel,
  Globe,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  LayoutTemplate,
  Lock,
  Mail,
  MessageSquareText,
  Moon,
  Package,
  Rss,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Signature,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { NavLink, useLocation } from "react-router";

export const iconMap: Record<NavigationIcon, LucideIcon> = {
  analytics: ChartNetwork,
  billing: FileText,
  briefcase: BriefcaseBusiness,
  calendar: CalendarDays,
  "calendar-check": CalendarCheck,
  chart: BarChart3,
  "chart-column-big": ChartColumnBig,
  lock: Lock,
  chevron: ChevronDown,
  clipboard: ClipboardList,
  dashboard: LayoutDashboard,
  documents: Files,
  download: ClipboardList,
  education: GraduationCap,
  file: FileText,
  "file-clock": FileClock,
  "file-plus": FilePlus2,
  package: Package,
  template: LayoutTemplate,
  folder: Folder,
  "folder-open": FolderOpen,
  gavel: Gavel,
  globe: Globe,
  landmark: Landmark,
  mail: Mail,
  message: MessageSquareText,
  moon: Moon,
  intake: UserRoundPlus,
  rss: Rss,
  search: Search,
  settings: Settings,
  shield: Shield,
  "shield-check": ShieldCheck,
  signature: Signature,
  users: Users,
  overview: ChartColumn,
  "book-open-check": BookOpenCheck,
  "chart-pie": ChartPie,
  "ai-review": Bot,
};

export function hasActiveChild(
  currentPath: string,
  item: ContextNavigationItem,
): boolean {
  if (currentPath === item.path) return true;
  return (
    item.children?.some((child) => hasActiveChild(currentPath, child)) ?? false
  );
}

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
