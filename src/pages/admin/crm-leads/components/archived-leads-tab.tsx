import {
  Box,
  Flex,
  Grid,
  HStack,
  Input,
  Table,
  Text,
  chakra,
} from "@chakra-ui/react";
import { Info, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  OutlineButton,
  PracticePill,
} from "@/components/ui/intake-ui";
import { archiveReasons, archivedLeads, practiceAreas } from "../data";

const archiveSummary = [
  {
    label: "DECLINED (CONFLICT)",
    count: 8,
    color: "#b00020",
    note: "ABA conflict of interest",
  },
  {
    label: "UNRESPONSIVE",
    count: 14,
    color: "#1a1a1a",
    note: "No response after 3 reminders",
  },
  {
    label: "WITHDRAWN",
    count: 6,
    color: "#534AB7",
    note: "Client withdrew enquiry",
  },
] as const;

export function ArchivedLeadsTab() {
  const [query, setQuery] = useState("");
  const [reason, setReason] = useState("All reasons");
  const [practiceArea, setPracticeArea] = useState("All practice areas");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return archivedLeads.filter((lead) => {
      if (
        q &&
        !lead.name.toLowerCase().includes(q) &&
        !lead.email.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (reason !== "All reasons" && lead.archiveReason !== reason) return false;
      if (practiceArea !== "All practice areas" && lead.practiceArea !== practiceArea)
        return false;
      return true;
    });
  }, [query, reason, practiceArea]);

  return (
    <Box mt="20px">
      <Grid
        templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
        gap="14px"
        mb="24px"
      >
        {archiveSummary.map((item) => (
          <Box
            key={item.label}
            border="1px solid"
            borderColor="border"
            borderRadius="10px"
            bg="bg"
            p="16px 18px"
          >
            <Text
              m="0 0 4px"
              color="fg.muted"
              fontSize="10px"
              fontWeight="500"
              textTransform="uppercase"
              letterSpacing="0.04em"
            >
              {item.label}
            </Text>
            <Text
              m="0 0 4px"
              color={item.color}
              fontSize="28px"
              fontWeight="600"
              lineHeight="1.1"
            >
              {item.count}
            </Text>
            <Text m="0" color="fg.muted" fontSize="11px">
              {item.note}
            </Text>
          </Box>
        ))}
      </Grid>

      <Flex align="center" justify="space-between" gap="16px" mb="16px" wrap="wrap">
        <HStack gap="10px" wrap="wrap">
          <HStack
            gap="8px"
            h="34px"
            minW="240px"
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
              onChange={(e) => setQuery(e.target.value)}
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
            ariaLabel="Filter by reason"
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            options={archiveReasons}
          />
          <FilterSelect
            ariaLabel="Filter by practice area"
            value={practiceArea}
            onChange={(e) => setPracticeArea(e.currentTarget.value)}
            options={practiceAreas}
          />
        </HStack>

        <Text m="0" color="fg.muted" fontSize="11px">
          {filtered.length} archived
        </Text>
      </Flex>

      <Box
        overflowX="auto"
        border="1px solid"
        borderColor="border"
        borderRadius="10px"
        bg="bg"
        mb="16px"
      >
        <Table.Root minW="760px">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              {[
                "NAME / EMAIL",
                "PRACTICE AREA",
                "ARCHIVE REASON",
                "ARCHIVED BY",
                "ARCHIVE DATE",
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
            {filtered.map((lead) => (
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
                  <PracticePill tone={lead.archiveReasonTone}>
                    {lead.archiveReason}
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
                  {lead.archivedBy}
                </Table.Cell>

                <Table.Cell
                  px="16px"
                  py="10px"
                  color="fg.muted"
                  fontSize="13px"
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                >
                  {lead.archiveDate}
                </Table.Cell>

                <Table.Cell
                  px="16px"
                  py="10px"
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                >
                  <OutlineButton h="28px" minH="28px" px="12px" fontSize="12px">
                    Restore
                  </OutlineButton>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      <HStack gap="8px" color="fg.muted">
        <Info size={13} />
        <Text m="0" fontSize="12px" lineHeight="1.5">
          Archived leads are retained for 24 months in compliance with ABA
          recordkeeping guidelines. Conflict-of-interest declines are logged
          permanently in the audit trail.
        </Text>
      </HStack>
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
