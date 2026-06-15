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
} from "@/pages/admin/intake/components/intake-ui";
import {
  leadSources,
  pipelineLeads,
  pipelineStages,
  practiceAreas,
} from "../data";

const PAGE_SIZE = 10;

export function PipelineTab() {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("All stages");
  const [practiceArea, setPracticeArea] = useState("All practice areas");
  const [source, setSource] = useState("All sources");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pipelineLeads.filter((lead) => {
      if (
        q &&
        !lead.name.toLowerCase().includes(q) &&
        !lead.email.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (stage !== "All stages" && lead.stage !== stage) return false;
      if (practiceArea !== "All practice areas" && lead.practiceArea !== practiceArea)
        return false;
      if (source !== "All sources" && lead.source !== source) return false;
      return true;
    });
  }, [query, stage, practiceArea, source]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  function handleFilterChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      setter(e.currentTarget.value);
      setPage(1);
    };
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
              aria-label="Search clients and leads"
              placeholder="Search clients and leads..."
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
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
            onChange={handleFilterChange(setStage)}
            options={pipelineStages}
          />
          <FilterSelect
            ariaLabel="Filter by practice area"
            value={practiceArea}
            onChange={handleFilterChange(setPracticeArea)}
            options={practiceAreas}
          />
          <FilterSelect
            ariaLabel="Filter by source"
            value={source}
            onChange={handleFilterChange(setSource)}
            options={leadSources}
          />
        </HStack>

        <Text m="0" color="fg.muted" fontSize="11px">
          {filtered.length} {filtered.length === 1 ? "record" : "records"}
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
                "ASSIGNED TO",
                "LAST ACTIVITY",
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
            {pageItems.map((lead) => (
              <Table.Row key={lead.email}>
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
                  <PracticePill tone={lead.practiceTone}>
                    {lead.practiceArea}
                  </PracticePill>
                </Table.Cell>

                <Table.Cell
                  px="16px"
                  py="10px"
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                >
                  <PracticePill tone={lead.stageTone}>{lead.stage}</PracticePill>
                </Table.Cell>

                <Table.Cell
                  px="16px"
                  py="10px"
                  color="fg.muted"
                  fontSize="13px"
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                >
                  {lead.source}
                </Table.Cell>

                <Table.Cell
                  px="16px"
                  py="10px"
                  color="fg.muted"
                  fontSize="13px"
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                >
                  {lead.assignedTo}
                </Table.Cell>

                <Table.Cell
                  px="16px"
                  py="10px"
                  color="fg.muted"
                  fontSize="13px"
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                >
                  {lead.lastActivity}
                </Table.Cell>

                <Table.Cell
                  px="16px"
                  py="10px"
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                >
                  {lead.actionPrimary ? (
                    <BrandButton h="28px" minH="28px" px="12px" fontSize="12px">
                      {lead.actionLabel}
                    </BrandButton>
                  ) : (
                    <OutlineButton h="28px" minH="28px" px="12px" fontSize="12px">
                      {lead.actionLabel}
                    </OutlineButton>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {totalPages > 1 || filtered.length > 0 ? (
        <Flex align="center" justify="space-between" mt="16px" wrap="wrap" gap="10px">
          <Text m="0" color="fg.muted" fontSize="12px">
            Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length} records
          </Text>

          <HStack gap="4px">
            <PageButton
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} />
            </PageButton>

            {buildPageRange(currentPage, totalPages).map((entry, i) =>
              entry === "..." ? (
                <Text key={`ellipsis-${i}`} m="0" color="fg.muted" fontSize="13px" px="4px">
                  …
                </Text>
              ) : (
                <PageButton
                  key={entry}
                  active={entry === currentPage}
                  onClick={() => setPage(entry as number)}
                >
                  {entry}
                </PageButton>
              ),
            )}

            <PageButton
              aria-label="Next page"
              disabled={currentPage === totalPages}
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
  options,
}: {
  ariaLabel: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: readonly string[];
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
      {options.map((opt) => (
        <option key={opt}>{opt}</option>
      ))}
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
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}
