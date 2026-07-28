import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Table,
  Text,
} from "@chakra-ui/react";
import { Info, Plus } from "lucide-react";

const DEADLINE_RULES = [
  {
    trigger: "MCH added",
    rule: "Filing submitted 15+ days before MCH",
    deadline: "Response deadline = filing date + 10 days",
    priority: "high",
  },
  {
    trigger: "MCH added",
    rule: "Filing submitted < 15 days before MCH",
    deadline: "Note: response may be oral at MCH",
    priority: "medium",
  },
  {
    trigger: "IH added",
    rule: "Non-detained respondent",
    deadline: "Filing deadline = 30 days before hearing",
    priority: "high",
  },
  {
    trigger: "IH added",
    rule: "Pre-hearing filing logged",
    deadline: "Response deadline = filing date + 10 days",
    priority: "high",
  },
  {
    trigger: "IH added",
    rule: "IJ orders document submission",
    deadline: "Configurable: 30 or 60 days before hearing",
    priority: "high",
  },
  {
    trigger: "Denial received",
    rule: "Removal defense case",
    deadline: "BIA appeal window: 30 days from denial",
    priority: "critical",
  },
  {
    trigger: "Denial received",
    rule: "Motion eligible",
    deadline: "Motion to reopen: 90 days from final order",
    priority: "critical",
  },
  {
    trigger: "Detained toggle ON",
    rule: "Active case",
    deadline: "ICE location check: every 24 hours",
    priority: "high",
  },
  {
    trigger: "Processing time exceeded",
    rule: "USCIS filing",
    deadline: "Service request: immediate + every 30 days",
    priority: "medium",
  },
];

const priorityConfig: Record<
  string,
  { color: string; bg: string; _dark?: { bg: string; color: string } }
> = {
  high: {
    color: "orange.700",
    bg: "orange.50",
    _dark: { bg: "orange.950", color: "orange.300" },
  },
  medium: {
    color: "yellow.700",
    bg: "yellow.50",
    _dark: { bg: "yellow.950", color: "yellow.300" },
  },
  critical: {
    color: "red.700",
    bg: "red.50",
    _dark: { bg: "red.950", color: "red.300" },
  },
};

const thStyle = {
  fontWeight: 600,
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  color: "fg.muted",
  py: "10px",
  px: "12px",
  whiteSpace: "nowrap" as const,
};

const tdStyle = {
  py: "12px",
  px: "12px",
  fontSize: "13px",
  color: "fg",
  whiteSpace: "nowrap" as const,
};

export function DeadlineRulesPage() {
  return (
    <Box bg="bg" minH="100vh">
      {/* ── Header ── */}
      <Flex
        as="header"
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "center" }}
        justify="space-between"
        gap={{ base: "12px", md: "24px" }}
        py={{ base: "12px", md: "20px" }}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Box flex="1">
          <Text
            as="h1"
            m="0"
            color="fg"
            fontSize={{ base: "18px", md: "24px" }}
            fontWeight="600"
            lineHeight="1.2"
          >
            Deadline rules
          </Text>
          <Text
            m={{ base: "4px 0 0", md: "8px 0 0" }}
            color="fg.muted"
            fontSize={{ base: "13px", md: "14px" }}
          >
            Automatic deadline cascades for hearings and filings
          </Text>
        </Box>
        <Button
          size="sm"
          h="36px"
          px="16px"
          borderRadius="7px"
          fontWeight={600}
          fontSize="13px"
          bg="brand.solid"
          color="brand.fg"
          _hover={{ bg: "brand.emphasized" }}
          flexShrink={0}
        >
          <Plus size={14} />
          Add custom rule
        </Button>
      </Flex>

      {/* ── Info banner ── */}
      <Box
        mt={{ base: "12px", md: "16px" }}
        p="12px 16px"
        bg="blue.50"
        border="1px solid"
        borderColor="blue.200"
        borderRadius="8px"
        _dark={{ bg: "blue.950", borderColor: "blue.800" }}
      >
        <HStack gap="8px" align="center">
          <Box flexShrink={0} lineHeight={0}>
            <Info size={16} style={{ color: "#3b82f6" }} />
          </Box>
          <Text fontSize="13px" color="fg">
            These rules fire automatically when events are added to the
            calendar. Changing a hearing date recalculates all dependent
            deadlines.
          </Text>
        </HStack>
      </Box>

      {/* ── Table ── */}
      <Box
        mt={{ base: "12px", md: "16px" }}
        mb="24px"
        border="1px solid"
        borderColor="border"
        borderRadius="8px"
        bg="bg"
        overflow="hidden"
      >
        <Box overflowX="auto">
          <Table.Root size="sm" minW="600px">
            <Table.Header>
              <Table.Row bg="bg.subtle">
                {["Trigger Event", "Rule", "Deadline Added", "Priority"].map(
                  (col) => (
                    <Table.ColumnHeader
                      key={col}
                      {...thStyle}
                    >
                      {col}
                    </Table.ColumnHeader>
                  ),
                )}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {DEADLINE_RULES.map((rule, i) => (
                <Table.Row
                  key={i}
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                  _last={{ borderBottom: "none" }}
                >
                  <Table.Cell {...tdStyle} fontWeight={500}>
                    {rule.trigger}
                  </Table.Cell>
                  <Table.Cell {...tdStyle}>{rule.rule}</Table.Cell>
                  <Table.Cell {...tdStyle}>{rule.deadline}</Table.Cell>
                  <Table.Cell {...tdStyle}>
                    <Badge
                      {...priorityConfig[rule.priority]}
                      px="8px"
                      py="2px"
                      borderRadius="4px"
                      fontSize="12px"
                      fontWeight={500}
                      display="inline-block"
                    >
                      {rule.priority.charAt(0).toUpperCase() + rule.priority.slice(1)}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>
    </Box>
  );
}
