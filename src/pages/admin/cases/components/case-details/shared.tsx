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

export const matterFields = [
  { label: "Case type", key: "caseType" },
  { label: "Practice area", key: "practiceArea" },
  { label: "Case reference", key: "caseRef" },
  { label: "Opened", key: "createdAt" },
  { label: "Team", key: "assignedTeam" },
  { label: "Current stage", key: "currentStep" },
  { label: "Status", key: "status" },
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
  caseType: { id: string; name: string };
  practiceArea: string;
  status: string;
  createdAt: string;
  assignedTeam: { id: string; name: string } | null;
  currentStep: string | null;
}
