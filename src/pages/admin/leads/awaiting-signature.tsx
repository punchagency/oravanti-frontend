import {
  getFirmSignSession,
  type AgreementAwaitingSignature,
} from "@/api/leads";
import type { APIError } from "@/hooks/types";
import { useEmbeddedSigning } from "@/hooks/use-embedded-signing";
import { useAgreementsAwaitingSignature } from "@/hooks/use-leads";
import {
  Box,
  Button,
  Flex,
  HStack,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, FileSignature, PenLine } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";

/**
 * What is waiting on the signed-in user's signature.
 *
 * The counterpart to the fee-agreement card, which can only be reached by
 * already knowing which lead an agreement belongs to. An attorney back from a
 * week away has no such knowledge, and a notification they have scrolled past
 * is not a work queue.
 *
 * Rows whose turn has not come are listed too, greyed rather than hidden: on a
 * client-first agreement the attorney can do nothing until the client signs,
 * but the point of a queue is to show the week, not only the next click.
 */
function relativeDays(iso: string): string {
  const days = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function SignatureRow({ agreement }: { agreement: AgreementAwaitingSignature }) {
  const qc = useQueryClient();

  const openSigningModal = useEmbeddedSigning({
    // Advisory: the provider's webhook is the record, and it is still in flight
    // when this fires. Refetch and let the server say what happened.
    onSigned: () => {
      toast.success("Signed — finalising with the e-signature provider");
      qc.invalidateQueries({ queryKey: ["agreements", "awaiting-signature"] });
      qc.invalidateQueries({ queryKey: ["lead"] });
    },
    onClosed: () =>
      qc.invalidateQueries({ queryKey: ["agreements", "awaiting-signature"] }),
  });

  const startSigning = useMutation({
    mutationFn: () => getFirmSignSession(agreement.id),
    onSuccess: (session) => openSigningModal(session),
    onError: (err: APIError) =>
      toast.error(
        err.response?.data?.message ?? "Could not open the agreement to sign",
      ),
  });

  return (
    <Flex
      align="center"
      justify="space-between"
      gap="16px"
      p="16px"
      borderBottom="1px solid"
      borderColor="border.subtle"
      _last={{ borderBottom: "none" }}
      opacity={agreement.canSign ? 1 : 0.72}
    >
      <Box minW={0}>
        <HStack gap="8px" wrap="wrap">
          <Text m="0" fontSize="14px" fontWeight="600" color="fg">
            {agreement.leadName}
          </Text>
          {agreement.docRef ? (
            <Text m="0" fontSize="12px" color="fg.subtle">
              {agreement.docRef}
            </Text>
          ) : null}
        </HStack>
        <Text m="0" fontSize="12px" color="fg.muted" mt="2px">
          {agreement.matterType ? `${agreement.matterType} · ` : ""}
          {agreement.canSign
            ? agreement.signingOrder === "firm_first"
              ? `Ready for your signature — sent ${relativeDays(agreement.sentAt)}`
              : `Client signed ${relativeDays(agreement.clientSignedAt ?? agreement.sentAt)}`
            : "Waiting on the client to sign first"}
        </Text>
      </Box>

      <HStack gap="8px" flexShrink={0}>
        <Button asChild size="sm" variant="outline">
          <Link to={`/leads/${agreement.leadId}/consultation`}>
            View agreement
          </Link>
        </Button>
        {agreement.canSign ? (
          <Button
            size="sm"
            loading={startSigning.isPending}
            onClick={() => startSigning.mutate()}
          >
            <PenLine size={14} /> Sign
          </Button>
        ) : (
          <HStack gap="4px" color="fg.subtle" fontSize="12px" px="8px">
            <Clock size={13} /> Not yet
          </HStack>
        )}
      </HStack>
    </Flex>
  );
}

export function AwaitingSignaturePage() {
  const { data, isLoading } = useAgreementsAwaitingSignature();

  return (
    <Box p={{ base: "16px", md: "24px" }} maxW="900px">
      <Stack gap="4px" mb="20px">
        <Text m="0" textStyle="heading">
          Awaiting my signature
        </Text>
        <Text m="0" fontSize="13px" color="fg.muted">
          Fee agreements assigned to you to sign on the firm's behalf.
        </Text>
      </Stack>

      <Box border="1px solid" borderColor="border" borderRadius="10px" bg="bg">
        {isLoading ? (
          <Stack gap="12px" p="16px">
            <Skeleton h="18px" w="40%" borderRadius="4px" />
            <Skeleton h="18px" w="55%" borderRadius="4px" />
          </Stack>
        ) : !data?.length ? (
          <Stack align="center" gap="8px" py="48px" px="16px">
            <FileSignature size={28} color="var(--chakra-colors-fg-subtle)" />
            <Text m="0" fontSize="14px" fontWeight="600" color="fg">
              Nothing to sign
            </Text>
            <Text m="0" fontSize="12px" color="fg.muted" textAlign="center">
              Agreements assigned to you appear here as soon as they are sent
              out for signature.
            </Text>
          </Stack>
        ) : (
          data.map((agreement) => (
            <SignatureRow key={agreement.id} agreement={agreement} />
          ))
        )}
      </Box>
    </Box>
  );
}
