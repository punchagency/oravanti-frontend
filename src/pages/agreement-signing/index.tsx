import { getAgreementSignSession } from "@/api/agreement-signing";
import type { APIError } from "@/hooks/types";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import HelloSign from "hellosign-embedded";
import { CheckCircle2, FileSignature, PenLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";

type Phase = "idle" | "signing" | "signed" | "declined";

export function AgreementSigningPage() {
  const { token = "" } = useParams();
  const [phase, setPhase] = useState<Phase>("idle");
  const clientRef = useRef<HelloSign | null>(null);

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
            <Stack gap={3} align="center">
              <CheckCircle2 size={40} color="var(--chakra-colors-green-500)" />
              <Heading size="lg">Thank you — your agreement is signed</Heading>
              <Text color="fg.muted">
                We've received your signature. Your law firm will be notified and
                will follow up with next steps. You may close this window.
              </Text>
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
