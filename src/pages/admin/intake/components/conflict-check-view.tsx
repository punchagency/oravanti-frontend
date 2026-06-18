import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { AlertTriangle, Send, Shield } from "lucide-react";
import { useState } from "react";
import type { ConflictCheck, Lead } from "@/api/leads";
import { conflictStatusLabels, formatReceivedDate } from "@/api/leads";
import {
  useLeads,
  useRunConflictCheck,
  useResolveConflictCheck,
} from "@/hooks/use-leads";
import {
  BrandButton,
  CardTitle,
  MutedText,
  OutlineButton,
  PracticePill,
  StatusPill,
  SurfaceCard,
} from "../../../../components/ui/intake-ui";

export function ConflictCheckView() {
  const { data, isLoading } = useLeads({ stage: "conflict_check" });
  const leads = Array.isArray(data) ? data : (data?.leads ?? []);

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

      {isLoading ? (
        <MutedText>Loading…</MutedText>
      ) : leads.length === 0 ? (
        <MutedText>No leads pending conflict check.</MutedText>
      ) : (
        <Stack gap="14px">
          {leads.map((lead) => (
            <ConflictCheckCard key={lead.id} lead={lead} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function ConflictCheckCard({ lead }: { lead: Lead }) {
  const [localResult, setLocalResult] = useState<ConflictCheck | null>(null);
  const runCheck = useRunConflictCheck();
  const resolveCheck = useResolveConflictCheck();

  const result = localResult;
  const status = result?.status;
  const displayMatches = result ? result.matches : (lead.conflictMatches ?? []);
  const hasConflict = status === "conflict_found";
  const isPass = status === "pass";
  const needsReview = status === "needs_review";

  function handleRunCheck() {
    runCheck.mutate(lead.id, {
      onSuccess: (check) => setLocalResult(check),
    });
  }

  function handleClearAndApprove() {
    resolveCheck.mutate(
      { id: lead.id, data: { status: "pass", reviewNotes: "Cleared by manual review" } },
      { onSuccess: (check) => setLocalResult(check) },
    );
  }

  function handleFlagConflict() {
    resolveCheck.mutate(
      { id: lead.id, data: { status: "needs_review", reviewNotes: "Flagged for supervisor review" } },
      { onSuccess: (check) => setLocalResult(check) },
    );
  }

  const statusTone = hasConflict ? "danger" : isPass ? "success" : needsReview ? "warning" : "neutral";
  const statusLabel = status ? conflictStatusLabels[status] : "Pending check";

  const outcomeTone = hasConflict ? "danger" : "success";
  const outcomeText = result
    ? hasConflict
      ? `Record match identified: ${displayMatches.map((m) => `"${m.matchedName}" (${m.rule})`).join(", ")}. Please execute manual verification or request supervisor clearance.`
      : isPass
      ? "Conflict check cleared — approved to initiate retainer workflow."
      : needsReview
      ? "Potential match flagged for attorney review. Please verify before proceeding."
      : ""
    : null;

  return (
    <SurfaceCard>
      <HStack align="flex-start" justify="space-between" gap="16px">
        <Box>
          <CardTitle>Conflict review: {lead.name}</CardTitle>
          <HStack mt="6px" gap="9px">
            <PracticePill tone="neutral">Lead</PracticePill>
            <MutedText>Received {formatReceivedDate(lead.receivedAt)}</MutedText>
          </HStack>
        </Box>
        <StatusPill
          tone={statusTone}
          icon={hasConflict || needsReview ? <AlertTriangle size={11} /> : undefined}
        >
          {statusLabel}
        </StatusPill>
      </HStack>

      {lead.situationSummary ? (
        <Box mt="14px" p="12px" borderRadius="7px" bg="bg.muted" color="fg.muted" fontSize="13px">
          Matter focus: {lead.situationSummary}
        </Box>
      ) : null}

      {outcomeText ? (
        <HStack
          align="center"
          gap="10px"
          mt="14px"
          p="12px"
          border="1px solid"
          borderColor={outcomeTone === "danger" ? "#ffb8bd" : "#91ddc2"}
          borderRadius="7px"
          bg={outcomeTone === "danger" ? "#fff2f3" : "#dff8ee"}
          color={outcomeTone === "danger" ? "#b00020" : "#006b4b"}
          fontSize="13px"
        >
          {outcomeTone === "danger" ? <AlertTriangle size={15} /> : <Shield size={15} />}
          <Box as="span">
            {outcomeTone === "danger" ? "Alert details: " : ""}
            {outcomeText}
          </Box>
        </HStack>
      ) : null}

      {displayMatches.length > 0 ? (
        <Box mt="14px">
          <Text fontWeight="600" fontSize="12px" color="fg.muted" mb="8px" textTransform="uppercase" letterSpacing="0.05em">
            Potential matches ({displayMatches.length})
          </Text>
          <Stack gap="6px">
            {displayMatches.map((match, i) => (
              <HStack
                key={match.matchedId + i}
                gap="10px"
                p="10px 12px"
                border="1px solid"
                borderColor="border.muted"
                borderRadius="6px"
                bg="bg.subtle"
                fontSize="12px"
                align="flex-start"
              >
                <AlertTriangle size={13} color="#b00020" style={{ flexShrink: 0, marginTop: 2 }} />
                <Stack gap="2px" flex="1">
                  <HStack gap="6px" flexWrap="wrap">
                    <Text fontWeight="600" color="fg" m="0">{match.matchedName}</Text>
                    <Box
                      as="span"
                      px="6px"
                      py="1px"
                      borderRadius="4px"
                      bg="#fff2f3"
                      color="#b00020"
                      fontWeight="500"
                    >
                      {match.rule}
                    </Box>
                    <Box
                      as="span"
                      px="6px"
                      py="1px"
                      borderRadius="4px"
                      bg="bg.muted"
                      color="fg.muted"
                    >
                      {match.type.replace(/_/g, " ")}
                    </Box>
                    <Box
                      as="span"
                      px="6px"
                      py="1px"
                      borderRadius="4px"
                      bg="bg.muted"
                      color="fg.muted"
                    >
                      {match.confidence.replace(/_/g, " ")}
                    </Box>
                  </HStack>
                  <Text m="0" color="fg.muted">{match.details}</Text>
                </Stack>
              </HStack>
            ))}
          </Stack>
        </Box>
      ) : null}

      <Box
        display="grid"
        gridTemplateColumns={{ base: "1fr", md: "repeat(auto-fit, minmax(220px, 1fr))" }}
        gap="8px"
        mt="14px"
        pt="14px"
        borderTop="1px solid"
        borderColor="border.subtle"
      >
        {!result && !displayMatches.length ? (
          <BrandButton loading={runCheck.isPending} onClick={handleRunCheck}>
            <Shield size={14} />
            Run conflict check
          </BrandButton>
        ) : null}

        {isPass ? (
          <BrandButton>
            <Send size={14} />
            Proceed to Questionnaire
          </BrandButton>
        ) : null}

        {hasConflict || needsReview || displayMatches.length ? (
          <>
            <OutlineButton
              color="#b00020"
              borderColor="#ffc3c8"
              loading={resolveCheck.isPending}
              onClick={handleFlagConflict}
            >
              Flag Conflict
            </OutlineButton>
            <BrandButton
              loading={resolveCheck.isPending}
              onClick={handleClearAndApprove}
            >
              Clear &amp; Approve
            </BrandButton>
          </>
        ) : null}

        {result && !hasConflict && !needsReview && !isPass ? (
          <Text m="0" color="fg.muted" fontSize="12px">
            Conflict check result: {statusLabel}
          </Text>
        ) : null}
      </Box>
    </SurfaceCard>
  );
}
