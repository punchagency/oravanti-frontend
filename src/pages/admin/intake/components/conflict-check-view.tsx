import { Box, HStack, Stack } from "@chakra-ui/react";
import { AlertTriangle, Send, Shield } from "lucide-react";
import { conflictReviews } from "../data";
import {
  AddOnWarning,
  BrandButton,
  CardTitle,
  MutedText,
  OutlineButton,
  PracticePill,
  StatusPill,
  SurfaceCard,
} from "./intake-ui";

export function ConflictCheckView() {
  return (
    <Stack gap="16px" pt="24px" aria-label="Conflict check review queue">
      <HStack
        gap="10px"
        minH="38px"
        px="14px"
        py="9px"
        border="1px solid"
        borderColor="brand.500"
        borderRadius="7px"
        bg="#fff8e8"
        color="#7a4e00"
        fontSize="12px"
      >
        <Shield size={15} />
        <Box as="span">
          All leads must pass a conflict of interest check (ABA Rules 1.7 and 1.9)
          before any engagement. Attorney review required.
        </Box>
      </HStack>

      <Stack gap="14px">
        {conflictReviews.map((review) => (
          <SurfaceCard key={review.name}>
            <HStack align="flex-start" justify="space-between" gap="16px">
              <Box>
                <CardTitle>Conflict review: {review.name}</CardTitle>
                <HStack mt="6px" gap="9px">
                  <PracticePill tone={review.practiceTone}>{review.practiceArea}</PracticePill>
                  <MutedText>Received {review.received}</MutedText>
                </HStack>
                {!review.addOnActive ? <AddOnWarning /> : null}
              </Box>
              <StatusPill
                tone={review.statusTone === "danger" ? "danger" : "success"}
                icon={review.statusTone === "danger" ? <AlertTriangle size={11} /> : undefined}
              >
                {review.statusLabel}
              </StatusPill>
            </HStack>

            <Box mt="14px" p="12px" borderRadius="7px" bg="bg.muted" color="fg.muted" fontSize="13px">
              Matter focus: {review.matterFocus}
            </Box>

            <HStack
              align="center"
              gap="10px"
              mt="14px"
              p="12px"
              border="1px solid"
              borderColor={review.outcomeTone === "danger" ? "#ffb8bd" : "#91ddc2"}
              borderRadius="7px"
              bg={review.outcomeTone === "danger" ? "#fff2f3" : "#dff8ee"}
              color={review.outcomeTone === "danger" ? "#b00020" : "#006b4b"}
              fontSize="13px"
            >
              {review.outcomeTone === "danger" ? (
                <AlertTriangle size={15} />
              ) : (
                <Shield size={15} />
              )}
              <Box as="span">
                {review.outcomeTone === "danger" ? "Alert details: " : ""}
                {review.outcome}
              </Box>
            </HStack>

            <Box
              display="grid"
              gridTemplateColumns={{ base: "1fr", md: "repeat(auto-fit, minmax(220px, 1fr))" }}
              gap="8px"
              mt="14px"
              pt="14px"
              borderTop="1px solid"
              borderColor="border.subtle"
            >
              {review.actions.map((action) =>
                action.tone === "danger" ? (
                  <OutlineButton key={action.label} color="#b00020" borderColor="#ffc3c8">
                    {action.label}
                  </OutlineButton>
                ) : (
                  <BrandButton key={action.label}>
                    {action.label === "Proceed to Questionnaire" ? <Send size={14} /> : null}
                    {action.label}
                  </BrandButton>
                ),
              )}
            </Box>
          </SurfaceCard>
        ))}
      </Stack>
    </Stack>
  );
}
