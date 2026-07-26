import type {
  ConflictCheck,
  ConflictCheckMatch,
  LeadLayout,
} from "@/api/leads";
import { conflictStatusLabels, formatReceivedDate } from "@/api/leads";
import {
  BrandButton,
  CardTitle,
  MutedText,
  OutlineButton,
  PracticePill,
  StatusPill,
  SurfaceCard,
} from "@/components/ui/intake-ui";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { useCanReviewConflicts } from "@/hooks/use-can-review-conflicts";
import {
  useConflictCheck,
  useLeadLayout,
  useResolveConflictCheck,
  useRunConflictCheck,
} from "@/hooks/use-leads";
import {
  Box,
  Dialog,
  HStack,
  Stack,
  Text,
  Textarea,
  chakra,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Check, Shield, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { ConflictCheckSkeleton, PipelineLayout } from "./pipeline-layout";

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

export function ConflictCheckPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const { data: lead, isLoading } = useLeadLayout(leadId!);

  if (isLoading || !lead) {
    return <ConflictCheckSkeleton />;
  }

  return (
    <PipelineLayout lead={lead} activeStep="conflict_check">
      <ConflictCheckSection lead={lead} />
    </PipelineLayout>
  );
}

function ConflictCheckSection({ lead }: { lead: LeadLayout }) {
  const [localResult, setLocalResult] = useState<ConflictCheck | null>(null);
  const [resolveMode, setResolveMode] = useState<"approve" | "decline" | null>(
    null,
  );
  const runCheck = useRunConflictCheck();
  const resolveCheck = useResolveConflictCheck();
  const canReview = useCanReviewConflicts();
  const { data: conflictCheckData, isLoading: isConflictLoading } =
    useConflictCheck(lead.id);

  const result = localResult ?? conflictCheckData;
  const status = result?.status ?? undefined;
  const displayMatches = result?.matches ?? [];
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

  if (isConflictLoading) {
    return (
      <SurfaceCard>
        <HStack align="flex-start" justify="space-between" gap="16px">
          <Box flex={1}>
            <ThemeSkeleton h="14px" w="55%" borderRadius="4px" mb={2} />
            <HStack gap={2}>
              <ThemeSkeleton h="16px" w="32px" borderRadius="full" />
              <ThemeSkeleton h="10px" w="90px" borderRadius="4px" />
            </HStack>
          </Box>
          <ThemeSkeleton h="18px" w="70px" borderRadius="full" />
        </HStack>
        <ThemeSkeleton h="10px" w="80%" borderRadius="4px" mt={3} />
        <ThemeSkeleton h="10px" w="60%" borderRadius="4px" mt={2} />
      </SurfaceCard>
    );
  }

  return (
    <>
      <Box
        display="flex"
        gap="10px"
        alignItems="center"
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
        <Shield size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
        <Box as="span">
          All leads must pass a conflict of interest check (ABA Rules 1.7 and
          1.9) before any engagement. Attorney review required.
        </Box>
      </Box>

      <SurfaceCard>
        <HStack align="center" justify="space-between" gap="16px">
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
              hasConflict || needsReview ? (
                <AlertTriangle size={11} />
              ) : undefined
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
          {!status || status === "pending" ? (
            <BrandButton loading={runCheck.isPending} onClick={handleRunCheck}>
              <Shield size={14} />
              Run conflict check
            </BrandButton>
          ) : null}

          {isPass ? (
            <HStack gap="6px" color="#00785a">
              <Check size={14} />
              <Text m="0" fontSize="13px" fontWeight="500">
                Conflict check cleared
              </Text>
            </HStack>
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
    </>
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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ notes: string }>({
    resolver: zodResolver(
      z.object({
        notes: z
          .string()
          .trim()
          .min(1, "A note is required for the audit record"),
      }),
    ),
    defaultValues: { notes: "" },
    mode: "onTouched",
  });
  const isDecline = mode === "decline";

  function handleClose() {
    reset({ notes: "" });
    onClose();
  }

  const submit = handleSubmit((data) => onConfirm(data.notes.trim()));

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
          <Dialog.Header p="16px 20px 0">
            <Dialog.Title fontSize="15px" fontWeight="600">
              {isDecline ? "Terminate lead" : "Approve conflict check"}
            </Dialog.Title>
            <Dialog.CloseTrigger />
          </Dialog.Header>

          <Dialog.Body p="16px 20px">
            <Text fontSize="13px" color="fg.muted" mb="12px">
              {isDecline
                ? `Declining will close the inquiry for ${leadName} and send a neutral notification.`
                : `Approving clears the conflict check for ${leadName} and advances the lead to the questionnaire stage.`}
            </Text>

            <chakra.label
              display="block"
              fontSize="12px"
              fontWeight="500"
              color="fg"
              mb="6px"
            >
              Audit note <chakra.span color="red.500">*</chakra.span>
            </chakra.label>
            <Textarea
              {...register("notes")}
              placeholder="Required note for the audit trail…"
              fontSize="13px"
              minH="80px"
              border="1px solid"
              borderColor={errors.notes ? "red.500" : "border"}
              borderRadius="8px"
              bg="bg"
            />
            {errors.notes ? (
              <Text fontSize="11px" color="red.500" mt="4px">
                {errors.notes.message}
              </Text>
            ) : null}
          </Dialog.Body>

          <Dialog.Footer p="0 20px 16px" gap="8px">
            <Dialog.ActionTrigger asChild>
              <OutlineButton h="34px" fontSize="13px">
                Cancel
              </OutlineButton>
            </Dialog.ActionTrigger>
            <BrandButton
              h="34px"
              fontSize="13px"
              loading={isPending}
              onClick={submit}
              bg={isDecline ? "red.500" : undefined}
              _hover={isDecline ? { bg: "red.600" } : undefined}
            >
              {isDecline ? "Decline & notify" : "Approve & advance"}
            </BrandButton>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function MatchCard({ match }: { match: ConflictCheckMatch }) {
  const tone = matchTypeTone[match.type] ?? "neutral";
  const toneStyles = {
    danger: { bg: "#fff2f3", border: "#ffb8bd", color: "#b00020" },
    warning: { bg: "#fffbeb", border: "#fde68a", color: "#92400e" },
    neutral: { bg: "bg.muted", border: "border", color: "fg.muted" },
  }[tone];

  return (
    <Box
      p="12px"
      borderRadius="8px"
      border="1px solid"
      borderColor={toneStyles.border}
      bg={toneStyles.bg}
    >
      <HStack justify="space-between" align="flex-start" gap="8px" mb="6px">
        <Text fontWeight="600" fontSize="13px" color={toneStyles.color}>
          {match.matchedName}
        </Text>
        <StatusPill
          tone={
            tone === "danger"
              ? "danger"
              : tone === "warning"
                ? "warning"
                : "neutral"
          }
        >
          {matchTypeLabels[match.type]}
        </StatusPill>
      </HStack>

      <Text fontSize="12px" color="fg.muted" mb="4px">
        Matched via <strong>{match.confidence.replace(/_/g, " ")}</strong>{" "}
        confidence — rule {match.rule}
      </Text>

      {match.details ? (
        <Text
          fontSize="12px"
          color="fg.muted"
          mb={match.caseDetails?.length ? "8px" : 0}
        >
          {match.details}
        </Text>
      ) : null}

      {match.firmClientName ? (
        <Text fontSize="12px" color="fg.muted" mb="4px">
          Firm client: <strong>{match.firmClientName}</strong>
        </Text>
      ) : null}

      {match.adversePartyRelationship ? (
        <Text fontSize="12px" color="fg.muted" mb="4px">
          Relationship: {match.adversePartyRelationship}
        </Text>
      ) : null}

      {match.caseDetails?.length ? (
        <Box mt="8px">
          <Text
            fontSize="11px"
            fontWeight="600"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="0.05em"
            mb="4px"
          >
            Related cases
          </Text>
          <Stack gap="4px">
            {match.caseDetails.map((c) => (
              <CaseRow key={c.id} caseDetail={c} />
            ))}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
}

function CaseRow({
  caseDetail,
}: {
  caseDetail: {
    id: string;
    caseNumber: string;
    caseType: string;
    practiceArea: string | null;
    status: string;
  };
}) {
  const colors = caseStatusColors[caseDetail.status] ?? caseStatusColors.active;

  return (
    <HStack
      gap="8px"
      p="8px"
      borderRadius="6px"
      bg="bg"
      border="1px solid"
      borderColor="border.subtle"
      fontSize="12px"
    >
      <Text fontWeight="500" color="fg" flex={1}>
        {caseDetail.caseNumber}
      </Text>
      <Text color="fg.muted">{caseDetail.caseType}</Text>
      <Text color="fg.muted">{caseDetail.practiceArea ?? "—"}</Text>
      <Box
        px="6px"
        py="2px"
        borderRadius="4px"
        bg={colors.bg}
        color={colors.color}
        fontSize="11px"
        fontWeight="500"
      >
        {caseDetail.status}
      </Box>
    </HStack>
  );
}
