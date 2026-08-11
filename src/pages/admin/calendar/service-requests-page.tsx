import { PageTitle } from "@/components/layout/shared/nav-context";
import { Badge, Box, Flex, Table, Text } from "@chakra-ui/react";
import { AlertTriangle, CalendarClock, Send } from "lucide-react";

const SUMMARY_CARDS = [
  {
    key: "submitted",
    label: "Submitted this month",
    value: 4,
    subtext: "3 pending response",
    icon: Send,
    iconBg: "green.100",
    iconColor: "green.600",
    _dark: { iconBg: "green.900", iconColor: "green.300" },
  },
  {
    key: "auto-scheduled",
    label: "Auto-scheduled",
    value: 7,
    subtext: "Next batch: Jul 15",
    icon: CalendarClock,
    iconBg: "blue.100",
    iconColor: "blue.600",
    _dark: { iconBg: "blue.900", iconColor: "blue.300" },
  },
  {
    key: "overdue",
    label: "Cases overdue",
    value: 3,
    subtext: "Outside processing window",
    icon: AlertTriangle,
    iconBg: "red.100",
    iconColor: "red.500",
    _dark: { iconBg: "red.900", iconColor: "red.300" },
    valueColor: "red.500",
  },
];

const SERVICE_REQUESTS = [
  {
    caseName: "Emeka Eze",
    caseNumber: "ORV-2026-0087",
    form: "I-589",
    filedDate: "Mar 12, 2026",
    processingWindow: "180 days",
    daysOverdue: 41,
    lastRequest: "Jun 10, 2026",
    nextRequest: "Jul 10, 2026",
    status: "Response pending",
  },
  {
    caseName: "Ibrahim Al-Amin",
    caseNumber: "ORV-2026-0076",
    form: "DACA Renewal",
    filedDate: "Jan 5, 2026",
    processingWindow: "120 days",
    daysOverdue: 29,
    lastRequest: "Jun 8, 2026",
    nextRequest: "Jul 8, 2026",
    status: "Response pending",
  },
  {
    caseName: "James Okonkwo",
    caseNumber: "ORV-2026-0139",
    form: "I-130",
    filedDate: "Feb 20, 2026",
    processingWindow: "120 days",
    daysOverdue: 15,
    lastRequest: "Jun 14, 2026",
    nextRequest: "Jul 14, 2026",
    status: "Submitted",
  },
];

const statusConfig: Record<
  string,
  { color: string; bg: string; _dark?: { bg: string; color: string } }
> = {
  "Response pending": {
    color: "orange.700",
    bg: "orange.50",
    _dark: { bg: "orange.950", color: "orange.300" },
  },
  Submitted: {
    color: "green.700",
    bg: "green.50",
    _dark: { bg: "green.950", color: "green.300" },
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

export function ServiceRequestsPage() {
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
          <PageTitle>
            <Text
              as="h1"
              m="0"
              color="fg"
              fontSize={{ base: "18px", md: "24px" }}
              fontWeight="600"
              lineHeight="1.2"
            >
              Service requests
            </Text>
          </PageTitle>
          <Text
            m={{ base: "4px 0 0", md: "8px 0 0" }}
            color="fg.muted"
            fontSize={{ base: "13px", md: "14px" }}
          >
            Automated service requests for cases outside government processing
            times
          </Text>
        </Box>
      </Flex>

      {/* ── Summary cards ── */}
      <Flex mt={{ base: "12px", md: "16px" }} gap="16px" flexWrap="wrap">
        {SUMMARY_CARDS.map((card) => (
          <Box
            key={card.key}
            flex="1 1 100%"
            md={{ flex: "1 1 calc(33.333% - 11px)" }}
            p="16px 20px"
            border="1px solid"
            borderColor="border"
            borderRadius="8px"
            bg="bg"
          >
            <Flex justify="space-between" align="flex-start">
              <Box>
                <Text
                  fontSize="11px"
                  fontWeight={600}
                  textTransform="uppercase"
                  letterSpacing="0.04em"
                  color="fg.muted"
                >
                  {card.label}
                </Text>
                <Text
                  fontSize="28px"
                  fontWeight={700}
                  color={card.valueColor ?? "fg"}
                  mt="4px"
                  lineHeight={1.2}
                >
                  {card.value}
                </Text>
                <Text fontSize="13px" color="fg.muted" mt="4px">
                  {card.subtext}
                </Text>
              </Box>
              <Box
                w="40px"
                h="40px"
                borderRadius="8px"
                bg={card.iconBg}
                display="flex"
                alignItems="center"
                justifyContent="center"
                _dark={{ bg: card._dark?.iconBg }}
              >
                <card.icon size={18} />
              </Box>
            </Flex>
          </Box>
        ))}
      </Flex>

      {/* ── Table ── */}
      <Box
        mt={{ base: "16px", md: "20px" }}
        mb="24px"
        border="1px solid"
        borderColor="border"
        borderRadius="8px"
        bg="bg"
        overflow="hidden"
      >
        <Box overflowX="auto">
          <Table.Root size="sm" minW="800px">
            <Table.Header>
              <Table.Row bg="bg.subtle">
                {[
                  "Case",
                  "Form",
                  "Filed Date",
                  "Processing Window",
                  "Days Overdue",
                  "Last Request",
                  "Next Request",
                  "Status",
                ].map((col) => (
                  <Table.ColumnHeader key={col} {...thStyle}>
                    {col}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {SERVICE_REQUESTS.map((req, i) => (
                <Table.Row
                  key={i}
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                  _last={{ borderBottom: "none" }}
                >
                  <Table.Cell {...tdStyle}>
                    <Text fontSize="13px" fontWeight={500} color="fg">
                      {req.caseName}
                    </Text>
                    <Text fontSize="12px" color="fg.muted">
                      {req.caseNumber}
                    </Text>
                  </Table.Cell>
                  <Table.Cell {...tdStyle}>{req.form}</Table.Cell>
                  <Table.Cell {...tdStyle}>{req.filedDate}</Table.Cell>
                  <Table.Cell {...tdStyle}>{req.processingWindow}</Table.Cell>
                  <Table.Cell {...tdStyle}>
                    <Text fontSize="13px" fontWeight={600} color="red.500">
                      {req.daysOverdue} days
                    </Text>
                  </Table.Cell>
                  <Table.Cell {...tdStyle}>{req.lastRequest}</Table.Cell>
                  <Table.Cell {...tdStyle}>{req.nextRequest}</Table.Cell>
                  <Table.Cell py="12px" px="12px">
                    <Badge
                      {...(statusConfig[req.status] ?? {
                        color: "fg.muted",
                        bg: "bg.subtle",
                      })}
                      px="8px"
                      py="2px"
                      borderRadius="4px"
                      fontSize="12px"
                      fontWeight={500}
                    >
                      {req.status}
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
