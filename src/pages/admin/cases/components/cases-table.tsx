import {
  Badge,
  Box,
  HStack,
  IconButton,
  Menu,
  Portal,
  ScrollArea,
  Stack,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  AlertTriangle,
  Archive,
  Download,
  Ellipsis,
  Eye,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { getSpecialtyColors } from "@/utils/specialty-colors";
import { CaseDetailsDrawer } from "./case-details/drawer";

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
  caseType: string;
  stage: string;
  assignedTeam: string;
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
    caseType: "I-485 Adjustment of Status",
    stage: "Interview scheduled",
    assignedTeam: "Immigration Team A",
    deadline: "Jun 22, 2026",
    status: "Interview",
    matttersCount: 1,
    specialty: "immigration",
  },
  {
    id: "2",
    clientName: "Amara Chen",
    caseRef: "ORV-2026-0142",
    caseType: "I-485 Adjustment of Status",
    stage: "USCIS Review",
    assignedTeam: "Immigration Team B",
    deadline: "—",
    status: "Active",
    matttersCount: 2,
    specialty: "immigration",
  },
  {
    id: "3",
    clientName: "Amara Chen",
    caseRef: "ORV-2026-0143",
    caseType: "I-765 Employment Authorization",
    stage: "Filed",
    assignedTeam: "Immigration Team B",
    deadline: "—",
    status: "Filed",
    matttersCount: 2,
    specialty: "immigration",
  },
  {
    id: "4",
    clientName: "Anna Kowalski",
    caseRef: "ORV-2025-0241",
    caseType: "Trust Document Generation",
    stage: "Executed",
    assignedTeam: "Estate Team",
    deadline: "—",
    status: "Closed",
    specialty: "estate",
  },
  {
    id: "5",
    clientName: "Carlos Rivera",
    caseRef: "ORV-2026-0128",
    caseType: "Divorce Petition",
    stage: "Discovery",
    assignedTeam: "Family Team A",
    deadline: "—",
    status: "Active",
    matttersCount: 2,
    specialty: "family",
  },
  {
    id: "6",
    clientName: "Carlos Rivera",
    caseRef: "ORV-2026-0144",
    caseType: "Child Custody Agreement",
    stage: "Finalized",
    assignedTeam: "Family Team A",
    deadline: "—",
    status: "Filed",
    matttersCount: 2,
    specialty: "family",
  },
  {
    id: "7",
    clientName: "Chioma Okafor",
    caseRef: "ORV-2026-0054",
    caseType: "Guardianship Petition",
    stage: "Pending hearing",
    assignedTeam: "Family Team B",
    deadline: "Jul 10, 2026",
    status: "RFE",
    specialty: "family",
  },
  {
    id: "8",
    clientName: "Daniel Park",
    caseRef: "ORV-2026-0068",
    caseType: "N-400 Naturalization",
    stage: "Decision received",
    assignedTeam: "Immigration Team A",
    deadline: "—",
    status: "Closed",
    specialty: "immigration",
  },
  {
    id: "9",
    clientName: "David Kim",
    caseRef: "ORV-2026-0135",
    caseType: "Business Formation",
    stage: "Articles filed",
    assignedTeam: "Business Team",
    deadline: "—",
    status: "Filed",
    specialty: "business",
  },
  {
    id: "10",
    clientName: "Emeka Eze",
    caseRef: "ORV-2026-0087",
    caseType: "I-589 Asylum",
    stage: "Response due",
    assignedTeam: "Immigration Team A",
    deadline: "Jun 14, 2026",
    status: "RFE",
    specialty: "immigration",
  },
  {
    id: "11",
    clientName: "Fatima Diallo",
    caseRef: "ORV-2026-0121",
    caseType: "Settlement Agreement",
    stage: "Negotiation",
    assignedTeam: "Family Team A",
    deadline: "—",
    status: "Active",
    specialty: "family",
  },
  {
    id: "12",
    clientName: "Grace Johnson",
    caseRef: "ORV-2026-0095",
    caseType: "Wrongful Termination",
    stage: "Discovery",
    assignedTeam: "Employment Team",
    deadline: "Jul 15, 2026",
    status: "Active",
    matttersCount: 1,
    specialty: "employment",
  },
  {
    id: "13",
    clientName: "Henry Martinez",
    caseRef: "ORV-2026-0102",
    caseType: "DUI Defense",
    stage: "Trial Scheduled",
    assignedTeam: "Criminal Team",
    deadline: "Aug 5, 2026",
    status: "Active",
    specialty: "criminal",
  },
  {
    id: "14",
    clientName: "Isabel Santos",
    caseRef: "ORV-2026-0089",
    caseType: "Motor Vehicle Accident",
    stage: "Settlement Negotiation",
    assignedTeam: "PI Team A",
    deadline: "—",
    status: "Active",
    matttersCount: 1,
    specialty: "personalinjury",
  },
  {
    id: "15",
    clientName: "James Wilson",
    caseRef: "ORV-2026-0156",
    caseType: "Commercial Lease Review",
    stage: "Document Review",
    assignedTeam: "Real Estate Team",
    deadline: "Jun 28, 2026",
    status: "Active",
    specialty: "realestate",
  },
];

const statusColorMap: Record<
  string,
  { borderColor: string; textColor: string; bg: string }
> = {
  Interview: { borderColor: "brand.emphasized", textColor: "brand.fg", bg: "brand.subtle" },
  Active: { borderColor: "brand.emphasized", textColor: "brand.fg", bg: "brand.subtle" },
  Filed: { borderColor: "brand.emphasized", textColor: "brand.fg", bg: "brand.subtle" },
  Closed: { borderColor: "border", textColor: "fg.muted", bg: "bg.subtle" },
  RFE: { borderColor: "brand.solid", textColor: "brand.contrast", bg: "brand.solid" },
  Pending: {
    borderColor: "brand.emphasized",
    textColor: "brand.fg",
    bg: "brand.subtle",
  },
};

function CaseActionMenu({ caseItem }: { caseItem: Case }) {
  const [open, setOpen] = useState(false);

  return (
    <CaseDetailsDrawer
      caseData={{
        id: caseItem.id,
        clientName: caseItem.clientName,
        caseRef: caseItem.caseRef,
        caseType: { id: caseItem.id, code: caseItem.caseType, name: caseItem.caseType },
        practiceArea: caseItem.specialty ?? "",
        stage: caseItem.stage,
        stageDetail: { phase: "", workflowTitle: "", stepTitle: caseItem.stage, stepStatus: "in_progress" },
        status: caseItem.status,
        assignedTeam: caseItem.assignedTeam ? { id: caseItem.id, name: caseItem.assignedTeam } : null,
        assignedStaff: null,
        filingDate: "",
        deadline: caseItem.deadline ?? "",
        courtRef: "",
        caseProgress: 50,
      }}
      open={open}
      onOpenChange={({ open }) => setOpen(open)}
    >
      <Menu.Root>
        <Menu.Trigger asChild>
          <IconButton
            variant="ghost"
            size="xs"
            color="fg.muted"
            _hover={{ color: "fg", bg: "bg.muted" }}
          >
            <Ellipsis size={15} />
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content minW="170px">
              <Menu.Item value="view" onClick={() => setOpen(true)}>
                <Eye size={14} />
                <Box flex="1">View details</Box>
              </Menu.Item>
              <Menu.Item value="reassign-team">
                <UserPlus size={14} />
                <Box flex="1">Reassign team</Box>
              </Menu.Item>
              <Menu.Item value="export">
                <Download size={14} />
                <Box flex="1">Export case file</Box>
              </Menu.Item>
              <Menu.Item value="close">
                <Archive size={14} />
                <Box flex="1">Close case</Box>
              </Menu.Item>
              <Menu.Item
                value="flag"
                color="fg.error"
                _hover={{ bg: "bg.error", color: "fg.error" }}
              >
                <AlertTriangle size={14} />
                <Box flex="1">Flag as urgent</Box>
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </CaseDetailsDrawer>
  );
}

export function CasesTable({ cases = mockCases, isLoading: _isLoading = false }: CasesTableProps) {
  return (
    <Box
      w="full"
      border="1px solid"
      borderColor="border"
      borderRadius="lg"
      overflow="hidden"
      bg="bg"
      display={{ base: "none", lg: "block" }}
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
                      CASE TYPE
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
                      TEAM
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
                      <Table.Cell whiteSpace="nowrap">
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
                      <Table.Cell whiteSpace="nowrap">
                        <Text textStyle="body-sm" color="fg">
                          {caseItem.caseType}
                        </Text>
                      </Table.Cell>
                      <Table.Cell whiteSpace="nowrap">
                        <Text textStyle="body-sm" color="fg.muted">
                          {caseItem.stage}
                        </Text>
                      </Table.Cell>
                      <Table.Cell whiteSpace="nowrap">
                        <Text textStyle="body-sm" color="fg">
                          {caseItem.assignedTeam}
                        </Text>
                      </Table.Cell>
                      <Table.Cell whiteSpace="nowrap">
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
                      <Table.Cell whiteSpace="nowrap">
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
                      <Table.Cell whiteSpace="nowrap">
                        <CaseActionMenu caseItem={caseItem} />
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
