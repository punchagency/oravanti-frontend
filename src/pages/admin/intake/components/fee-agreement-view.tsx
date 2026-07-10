import { Box, HStack, Stack } from "@chakra-ui/react";
import { FileText, Link2, PenLine, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import type {
  FeeAgreementDetails,
  FeeAgreementPreview,
  Lead,
} from "@/api/leads";
import { formatReceivedDate } from "@/api/leads";
import {
  useLeads,
  useLeadById,
  useNudgeClient,
  useGenerateFeeAgreement,
  useAdvanceLeadStage,
  useDiscardFeeAgreement,
  useFeeAgreementPreview,
  useMarkFeeAgreementPaymentReceived,
  useSendFeeAgreement,
} from "@/hooks/use-leads";
import { useConsultationSettings } from "@/hooks/use-consultation-settings";
import {
  BrandButton,
  CardTitle,
  IntakeListSkeleton,
  MutedText,
  OutlineButton,
  PracticePill,
  StatusPill,
  SurfaceCard,
} from "../../../../components/ui/intake-ui";
import { FeeAgreementPreviewModal } from "./consultation-view";
import { FeeAgreementWizard } from "./fee-agreement-wizard";

export function FeeAgreementView() {
  const { data, isLoading } = useLeads({ stage: "fee_agreement" });
  const leads = Array.isArray(data) ? data : (data?.leads ?? []);
  const pendingCount = leads.length;

  return (
    <Stack gap="16px" pt="24px" aria-label="Fee agreements">
      <HStack justify="space-between" gap="16px" wrap="wrap">
        <MutedText fontSize="14px">
          {isLoading
            ? "Loading…"
            : `${pendingCount} fee agreement${pendingCount === 1 ? "" : "s"} pending signature`}
        </MutedText>
        <OutlineButton>
          <FileText size={14} />
          Generate agreement
        </OutlineButton>
      </HStack>

      {isLoading ? (
        <IntakeListSkeleton />
      ) : leads.length === 0 ? (
        <MutedText>No fee agreements pending.</MutedText>
      ) : (
        <Stack gap="14px">
          {leads.map((lead) => (
            <FeeAgreementCard key={lead.id} lead={lead} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function FeeAgreementCard({ lead }: { lead: Lead }) {
  const { data: leadDetail } = useLeadById(lead.id);
  const nudge = useNudgeClient();
  const generateAgreement = useGenerateFeeAgreement();
  const advanceStage = useAdvanceLeadStage();
  const sendFee = useSendFeeAgreement();
  const markPayment = useMarkFeeAgreementPaymentReceived();
  const { data: firmFeeSettings } = useConsultationSettings();

  const agreement = leadDetail?.feeAgreement;
  const isSigned = agreement?.status === "signed";
  const isPending = agreement?.status === "pending_signature";
  // Case-opening payment gate: standard agreements need payment recorded
  // before advancing; contingency (and pre-tracking) agreements do not.
  const awaitingPayment =
    isSigned &&
    agreement?.details != null &&
    agreement.details.attorneyFee.type !== "contingency" &&
    !agreement.details.paymentReceivedAt;

  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatedPreview, setGeneratedPreview] =
    useState<FeeAgreementPreview | null>(null);
  const draftPreview = useFeeAgreementPreview(
    agreement?.id ?? null,
    previewOpen && !generatedPreview,
  );
  const previewData = generatedPreview ?? draftPreview.data ?? null;
  function closePreview() {
    setPreviewOpen(false);
    setGeneratedPreview(null);
  }

  // Config of a discarded draft — seeds the wizard so the attorney can adjust
  // and regenerate instead of starting over.
  const discardDraft = useDiscardFeeAgreement();
  const [reusedDetails, setReusedDetails] =
    useState<FeeAgreementDetails | null>(null);
  function handleDiscardDraft() {
    if (!agreement) return;
    const details = agreement.details;
    discardDraft.mutate(agreement.id, {
      onSuccess: () => {
        setReusedDetails(details);
        closePreview();
      },
    });
  }

  function handleNudge() {
    if (!agreement?.id) return;
    nudge.mutate(agreement.id);
  }

  function handleAdvanceStage() {
    advanceStage.mutate({ id: lead.id, stage: "case_opening" });
  }

  async function handleCopySigningLink() {
    if (!agreement?.signingLink) return;
    try {
      await navigator.clipboard.writeText(agreement.signingLink);
      toast.success("Signing link copied to clipboard");
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  const statusTone = isSigned ? (awaitingPayment ? "warning" : "success") : "warning";
  const statusLabel = isSigned
    ? awaitingPayment
      ? "Awaiting payment"
      : "Signed"
    : isPending
    ? "Pending signature"
    : agreement
    ? "Draft"
    : "No agreement";

  const progress = isSigned ? 100 : isPending ? 60 : 20;

  return (
    <SurfaceCard>
      <HStack align="flex-start" justify="space-between" gap="16px">
        <Box>
          <CardTitle>
            {agreement ? "Fee agreement: " : "Generate agreement: "}
            {lead.name}
          </CardTitle>
          <HStack mt="6px" gap="9px">
            <PracticePill tone="neutral">Lead</PracticePill>
            <MutedText>Received {formatReceivedDate(lead.receivedAt)}</MutedText>
          </HStack>
        </Box>
        <StatusPill tone={statusTone} icon={!isSigned ? <PenLine size={11} /> : undefined}>
          {statusLabel}
        </StatusPill>
      </HStack>

      {agreement ? (
        <Stack
          gap="8px"
          mt="26px"
          pb="24px"
          borderBottom="1px solid"
          borderColor="border.subtle"
        >
          <HStack justify="space-between" gap="16px" color="fg.muted" fontSize="12px">
            <Box as="span">
              {isSigned ? "Agreement signed by client" : "Awaiting client digital signature"}
            </Box>
            <Box as="span">{progress}% complete</Box>
          </HStack>
          <Box w="100%" h="6px" borderRadius="999px" bg="bg.subtle" overflow="hidden">
            <Box
              h="100%"
              borderRadius="inherit"
              bg="brand.solid"
              style={{ width: `${progress}%` }}
            />
          </Box>
        </Stack>
      ) : null}

      {agreement ? (
        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}
          gap="8px"
          mt="14px"
        >
          {agreement.status === "draft" ? (
            <>
              <BrandButton onClick={() => setPreviewOpen(true)}>
                <FileText size={14} />
                Preview &amp; send
              </BrandButton>
              <OutlineButton
                loading={discardDraft.isPending}
                onClick={handleDiscardDraft}
              >
                <Pencil size={14} />
                Cancel &amp; edit
              </OutlineButton>
            </>
          ) : !isSigned ? (
            <OutlineButton loading={nudge.isPending} onClick={handleNudge}>
              Nudge client
            </OutlineButton>
          ) : (
            <OutlineButton disabled>Agreement signed</OutlineButton>
          )}
          {isSigned && awaitingPayment ? (
            // Recording payment auto-advances the lead server-side. Advance
            // stays available for the dev-mode gate bypass; without it the
            // backend 409 surfaces as a toast.
            <>
              <BrandButton
                loading={markPayment.isPending}
                onClick={() => agreement?.id && markPayment.mutate(agreement.id)}
              >
                Mark payment received
              </BrandButton>
              <OutlineButton loading={advanceStage.isPending} onClick={handleAdvanceStage}>
                <PenLine size={14} />
                Advance to case opening
              </OutlineButton>
            </>
          ) : isSigned ? (
            <BrandButton loading={advanceStage.isPending} onClick={handleAdvanceStage}>
              <PenLine size={14} />
              Advance to case opening
            </BrandButton>
          ) : agreement.status === "pending_signature" && agreement.signingLink ? (
            <OutlineButton onClick={handleCopySigningLink}>
              <Link2 size={14} />
              Copy signing link
            </OutlineButton>
          ) : null}
        </Box>
      ) : (
        <Box mt="14px">
          <FeeAgreementWizard
            lead={lead}
            consultationFeeAmount={firmFeeSettings?.defaultAmount ?? null}
            generating={generateAgreement.isPending}
            initialDetails={reusedDetails}
            onSubmit={(data) =>
              generateAgreement.mutate(
                { id: lead.id, data },
                {
                  onSuccess: (preview) => {
                    setGeneratedPreview(preview);
                    setPreviewOpen(true);
                  },
                },
              )
            }
          />
        </Box>
      )}

      <FeeAgreementPreviewModal
        open={previewOpen}
        loading={draftPreview.isLoading && !generatedPreview}
        preview={previewData}
        sending={sendFee.isPending}
        onSend={() =>
          previewData &&
          sendFee.mutate(previewData.agreement.id, { onSuccess: closePreview })
        }
        onClose={closePreview}
      />
    </SurfaceCard>
  );
}
