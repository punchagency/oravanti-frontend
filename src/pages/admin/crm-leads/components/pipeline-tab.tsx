import {
  Box,
  Flex,
  HStack,
  Input,
  Table,
  Text,
  chakra,
} from "@chakra-ui/react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  BrandButton,
  OutlineButton,
  PracticePill,
} from "@/components/ui/intake-ui";
import {
  sourceLabels,
  formatReceivedDate,
  type LeadSource,
  type PipelineStage,
} from "@/api/leads";
import { useLeads } from "@/hooks/use-leads";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
import type { PublicPracticeArea } from "@/pages/contractor-sign-up/types";

const PAGE_SIZE = 10;

const stageOptions: Array<{ label: string; value: PipelineStage | "" }> = [
  { label: "All stages", value: "" },
  { label: "Conflict check", value: "conflict_check" },
  { label: "Questionnaire sent", value: "questionnaire" },
  { label: "Consultation", value: "consultation" },
  { label: "Fee agreement", value: "fee_agreement" },
  { label: "Case opened", value: "case_opening" },
];

const stageLabel: Record<PipelineStage, string> = {
  conflict_check: "Conflict check",
  questionnaire: "Questionnaire sent",
  consultation: "Consultation",
  fee_agreement: "Fee agreement",
  case_opening: "Case opened",
};

const stageTone: Record<
  PipelineStage,
  "neutral" | "warning" | "info" | "brand" | "gold" | "success"
> = {
  conflict_check: "warning",
  questionnaire: "info",
  consultation: "brand",
  fee_agreement: "gold",
  case_opening: "success",
};

function buildPracticeAreaMap(areas: PublicPracticeArea[]) {
  const map = new Map<string, string>();
  for (const area of areas) {
    map.set(area.id, area.name);
  }
  return map;
}

export function PipelineTab() {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<PipelineStage | "">("");
  const [practiceAreaId, setPracticeAreaId] = useState("");
  const [source, setSource] = useState<LeadSource | "">("");
  const [page, setPage] = useState(1);

  const { data: practiceAreas } = usePublicPracticeAreas();
  const practiceAreaMap = useMemo(
    () => buildPracticeAreaMap(practiceAreas ?? []),
    [practiceAreas],
  );

  const { data, isLoading } = useLeads({
    stage: stage || undefined,
    practiceAreaName: practiceAreaMap.get(practiceAreaId) ?? undefined,
    source: source || undefined,
    search: query || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const leads = data?.leads ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function resetPage() {
    setPage(1);
  }

  return (
    <>
      <Flex
        align="center"
        justify="space-between"
        gap="16px"
        my="20px"
        wrap="wrap"
      >
        <HStack gap="10px" wrap="wrap">
          <HStack
            gap="8px"
            h="34px"
            minW="260px"
            px="12px"
            border="1px solid"
            borderColor="border"
            borderRadius="7px"
            bg="bg"
            color="fg.muted"
          >
            <Search size={14} />
            <Input
              aria-label="Search leads"
              placeholder="Search clients and leads..."
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetPage();
              }}
              p="0"
              h="auto"
              border="0"
              bg="transparent"
              color="fg"
              fontSize="13px"
              _focus={{ boxShadow: "none", outline: "0" }}
            />
          </HStack>

          <FilterSelect
            ariaLabel="Filter by stage"
            value={stage}
            onChange={(e) => {
              setStage(e.currentTarget.value as PipelineStage | "");
              resetPage();
            }}
          >
            {stageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            ariaLabel="Filter by practice area"
            value={practiceAreaId}
            onChange={(e) => {
              setPracticeAreaId(e.currentTarget.value);
              resetPage();
            }}
          >
            <option value="">All practice areas</option>
            {(practiceAreas ?? []).map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            ariaLabel="Filter by source"
            value={source}
            onChange={(e) => {
              setSource(e.currentTarget.value as LeadSource | "");
              resetPage();
            }}
          >
            <option value="">All sources</option>
            {(Object.entries(sourceLabels) as [LeadSource, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </FilterSelect>
        </HStack>

        <Text m="0" color="fg.muted" fontSize="11px">
          {isLoading ? "Loading…" : `${total} ${total === 1 ? "record" : "records"}`}
        </Text>
      </Flex>

      <Box
        overflowX="auto"
        border="1px solid"
        borderColor="border"
        borderRadius="10px"
        bg="bg"
      >
        <Table.Root minW="900px">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              {[
                "CLIENT / LEAD",
                "PRACTICE AREA",
                "STAGE",
                "SOURCE",
                "RECEIVED",
                "ACTION",
              ].map((h) => (
                <Table.ColumnHeader
                  key={h}
                  h="36px"
                  px="16px"
                  color="fg.muted"
                  fontSize="10px"
                  fontWeight="500"
                  textTransform="uppercase"
                  letterSpacing="0.04em"
                >
                  {h}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <Table.Cell px="16px" py="24px" color="fg.muted" fontSize="13px">
                  Loading…
                </Table.Cell>
              </Table.Row>
            ) : leads.length === 0 ? (
              <Table.Row>
                <Table.Cell px="16px" py="24px" color="fg.muted" fontSize="13px">
                  No leads found.
                </Table.Cell>
              </Table.Row>
            ) : (
              leads.map((lead) => {
                const practiceAreaName = lead.practiceAreaId
                  ? (practiceAreaMap.get(lead.practiceAreaId) ?? "—")
                  : "—";
                const isPrimary =
                  lead.pipelineStage === "case_opening";

                return (
                  <Table.Row key={lead.id}>
                    <Table.Cell
                      px="16px"
                      py="10px"
                      borderBottom="1px solid"
                      borderColor="border.subtle"
                    >
                      <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                        {lead.name}
                      </Text>
                      <Text m="0" color="fg.muted" fontSize="11px">
                        {lead.email}
                      </Text>
                    </Table.Cell>

                    <Table.Cell
                      px="16px"
                      py="10px"
                      borderBottom="1px solid"
                      borderColor="border.subtle"
                    >
                      {lead.practiceAreaId ? (
                        <PracticePill tone="neutral">{practiceAreaName}</PracticePill>
                      ) : (
                        <Text m="0" color="fg.muted" fontSize="13px">—</Text>
                      )}
                    </Table.Cell>

                    <Table.Cell
                      px="16px"
                      py="10px"
                      borderBottom="1px solid"
                      borderColor="border.subtle"
                    >
                      <PracticePill tone={stageTone[lead.pipelineStage]}>
                        {stageLabel[lead.pipelineStage]}
                      </PracticePill>
                    </Table.Cell>

                    <Table.Cell
                      px="16px"
                      py="10px"
                      color="fg.muted"
                      fontSize="13px"
                      borderBottom="1px solid"
                      borderColor="border.subtle"
                    >
                      {sourceLabels[lead.source]}
                    </Table.Cell>

                    <Table.Cell
                      px="16px"
                      py="10px"
                      color="fg.muted"
                      fontSize="13px"
                      borderBottom="1px solid"
                      borderColor="border.subtle"
                    >
                      {formatReceivedDate(lead.receivedAt)}
                    </Table.Cell>

                    <Table.Cell
                      px="16px"
                      py="10px"
                      borderBottom="1px solid"
                      borderColor="border.subtle"
                    >
                      {isPrimary ? (
                        <BrandButton h="28px" minH="28px" px="12px" fontSize="12px">
                          Review
                        </BrandButton>
                      ) : (
                        <OutlineButton h="28px" minH="28px" px="12px" fontSize="12px">
                          View
                        </OutlineButton>
                      )}
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      {totalPages > 1 || total > 0 ? (
        <Flex align="center" justify="space-between" mt="16px" wrap="wrap" gap="10px">
          <Text m="0" color="fg.muted" fontSize="12px">
            {total === 0
              ? "No records"
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} records`}
          </Text>

          <HStack gap="4px">
            <PageButton
              aria-label="Previous page"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} />
            </PageButton>

            {buildPageRange(page, totalPages).map((entry, i) =>
              entry === "..." ? (
                <Text
                  key={`ellipsis-${i}`}
                  m="0"
                  color="fg.muted"
                  fontSize="13px"
                  px="4px"
                >
                  …
                </Text>
              ) : (
                <PageButton
                  key={entry}
                  active={entry === page}
                  onClick={() => setPage(entry as number)}
                >
                  {entry}
                </PageButton>
              ),
            )}

            <PageButton
              aria-label="Next page"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={14} />
            </PageButton>
          </HStack>
        </Flex>
      ) : null}
    </>
  );
}

function FilterSelect({
  ariaLabel,
  value,
  onChange,
  children,
}: {
  ariaLabel: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <chakra.select
      aria-label={ariaLabel}
      value={value}
      onChange={onChange}
      h="34px"
      minW="148px"
      px="10px"
      border="1px solid"
      borderColor="border"
      borderRadius="7px"
      bg="bg"
      color="fg"
      fontSize="13px"
      cursor="pointer"
    >
      {children}
    </chakra.select>
  );
}

function PageButton({
  children,
  active,
  disabled,
  onClick,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
}) {
  return (
    <chakra.button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      display="grid"
      placeItems="center"
      minW="30px"
      h="30px"
      px="6px"
      border="1px solid"
      borderColor={active ? "brand.solid" : "border"}
      borderRadius="6px"
      bg={active ? "brand.solid" : "bg"}
      color={active ? "brand.fg" : disabled ? "fg.subtle" : "fg"}
      fontSize="12px"
      fontWeight={active ? "500" : "400"}
      cursor={disabled ? "not-allowed" : "pointer"}
      opacity={disabled ? 0.5 : 1}
    >
      {children}
    </chakra.button>
  );
}

function buildPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3)
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}
