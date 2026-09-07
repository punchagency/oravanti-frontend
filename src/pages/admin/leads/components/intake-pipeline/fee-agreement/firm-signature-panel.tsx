import { getFirmSignSession, type FeeAgreement } from "@/api/leads";
import { FormSelect } from "@/components/ui/form-select";
import { BrandButton, MutedText, OutlineButton } from "@/components/ui/intake-ui";
import { useEligibleSigners } from "@/hooks/use-fee-agreement-settings";
import { useEmbeddedSigning } from "@/hooks/use-embedded-signing";
import {
  useReassignFirmSigner,
  useRemindFirmSigner,
} from "@/hooks/use-leads";
import type { APIError } from "@/hooks/types";
import { Dialog, HStack, Portal, Stack, Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, PenLine, UserCog } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { pendingSignatureSummary } from "./fee-agreement-status";

/**
 * The fee-agreement card body while an agreement is out for signature.
 *
 * Covers both shapes — a client-only agreement, which behaves exactly as it
 * always has, and a counter-signed one, where the card has to say whose
 * signature the flow is waiting on and offer the assigned signer a way to give
 * it. Shared by the two hosts that render this card.
 */
export function FirmSignaturePanel({
  agreement,
  onMarkReceived,
  markingReceived,
  onNudgeClient,
  nudgingClient,
}: {
  agreement: FeeAgreement;
  onMarkReceived: () => void;
  markingReceived: boolean;
  onNudgeClient: () => void;
  nudgingClient: boolean;
}) {
  const qc = useQueryClient();
  const [reassignOpen, setReassignOpen] = useState(false);
  const [nextSignerId, setNextSignerId] = useState("");

  const remind = useRemindFirmSigner();
  const reassign = useReassignFirmSigner();
  const { data: signers } = useEligibleSigners(reassignOpen);

  const openSigningModal = useEmbeddedSigning({
    // Advisory only — the provider's webhook is what records the signature, and
    // it is still in flight when this fires. Refetch and let the server say.
    onSigned: () => {
      toast.success("Signed — finalising with the e-signature provider");
      qc.invalidateQueries({ queryKey: ["lead"] });
    },
    onClosed: () => qc.invalidateQueries({ queryKey: ["lead"] }),
  });

  const startSigning = useMutation({
    mutationFn: () => getFirmSignSession(agreement.id),
    onSuccess: (session) => openSigningModal(session),
    onError: (err: APIError) =>
      toast.error(
        err.response?.data?.message ?? "Could not open the agreement to sign",
      ),
  });

  const signerOptions = useMemo(
    () =>
      (signers ?? [])
        .filter((s) => s.staffId !== agreement.firmSigner?.staffId)
        .map((s) => ({
          value: s.staffId,
          label: s.jobTitle ? `${s.name} — ${s.jobTitle}` : s.name,
        })),
    [signers, agreement.firmSigner?.staffId],
  );

  // A client-only agreement keeps precisely the actions it had before.
  if (!agreement.firmSigner) {
    return (
      <Stack gap="10px">
        <MutedText>{pendingSignatureSummary(agreement)}</MutedText>
        <HStack gap="8px" wrap="wrap">
          <BrandButton loading={markingReceived} onClick={onMarkReceived}>
            Mark as received
          </BrandButton>
          <OutlineButton loading={nudgingClient} onClick={onNudgeClient}>
            <Mail size={14} />
            Nudge client
          </OutlineButton>
        </HStack>
      </Stack>
    );
  }

  const awaitingClient =
    agreement.signingOrder === "firm_first"
      ? Boolean(agreement.firmSignedAt) && !agreement.clientSignedAt
      : !agreement.clientSignedAt;

  return (
    <Stack gap="10px">
      <MutedText>{pendingSignatureSummary(agreement)}</MutedText>
      <HStack gap="8px" wrap="wrap">
        {agreement.canSign ? (
          <BrandButton
            loading={startSigning.isPending}
            onClick={() => startSigning.mutate()}
          >
            <PenLine size={14} />
            Sign agreement
          </BrandButton>
        ) : null}

        {awaitingClient ? (
          <OutlineButton loading={nudgingClient} onClick={onNudgeClient}>
            <Mail size={14} />
            Nudge client
          </OutlineButton>
        ) : (
          // Waiting on the firm. Not gated on the signing permission — chasing
          // a colleague is administration, and whoever is chasing is routinely
          // the person who cannot sign.
          !agreement.canSign && (
            <OutlineButton
              loading={remind.isPending}
              onClick={() => remind.mutate(agreement.id)}
            >
              <Mail size={14} />
              Remind {agreement.firmSigner.name.split(" ")[0]}
            </OutlineButton>
          )
        )}

        <OutlineButton onClick={() => setReassignOpen(true)}>
          <UserCog size={14} />
          Change signer
        </OutlineButton>

        <OutlineButton loading={markingReceived} onClick={onMarkReceived}>
          Mark as received
        </OutlineButton>
      </HStack>

      <Dialog.Root
        open={reassignOpen}
        onOpenChange={(e) => setReassignOpen(e.open)}
        placement="center"
        lazyMount
        unmountOnExit
      >
        <Portal>
          <Dialog.Backdrop bg="rgba(0, 0, 0, 0.46)" />
          <Dialog.Positioner px="16px">
            <Dialog.Content w="full" maxW="440px" p="20px" borderRadius="12px">
              <Stack gap="14px">
                <Text m="0" fontSize="14px" fontWeight="600">
                  Change who signs for the firm
                </Text>
                <MutedText>
                  {agreement.clientSignedAt
                    ? "The client has already signed. Changing the signer voids the current document and emails them a new link to sign again — the agreement names its signer, so their signature cannot carry over."
                    : "The outstanding signature request is withdrawn and replaced, and the client is emailed a new link."}
                </MutedText>
                <FormSelect
                  ariaLabel="New firm signer"
                  options={signerOptions}
                  value={nextSignerId}
                  onChange={setNextSignerId}
                  placeholder="Select the new signer"
                />
                <HStack gap="8px" justify="flex-end">
                  <OutlineButton onClick={() => setReassignOpen(false)}>
                    Cancel
                  </OutlineButton>
                  <BrandButton
                    disabled={!nextSignerId}
                    loading={reassign.isPending}
                    onClick={() =>
                      reassign.mutate(
                        {
                          agreementId: agreement.id,
                          firmSignerStaffId: nextSignerId,
                        },
                        {
                          onSuccess: () => {
                            setReassignOpen(false);
                            setNextSignerId("");
                          },
                        },
                      )
                    }
                  >
                    Change signer
                  </BrandButton>
                </HStack>
              </Stack>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Stack>
  );
}
