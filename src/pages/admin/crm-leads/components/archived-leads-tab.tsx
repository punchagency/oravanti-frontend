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
import { OutlineButton, PracticePill } from "@/components/ui/intake-ui";
import { formatReceivedDate, sourceLabels, type PipelineStage } from "@/api/leads";
import { useLeads } from "@/hooks/use-leads";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
import type { PublicPracticeArea } from "@/pages/contractor-sign-up/types";

const archiveSummary = [
  {
    label: "DECLINED (CONFLICT)",
    count: "—",
    color: "#b00020",
    note: "ABA conflict of interest",
  },
  {
    label: "UNRESPONSIVE",
    count: "—",
    color: "#1a1a1a",
    note: "No response after 3 reminders",
  },
  {
    label: "WITHDRAWN",
    count: "—",
    color: "#534AB7",
    note: "Client withdrew enquiry",
  },
] as const;

const stageLabel: Record<PipelineStage, string> = {
  lead_inbox: "New lead",
  conflict_check: "Conflict check",
  questionnaire: "Questionnaire",
  consultation: "Consultation",
  fee_agreement: "Fee agreement",
  case_opening: "Case opening",
};

function buildPracticeAreaMap(areas: PublicPracticeArea[]) {
  const map = new Map<string, string>();
  for (const area of areas) {
    map.set(area.id, area.name);
  }
  return map;
}

export function ArchivedLeadsTab() {
  const [query, setQuery] = useState("");

  const { data, isLoading } = useLeads({
    status: "archived",
    search: query || undefined,
  });

  const { data: practiceAreas } = usePublicPracticeAreas();
  const practiceAreaMap = useMemo(
    () => buildPracticeAreaMap(practiceAreas ?? []),
    [practiceAreas],
  );

  const leads = data?.leads ?? [];

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

      <Flex
        align="center"
        justify="space-between"
        gap="16px"
        mb="16px"
        wrap="wrap"
      >
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
            aria-label="Search archived leads"
            placeholder="Search archived leads..."
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

        <Text m="0" color="fg.muted" fontSize="11px">
          {isLoading ? "Loading…" : `${leads.length} archived`}
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
        <Table.Root minW="700px">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              {[
                "NAME / EMAIL",
                "PRACTICE AREA",
                "STAGE AT ARCHIVE",
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
                  No archived leads.
                </Table.Cell>
              </Table.Row>
            ) : (
              leads.map((lead) => (
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
                      <PracticePill tone="neutral">
                        {practiceAreaMap.get(lead.practiceAreaId) ?? "—"}
                      </PracticePill>
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
                    <PracticePill tone="neutral">
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
                    <OutlineButton h="28px" minH="28px" px="12px" fontSize="12px" disabled>
                      Restore
                    </OutlineButton>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
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
