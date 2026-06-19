import { Box, HStack, Stack, Text, Textarea } from "@chakra-ui/react";
import { AlertTriangle, Send, Shield, ShieldAlert } from "lucide-react";
import { useState } from "react";
import type {
  CaseDetail,
  ConflictCheck,
  ConflictCheckMatch,
  Lead,
} from "@/api/leads";
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
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideNotes, setOverrideNotes] = useState("");
  const runCheck = useRunConflictCheck();
  const resolveCheck = useResolveConflictCheck();

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

  function handleClearAndApprove() {
    resolveCheck.mutate(
      {
        id: lead.id,
        data: {
          action: "manual_review",
          status: "pass",
          reviewNotes: "Cleared by manual review",
        },
      },
      {
        onSuccess: (check) => {
          setLocalResult(check);
          toast.success("Conflict check resolved");
        },
      },
    );
  }

  function handleFlagConflict() {
    resolveCheck.mutate(
      {
        id: lead.id,
        data: {
          action: "manual_review",
          status: "needs_review",
          reviewNotes: "Flagged for supervisor review",
        },
      },
      {
        onSuccess: (check) => {
          setLocalResult(check);
          toast.success("Conflict check flagged for manual review");
        },
      },
    );
  }

  function handleSupervisorOverride() {
    if (!overrideNotes.trim()) return;
    resolveCheck.mutate(
      {
        id: lead.id,
        data: {
          action: "supervisor_override",
          supervisorNotes: overrideNotes.trim(),
        },
      },
      {
        onSuccess: (check) => {
          setLocalResult(check);
          setOverrideOpen(false);
          setOverrideNotes("");
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

      {overrideOpen ? (
        <Box
          mt="14px"
          p="14px"
          border="1px solid"
          borderColor="#ffb8bd"
          borderRadius="8px"
          bg="#fff2f3"
        >
          <Text fontWeight="600" fontSize="13px" color="#b00020" mb="8px">
            Supervisor override — justification required
          </Text>
          <Textarea
            value={overrideNotes}
            onChange={(e) => setOverrideNotes(e.currentTarget.value)}
            placeholder="Explain why proceeding despite the identified conflict is permissible…"
            minH="80px"
            resize="vertical"
            fontSize="13px"
            border="1px solid"
            borderColor="border"
            borderRadius="7px"
            bg="bg"
            color="fg"
            px="12px"
            py="8px"
            mb="10px"
            _focus={{
              borderColor: "brand.solid",
              boxShadow: "0 0 0 1px var(--brand-cta)",
            }}
          />
          <HStack gap="8px" justify="flex-end">
            <OutlineButton
              type="button"
              onClick={() => {
                setOverrideOpen(false);
                setOverrideNotes("");
              }}
            >
              Cancel
            </OutlineButton>
            <BrandButton
              loading={resolveCheck.isPending}
              disabled={!overrideNotes.trim()}
              onClick={handleSupervisorOverride}
            >
              Confirm override
            </BrandButton>
          </HStack>
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

        {needsReview || (!hasConflict && displayMatches.length > 0) ? (
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

        {hasConflict && !overrideOpen ? (
          <>
            <OutlineButton
              color="#b00020"
              borderColor="#ffc3c8"
              loading={resolveCheck.isPending}
              onClick={handleFlagConflict}
            >
              Flag Conflict
            </OutlineButton>
            <OutlineButton
              color="#b00020"
              borderColor="#ffc3c8"
              onClick={() => setOverrideOpen(true)}
            >
              <ShieldAlert size={14} />
              Supervisor Override
            </OutlineButton>
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
