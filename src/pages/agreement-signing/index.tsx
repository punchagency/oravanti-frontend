import {
  getAgreementPaymentSession,
  getAgreementSignSession,
} from "@/api/agreement-signing";
import type { APIError } from "@/hooks/types";
import { formatCurrency } from "@/utils/currency";
import {
  Box,
  Button,
  chakra,
  Container,
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import HelloSign from "hellosign-embedded";
import { CheckCircle2, FileSignature, PenLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";

type Phase = "idle" | "signing" | "signed" | "declined";

export function AgreementSigningPage() {
  const { token = "" } = useParams();
  const [phase, setPhase] = useState<Phase>("idle");
  const clientRef = useRef<HelloSign | null>(null);

  /**
   * What the client owes, once they have signed.
   *
   * Only asked after signing: before that there is no invoice, and the endpoint
   * would say so on every poll for nothing.
   *
   * Two reasons this polls. The invoice is raised by the e-signature webhook,
   * which is not synchronous with the signature — the embedded client fires
   * `sign` locally while the webhook is still in flight — so `pending` is
   * expected for a few seconds. And once the payment frame is open, the webhook
   * is again the only completion signal, exactly as on the invoice page.
   */
  const payment = useQuery({
    queryKey: ["agreement-payment", token],
    queryFn: () => getAgreementPaymentSession(token),
    enabled: phase === "signed" && Boolean(token),
    // Three seconds: someone is watching a card go through, or waiting on an
    // invoice that is seconds away.
    refetchInterval: (query) => {
      const state = query.state.data?.state;
      if (state === "pending") return 3000;
      if (state === "ready") return 3000;
      return false;
    },
    // The signature already succeeded and is recorded server-side. A hiccup
    // fetching the bill must never be presented as a failure to sign.
    retry: 2,
  });

  const pay = payment.data;

  // Tear down the embedded client on unmount.
  useEffect(() => {
    return () => {
      clientRef.current?.close();
      clientRef.current = null;
    };
  }, []);

  const startSigning = useMutation({
    mutationFn: () => getAgreementSignSession(token),
    onSuccess: (session) => {
      const client = new HelloSign({
        clientId: session.clientId ?? undefined,
        // Dev/stub only — real embedded signing verifies the app's domains.
        skipDomainVerification: import.meta.env.DEV,
      });
      clientRef.current = client;

      client.on("sign", () => setPhase("signed"));
      client.on("decline", () => setPhase("declined"));
      client.on("close", () =>
        setPhase((p) => (p === "signed" || p === "declined" ? p : "idle")),
      );

      setPhase("signing");
      client.open(session.signUrl, {
        skipDomainVerification: import.meta.env.DEV,
      });
    },
  });

  const errorMessage =
    (startSigning.error as APIError | undefined)?.response?.data?.message ??
    "We couldn't open your agreement. The link may have expired or already been used.";

  return (
    <Box minH="100dvh" bg="bg.subtle" py={{ base: 8, md: 16 }}>
      <Container maxW="lg">
        <Stack gap={6} align="center" textAlign="center">
          <Flex
            w={12}
            h={12}
            align="center"
            justify="center"
            rounded="full"
            bg="brand.solid"
            color="brand.contrast"
          >
            <FileSignature size={22} />
          </Flex>

          {phase === "signed" ? (
            <Stack gap={5} align="center" w="full">
              <Stack gap={3} align="center">
                <CheckCircle2 size={40} color="var(--chakra-colors-green-500)" />
                <Heading size="lg">Thank you — your agreement is signed</Heading>
                <Text color="fg.muted">
                  {pay?.state === "ready"
                    ? "One last step: your firm asks for payment now to open your case."
                    : "We've received your signature. Your law firm will be notified and will follow up with next steps."}
                </Text>
              </Stack>

              {pay?.state === "pending" ? (
                <Flex align="center" gap={2} color="fg.muted" fontSize="sm">
                  <Spinner size="sm" /> Preparing your invoice…
                </Flex>
              ) : null}

              {pay?.state === "settled" ? (
                <Text color="fg.muted" fontSize="sm">
                  Your payment has been received in full. You may close this
                  window.
                </Text>
              ) : null}

              {pay?.state === "unavailable" && pay.reason ? (
                <Text color="fg.muted" fontSize="sm">
                  {pay.reason}
                </Text>
              ) : null}

              {pay?.state === "ready" && pay.url ? (
                <Box w="full">
                  {pay.amountDueNow != null ? (
                    <Text
                      fontSize="sm"
                      fontWeight="600"
                      color="fg"
                      mb={2}
                      textAlign="center"
                    >
                      Amount due: {formatCurrency(pay.amountDueNow)}
                    </Text>
                  ) : null}
                  {/* Embedded rather than a redirect, matching the invoice
                      page: Confido provides no return URL, so a redirect would
                      strand the payer on someone else's confirmation screen. */}
                  <Box
                    border="1px solid"
                    borderColor="border"
                    borderRadius="10px"
                    overflow="hidden"
                    bg="bg.muted"
                    h={{ base: "520px", md: "620px" }}
                  >
                    <chakra.iframe
                      src={pay.url}
                      title="Pay your fee agreement"
                      w="100%"
                      h="100%"
                      border="none"
                    />
                  </Box>
                  <Text
                    fontSize="12px"
                    color="fg.subtle"
                    mt="10px"
                    textAlign="center"
                  >
                    This page updates on its own once your payment goes through.{" "}
                    {/* Always shown, never conditional — the card fields live
                        in frames nested inside the payment page, and a
                        cross-origin frame that refuses to load reports nothing
                        to its parent, so a link that only appeared on failure
                        would never appear at all. */}
                    <chakra.a
                      href={pay.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      textDecoration="underline"
                      _hover={{ color: "fg" }}
                    >
                      Having trouble? Open the payment page in a new tab.
                    </chakra.a>
                  </Text>
                </Box>
              ) : null}

              {/* The signature is safe either way, so a failure to load the
                  bill is a footnote rather than an error state. The firm still
                  emails the invoice. */}
              {payment.isError ? (
                <Text color="fg.muted" fontSize="sm">
                  We could not load your invoice just now. Your firm will email
                  it to you shortly.
                </Text>
              ) : null}
            </Stack>
          ) : phase === "declined" ? (
            <Stack gap={3} align="center">
              <Heading size="lg">Signing was declined</Heading>
              <Text color="fg.muted">
                You chose not to sign the agreement. If this was a mistake, please
                contact your law firm to have the agreement re-sent.
              </Text>
            </Stack>
          ) : (
            <Stack gap={4} align="center">
              <Heading size="lg">Sign your fee agreement</Heading>
              <Text color="fg.muted" maxW="md">
                Please review your fee agreement and add your signature. This
                opens a secure signing window from our e-signature provider.
              </Text>

              {startSigning.isError && (
                <Box
                  w="full"
                  bg="red.subtle"
                  color="red.fg"
                  rounded="md"
                  px={4}
                  py={3}
                  fontSize="sm"
                >
                  {errorMessage}
                </Box>
              )}

              <Button
                colorPalette="brand"
                size="lg"
                loading={startSigning.isPending || phase === "signing"}
                onClick={() => startSigning.mutate()}
              >
                <PenLine size={16} />
                Review &amp; sign
              </Button>

              {phase === "signing" && (
                <Flex align="center" gap={2} color="fg.muted" fontSize="sm">
                  <Spinner size="sm" /> Opening your agreement…
                </Flex>
              )}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
