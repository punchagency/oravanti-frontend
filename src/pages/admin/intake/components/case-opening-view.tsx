import { Box, Button, HStack, Stack } from "@chakra-ui/react";
import { AlertTriangle, Check, FolderOpen, Lock } from "lucide-react";
import { caseOpenings } from "../data";
import {
  BrandButton,
  CardTitle,
  MutedText,
  PracticePill,
  StatusPill,
  SurfaceCard,
} from "./intake-ui";

export function CaseOpeningView() {
  return (
    <Stack gap="16px" pt="24px" aria-label="Case opening queue">
      <HStack justify="space-between" gap="16px" wrap="wrap">
        <MutedText fontSize="14px">2 cases ready to open</MutedText>
        <StatusPill>Retainers confirmed</StatusPill>
      </HStack>

      <Stack gap="14px">
        {caseOpenings.map((caseOpening) => (
          <SurfaceCard key={caseOpening.title}>
            <HStack align="flex-start" justify="space-between" gap="16px">
              <Box>
                <CardTitle>{caseOpening.title}</CardTitle>
                <HStack mt="6px" gap="9px">
                  <PracticePill tone={caseOpening.practiceTone}>
                    {caseOpening.practiceArea}
                  </PracticePill>
                  <MutedText>{caseOpening.retainerCopy}</MutedText>
                </HStack>
                {!caseOpening.addOnActive ? (
                  <HStack mt="0" gap="3px" color="brand.700" fontSize="10px" fontWeight="500">
                    <AlertTriangle size={11} />
                    <Box as="span">Not active</Box>
                  </HStack>
                ) : null}
              </Box>
              <StatusPill icon={<Check size={11} />}>Retainer Received</StatusPill>
            </HStack>

            <Box mt="18px" p="12px" borderRadius="7px" bg="bg.muted" color="fg.muted" fontSize="13px">
              Active Situation Summary: {caseOpening.summary}
            </Box>

            <Box mt="14px" pt="14px" borderTop="1px solid" borderColor="border.subtle">
              {caseOpening.actionTone === "danger" ? (
                <Button
                  w="100%"
                  minH="32px"
                  borderRadius="7px"
                  bg="#c40024"
                  color="#ffffff"
                  fontSize="13px"
                  fontWeight="500"
                  _hover={{ bg: "#a9001f" }}
                >
                  <Lock size={14} />
                  {caseOpening.actionLabel}
                </Button>
              ) : (
                <BrandButton w="100%">
                  <FolderOpen size={14} />
                  {caseOpening.actionLabel}
                </BrandButton>
              )}
            </Box>
          </SurfaceCard>
        ))}
      </Stack>
    </Stack>
  );
}
