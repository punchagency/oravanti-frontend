import { Box, chakra, Dialog, HStack, Stack, Text, Textarea } from "@chakra-ui/react";
import { AlertTriangle, Send, Shield, ShieldAlert, X } from "lucide-react";
import { useState } from "react";
import type {
  CaseDetail,
  ConflictCheck,
  ConflictCheckMatch,
  Lead,
} from "@/api/leads";
import { conflictStatusLabels, formatReceivedDate } from "@/api/leads";
import { useCanReviewConflicts } from "@/hooks/use-can-review-conflicts";
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
import { toast } from "sonner";

const matchTypeLabels: Record<ConflictCheckMatch["type"], string> = {
  current_client: "Current client",
  former_client: "Former client",
  adverse_party: "Adverse party",
  related_party: "Related party",
  client_is_opponent: "Active client is opponent",
  former_client_is_opponent: "Former client is opponent",
};

const matchTypeTone: Record<
  ConflictCheckMatch["type"],
  "danger" | "warning" | "neutral"
> = {
  current_client: "danger",
  client_is_opponent: "danger",
  adverse_party: "danger",
  former_client: "warning",
  former_client_is_opponent: "warning",
  related_party: "neutral",
};

const caseStatusColors: Record<string, { bg: string; color: string }> = {
  active: { bg: "#dff8ee", color: "#006b4b" },
  completed: { bg: "#e8f0fe", color: "#1a56db" },
  cancelled: { bg: "#f3f4f6", color: "#6b7280" },
  on_hold: { bg: "#fef3c7", color: "#92400e" },
  pending_review: { bg: "#fef3c7", color: "#92400e" },
};

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
          All leads must pass a conflict of interest check (ABA Rules 1.7 and
          1.9) before any engagement. Attorney review required.
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
  // Which resolution modal is open (if any).
  const [resolveMode, setResolveMode] = useState<"approve" | "decline" | null>(
    null,
  );
  const runCheck = useRunConflictCheck();
  const resolveCheck = useResolveConflictCheck();
  const canReview = useCanReviewConflicts();

  const result = localResult;
  const status =
    result?.status ??
    (lead.conflictCheckStatus as
      | "pass"
      | "needs_review"
      | "pending"
      | "conflict_found"
      | undefined);
  const displayMatches = result ? result.matches : (lead.conflictMatches ?? []);
  const hasConflict = status === "conflict_found";
  const isPass = status === "pass";
  const needsReview = status === "needs_review";

  function handleRunCheck() {
    runCheck.mutate(lead.id, {
      onSuccess: (check) => setLocalResult(check),
    });
  }

  function handleResolve(action: "approve" | "decline", reviewNotes: string) {
    resolveCheck.mutate(
      { id: lead.id, data: { action, reviewNotes } },
      {
        onSuccess: (check) => {
          setLocalResult(check);
          setResolveMode(null);
          toast.success(
            action === "approve"
              ? "Conflict cleared — lead advanced to questionnaire"
              : "Lead declined and notified",
          );
        },
      },
    );
  }

  const statusTone = hasConflict
    ? "danger"
    : isPass
      ? "success"
      : needsReview
        ? "warning"
        : "neutral";
  const statusLabel = status ? conflictStatusLabels[status] : "Pending check";

  const outcomeTone = hasConflict || needsReview ? "danger" : "success";
  const outcomeText =
    result || displayMatches.length
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
            <MutedText>
              Received {formatReceivedDate(lead.receivedAt)}
            </MutedText>
          </HStack>
        </Box>
        <StatusPill
          tone={statusTone}
          icon={
            hasConflict || needsReview ? <AlertTriangle size={11} /> : undefined
          }
        >
          {statusLabel}
        </StatusPill>
      </HStack>

      {lead.intakeAdversePartyName || lead.intakeAdversePartyEmail ? (
        <HStack
          gap="8px"
          mt="14px"
          px="12px"
          py="9px"
          border="1px solid"
          borderColor="#fde68a"
          borderRadius="7px"
          bg="#fffbeb"
          color="#92400e"
          fontSize="12px"
        >
          <ShieldAlert size={13} style={{ flexShrink: 0 }} />
          <Box as="span">
            <Box as="span" fontWeight="600">
              Declared opposing party:{" "}
            </Box>
            {[lead.intakeAdversePartyName, lead.intakeAdversePartyEmail]
              .filter(Boolean)
              .join(" · ")}
          </Box>
        </HStack>
      ) : null}

      {lead.situationSummary ? (
        <Box
          mt="14px"
          p="12px"
          borderRadius="7px"
          bg="bg.muted"
          color="fg.muted"
          fontSize="13px"
        >
          Matter focus: {lead.situationSummary}
        </Box>
      ) : null}

      {outcomeText ? (
        <HStack
          align="center"
          gap="10px"
          mt="14px"
          border="1px solid"
          p="12px"
          borderColor={outcomeTone === "danger" ? "#ffb8bd" : "#91ddc2"}
          borderRadius="7px"
          bg={outcomeTone === "danger" ? "#fff2f3" : "#dff8ee"}
          color={outcomeTone === "danger" ? "#b00020" : "#006b4b"}
          fontSize="13px"
        >
          {outcomeTone === "danger" ? (
            <AlertTriangle size={15} />
          ) : (
            <Shield size={15} />
          )}
          <Box as="span">
            {outcomeTone === "danger" ? "Alert details: " : ""}
            {outcomeText}
          </Box>
        </HStack>
      ) : null}

      {displayMatches.length > 0 ? (
        <Box mt="14px">
          <Text
            fontWeight="600"
            fontSize="12px"
            color="fg.muted"
            mb="8px"
            textTransform="uppercase"
            letterSpacing="0.05em"
          >
            Potential matches ({displayMatches.length})
          </Text>
          <Stack gap="6px">
            {displayMatches.map((match, i) => (
              <MatchCard key={match.matchedId + i} match={match} />
            ))}
          </Stack>
        </Box>
      ) : null}

      <Box
        display="grid"
        gridTemplateColumns={{
          base: "1fr",
          md: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
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

        {(needsReview || hasConflict) && canReview ? (
          <>
            <OutlineButton
              color="#b00020"
              borderColor="#ffc3c8"
              onClick={() => setResolveMode("decline")}
            >
              <ShieldAlert size={14} />
              Flag &amp; terminate
            </OutlineButton>
            <BrandButton onClick={() => setResolveMode("approve")}>
              <Shield size={14} />
              Clear &amp; approve
            </BrandButton>
          </>
        ) : null}

        {(needsReview || hasConflict) && !canReview ? (
          <Text m="0" color="fg.muted" fontSize="12px">
            A conflict was flagged. Only an owner or admin can resolve it.
          </Text>
        ) : null}

        {result && !hasConflict && !needsReview && !isPass ? (
          <Text m="0" color="fg.muted" fontSize="12px">
            Conflict check result: {statusLabel}
          </Text>
        ) : null}
      </Box>

      <ResolutionDialog
        mode={resolveMode}
        leadName={lead.name}
        isPending={resolveCheck.isPending}
        onClose={() => setResolveMode(null)}
        onConfirm={(notes) => {
          if (resolveMode) handleResolve(resolveMode, notes);
        }}
      />
    </SurfaceCard>
  );
}

function ResolutionDialog({
  mode,
  leadName,
  isPending,
  onClose,
  onConfirm,
}: {
  mode: "approve" | "decline" | null;
  leadName: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (reviewNotes: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const isDecline = mode === "decline";

  function handleClose() {
    setNotes("");
    onClose();
  }

  return (
    <Dialog.Root
      open={mode !== null}
      onOpenChange={(details) => {
        if (!details.open) handleClose();
      }}
      placement="center"
    >
      <Dialog.Backdrop bg="rgba(0, 0, 0, 0.46)" />
      <Dialog.Positioner px="16px">
        <Dialog.Content
          w="full"
          maxW="460px"
          border="1px solid"
          borderColor="border"
          borderRadius="14px"
          bg="bg"
          p="0"
          boxShadow="0 24px 70px rgba(0, 0, 0, 0.26)"
        >
          <chakra.button
            type="button"
            aria-label="Close conflict resolution dialog"
            position="absolute"
            top="22px"
            right="22px"
            display="grid"
            placeItems="center"
            w="32px"
            h="32px"
            border="1px solid"
            borderColor="border"
            borderRadius="8px"
            bg="bg"
            color="fg.muted"
            onClick={handleClose}
          >
            <X size={16} />
          </chakra.button>

          <Box p="32px 24px 24px">
            <Dialog.Title
              color="fg"
              fontSize="17px"
              fontWeight="600"
              lineHeight="1.2"
            >
              {isDecline ? "Flag & terminate lead" : "Clear & approve"}
            </Dialog.Title>
            <Dialog.Description
              mt="10px"
              color="fg.muted"
              fontSize="13px"
              lineHeight="1.4"
            >
              {isDecline ? (
                <>
                  {leadName} will be marked <strong>declined</strong>, removed
                  from the active pipeline, and emailed that the firm cannot
                  proceed. This cannot be undone. A note is required for the
                  audit record.
                </>
              ) : (
                <>
                  Record your justification for clearing this conflict.{" "}
                  {leadName} will advance to the questionnaire stage. A note is
                  required for the audit record.
                </>
              )}
            </Dialog.Description>

            {isDecline ? (
              <HStack
                gap="8px"
                mt="14px"
                px="12px"
                py="9px"
                border="1px solid"
                borderColor="#ffb8bd"
                borderRadius="7px"
                bg="#fff2f3"
                color="#b00020"
                fontSize="12px"
              >
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <Box as="span">
                  The decline email is neutral and never discloses the conflict
                  or the matched party.
                </Box>
              </HStack>
            ) : null}

            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
              placeholder={
                isDecline
                  ? "Reason for terminating this lead…"
                  : "Reason for clearing this conflict…"
              }
              minH="90px"
              resize="vertical"
              fontSize="13px"
              border="1px solid"
              borderColor="border"
              borderRadius="7px"
              bg="bg"
              color="fg"
              px="12px"
              py="8px"
              mt="14px"
              _focus={{
                borderColor: "brand.solid",
                boxShadow: "0 0 0 1px var(--brand-cta)",
              }}
            />

            <HStack gap="8px" justify="flex-end" mt="16px">
              <OutlineButton type="button" onClick={handleClose}>
                Cancel
              </OutlineButton>
              {isDecline ? (
                <OutlineButton
                  color="#b00020"
                  borderColor="#ffc3c8"
                  loading={isPending}
                  disabled={!notes.trim() || isPending}
                  onClick={() => onConfirm(notes.trim())}
                >
                  Decline lead
                </OutlineButton>
              ) : (
                <BrandButton
                  loading={isPending}
                  disabled={!notes.trim() || isPending}
                  onClick={() => onConfirm(notes.trim())}
                >
                  Clear &amp; approve
                </BrandButton>
              )}
            </HStack>
          </Box>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function MatchCard({ match }: { match: ConflictCheckMatch }) {
  const tone = matchTypeTone[match.type] ?? "neutral";
  const typeLabel =
    matchTypeLabels[match.type] ?? match.type.replace(/_/g, " ");

  const badgeBg =
    tone === "danger" ? "#fff2f3" : tone === "warning" ? "#fffbeb" : "bg.muted";
  const badgeColor =
    tone === "danger" ? "#b00020" : tone === "warning" ? "#92400e" : "fg.muted";

  return (
    <Box
      p="10px 12px"
      border="1px solid"
      borderColor={
        tone === "danger"
          ? "#ffb8bd"
          : tone === "warning"
            ? "#fde68a"
            : "border.muted"
      }
      borderRadius="6px"
      bg="bg.subtle"
      fontSize="12px"
    >
      <HStack gap="6px" flexWrap="wrap" align="center">
        <AlertTriangle
          size={13}
          color={tone === "neutral" ? "#6b7280" : "#b00020"}
          style={{ flexShrink: 0 }}
        />
        <Text fontWeight="600" color="fg" m="0">
          {match.matchedName}
        </Text>
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
          bg={badgeBg}
          color={badgeColor}
          fontWeight="500"
        >
          {typeLabel}
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

      {match.caseDetails && match.caseDetails.length > 0 ? (
        <Stack gap="4px" mt="8px" pl="21px">
          {match.caseDetails.map((c) => (
            <CaseRow key={c.id} caseDetail={c} />
          ))}
          {match.type === "adverse_party" &&
          (match.adversePartyRelationship || match.firmClientName) ? (
            <HStack gap="10px" flexWrap="wrap" mt="2px">
              {match.adversePartyRelationship ? (
                <Text m="0" color="fg.muted">
                  Role:{" "}
                  <Box as="span" color="fg">
                    {match.adversePartyRelationship.replace(/_/g, " ")}
                  </Box>
                </Text>
              ) : null}
              {match.firmClientName ? (
                <Text m="0" color="fg.muted">
                  Firm's client:{" "}
                  <Box as="span" color="fg" fontWeight="500">
                    {match.firmClientName}
                  </Box>
                </Text>
              ) : null}
            </HStack>
          ) : null}
        </Stack>
      ) : (
        <Text m="4px 0 0 21px" color="fg.muted">
          {match.details}
        </Text>
      )}
    </Box>
  );
}

function CaseRow({ caseDetail }: { caseDetail: CaseDetail }) {
  const colors = caseStatusColors[caseDetail.status] ?? {
    bg: "bg.muted",
    color: "fg.muted",
  };
  return (
    <HStack gap="8px" flexWrap="wrap">
      <Text m="0" color="fg" fontWeight="500">
        #{caseDetail.caseNumber}
      </Text>
      <Text m="0" color="fg.muted">
        {caseDetail.caseType}
      </Text>
      {caseDetail.practiceArea ? (
        <Text m="0" color="fg.muted">
          · {caseDetail.practiceArea}
        </Text>
      ) : null}
      <Box
        as="span"
        px="6px"
        py="1px"
        borderRadius="4px"
        bg={colors.bg}
        color={colors.color}
        fontSize="11px"
      >
        {caseDetail.status.replace(/_/g, " ")}
      </Box>
    </HStack>
  );
}
