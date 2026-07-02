import { Box, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <Box borderBottom="1px solid" borderColor="border.muted" py={2}>
      <Text
        color="fg.subtle"
        fontSize="10px"
        fontWeight="500"
        letterSpacing="0.5px"
        textTransform="uppercase"
        mb={0.5}
      >
        {label}
      </Text>
      <Text color="fg" fontSize="12px" lineHeight="150%">
        {value}
      </Text>
    </Box>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Text
      color="fg.subtle"
      fontSize="11px"
      fontWeight="500"
      letterSpacing="0.55px"
      textTransform="uppercase"
      mb={2}
    >
      {children}
    </Text>
  );
}

export interface CaseTypeInfo {
  id: string;
  code: string;
  name: string;
}

export interface TeamInfo {
  id: string;
  name: string;
}

export interface CaseStage {
  phase: string;
  workflowTitle: string;
  stepTitle: string;
  stepStatus: "pending" | "in_progress" | "completed" | "skipped";
}

export const pipelineSteps = [
  { label: "Intake", stage: "Intake & Conflict Check", completed: true },
  { label: "Consult", stage: "Questionnaire & Consultation", completed: true },
  { label: "File", stage: "Document Prep & Filing", completed: true },
  { label: "Review", stage: "USCIS / Court Review", completed: true },
  { label: "Done", stage: "Case Resolution", completed: false },
];

export const matterFields = [
  { label: "Case type", key: "caseType" },
  { label: "Practice area", key: "practiceArea" },
  { label: "Case reference", key: "caseRef" },
  { label: "Opened", key: "filingDate" },
  { label: "Team", key: "assignedTeam" },
  { label: "Assigned staff", key: "assignedStaff" },
  { label: "Current stage", key: "stage" },
  { label: "Internal deadline", key: "deadline" },
  { label: "Court / Agency ref", key: "courtRef" },
];

export const statusBadgeStyle: Record<string, { borderColor: string; textColor: string; bg: string }> = {
  Filed: { borderColor: "brand.emphasized", textColor: "brand.fg", bg: "brand.subtle" },
  Active: { borderColor: "brand.emphasized", textColor: "brand.fg", bg: "brand.subtle" },
  Closed: { borderColor: "border", textColor: "fg.muted", bg: "bg.subtle" },
  RFE: { borderColor: "brand.solid", textColor: "brand.contrast", bg: "brand.solid" },
};

export interface CaseData {
  id: string;
  clientName: string;
  caseRef: string;
  caseType: CaseTypeInfo;
  practiceArea: string;
  stage: string;
  stageDetail: CaseStage;
  status: string;
  assignedTeam: TeamInfo | null;
  assignedStaff: { name: string; role: string } | null;
  filingDate: string;
  deadline: string;
  courtRef: string;
  caseProgress: number;
}
