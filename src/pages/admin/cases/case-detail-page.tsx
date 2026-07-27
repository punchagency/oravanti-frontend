import { getCaseById } from "@/api/cases";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  Badge,
  Box,
  Breadcrumb,
  Button,
  Flex,
  HStack,
  Menu,
  Portal,
  ScrollArea,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Archive,
  ChevronDown,
  ChevronRight,
  Download,
  UserPlus,
} from "lucide-react";
import {
  Outlet,
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { ThemeSkeleton } from "../../../components/ui/theme-skeleton";
import { statusBadgeStyle } from "./components/case-details/shared";

const TAB_CONFIG = [
  { value: "overview", label: "Overview" },
  { value: "workflow", label: "Workflow" },
  { value: "people", label: "People" },
  { value: "documents", label: "Documents" },
  { value: "timeline", label: "Timeline" },
  { value: "notes", label: "Notes" },
  { value: "ai-review", label: "AI Review" },
  { value: "audit-log", label: "Audit Log" },
] as const;

const DEFAULT_TAB = "overview";

export function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const segments = location.pathname.replace(/\/+$/, "").split("/");
  const last = segments[segments.length - 1];
  const currentTab = TAB_CONFIG.some((t) => t.value === last)
    ? last
    : DEFAULT_TAB;

  const { data: caseRow, isLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => getCaseById(caseId!),
    enabled: Boolean(caseId),
    staleTime: 60_000,
  });

  useDocumentTitle(
    caseRow ? `${caseRow.caseNumber} – Case – Oravanti` : "Case – Oravanti",
  );

  const statusColors =
    statusBadgeStyle[caseRow?.status as keyof typeof statusBadgeStyle] ??
    statusBadgeStyle.Filed;

  return (
    <Box>
      {/* ── Breadcrumbs ── */}
      <Breadcrumb.Root pt={{ base: "12px", md: "20px" }} mb={3}>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link asChild color="fg.muted" fontSize="12px">
              <RouterLink to="/cases">Cases</RouterLink>
            </Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator>
            <ChevronRight size={12} />
          </Breadcrumb.Separator>
          <Breadcrumb.Item>
            <Breadcrumb.CurrentLink color="fg" fontSize="12px" fontWeight="500">
              {caseRow?.caseNumber ?? "Loading..."}
            </Breadcrumb.CurrentLink>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>

      {/* ── Header ── */}
      <Flex
        as="header"
        align={{ base: "flex-start", sm: "center" }}
        justify="space-between"
        gap="16px"
        pb={{ base: "12px", md: "8px" }}
        direction={{ base: "column", sm: "row" }}
        mb={1}
      >
        <Box minW={0} flex={1}>
          {isLoading ? (
            <>
              <ThemeSkeleton h="22px" w="120px" borderRadius="4px" mb={1} />
              <ThemeSkeleton h="14px" w="140px" borderRadius="4px" />
            </>
          ) : (
            <>
              <Text
                color="fg"
                fontSize={{ base: "17px", md: "22px" }}
                fontWeight="600"
                lineHeight="1.2"
                truncate
              >
                {caseRow?.caseNumber ?? "—"}
              </Text>
              <Text
                color="fg.muted"
                fontSize={{ base: "12px", md: "13px" }}
                mt={0.5}
              >
                {caseRow?.client?.name ?? "—"}
              </Text>
            </>
          )}
          <HStack gap={1.5} mt={2} wrap="wrap">
            <Badge
              size="xs"
              borderRadius="full"
              px={2.5}
              py={0.5}
              borderWidth="1px"
              borderColor={statusColors.borderColor}
              bg={statusColors.bg}
              color={statusColors.textColor}
              fontWeight="500"
              fontSize="11px"
              textTransform="none"
              whiteSpace="nowrap"
            >
              {caseRow?.status ?? "—"}
            </Badge>

            <Box bg="brand.subtle" borderRadius="10px" px={1.5} py={0.5}>
              <Text
                color="brand.fg"
                fontSize="10px"
                fontWeight="500"
                lineHeight="12px"
              >
                {caseRow?.practiceArea?.name ?? "—"}
              </Text>
            </Box>

            <Menu.Root>
              <Menu.Trigger asChild>
                <Button
                  size="xs"
                  variant="outline"
                  borderColor="border"
                  h="22px"
                  fontSize="10px"
                  fontWeight="400"
                  px={2}
                >
                  Actions
                  <ChevronDown size={10} />
                </Button>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content minW="180px">
                    <Menu.Item value="reassign-team">
                      <UserPlus size={14} />
                      <Box flex="1">Reassign team</Box>
                    </Menu.Item>
                    <Menu.Item value="export">
                      <Download size={14} />
                      <Box flex="1">Export case file</Box>
                    </Menu.Item>
                    <Menu.Item value="close">
                      <Archive size={14} />
                      <Box flex="1">Close case</Box>
                    </Menu.Item>
                    <Menu.Item
                      value="flag"
                      color="fg.error"
                      _hover={{ bg: "bg.error", color: "fg.error" }}
                    >
                      <AlertTriangle size={14} />
                      <Box flex="1">Flag as urgent</Box>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </HStack>
        </Box>
      </Flex>

      {/* ── Route-driven tabs ── */}
      <Tabs.Root
        value={currentTab}
        onValueChange={(e) =>
          navigate(
            e.value === DEFAULT_TAB
              ? `/cases/${caseId}`
              : `/cases/${caseId}/${e.value}`,
          )
        }
        variant="plain"
        w="full"
      >
        <ScrollArea.Root w="full" size="xs">
          <ScrollArea.Viewport>
            <ScrollArea.Content>
              <Tabs.List borderBottom="1px solid" borderColor="border.muted">
                {TAB_CONFIG.map((tab) => (
                  <Tabs.Trigger
                    key={tab.value}
                    value={tab.value}
                    textStyle="label"
                    color="fg.muted"
                    pb="10px"
                    px={{ base: 2.5, md: 4 }}
                    borderRadius="none"
                    whiteSpace="nowrap"
                    fontSize={{ base: "12px", md: "13px" }}
                    borderBottom="2px solid transparent"
                    _selected={{
                      borderBottom: "2px solid",
                      borderColor: "brand.solid",
                    }}
                    _hover={{ color: "fg" }}
                    transition="all 0.2s"
                  >
                    {tab.label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="horizontal" />
          <ScrollArea.Corner />
        </ScrollArea.Root>

        <Box pt={{ base: "16px", md: "24px" }}>
          <Outlet />
        </Box>
      </Tabs.Root>
    </Box>
  );
}
