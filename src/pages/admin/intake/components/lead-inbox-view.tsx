import {
  Box,
  Flex,
  HStack,
  Input,
  Table,
  chakra,
} from "@chakra-ui/react";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  leadInboxLeads,
  leadSources,
  leadStatuses,
} from "../data";
import {
  AddOnWarning,
  MutedText,
  OutlineButton,
  PracticePill,
} from "./intake-ui";

export function LeadInboxView() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("All sources");
  const [status, setStatus] = useState("All statuses");

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return leadInboxLeads.filter((lead) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          lead.name,
          lead.email,
          lead.phone,
          lead.practiceArea,
          lead.source,
          lead.status,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      const matchesSource = source === "All sources" || lead.source === source;
      const matchesStatus = status === "All statuses" || lead.status === status;

      return matchesQuery && matchesSource && matchesStatus;
    });
  }, [query, source, status]);

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
        <HStack gap="10px" wrap="wrap">
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
              onChange={(event) => setQuery(event.target.value)}
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
            onChange={setSource}
            options={["All sources", ...leadSources]}
          />
          <FilterSelect
            ariaLabel="Filter by status"
            value={status}
            onChange={setStatus}
            options={["All statuses", ...leadStatuses]}
          />
        </HStack>
        <MutedText fontSize="11px">
          {filteredLeads.length} {filteredLeads.length === 1 ? "lead" : "leads"}
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
            {filteredLeads.map((lead) => (
              <Table.Row key={lead.email}>
                <Table.Cell px="16px" py="9px" borderBottom="1px solid" borderColor="border.subtle">
                  <Box color="fg" fontSize="13px" fontWeight="500">
                    {lead.name}
                  </Box>
                  <LeadStatus status={lead.status} />
                </Table.Cell>
                <Table.Cell px="16px" py="9px" color="fg.muted" fontSize="13px" borderBottom="1px solid" borderColor="border.subtle">
                  {lead.email}
                  <MutedText fontSize="11px">{lead.phone}</MutedText>
                </Table.Cell>
                <Table.Cell px="16px" py="9px" borderBottom="1px solid" borderColor="border.subtle">
                  <PracticePill tone={lead.practiceTone}>{lead.practiceArea}</PracticePill>
                  {!lead.addOnActive ? <AddOnWarning /> : null}
                </Table.Cell>
                <Table.Cell px="16px" py="9px" color="fg.muted" fontSize="13px" borderBottom="1px solid" borderColor="border.subtle">
                  {lead.source}
                </Table.Cell>
                <Table.Cell px="16px" py="9px" color="fg.muted" fontSize="13px" borderBottom="1px solid" borderColor="border.subtle">
                  {lead.received}
                </Table.Cell>
                <Table.Cell px="16px" py="9px" borderBottom="1px solid" borderColor="border.subtle">
                  <OutlineButton h="28px" minH="28px" fontSize="12px">
                    Review
                  </OutlineButton>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
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
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <chakra.select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      h="34px"
      minW="156px"
      px="10px"
      border="1px solid"
      borderColor="border"
      borderRadius="7px"
      bg="bg"
      color="fg"
      fontSize="13px"
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </chakra.select>
  );
}

function LeadStatus({ status }: { status: string }) {
  const tone = status === "New" ? "warning" : "neutral";

  return (
    <PracticePill tone={tone}>
      {status}
    </PracticePill>
  );
}
