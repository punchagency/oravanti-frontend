import {
  formatReceivedDate,
  sourceLabels,
  type Lead,
  type LeadSource,
} from "@/api/leads";
import { AddLeadDialog } from "@/components/ui/add-lead";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageTitle } from "@/components/layout/shared/nav-context";
import {
  useLeadsStageCount,
  useRunConflictCheck,
  useUpdateLeadStatus,
} from "@/hooks/use-leads";
import { useCanCreateLeads } from "@/hooks/use-can-create-leads";
import { useAuthStore } from "@/store/auth-store";
import { InstantConsultationDialog } from "./components/intake-pipeline/dialogs/instant-consultation-dialog";
import { OutlineButton } from "@/components/ui/intake-ui";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Menu,
  Portal,
  Select,
  Stack,
  Table,
  Text,
  VStack,
  createListCollection,
} from "@chakra-ui/react";
import {
  Briefcase,
  ClipboardCheck,
  Ellipsis,
  Eye,
  FileSignature,
  FileText,
  MessageSquare,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  Undo2,
  X,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  BrandButton,
  MutedText,
  PracticePill,
} from "../../../components/ui/intake-ui";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { pipelineStageLabels } from "./components/intake-pipeline/shared/constants";
import { LeadsDataProvider, useLeadsData } from "./leads-data-context";

const PAGE_SIZE_OPTIONS = [10, 15, 20, 50] as const;

const statusSummaryCards = [
  { key: "new", label: "New", color: "#E8A635", icon: FileText },
  { key: "reviewed", label: "Reviewed", color: "#1D9E75", icon: RotateCcw },
  { key: "archived", label: "Archived", color: "#B4B2A9", icon: Trash2 },
  { key: "total", label: "Total Leads", color: "fg", icon: Eye },
] as const;

const stageSummaryCards = [
  { key: "conflict_check", label: "Conflict Check", color: "#E85435", icon: ShieldAlert },
  { key: "questionnaire", label: "Questionnaire", color: "#3B82F6", icon: ClipboardCheck },
  { key: "consultation", label: "Consultation", color: "#8B5CF6", icon: MessageSquare },
  { key: "fee_agreement", label: "Fee Agreement", color: "#F59E0B", icon: FileSignature },
  { key: "case_opening", label: "Case Opening", color: "#10B981", icon: Briefcase },
] as const;

function LeadsPageContent() {
  const {
    leads,
    isLoading,
    total,
    counts,
    practiceAreas,
    searchQuery,
    setSearchQuery,
    source,
    setSource,
    practiceArea,
    setPracticeArea,
    stage,
    setStage,
    currentPage,
    pageLimit,
    setPagination,
    pipelineStageOptions,
    leadSources,
  } = useLeadsData();

  const navigate = useNavigate();


  const updateLeadStatus = useUpdateLeadStatus();
  const runConflictCheck = useRunConflictCheck();
  const { data: stageCounts, isLoading: stageCountsLoading } =
    useLeadsStageCount();
  const currentUser = useAuthStore((s) => s.user);
  const canCreateLeads = useCanCreateLeads();

  function handleQueryChange(value: string) {
    setSearchQuery(value);
  }

  function handleSourceChange(value: string) {
    setSource(value === "All sources" ? "" : value);
  }

  function handlePracticeAreaChange(value: string) {
    setPracticeArea(value === "" ? "" : value);
  }

  function handleStageChange(value: string) {
    if (value === "All stages") {
      setStage("");
    } else {
      const key =
        Object.entries(pipelineStageLabels).find(
          ([, label]) => label === value,
        )?.[0] ?? "";
      setStage(key);
    }
  }

  function handleLimitChange(value: number) {
    setPagination({ limit: value, currentPage: 1 });
  }

  const hasActiveFilters =
    searchQuery !== "" || source !== "" || practiceArea !== "" || stage !== "";

  function clearFilters() {
    setSearchQuery("");
    setSource("");
    setPracticeArea("");
    setStage("");
    setPagination({ currentPage: 1 });
  }

  function viewLead(lead: Lead) {
    if (lead.status === "new") {
      updateLeadStatus.mutate({
        id: lead.id,
        status: "reviewed",
        actorId: currentUser?.id,
      });
    }
    navigate(`/leads/${lead.id}`);
  }

  return (
    <>
      {/* ── Header ── */}
      <Flex
        as="header"
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "flex-start" }}
        justify="space-between"
        gap={{ base: "12px", md: "24px" }}
        py={{ base: "12px", md: "20px" }}
        pb={{ base: "12px", md: "20px" }}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Box flex="1">
          <PageTitle>
            <Text
              as="h1"
              m="0"
              color="fg"
              fontSize={{ base: "18px", md: "24px" }}
              fontWeight="600"
              lineHeight="1.2"
            >
              Leads
            </Text>
          </PageTitle>
          <Text
            m={{ base: "4px 0 0", md: "8px 0 0" }}
            color="fg.muted"
            fontSize={{ base: "13px", md: "14px" }}
          >
            Manage leads from first contact to active case
          </Text>
        </Box>
        {canCreateLeads && (
          <AddLeadDialog>
            <BrandButton w={{ base: "full", md: "auto" }}>
              <Plus size={15} />
              Add lead
            </BrandButton>
          </AddLeadDialog>
        )}
        {canCreateLeads && (
          <InstantConsultationDialog>
            <OutlineButton w={{ base: "full", md: "auto" }}>
              <Zap size={14} />
              Start consultation now
            </OutlineButton>
          </InstantConsultationDialog>
        )}
      </Flex>

      {/* ── Status summary ── */}
      <Flex wrap="wrap" gap={{ base: 3, md: 4 }} py={5}>
        {statusSummaryCards.map((card) => {
          const Icon = card.icon;
          const count =
            card.key === "total"
              ? total
              : counts[card.key as keyof typeof counts];
          return (
            <Box
              key={card.key}
              flex={{
                base: "1 1 calc(50% - 12px)",
                md: "1 1 calc(25% - 12px)",
              }}
              minW={{ base: 0, md: "120px" }}
              bg="bg"
              border="1px solid"
              borderColor="border"
              borderRadius="lg"
              px={{ base: 3, md: 4 }}
              py={{ base: 3, md: 4 }}
            >
              <Flex align="center" gap={2.5}>
                <Box color={card.color}>
                  <Icon size={18} />
                </Box>
                {isLoading ? (
                  <ThemeSkeleton h="28px" w="32px" borderRadius="md" />
                ) : (
                  <Text
                    fontWeight="bold"
                    fontSize={{ base: "xl", md: "2xl" }}
                    color="fg"
                  >
                    {count}
                  </Text>
                )}
              </Flex>
              <Text
                mt={1}
                fontSize="13px"
                color="fg.subtle"
                whiteSpace="nowrap"
              >
                {card.label}
              </Text>
            </Box>
          );
        })}
      </Flex>

      {/* ── Pipeline stage summary ── */}
      <Flex wrap="wrap" gap={{ base: 3, md: 4 }} pb={5}>
        {stageSummaryCards.map((card) => {
          const Icon = card.icon;
          const count = stageCounts?.[card.key as keyof typeof stageCounts] ?? 0;
          return (
            <Box
              key={card.key}
              flex={{
                base: "1 1 calc(50% - 12px)",
                md: "1 1 calc(20% - 12px)",
              }}
              minW={{ base: 0, md: "110px" }}
              bg="bg"
              border="1px solid"
              borderColor="border"
              borderRadius="lg"
              px={{ base: 3, md: 4 }}
              py={{ base: 3, md: 4 }}
            >
              <Flex align="center" gap={2.5}>
                <Box color={card.color}>
                  <Icon size={18} />
                </Box>
                {stageCountsLoading ? (
                  <ThemeSkeleton h="28px" w="32px" borderRadius="md" />
                ) : (
                  <Text
                    fontWeight="bold"
                    fontSize={{ base: "xl", md: "2xl" }}
                    color="fg"
                  >
                    {count}
                  </Text>
                )}
              </Flex>
              <Text
                mt={1}
                fontSize="13px"
                color="fg.subtle"
                whiteSpace="nowrap"
              >
                {card.label}
              </Text>
            </Box>
          );
        })}
      </Flex>

      {/* ── Filters ── */}
      <Flex
        as="section"
        align={{ base: "stretch", md: "center" }}
        justify="space-between"
        gap="12px"
        mb="18px"
        direction={{ base: "column", md: "row" }}
      >
        <Stack
          gap="12px"
          direction={{ base: "column", sm: "row" }}
          w={{ base: "full", md: "auto" }}
          flexWrap="wrap"
        >
          <HStack
            gap="8px"
            h="34px"
            w={{ base: "full", md: "220px" }}
            px="12px"
            border="1px solid"
            borderColor="border"
            borderRadius="7px"
            bg="bg"
            color="fg.muted"
          >
            <Search size={15} />
            <Input
              aria-label="Search leads"
              placeholder="Search leads..."
              type="search"
              value={searchQuery}
              onChange={(event) => handleQueryChange(event.target.value)}
              p="0"
              h="auto"
              border="0"
              bg="transparent"
              color="fg"
              _focus={{ boxShadow: "none", outline: "0" }}
            />
          </HStack>

          <FilterSelect
            ariaLabel="Filter by source"
            value={source === "" ? "All sources" : source}
            onChange={handleSourceChange}
            options={["All sources", ...leadSources]}
          />
          <FilterSelect
            ariaLabel="Filter by practice area"
            value={practiceArea}
            onChange={handlePracticeAreaChange}
            options={[
              { label: "All practice areas", value: "" },
              ...practiceAreas.map((pa) => ({ label: pa.name, value: pa.id })),
            ]}
          />
          <FilterSelect
            ariaLabel="Filter by pipeline stage"
            value={
              stage === ""
                ? "All stages"
                : (pipelineStageLabels[stage] ?? stage)
            }
            onChange={handleStageChange}
            options={pipelineStageOptions.map((s) =>
              s === "All stages" ? s : (pipelineStageLabels[s] ?? s),
            )}
          />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size={{ base: "xs", md: "sm" }}
              color="fg.muted"
              onClick={clearFilters}
              flexShrink={0}
            >
              <X size={14} />
              <Text display={{ base: "inline", md: "none" }} ml={1}>
                Clear
              </Text>
              <Text display={{ base: "none", md: "inline" }}>
                Clear filters
              </Text>
            </Button>
          )}
        </Stack>
        <MutedText fontSize="11px">
          {isLoading
            ? "Loading…"
            : `${total} ${total === 1 ? "lead" : "leads"}`}
        </MutedText>
      </Flex>

      {/* ── Desktop table ── */}
      {isLoading ? (
        <Box
          display={{ base: "none", lg: "block" }}
          overflowX="auto"
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          bg="bg"
        >
          <Table.Root minW="1080px">
            <Table.Header>
              <Table.Row bg="bg.subtle">
                {[
                  "Client name",
                  "Contact",
                  "Practice area",
                  "Case type",
                  "Phase",
                  "Source",
                  "Received",
                  "",
                ].map((heading) => (
                  <Table.ColumnHeader
                    key={heading}
                    h="36px"
                    px="16px"
                    color="fg.muted"
                    fontSize="10px"
                    fontWeight="500"
                    textTransform="uppercase"
                  >
                    {heading}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {Array.from({ length: 8 }, (_, i) => (
                <Table.Row key={i}>
                  <Table.Cell
                    px="16px"
                    py="9px"
                    borderBottom="1px solid"
                    borderColor="border.subtle"
                  >
                    <ThemeSkeleton
                      h="13px"
                      w="120px"
                      mb="6px"
                      borderRadius="4px"
                    />
                    <ThemeSkeleton h="11px" w="48px" borderRadius="4px" />
                  </Table.Cell>
                  <Table.Cell
                    px="16px"
                    py="9px"
                    borderBottom="1px solid"
                    borderColor="border.subtle"
                  >
                    <ThemeSkeleton
                      h="13px"
                      w="160px"
                      mb="5px"
                      borderRadius="4px"
                    />
                    <ThemeSkeleton h="11px" w="90px" borderRadius="4px" />
                  </Table.Cell>
                  <Table.Cell
                    px="16px"
                    py="9px"
                    borderBottom="1px solid"
                    borderColor="border.subtle"
                  >
                    <ThemeSkeleton h="13px" w="90px" borderRadius="4px" />
                  </Table.Cell>
                  <Table.Cell
                    px="16px"
                    py="9px"
                    borderBottom="1px solid"
                    borderColor="border.subtle"
                  >
                    <ThemeSkeleton h="13px" w="100px" borderRadius="4px" />
                  </Table.Cell>
                  <Table.Cell
                    px="16px"
                    py="9px"
                    borderBottom="1px solid"
                    borderColor="border.subtle"
                  >
                    <ThemeSkeleton h="13px" w="70px" borderRadius="4px" />
                  </Table.Cell>
                  <Table.Cell
                    px="16px"
                    py="9px"
                    borderBottom="1px solid"
                    borderColor="border.subtle"
                  >
                    <ThemeSkeleton h="13px" w="80px" borderRadius="4px" />
                  </Table.Cell>
                  <Table.Cell
                    px="16px"
                    py="9px"
                    borderBottom="1px solid"
                    borderColor="border.subtle"
                  >
                    <ThemeSkeleton h="13px" w="60px" borderRadius="4px" />
                  </Table.Cell>
                  <Table.Cell
                    px="16px"
                    py="9px"
                    borderBottom="1px solid"
                    borderColor="border.subtle"
                  >
                    <ThemeSkeleton h="24px" w="24px" borderRadius="6px" />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      ) : leads.length === 0 ? (
        <VStack
          display={{ base: "none", lg: "flex" }}
          py={16}
          gap={2}
          textAlign="center"
        >
          <Text color="fg.muted" textStyle="lg" fontWeight="600">
            No leads found
          </Text>
          <Text color="fg.subtle" textStyle="body-sm">
            Try adjusting your filters or search terms.
          </Text>
        </VStack>
      ) : (
        <Box
          display={{ base: "none", lg: "block" }}
          overflowX="auto"
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          bg="bg"
          aria-label="Leads table"
        >
          <Table.Root minW="1080px">
            <Table.Header>
              <Table.Row bg="bg.subtle">
                {[
                  "Client name",
                  "Contact",
                  "Practice area",
                  "Case type",
                  "Phase",
                  "Source",
                  "Received",
                  "",
                ].map((heading) => (
                  <Table.ColumnHeader
                    key={heading}
                    h="36px"
                    px="16px"
                    color="fg.muted"
                    fontSize="10px"
                    fontWeight="500"
                    textTransform="uppercase"
                  >
                    {heading}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading
                ? Array.from({ length: 8 }, (_, i) => (
                    <Table.Row key={i}>
                      <Table.Cell
                        px="16px"
                        py="9px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                      >
                        <ThemeSkeleton
                          h="13px"
                          w="120px"
                          mb="6px"
                          borderRadius="4px"
                        />
                        <ThemeSkeleton h="11px" w="48px" borderRadius="4px" />
                      </Table.Cell>
                      <Table.Cell
                        px="16px"
                        py="9px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                      >
                        <ThemeSkeleton
                          h="13px"
                          w="160px"
                          mb="5px"
                          borderRadius="4px"
                        />
                        <ThemeSkeleton h="11px" w="90px" borderRadius="4px" />
                      </Table.Cell>
                      <Table.Cell
                        px="16px"
                        py="9px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                      >
                        <ThemeSkeleton h="20px" w="100px" borderRadius="99px" />
                      </Table.Cell>
                      <Table.Cell
                        px="16px"
                        py="9px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                      >
                        <ThemeSkeleton h="13px" w="80px" borderRadius="4px" />
                      </Table.Cell>
                      <Table.Cell
                        px="16px"
                        py="9px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                      >
                        <ThemeSkeleton h="13px" w="100px" borderRadius="4px" />
                      </Table.Cell>
                      <Table.Cell
                        px="16px"
                        py="9px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                      >
                        <ThemeSkeleton h="13px" w="80px" borderRadius="4px" />
                      </Table.Cell>
                      <Table.Cell
                        px="16px"
                        py="9px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                      >
                        <ThemeSkeleton h="13px" w="110px" borderRadius="4px" />
                      </Table.Cell>
                      <Table.Cell
                        px="16px"
                        py="9px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                      >
                        <ThemeSkeleton h="28px" w="32px" borderRadius="7px" />
                      </Table.Cell>
                    </Table.Row>
                  ))
                : leads.map((lead) => (
                    <Table.Row key={lead.id}>
                      <Table.Cell
                        px="16px"
                        py="9px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                      >
                        <Link
                          to={`/leads/${lead.id}`}
                          style={{ color: "inherit", textDecoration: "none" }}
                        >
                          <Text
                            color="fg"
                            fontSize="13px"
                            fontWeight="500"
                            _hover={{ color: "brand.solid" }}
                          >
                            {lead.name}
                          </Text>
                        </Link>
                      </Table.Cell>
                      <Table.Cell
                        px="16px"
                        py="9px"
                        color="fg.muted"
                        fontSize="13px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                      >
                        {lead.email}
                        <MutedText fontSize="11px">
                          {lead.phone ?? ""}
                        </MutedText>
                      </Table.Cell>
                      <Table.Cell
                        px="16px"
                        py="9px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                      >
                        {lead.practiceAreaName ? (
                          <PracticePill tone="neutral">
                            {lead.practiceAreaName}
                          </PracticePill>
                        ) : (
                          <MutedText>—</MutedText>
                        )}
                      </Table.Cell>
                      <Table.Cell
                        px="16px"
                        py="9px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                      >
                        {lead.caseTypeName ? (
                          <PracticePill tone="neutral">
                            {lead.caseTypeName}
                          </PracticePill>
                        ) : (
                          <MutedText>—</MutedText>
                        )}
                      </Table.Cell>
                      <Table.Cell
                        px="16px"
                        py="9px"
                        color="fg.muted"
                        fontSize="13px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                      >
                        {pipelineStageLabels[lead.pipelineStage] ??
                          lead.pipelineStage}
                      </Table.Cell>
                      <Table.Cell
                        px="16px"
                        py="9px"
                        color="fg.muted"
                        fontSize="13px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                      >
                        {sourceLabels[lead.source as LeadSource]}
                      </Table.Cell>
                      <Table.Cell
                        px="16px"
                        py="9px"
                        color="fg.muted"
                        fontSize="13px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                      >
                        {formatReceivedDate(lead.receivedAt)}
                      </Table.Cell>
                      <Table.Cell
                        px="16px"
                        py="9px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                      >
                        <Menu.Root>
                          <Menu.Trigger asChild>
                            <IconButton
                              variant="ghost"
                              size="xs"
                              color="fg.muted"
                              aria-label="Lead actions"
                            >
                              <Ellipsis size={15} />
                            </IconButton>
                          </Menu.Trigger>
                          <Portal>
                            <Menu.Positioner>
                              <Menu.Content minW="160px">
                                <Menu.Item
                                  value="view"
                                  onClick={() => viewLead(lead)}
                                >
                                  <Eye size={13} />
                                  <Box flex="1">View lead</Box>
                                </Menu.Item>
                                {lead.pipelineStage === "conflict_check" &&
                                !lead.conflictCheckId ? (
                                  <Menu.Item
                                    value="run-conflict-check"
                                    onClick={() =>
                                      runConflictCheck.mutate(lead.id)
                                    }
                                  >
                                    <ShieldAlert size={13} />
                                    <Box flex="1">Run conflict check</Box>
                                  </Menu.Item>
                                ) : null}
                                {lead.status === "new" ? (
                                  <Menu.Item
                                    value="mark-reviewed"
                                    onClick={() =>
                                      updateLeadStatus.mutate({
                                        id: lead.id,
                                        status: "reviewed",
                                        actorId: currentUser?.id,
                                      })
                                    }
                                  >
                                    <RotateCcw size={13} />
                                    <Box flex="1">Mark reviewed</Box>
                                  </Menu.Item>
                                ) : null}
                                {lead.status === "archived" ? (
                                  <Menu.Item
                                    value="unarchive"
                                    onClick={() =>
                                      updateLeadStatus.mutate({
                                        id: lead.id,
                                        status: "new",
                                        actorId: currentUser?.id,
                                      })
                                    }
                                  >
                                    <Undo2 size={13} />
                                    <Box flex="1">Unarchive</Box>
                                  </Menu.Item>
                                ) : (
                                  <Menu.Item
                                    value="archive"
                                    onClick={() =>
                                      updateLeadStatus.mutate({
                                        id: lead.id,
                                        status: "archived",
                                        actorId: currentUser?.id,
                                      })
                                    }
                                  >
                                    <Trash2 size={13} />
                                    <Box flex="1">Archive</Box>
                                  </Menu.Item>
                                )}
                              </Menu.Content>
                            </Menu.Positioner>
                          </Portal>
                        </Menu.Root>
                      </Table.Cell>
                    </Table.Row>
                  ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* ── Mobile card list ── */}
      <Stack gap={3} display={{ base: "flex", lg: "none" }}>
        {isLoading ? (
          Array.from({ length: 6 }, (_, i) => (
            <Box
              key={i}
              border="1px solid"
              borderColor="border.muted"
              borderRadius="md"
              p={3}
              bg="bg"
            >
              <Flex align="flex-start" gap={3}>
                <Box flex={1}>
                  <ThemeSkeleton
                    h="14px"
                    w="140px"
                    mb="6px"
                    borderRadius="4px"
                  />
                  <ThemeSkeleton h="11px" w="100px" borderRadius="4px" />
                  <ThemeSkeleton h="11px" w="180px" borderRadius="4px" />
                </Box>
                <ThemeSkeleton
                  h="24px"
                  w="24px"
                  borderRadius="6px"
                  flexShrink={0}
                />
              </Flex>
            </Box>
          ))
        ) : leads.length === 0 ? (
          <Stack py={16} gap={2} textAlign="center" align="center">
            <Text color="fg.muted" fontSize="lg" fontWeight="600">
              No leads found
            </Text>
            <Text color="fg.subtle" textStyle="body-sm">
              Try adjusting your filters or search terms.
            </Text>
          </Stack>
        ) : (
          leads.map((lead) => (
            <Box
              key={lead.id}
              border="1px solid"
              borderColor="border.muted"
              borderRadius="md"
              p={3}
              bg="bg"
              _active={{ bg: "bg.subtle" }}
            >
              <Flex align="flex-start" gap={3}>
                <Box flex={1} minW={0}>
                  <Link
                    to={`/leads/${lead.id}`}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    <Text
                      fontSize="13px"
                      fontWeight="500"
                      color="fg"
                      truncate
                      _hover={{ color: "brand.solid" }}
                    >
                      {lead.name}
                    </Text>
                  </Link>
                  <Text fontSize="11px" color="fg.muted" mt={1} truncate>
                    {lead.email}
                  </Text>
                  <HStack gap={2} mt={1.5} flexWrap="wrap">
                    {lead.practiceAreaName ? (
                      <PracticePill tone="neutral">
                        {lead.practiceAreaName}
                      </PracticePill>
                    ) : null}
                    {lead.caseTypeName ? (
                      <PracticePill tone="neutral">
                        {lead.caseTypeName}
                      </PracticePill>
                    ) : null}
                    <Text fontSize="10px" color="fg.subtle">
                      {pipelineStageLabels[lead.pipelineStage] ??
                        lead.pipelineStage}
                    </Text>
                    <Text fontSize="10px" color="fg.subtle">
                      {sourceLabels[lead.source as LeadSource]}
                    </Text>
                    <Text fontSize="10px" color="fg.subtle">
                      {formatReceivedDate(lead.receivedAt)}
                    </Text>
                  </HStack>
                </Box>
                <Menu.Root>
                  <Menu.Trigger asChild>
                    <IconButton
                      variant="ghost"
                      size="xs"
                      color="fg.muted"
                      aria-label="Lead actions"
                    >
                      <Ellipsis size={15} />
                    </IconButton>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content minW="160px">
                        <Menu.Item value="view" onClick={() => viewLead(lead)}>
                          <Eye size={13} />
                          <Box flex="1">View lead</Box>
                        </Menu.Item>
                        {lead.pipelineStage === "conflict_check" &&
                        !lead.conflictCheckId ? (
                          <Menu.Item
                            value="run-conflict-check"
                            onClick={() => runConflictCheck.mutate(lead.id)}
                          >
                            <ShieldAlert size={13} />
                            <Box flex="1">Run conflict check</Box>
                          </Menu.Item>
                        ) : null}
                        {lead.status === "new" ? (
                          <Menu.Item
                            value="mark-reviewed"
                            onClick={() =>
                              updateLeadStatus.mutate({
                                id: lead.id,
                                status: "reviewed",
                                actorId: currentUser?.id,
                              })
                            }
                          >
                            <RotateCcw size={13} />
                            <Box flex="1">Mark reviewed</Box>
                          </Menu.Item>
                        ) : null}
                        {lead.status === "archived" ? (
                          <Menu.Item
                            value="unarchive"
                            onClick={() =>
                              updateLeadStatus.mutate({
                                id: lead.id,
                                status: "new",
                                actorId: currentUser?.id,
                              })
                            }
                          >
                            <Undo2 size={13} />
                            <Box flex="1">Unarchive</Box>
                          </Menu.Item>
                        ) : (
                          <Menu.Item
                            value="archive"
                            onClick={() =>
                              updateLeadStatus.mutate({
                                id: lead.id,
                                status: "archived",
                                actorId: currentUser?.id,
                              })
                            }
                          >
                            <Trash2 size={13} />
                            <Box flex="1">Archive</Box>
                          </Menu.Item>
                        )}
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              </Flex>
            </Box>
          ))
        )}
      </Stack>

      {total > 0 && (
        <Box mt={4}>
          <PaginationControls
            total={total}
            currentPage={currentPage}
            limit={pageLimit}
            onPageChange={(p) => setPagination({ currentPage: p })}
            onLimitChange={handleLimitChange}
            pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
          />
        </Box>
      )}
    </>
  );
}

export function LeadsPage() {
  return (
    <LeadsDataProvider>
      <LeadsPageContent />
    </LeadsDataProvider>
  );
}

function FilterSelect({
  ariaLabel,
  value,
  onChange,
  options,
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (string | { label: string; value: string })[];
}) {
  const collection = useMemo(
    () =>
      createListCollection({
        items: options.map((option) =>
          typeof option === "string"
            ? { label: option, value: option }
            : option,
        ),
      }),
    [options],
  );

  return (
    <Select.Root
      collection={collection}
      size="sm"
      w={{ base: "full", md: "156px" }}
      value={[value]}
      onValueChange={(event) => onChange(event.value[0] ?? value)}
      aria-label={ariaLabel}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger bg="bg" borderColor="border" rounded="7px">
          <Select.ValueText />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {collection.items.map((item) => (
              <Select.Item item={item} key={item.value}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
