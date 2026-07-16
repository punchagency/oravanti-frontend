import {
  Badge,
  Box,
  Center,
  HStack,
  IconButton,
  Menu,
  Portal,
  ScrollArea,
  Spinner,
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
  ExternalLink,
  UserPlus,
} from "lucide-react";
import { getSpecialtyColors } from "@/utils/specialty-colors";
import { Link } from "react-router";

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

export interface Case {
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

import { useNavigate } from "react-router";

function CaseActionMenu({ caseItem }: { caseItem: Case }) {
  const navigate = useNavigate();

  return (
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
            <Menu.Item value="view" onClick={() => navigate(`/cases/${caseItem.id}`)}>
              <ExternalLink size={14} />
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
  );
}

export function CasesTable({ cases = [], isLoading = false }: CasesTableProps) {
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
      {isLoading ? (
        <Center py={16}>
          <Spinner />
        </Center>
      ) : cases.length === 0 ? (
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
                          <Link
                            to={`/cases/${caseItem.id}`}
                            style={{ textDecoration: "none" }}
                          >
                            <Text
                              textStyle="body-sm"
                              fontWeight="500"
                              color="fg"
                              _hover={{ color: "brand.solid" }}
                              cursor="pointer"
                            >
                              {caseItem.clientName}
                            </Text>
                          </Link>
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
