import { Box, Grid, HStack, Stack, Text } from "@chakra-ui/react";
import {
  AlertTriangle,
  Archive,
  Check,
  Eye,
  FolderOpen,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  CalendarClock,
} from "lucide-react";
import { useState } from "react";
import {
  conflictStatusLabels,
  formatReceivedDateDetail,
  sourceLabels,
  statusLabels,
  type LeadDetail,
} from "@/api/leads";
import {
  BrandButton,
  CardTitle,
  MutedText,
  OutlineButton,
  PracticePill,
  StatusPill,
  SurfaceCard,
} from "@/components/ui/intake-ui";
import {
  useArchiveLead,
  useOpenCase,
  useResolveConflictCheck,
  useRestoreLead,
  useRunConflictCheck,
} from "@/hooks/use-leads";
import { useLeadQuestionnaire } from "@/hooks/use-questionnaires";
import {
  MatchCard,
  ResolutionDialog,
} from "@/pages/admin/intake/components/conflict-check-view";
import { ScheduleConsultationDialog } from "@/pages/admin/intake/components/consultation-view";
import { QuestionnaireResponseDialog } from "@/pages/admin/intake/components/questionnaire-response-dialog";
import { SendQuestionnaireDialog } from "@/pages/admin/intake/components/send-questionnaire-dialog";
import { TeamSelectionModal } from "@/pages/admin/intake/components/team-selection-modal";
import { stageLabel, stageTone } from "../../data";

/**
 * The lead's current state plus the actions available at its stage — the same
 * actions the intake pipeline offers, driven by the same hooks and the same
 * dialogs, so a user never has to leave the CRM to move a lead forward.
 */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Box>
      <Text
        m="0 0 3px"
        color="fg.muted"
        fontSize="10px"
        fontWeight="600"
        textTransform="uppercase"
        letterSpacing="0.04em"
      >
        {label}
      </Text>
      <Box color="fg" fontSize="13px" fontWeight="500">
        {value ?? <Text as="span" color="fg.muted">—</Text>}
      </Box>
    </Box>
  );
}

export function OverviewTab({
  lead,
  practiceAreaName,
}: {
  lead: LeadDetail;
  practiceAreaName: string | null;
}) {
  const [resolutionMode, setResolutionMode] = useState<
    "approve" | "decline" | null
  >(null);
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);

  const runConflictCheck = useRunConflictCheck();
  const resolveConflictCheck = useResolveConflictCheck();
  const openCase = useOpenCase();
  const archiveLead = useArchiveLead();
  const restoreLead = useRestoreLead();

  const { data: questionnaire } = useLeadQuestionnaire(lead.id);

  const conflictCheck = lead.conflictCheck;
  const consultation = lead.consultation;
  const feeAgreement = lead.feeAgreement;
  const isArchived = lead.status === "archived";
  const isConverted = Boolean(lead.convertedCaseId);
  const isDeclined = lead.status === "declined";

  return (
    <Stack gap="18px">
      {/* ── Identity ──────────────────────────────────────────────────────── */}
      <SurfaceCard>
        <HStack justify="space-between" align="flex-start" gap="12px" mb="14px">
          <Box>
            <CardTitle>{lead.name}</CardTitle>
            <MutedText>{lead.email}</MutedText>
          </Box>
          <PracticePill tone={stageTone[lead.pipelineStage]}>
            {stageLabel[lead.pipelineStage]}
          </PracticePill>
        </HStack>

        <Grid templateColumns="repeat(2, 1fr)" gap="14px">
          <DetailRow label="Phone" value={lead.phone} />
          <DetailRow label="Practice area" value={practiceAreaName} />
          <DetailRow label="Source" value={sourceLabels[lead.source]} />
          <DetailRow label="Status" value={statusLabels[lead.status]} />
          <DetailRow
            label="Received"
            value={formatReceivedDateDetail(lead.receivedAt)}
          />
          <DetailRow label="Entity" value={lead.entityType} />
        </Grid>

        {lead.situationSummary && (
          <Box
            mt="14px"
            p="12px"
            borderRadius="7px"
            bg="bg.muted"
            color="fg.muted"
            fontSize="13px"
          >
            {lead.situationSummary}
          </Box>
        )}
      </SurfaceCard>

      {isDeclined && (
        <SurfaceCard>
          <HStack gap="8px" color="#b00020">
            <AlertTriangle size={14} />
            <Text m="0" fontSize="13px" fontWeight="500">
              This lead was declined for conflict and cannot be advanced.
            </Text>
          </HStack>
        </SurfaceCard>
      )}

      {/* ── Conflict check ────────────────────────────────────────────────── */}
      <SurfaceCard>
        <HStack justify="space-between" align="center" gap="12px" mb="12px">
          <CardTitle>Conflict check</CardTitle>
          {conflictCheck && (
            <StatusPill
              tone={
                conflictCheck.status === "pass"
                  ? "success"
                  : conflictCheck.status === "conflict_found"
                    ? "danger"
                    : "warning"
              }
              icon={<ShieldCheck size={11} />}
            >
              {conflictStatusLabels[conflictCheck.status]}
            </StatusPill>
          )}
        </HStack>

        {!conflictCheck ? (
          <Stack gap="10px">
            <MutedText>No conflict check has been run for this lead.</MutedText>
            <BrandButton
              loading={runConflictCheck.isPending}
              onClick={() => runConflictCheck.mutate(lead.id)}
              disabled={isDeclined || isArchived}
            >
              <Search size={14} />
              Run conflict check
            </BrandButton>
          </Stack>
        ) : (
          <Stack gap="12px">
            {conflictCheck.matches?.length ? (
              <Stack gap="10px">
                {conflictCheck.matches.map((match, i) => (
                  <MatchCard key={`${match.matchedId}-${i}`} match={match} />
                ))}
              </Stack>
            ) : (
              <MutedText>No conflicting parties were found.</MutedText>
            )}

            {conflictCheck.reviewNotes && (
              <Box
                p="10px 12px"
                borderRadius="7px"
                bg="bg.muted"
                color="fg.muted"
                fontSize="12px"
              >
                Review note: {conflictCheck.reviewNotes}
              </Box>
            )}

            <HStack gap="8px" wrap="wrap">
              <OutlineButton
                loading={runConflictCheck.isPending}
                onClick={() => runConflictCheck.mutate(lead.id)}
                disabled={isDeclined || isArchived}
              >
                <Search size={14} />
                Re-run
              </OutlineButton>

              {conflictCheck.status !== "pass" && !isDeclined && (
                <>
                  <BrandButton onClick={() => setResolutionMode("approve")}>
                    <Check size={14} />
                    Approve / override
                  </BrandButton>
                  <OutlineButton onClick={() => setResolutionMode("decline")}>
                    Decline lead
                  </OutlineButton>
                </>
              )}
            </HStack>
          </Stack>
        )}
      </SurfaceCard>

      {/* ── Questionnaire ─────────────────────────────────────────────────── */}
      <SurfaceCard>
        <CardTitle>Questionnaire</CardTitle>
        <Box mt="12px">
          {!lead.questionnaireSendId ? (
            <Stack gap="10px">
              <MutedText>No questionnaire has been sent.</MutedText>
              <BrandButton
                onClick={() => setQuestionnaireOpen(true)}
                disabled={isDeclined || isArchived}
              >
                <Send size={14} />
                Send questionnaire
              </BrandButton>
            </Stack>
          ) : questionnaire?.response ? (
            <Stack gap="10px">
              <StatusPill icon={<Check size={11} />}>
                Response received
              </StatusPill>
              <BrandButton
                onClick={() => setResponseId(questionnaire.response!.id)}
              >
                <Eye size={14} />
                View response
              </BrandButton>
            </Stack>
          ) : (
            <Stack gap="10px">
              <StatusPill tone="warning">Awaiting response</StatusPill>
              <OutlineButton onClick={() => setQuestionnaireOpen(true)}>
                <Send size={14} />
                Resend questionnaire
              </OutlineButton>
            </Stack>
          )}
        </Box>
      </SurfaceCard>

      {/* ── Consultation ──────────────────────────────────────────────────── */}
      <SurfaceCard>
        <CardTitle>Consultation</CardTitle>
        <Box mt="12px">
          {!consultation ? (
            <Stack gap="10px">
              <MutedText>No consultation scheduled.</MutedText>
              <BrandButton
                onClick={() => setScheduleOpen(true)}
                disabled={isDeclined || isArchived}
              >
                <CalendarClock size={14} />
                Schedule consultation
              </BrandButton>
            </Stack>
          ) : (
            <Stack gap="10px">
              <Grid templateColumns="repeat(2, 1fr)" gap="12px">
                <DetailRow
                  label="Status"
                  value={consultation.status.replace(/_/g, " ")}
                />
                <DetailRow
                  label="Scheduled"
                  value={
                    consultation.scheduledAt
                      ? formatReceivedDateDetail(consultation.scheduledAt)
                      : null
                  }
                />
                <DetailRow
                  label="Mode"
                  value={consultation.mode?.replace(/_/g, " ")}
                />
                <DetailRow label="Fee status" value={consultation.feeStatus} />
              </Grid>

              <OutlineButton
                onClick={() => setScheduleOpen(true)}
                disabled={isDeclined || isArchived}
              >
                <CalendarClock size={14} />
                Schedule follow-up
              </OutlineButton>
            </Stack>
          )}
        </Box>
      </SurfaceCard>

      {/* ── Fee agreement ─────────────────────────────────────────────────── */}
      {feeAgreement && (
        <SurfaceCard>
          <HStack justify="space-between" align="center" gap="12px">
            <CardTitle>Fee agreement</CardTitle>
            <StatusPill
              tone={feeAgreement.status === "signed" ? "success" : "warning"}
            >
              {feeAgreement.status.replace(/_/g, " ")}
            </StatusPill>
          </HStack>
          <Box mt="10px">
            <MutedText>
              {/* The agreement wizard is a multi-step flow tied to the
                  consultation stage; the drawer surfaces state and defers
                  generation to that view rather than half-reimplementing it. */}
              Generate and send agreements from the consultation stage of the
              intake pipeline.
            </MutedText>
          </Box>
        </SurfaceCard>
      )}

      {/* ── Case opening ──────────────────────────────────────────────────── */}
      {lead.pipelineStage === "case_opening" && (
        <SurfaceCard>
          <CardTitle>Case opening</CardTitle>
          <Box mt="12px">
            {isConverted ? (
              <StatusPill icon={<Check size={11} />}>Case opened</StatusPill>
            ) : (
              <BrandButton
                w="100%"
                loading={openCase.isPending}
                onClick={() => setTeamModalOpen(true)}
              >
                <FolderOpen size={14} />
                Open case
              </BrandButton>
            )}
          </Box>
        </SurfaceCard>
      )}

      {/* ── Archive / restore ─────────────────────────────────────────────── */}
      <SurfaceCard>
        <HStack justify="space-between" align="center" gap="12px">
          <Box>
            <CardTitle>{isArchived ? "Archived" : "Archive lead"}</CardTitle>
            <MutedText>
              {isArchived
                ? "Restoring returns this lead to the pipeline."
                : "Archiving removes this lead from the active pipeline."}
            </MutedText>
          </Box>

          {isArchived ? (
            <OutlineButton
              loading={restoreLead.isPending}
              onClick={() => restoreLead.mutate(lead.id)}
            >
              <RotateCcw size={14} />
              Restore
            </OutlineButton>
          ) : (
            <OutlineButton
              loading={archiveLead.isPending}
              onClick={() => archiveLead.mutate({ id: lead.id })}
              disabled={isConverted}
            >
              <Archive size={14} />
              Archive
            </OutlineButton>
          )}
        </HStack>
      </SurfaceCard>

      {/* ── Dialogs (the same ones the intake pipeline mounts) ────────────── */}
      <ResolutionDialog
        mode={resolutionMode}
        leadName={lead.name}
        isPending={resolveConflictCheck.isPending}
        onClose={() => setResolutionMode(null)}
        onConfirm={(reviewNotes) => {
          if (!resolutionMode) return;
          resolveConflictCheck.mutate(
            { id: lead.id, data: { action: resolutionMode, reviewNotes } },
            { onSuccess: () => setResolutionMode(null) },
          );
        }}
      />

      <SendQuestionnaireDialog
        open={questionnaireOpen}
        onOpenChange={setQuestionnaireOpen}
        presetLeadId={lead.id}
      />

      <QuestionnaireResponseDialog
        responseId={responseId}
        onClose={() => setResponseId(null)}
      />

      <ScheduleConsultationDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        presetLead={lead}
        parentConsultationId={
          consultation?.status === "completed" ? consultation.id : undefined
        }
      />

      <TeamSelectionModal
        leadId={lead.id}
        open={teamModalOpen}
        onOpenChange={({ open }) => setTeamModalOpen(open)}
        onSelect={(teamId) => {
          setTeamModalOpen(false);
          openCase.mutate({ id: lead.id, data: { assignedTeamId: teamId } });
        }}
      />
    </Stack>
  );
}
