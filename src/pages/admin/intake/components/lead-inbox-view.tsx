import {
  Box,
  Flex,
  HStack,
  Input,
  Portal,
  Select,
  Skeleton,
  Table,
  Text,
  VStack,
  createListCollection,
} from "@chakra-ui/react";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { leadSources, leadStatuses } from "../data";
import {
  MutedText,
  OutlineButton,
  PracticePill,
} from "../../../../components/ui/intake-ui";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  sourceLabels,
  sourceValues,
  statusLabels,
  formatReceivedDate,
  type Lead,
  type LeadSource,
  type LeadStatus,
} from "@/api/leads";
import {
  useLeads,
  useUpdateLeadStatus,
} from "@/hooks/use-leads";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
import { LeadDetailsDrawer } from "./lead-details/drawer";
import type { PublicPracticeArea } from "@/pages/contractor-sign-up/types";

function buildPracticeAreaMap(areas: PublicPracticeArea[]) {
  const map = new Map<string, string>();
  for (const area of areas) {
    map.set(area.id, area.name);
  }
  return map;
}

const PAGE_SIZE_OPTIONS = [10, 15, 20, 50] as const;

export function LeadInboxView() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("All sources");
  const [status, setStatus] = useState("All statuses");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const updateLeadStatus = useUpdateLeadStatus();

  const sourceFilter =
    source === "All sources"
      ? undefined
      : (sourceValues[source] as LeadSource | undefined);
  const statusFilter =
    status === "All statuses"
      ? undefined
      : (status.toLowerCase() as LeadStatus | undefined);

  const { data, isLoading } = useLeads({
    stage: "lead_inbox",
    source: sourceFilter,
    status: statusFilter,
    search: query || undefined,
    page,
    limit,
  });

  const { data: practiceAreas } = usePublicPracticeAreas();
  const practiceAreaMap = useMemo(
    () => buildPracticeAreaMap(practiceAreas ?? []),
    [practiceAreas],
  );

  const leads = useMemo(() => {
    const list = Array.isArray(data) ? data : (data?.leads ?? []);
    return list;
  }, [data]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  function handleSourceChange(value: string) {
    setSource(value);
    setPage(1);
  }

  function handleStatusChange(value: string) {
    setStatus(value);
    setPage(1);
  }

  function handleLimitChange(value: number) {
    setLimit(value);
    setPage(1);
  }

  function handleLeadStatusUpdate(leadId: string) {
    updateLeadStatus.mutate({ id: leadId, status: "reviewed" });
  }

  const total = data?.pagination?.total ?? 0;

  return (
    <>
      <Flex
        as="section"
        align="center"
        justify="space-between"
        gap="16px"
        my="24px"
        mb="18px"
        wrap="wrap"
        aria-label="Lead inbox controls"
      >
        <HStack gap="10px">
          <HStack
            gap="8px"
            h="34px"
            minW="280px"
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
              value={query}
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
            value={source}
            onChange={handleSourceChange}
            options={["All sources", ...leadSources]}
          />
          <FilterSelect
            ariaLabel="Filter by status"
            value={status}
            onChange={handleStatusChange}
            options={["All statuses", ...leadStatuses]}
          />
        </HStack>
        <MutedText fontSize="11px">
          {isLoading
            ? "Loading…"
            : `${total} ${total === 1 ? "lead" : "leads"}`}
        </MutedText>
      </Flex>

      <Box
        overflowX="auto"
        border="1px solid"
        borderColor="border"
        borderRadius="10px"
        bg="bg"
        aria-label="Lead inbox table"
      >
        <Table.Root minW="980px">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              {[
                "Name",
                "Contact",
                "Practice area interest",
                "Source",
                "Received",
                "Action",
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
                      <Skeleton
                        h="13px"
                        w="120px"
                        mb="6px"
                        borderRadius="4px"
                      />
                      <Skeleton h="16px" w="48px" borderRadius="99px" />
                    </Table.Cell>
                    <Table.Cell
                      px="16px"
                      py="9px"
                      borderBottom="1px solid"
                      borderColor="border.subtle"
                    >
                      <Skeleton
                        h="13px"
                        w="160px"
                        mb="5px"
                        borderRadius="4px"
                      />
                      <Skeleton h="11px" w="90px" borderRadius="4px" />
                    </Table.Cell>
                    <Table.Cell
                      px="16px"
                      py="9px"
                      borderBottom="1px solid"
                      borderColor="border.subtle"
                    >
                      <Skeleton h="20px" w="100px" borderRadius="99px" />
                    </Table.Cell>
                    <Table.Cell
                      px="16px"
                      py="9px"
                      borderBottom="1px solid"
                      borderColor="border.subtle"
                    >
                      <Skeleton h="13px" w="80px" borderRadius="4px" />
                    </Table.Cell>
                    <Table.Cell
                      px="16px"
                      py="9px"
                      borderBottom="1px solid"
                      borderColor="border.subtle"
                    >
                      <Skeleton h="13px" w="110px" borderRadius="4px" />
                    </Table.Cell>
                    <Table.Cell
                      px="16px"
                      py="9px"
                      borderBottom="1px solid"
                      borderColor="border.subtle"
                    >
                      <Skeleton h="28px" w="62px" borderRadius="7px" />
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
                      <Box color="fg" fontSize="13px" fontWeight="500">
                        {lead.name}
                      </Box>
                      <LeadStatusPill status={lead.status} />
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
                      <MutedText fontSize="11px">{lead.phone ?? ""}</MutedText>
                    </Table.Cell>
                    <Table.Cell
                      px="16px"
                      py="9px"
                      borderBottom="1px solid"
                      borderColor="border.subtle"
                    >
                      {lead.practiceAreaId ? (
                        <PracticePill tone="neutral">
                          {practiceAreaMap.get(lead.practiceAreaId) ??
                            "Practice area"}
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
                      <OutlineButton
                        h="28px"
                        minH="28px"
                        fontSize="12px"
                        onClick={() => {
                          setSelectedLead(lead);
                          if (lead.status === "new") {
                            handleLeadStatusUpdate(lead.id);
                          }
                        }}
                      >
                        Review
                      </OutlineButton>
                    </Table.Cell>
                  </Table.Row>
                ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {total > 0 && (
        <PaginationControls
          total={total}
          currentPage={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
          pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
        />
      )}

      <LeadDetailsDrawer
        leadId={selectedLead?.id ?? ""}
        open={Boolean(selectedLead)}
        onOpenChange={(details) => { if (!details.open) setSelectedLead(null); }}
      >
        <span />
      </LeadDetailsDrawer>
    </>
  );
}



function LeadDetail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Text
        m="0 0 7px"
        color="fg.muted"
        fontSize="10px"
        fontWeight="600"
        lineHeight="1"
        textTransform="uppercase"
      >
        {label}
      </Text>
      <Box color="fg" fontSize="13px" fontWeight="500" lineHeight="1.25">
        {children}
      </Box>
    </Box>
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
  options: readonly string[];
}) {
  const collection = useMemo(
    () =>
      createListCollection({
        items: options.map((option) => ({ label: option, value: option })),
      }),
    [options],
  );

  return (
    <Select.Root
      collection={collection}
      size="sm"
      minW="156px"
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

const leadStatusTone: Record<LeadStatus, "warning" | "neutral" | "danger"> = {
  new: "warning",
  reviewed: "neutral",
  archived: "neutral",
  declined: "danger",
  overridden: "warning",
};

function LeadStatusPill({ status }: { status: LeadStatus }) {
  const tone = leadStatusTone[status] ?? "neutral";
  return <PracticePill tone={tone}>{statusLabels[status]}</PracticePill>;
}
