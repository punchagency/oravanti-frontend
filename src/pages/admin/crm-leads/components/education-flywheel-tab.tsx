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
import { BookOpen, Search, Star, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { OutlineButton, PracticePill } from "@/components/ui/intake-ui";
import { formatReceivedDate } from "@/api/leads";
import { useLeads } from "@/hooks/use-leads";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
import type { PublicPracticeArea } from "@/pages/contractor-sign-up/types";

const tierCards = [
  {
    label: "Free tier",
    description: "Legal basics, rights, banking, housing",
    leads: "—",
    pct: null,
    barColor: "#9ca3af",
    icon: <BookOpen size={14} />,
  },
  {
    label: "Tier 2",
    description: "Business formation, credit building",
    leads: "—",
    pct: null,
    barColor: "#d18400",
    icon: <TrendingUp size={14} />,
  },
  {
    label: "Tier 3",
    description: "Investment, EB-5 / E-2 pathways",
    leads: "—",
    pct: null,
    barColor: "#9333ea",
    icon: <Star size={14} />,
  },
] as const;

function buildPracticeAreaMap(areas: PublicPracticeArea[]) {
  const map = new Map<string, string>();
  for (const area of areas) {
    map.set(area.id, area.name);
  }
  return map;
}

export function EducationFlywheelTab() {
  const [query, setQuery] = useState("");
  const [practiceAreaId, setPracticeAreaId] = useState("");

  const { data: practiceAreas } = usePublicPracticeAreas();
  const practiceAreaMap = useMemo(
    () => buildPracticeAreaMap(practiceAreas ?? []),
    [practiceAreas],
  );

  const { data, isLoading } = useLeads({
    source: "education_flywheel",
    practiceAreaName: practiceAreaMap.get(practiceAreaId) ?? undefined,
    search: query || undefined,
  });

  const leads = data?.leads ?? [];

  return (
    <Box mt="20px">
      <Box
        border="1px solid"
        borderColor="brand.200"
        borderRadius="8px"
        bg="brand.50"
        p="14px 16px"
        mb="20px"
      >
        <Text m="0 0 4px" color="brand.800" fontSize="13px" fontWeight="500">
          Education platform leads
        </Text>
        <Text m="0" color="brand.700" fontSize="12px" lineHeight="1.5">
          These leads discovered Oravanti through the free legal education
          platform and were routed to your firm based on their practice area
          interest. They tend to convert at a higher rate because they arrive
          already informed.
        </Text>
      </Box>

      <Flex
        align="center"
        justify="space-between"
        gap="16px"
        mb="16px"
        wrap="wrap"
      >
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
              aria-label="Search education flywheel leads"
              placeholder="Search by name or email..."
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

          <chakra.select
            aria-label="Filter by practice area"
            value={practiceAreaId}
            onChange={(e) => setPracticeAreaId(e.currentTarget.value)}
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
            <option value="">All practice areas</option>
            {(practiceAreas ?? []).map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </chakra.select>
        </HStack>

        <Text m="0" color="fg.muted" fontSize="11px">
          {isLoading ? "Loading…" : `${leads.length} ${leads.length === 1 ? "lead" : "leads"}`}
        </Text>
      </Flex>

      <Box
        overflowX="auto"
        border="1px solid"
        borderColor="border"
        borderRadius="10px"
        bg="bg"
        mb="20px"
      >
        <Table.Root minW="660px">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              {[
                "NAME / EMAIL",
                "PRACTICE AREA",
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
                  No education flywheel leads.
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
                      <PracticePill tone="success">
                        {practiceAreaMap.get(lead.practiceAreaId) ?? "—"}
                      </PracticePill>
                    ) : (
                      <Text m="0" color="fg.muted" fontSize="13px">—</Text>
                    )}
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
                    <OutlineButton h="28px" minH="28px" px="12px" fontSize="12px">
                      View
                    </OutlineButton>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="14px">
        {tierCards.map((card) => (
          <Box
            key={card.label}
            border="1px solid"
            borderColor="border"
            borderRadius="10px"
            bg="bg"
            p="16px 18px"
          >
            <HStack gap="8px" mb="6px">
              <Box color="fg.muted">{card.icon}</Box>
              <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                {card.label}
              </Text>
            </HStack>
            <Text m="0 0 12px" color="fg.muted" fontSize="11px">
              {card.description}
            </Text>
            <Text m="0" color="fg.muted" fontSize="13px">
              {card.leads} leads
            </Text>
          </Box>
        ))}
      </Grid>
    </Box>
  );
}
