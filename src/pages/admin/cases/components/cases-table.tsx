import {
  Badge,
  Box,
  Button,
  HStack,
  ScrollArea,
  Stack,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Eye } from "lucide-react";
import { getSpecialtyColors } from "@/utils/specialty-colors";

const specialtyLabelMap: Record<string, string> = {
  family: "Family law",
  business: "Business",
  estate: "Estate planning",
  employment: "Employment",
  realestate: "Real estate law",
  criminal: "Criminal defense",
  personalinjury: "Personal injury",
  immigration: "Immigration",
};

interface Case {
  id: string;
  clientName: string;
  caseRef: string;
  filingType: string;
  stage: string;
  assignedTo: string;
  deadline?: string;
  status: string;
  matttersCount?: number;
  specialty?: "immigration" | "family" | "business" | "estate" | "employment" | "realestate" | "criminal" | "personalinjury";
}

interface CasesTableProps {
  cases: Case[];
  isLoading?: boolean;
}

export const mockCases: Case[] = [
  {
    id: "1",
    clientName: "Aisha Patel",
    caseRef: "ORV-2026-0131",
    filingType: "I-485 Adjustment of Status",
    stage: "Interview scheduled",
    assignedTo: "Sandra Adeyemi",
    deadline: "Jun 22, 2026",
    status: "Interview",
    matttersCount: 1,
    specialty: "immigration",
  },
  {
    id: "2",
    clientName: "Amara Chen",
    caseRef: "ORV-2026-0142",
    filingType: "I-485 Adjustment of Status",
    stage: "USCIS Review",
    assignedTo: "Yemi Okafor",
    deadline: "—",
    status: "Active",
    matttersCount: 2,
    specialty: "immigration",
  },
  {
    id: "3",
    clientName: "Amara Chen",
    caseRef: "ORV-2026-0143",
    filingType: "I-765 Employment Authorization",
    stage: "Filed",
    assignedTo: "Yemi Okafor",
    deadline: "—",
    status: "Filed",
    matttersCount: 2,
    specialty: "immigration",
  },
  {
    id: "4",
    clientName: "Anna Kowalski",
    caseRef: "ORV-2025-0241",
    filingType: "Trust Document Generation",
    stage: "Executed",
    assignedTo: "Sarah Mitchell",
    deadline: "—",
    status: "Closed",
    specialty: "estate",
  },
  {
    id: "5",
    clientName: "Carlos Rivera",
    caseRef: "ORV-2026-0128",
    filingType: "Divorce Petition",
    stage: "Discovery",
    assignedTo: "Jennifer Lee",
    deadline: "—",
    status: "Active",
    matttersCount: 2,
    specialty: "family",
  },
  {
    id: "6",
    clientName: "Carlos Rivera",
    caseRef: "ORV-2026-0144",
    filingType: "Child Custody Agreement",
    stage: "Finalized",
    assignedTo: "Jennifer Lee",
    deadline: "—",
    status: "Filed",
    matttersCount: 2,
    specialty: "family",
  },
  {
    id: "7",
    clientName: "Chioma Okafor",
    caseRef: "ORV-2026-0054",
    filingType: "Guardianship Petition",
    stage: "Pending hearing",
    assignedTo: "Michael Chen",
    deadline: "Jul 10, 2026",
    status: "RFE",
    specialty: "family",
  },
  {
    id: "8",
    clientName: "Daniel Park",
    caseRef: "ORV-2026-0068",
    filingType: "N-400 Naturalization",
    stage: "Decision received",
    assignedTo: "Yemi Okafor",
    deadline: "—",
    status: "Closed",
    specialty: "immigration",
  },
  {
    id: "9",
    clientName: "David Kim",
    caseRef: "ORV-2026-0135",
    filingType: "Business Formation",
    stage: "Articles filed",
    assignedTo: "Robert Thompson",
    deadline: "—",
    status: "Filed",
    specialty: "business",
  },
  {
    id: "10",
    clientName: "Emeka Eze",
    caseRef: "ORV-2026-0087",
    filingType: "I-589 Asylum",
    stage: "Response due",
    assignedTo: "Sandra Adeyemi",
    deadline: "Jun 14, 2026",
    status: "RFE",
    specialty: "immigration",
  },
  {
    id: "11",
    clientName: "Fatima Diallo",
    caseRef: "ORV-2026-0121",
    filingType: "Settlement Agreement",
    stage: "Negotiation",
    assignedTo: "Patricia Williams",
    deadline: "—",
    status: "Active",
    specialty: "family",
  },
  {
    id: "12",
    clientName: "Grace Johnson",
    caseRef: "ORV-2026-0095",
    filingType: "Wrongful Termination",
    stage: "Discovery",
    assignedTo: "Robert Thompson",
    deadline: "Jul 15, 2026",
    status: "Active",
    matttersCount: 1,
    specialty: "employment",
  },
  {
    id: "13",
    clientName: "Henry Martinez",
    caseRef: "ORV-2026-0102",
    filingType: "DUI Defense",
    stage: "Trial Scheduled",
    assignedTo: "Michael Chen",
    deadline: "Aug 5, 2026",
    status: "Active",
    specialty: "criminal",
  },
  {
    id: "14",
    clientName: "Isabel Santos",
    caseRef: "ORV-2026-0089",
    filingType: "Motor Vehicle Accident",
    stage: "Settlement Negotiation",
    assignedTo: "Jennifer Lee",
    deadline: "—",
    status: "Active",
    matttersCount: 1,
    specialty: "personalinjury",
  },
  {
    id: "15",
    clientName: "James Wilson",
    caseRef: "ORV-2026-0156",
    filingType: "Commercial Lease Review",
    stage: "Document Review",
    assignedTo: "Sarah Mitchell",
    deadline: "Jun 28, 2026",
    status: "Active",
    specialty: "realestate",
  },
];

const statusColorMap: Record<
  string,
  { borderColor: string; textColor: string; bg: string }
> = {
  Interview: { borderColor: "blue.300", textColor: "blue.700", bg: "blue.50" },
  Active: { borderColor: "green.300", textColor: "green.700", bg: "green.50" },
  Filed: { borderColor: "blue.300", textColor: "blue.700", bg: "blue.50" },
  Closed: { borderColor: "gray.300", textColor: "gray.700", bg: "gray.50" },
  RFE: { borderColor: "orange.300", textColor: "orange.700", bg: "orange.50" },
  Pending: {
    borderColor: "orange.300",
    textColor: "orange.700",
    bg: "orange.50",
  },
};

const actionButtonMap: Record<string, { label: string; variant: string }> = {
  Interview: { label: "View", variant: "outline" },
  Active: { label: "View", variant: "outline" },
  Filed: { label: "View", variant: "outline" },
  Closed: { label: "View", variant: "outline" },
  RFE: { label: "Respond", variant: "solid" },
  Pending: { label: "Prepare", variant: "solid" },
};

export function CasesTable({ cases = mockCases, isLoading: _isLoading = false }: CasesTableProps) {
  return (
    <Box
      w="full"
      border="1px solid"
      borderColor="border"
      borderRadius="lg"
      overflow="hidden"
      bg="bg"
    >
      {cases.length === 0 ? (
        <VStack py={16} gap={2} textAlign="center">
          <Text color="fg.muted" textStyle="lg" fontWeight="600">
            No cases found
          </Text>
          <Text color="fg.subtle" textStyle="body-sm">
            Try adjusting your filters or search terms.
          </Text>
        </VStack>
      ) : (
        <ScrollArea.Root w="full" size="xs">
            <ScrollArea.Viewport>
              <ScrollArea.Content>
                <Table.Root size="md">
                  <Table.Header borderBottom="1px solid" borderColor="border">
                    <Table.Row bg="bg.subtle">
                    <Table.ColumnHeader
                      textStyle="body-sm"
                      fontWeight="bold"
                      color="fg.subtle"
                      pb={3}
                      whiteSpace="nowrap"
                    >
                      MATTER
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      textStyle="body-sm"
                      fontWeight="bold"
                      color="fg.subtle"
                      pb={3}
                      whiteSpace="nowrap"
                    >
                      FILING TYPE
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      textStyle="body-sm"
                      fontWeight="bold"
                      color="fg.subtle"
                      pb={3}
                      whiteSpace="nowrap"
                    >
                      STAGE
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      textStyle="body-sm"
                      fontWeight="bold"
                      color="fg.subtle"
                      pb={3}
                      whiteSpace="nowrap"
                    >
                      ASSIGNED TO
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      textStyle="body-sm"
                      fontWeight="bold"
                      color="fg.subtle"
                      pb={3}
                      whiteSpace="nowrap"
                    >
                      DEADLINE
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      textStyle="body-sm"
                      fontWeight="bold"
                      color="fg.subtle"
                      pb={3}
                      whiteSpace="nowrap"
                    >
                      STATUS
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      textStyle="body-sm"
                      fontWeight="bold"
                      color="fg.subtle"
                      pb={3}
                      whiteSpace="nowrap"
                    >
                      ACTION
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {cases.map((caseItem) => (
                    <Table.Row key={caseItem.id}>
                      <Table.Cell>
                        <Stack gap="2px">
                          <Text textStyle="body-sm" fontWeight="500" color="fg">
                            {caseItem.clientName}
                          </Text>
                          <HStack gap="6px" align="flex-start">
                            <Text textStyle="body-sm" color="fg.muted">
                              {caseItem.caseRef}
                            </Text>
                            {(() => {
                              const specialtyColors = getSpecialtyColors(
                                caseItem.specialty || "immigration"
                              );
                              const specialtyLabel =
                                specialtyLabelMap[caseItem.specialty || "immigration"];
                              return (
                                <Badge
                                  size="sm"
                                  bg={specialtyColors.bg}
                                  color={specialtyColors.text}
                                  borderRadius="md"
                                  flexShrink={0}
                                >
                                  {specialtyLabel}
                                </Badge>
                              );
                            })()}
                            {caseItem.matttersCount && (() => {
                              const matterColors = getSpecialtyColors("estate");
                              return (
                                <Badge
                                  size="sm"
                                  bg={matterColors.bg}
                                  color={matterColors.text}
                                  border="1px solid"
                                  borderColor={matterColors.border}
                                  borderRadius="sm"
                                  flexShrink={0}
                                  mt="-20px"
                                >
                                  {caseItem.matttersCount} matters
                                </Badge>
                              );
                            })()}
                          </HStack>
                        </Stack>
                      </Table.Cell>
                      <Table.Cell>
                        <Text textStyle="body-sm" color="fg">
                          {caseItem.filingType}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text textStyle="body-sm" color="fg.muted">
                          {caseItem.stage}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text textStyle="body-sm" color="fg">
                          {caseItem.assignedTo}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text
                          textStyle="body-sm"
                          fontWeight={
                            caseItem.deadline && caseItem.deadline !== "—"
                              ? "500"
                              : "400"
                          }
                          color={
                            caseItem.deadline && caseItem.deadline !== "—"
                              ? "brand.solid"
                              : "fg.muted"
                          }
                        >
                          {caseItem.deadline}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        {(() => {
                          const colors =
                            statusColorMap[caseItem.status] ||
                            statusColorMap["Closed"];
                          return (
                            <Badge
                              size="sm"
                              borderWidth="1px"
                              borderColor={colors.borderColor}
                              bg={colors.bg}
                              color={colors.textColor}
                              borderRadius="md"
                            >
                              {caseItem.status}
                            </Badge>
                          );
                        })()}
                      </Table.Cell>
                      <Table.Cell>
                        {(() => {
                          const action = actionButtonMap[caseItem.status];
                          return (
                            <Button
                              size="xs"
                              variant={action.variant === "solid" ? "solid" : "outline"}
                              bg={
                                action.variant === "solid"
                                  ? "brand.solid"
                                  : undefined
                              }
                              color={
                                action.variant === "solid"
                                  ? "brand.fg"
                                  : undefined
                              }
                              _hover={
                                action.variant === "solid"
                                  ? { bg: "brand.600" }
                                  : undefined
                              }
                            >
                              {action.variant === "outline" && (
                                <Eye size={14} />
                              )}
                              {action.label}
                            </Button>
                          );
                        })()}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="horizontal" />
          <ScrollArea.Corner />
        </ScrollArea.Root>
      )}
    </Box>
  );
}
