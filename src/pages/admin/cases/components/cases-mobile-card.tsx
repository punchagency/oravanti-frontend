import {
  Badge,
  Box,
  Flex,
  HStack,
  IconButton,
  Menu,
  Portal,
  Stack,
  Text,
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

const statusColorMap: Record<
  string,
  { borderColor: string; textColor: string; bg: string }
> = {
  Interview: { borderColor: "brand.emphasized", textColor: "brand.fg", bg: "brand.subtle" },
  Active: { borderColor: "brand.emphasized", textColor: "brand.fg", bg: "brand.subtle" },
  Filed: { borderColor: "brand.emphasized", textColor: "brand.fg", bg: "brand.subtle" },
  Closed: { borderColor: "border", textColor: "fg.muted", bg: "bg.subtle" },
  RFE: { borderColor: "brand.solid", textColor: "brand.contrast", bg: "brand.solid" },
  Pending: { borderColor: "brand.emphasized", textColor: "brand.fg", bg: "brand.subtle" },
};

function CaseActionMenu({ caseItem }: { caseItem: CaseMobile }) {
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

interface CaseMobile {
  id: string;
  clientName: string;
  caseRef: string;
  caseType: string;
  stage: string;
  assignedTeam: string;
  deadline?: string;
  status: string;
  matttersCount?: number;
  specialty?: string;
}

interface CasesMobileCardProps {
  caseItem: CaseMobile;
}

export function CasesMobileCard({ caseItem }: CasesMobileCardProps) {
  const colors = statusColorMap[caseItem.status] ?? statusColorMap.Closed;
  const specialtyColors = getSpecialtyColors(caseItem.specialty || "immigration");
  const specialtyLabel = specialtyLabelMap[caseItem.specialty || "immigration"];
  return (
    <Box
      p={4}
      border="1px solid"
      borderColor="border"
      borderRadius="lg"
      bg="bg"
      _hover={{ borderColor: "brand.solid" }}
      transition="border-color 0.2s"
    >
      <Flex justify="space-between" align="flex-start" mb={3}>
        <Box minW={0} flex={1}>
          <Text fontWeight="600" color="fg" truncate fontSize="sm">
            {caseItem.clientName}
          </Text>
          <HStack gap={1.5} mt={0.5}>
            <Text textStyle="body-sm" color="fg.muted" truncate>
              {caseItem.caseRef}
            </Text>
            <Badge
              size="xs"
              bg={specialtyColors.bg}
              color={specialtyColors.text}
              borderRadius="md"
              flexShrink={0}
            >
              {specialtyLabel}
            </Badge>
          </HStack>
        </Box>
        <Badge
          size="xs"
          px={2.5}
          py={0.5}
          borderRadius="full"
          borderWidth="1px"
          borderColor={colors.borderColor}
          bg={colors.bg}
          color={colors.textColor}
          fontWeight="500"
          fontSize="11px"
          textTransform="none"
          whiteSpace="nowrap"
          flexShrink={0}
        >
          {caseItem.status}
        </Badge>
      </Flex>

      <Stack
        gap={2}
        textStyle="body-sm"
        pt={2.5}
        borderTop="1px solid"
        borderColor="border.muted"
      >
        <Flex justify="space-between" align="center">
          <Text color="fg.subtle" flexShrink={0}>Case type:</Text>
          <Text color="fg" fontWeight="500" textAlign="right" ml={3}>
            {caseItem.caseType}
          </Text>
        </Flex>
        <Flex justify="space-between" align="center">
          <Text color="fg.subtle" flexShrink={0}>Stage:</Text>
          <Text color="fg" fontWeight="500" textAlign="right" ml={3}>
            {caseItem.stage}
          </Text>
        </Flex>
        <Flex justify="space-between" align="center">
          <Text color="fg.subtle" flexShrink={0}>Team:</Text>
          <Text color="fg" fontWeight="500">{caseItem.assignedTeam}</Text>
        </Flex>
        <Flex justify="space-between" align="center">
          <Text color="fg.subtle" flexShrink={0}>Deadline:</Text>
          <Text
            color={
              caseItem.deadline && caseItem.deadline !== "—"
                ? "brand.solid"
                : "fg.muted"
            }
            fontWeight={caseItem.deadline && caseItem.deadline !== "—" ? "600" : "400"}
          >
            {caseItem.deadline ?? "—"}
          </Text>
        </Flex>
      </Stack>

      <HStack gap={2} mt={3.5} justify="flex-end">
        <CaseActionMenu caseItem={caseItem} />
      </HStack>
    </Box>
  );
}
