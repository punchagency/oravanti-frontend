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
import {
  OutlineButton,
  PracticePill,
} from "@/components/ui/intake-ui";
import { educationLeads, educationTiers, practiceAreas } from "../data";

const tierCards = [
  {
    label: "Free tier",
    description: "Legal basics, rights, banking, housing",
    leads: 7,
    pct: 43,
    barColor: "#9ca3af",
    icon: <BookOpen size={14} />,
  },
  {
    label: "Tier 2",
    description: "Business formation, credit building",
    leads: 6,
    pct: 50,
    barColor: "#d18400",
    icon: <TrendingUp size={14} />,
  },
  {
    label: "Tier 3",
    description: "Investment, EB-5 / E-2 pathways",
    leads: 5,
    pct: 60,
    barColor: "#9333ea",
    icon: <Star size={14} />,
  },
] as const;

export function EducationFlywheelTab() {
  const [query, setQuery] = useState("");
  const [practiceArea, setPracticeArea] = useState("All practice areas");
  const [tier, setTier] = useState("All tiers");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return educationLeads.filter((lead) => {
      if (
        q &&
        !lead.name.toLowerCase().includes(q) &&
        !lead.email.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (practiceArea !== "All practice areas" && lead.practiceArea !== practiceArea)
        return false;
      if (
        tier !== "All tiers" &&
        !lead.educationCompleted.toLowerCase().startsWith(tier.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [query, practiceArea, tier]);

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
          These leads discovered Oravanti through the free legal education platform
          and were routed to your firm based on their practice area interest. They
          tend to convert at a higher rate because they arrive already informed.
        </Text>
      </Box>

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
            ariaLabel="Filter by practice area"
            value={practiceArea}
            onChange={(e) => setPracticeArea(e.currentTarget.value)}
            options={practiceAreas}
          />
          <FilterSelect
            ariaLabel="Filter by tier"
            value={tier}
            onChange={(e) => setTier(e.currentTarget.value)}
            options={educationTiers}
          />
        </HStack>

        <Text m="0" color="fg.muted" fontSize="11px">
          {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
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
        <Table.Root minW="760px">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              {[
                "NAME / EMAIL",
                "PRACTICE AREA",
                "EDUCATION COMPLETED",
                "ASSIGNED TO",
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
                  color="fg"
                  fontSize="13px"
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                >
                  {lead.educationCompleted}
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
                  {lead.received}
                </Table.Cell>

                <Table.Cell
                  px="16px"
                  py="10px"
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                >
                  <OutlineButton h="28px" minH="28px" px="12px" fontSize="12px">
                    View case
                  </OutlineButton>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      <Grid
        templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
        gap="14px"
      >
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

            <Flex align="baseline" gap="8px" mb="8px">
              <Text m="0" color="fg" fontSize="20px" fontWeight="600">
                {card.leads} leads
              </Text>
              <Text m="0" color="fg.muted" fontSize="11px">
                {card.pct}% to active client
              </Text>
            </Flex>

            <Box h="4px" borderRadius="999px" bg="bg.subtle">
              <Box
                h="full"
                borderRadius="999px"
                bg={card.barColor}
                w={`${card.pct}%`}
              />
            </Box>
          </Box>
        ))}
      </Grid>
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
