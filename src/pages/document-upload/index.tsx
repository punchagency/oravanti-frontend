import {
  getDocumentRequestByToken,
  submitDocumentByToken,
  type PublicDocumentRequest,
} from "@/api/document-requests";
import type { APIError } from "@/hooks/types";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileUp, Upload, XCircle } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

/** Why a link is no longer usable, in the client's terms. */
const deadLinkMessage: Record<string, string> = {
  SUBMITTED: "This document has already been received. Nothing more is needed.",
  EXPIRED:
    "This upload link has expired. Contact your legal team and they can send you a new one.",
  CANCELLED:
    "This request was withdrawn. Contact your legal team if you think that is a mistake.",
};

/**
 * Where a client lands from a "we need a document" email.
 *
 * Unauthenticated: the token in the URL is the only credential, and it is
 * single-use — the request flips to SUBMITTED once a file arrives.
 */
export function DocumentUploadPage() {
  const { token = "" } = useParams();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const request = useQuery({
    queryKey: ["document-request", token],
    queryFn: () => getDocumentRequestByToken(token),
    enabled: Boolean(token),
    retry: false,
  });

  const submit = useMutation({
    mutationFn: () =>
      submitDocumentByToken(token, {
        file: file as File,
        uploadedByName: name,
        uploadedByEmail: email,
        title: request.data?.requestedLabel ?? undefined,
      }),
  });

  // The request is gone, expired, cancelled or already answered. Say which —
  // "something went wrong" would leave the client with nothing to do.
  const error = submit.error as APIError | null;
  const errorMessage = error?.response?.data?.message;

  if (submit.isSuccess) {
    return (
      <Container maxW="560px" py="80px">
        <Stack align="center" gap="14px" textAlign="center">
          <Box color="green.500">
            <CheckCircle2 size={40} />
          </Box>
          <Heading size="lg" color="fg">
            Document received
          </Heading>
          <Text color="fg.muted" fontSize="15px">
            Thank you — your legal team has it and will be in touch if anything
            else is needed. You can close this page.
          </Text>
        </Stack>
      </Container>
    );
  }

  if (request.isLoading) {
    return (
      <Container maxW="560px" py="80px">
        <Flex justify="center">
          <Spinner color="brand.solid" />
        </Flex>
      </Container>
    );
  }

  // A spent or unknown link is a dead end — say so before asking for a file
  // rather than after the client has picked one.
  const notFound = request.isError;
  const dead = notFound
    ? "This upload link is not valid. Contact your legal team and they can send you a new one."
    : (deadLinkMessage[request.data?.status ?? ""] ?? null);

  if (dead) {
    return (
      <Container maxW="560px" py="80px">
        <Stack align="center" gap="14px" textAlign="center">
          <Box color="fg.muted">
            <XCircle size={40} />
          </Box>
          <Heading size="lg" color="fg">
            This link is no longer active
          </Heading>
          <Text color="fg.muted" fontSize="15px">
            {dead}
          </Text>
        </Stack>
      </Container>
    );
  }

  const details = request.data as PublicDocumentRequest;
  const canSubmit = Boolean(file && name.trim() && email.trim());

  return (
    <Container maxW="560px" py="64px">
      <Stack gap="24px">
        <Stack gap="8px">
          <Flex align="center" gap="10px" color="brand.solid">
            <FileUp size={22} />
            <Heading size="lg" color="fg">
              Upload your document
            </Heading>
          </Flex>
          <Text color="fg.muted" fontSize="14px" lineHeight="1.6">
            {details.firmName ?? "Your legal team"} has asked for a document.
            Upload it below — this link is unique to you, so there is no need to
            sign in.
          </Text>
        </Stack>

        <MatterCard details={details} />

        <Stack
          gap="16px"
          p="24px"
          border="1px solid"
          borderColor="border"
          borderRadius="12px"
          bg="bg.panel"
        >
          <Stack gap="6px">
            <Text fontSize="13px" fontWeight="600" color="fg">
              Your name
            </Text>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              bg="bg"
            />
          </Stack>

          <Stack gap="6px">
            <Text fontSize="13px" fontWeight="600" color="fg">
              Your email
            </Text>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              bg="bg"
            />
          </Stack>

          <Stack gap="6px">
            <Text fontSize="13px" fontWeight="600" color="fg">
              Document
            </Text>
            <Input
              type="file"
              p="6px"
              bg="bg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <Text fontSize="12px" color="fg.muted">
                {file.name}
              </Text>
            )}
          </Stack>

          {errorMessage && (
            <Box
              p="10px 12px"
              borderRadius="8px"
              bg="red.50"
              border="1px solid"
              borderColor="red.200"
            >
              <Text fontSize="13px" color="red.700">
                {errorMessage}
              </Text>
            </Box>
          )}

          <Button
            onClick={() => submit.mutate()}
            disabled={!canSubmit || submit.isPending}
            loading={submit.isPending}
            bg="brand.solid"
            color="brand.fg"
            alignSelf="flex-start"
          >
            <Upload size={15} />
            Upload document
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}

/**
 * Which matter this request belongs to, and what it is asking for.
 *
 * A client with more than one matter open at the firm has no way to tell two
 * upload links apart otherwise — and sending a document to the wrong file is
 * worse than not sending it.
 */
function MatterCard({ details }: { details: PublicDocumentRequest }) {
  const { matter } = details;

  const rows: { label: string; value: string }[] = [
    { label: "Document requested", value: details.requestedLabel ?? "—" },
    ...(matter.clientName
      ? [{ label: "Client", value: matter.clientName }]
      : []),
    ...(matter.reference ? [{ label: "Matter", value: matter.reference }] : []),
    ...(matter.caseType
      ? [{ label: "Case type", value: matter.caseType }]
      : []),
    ...(matter.practiceArea
      ? [{ label: "Practice area", value: matter.practiceArea }]
      : []),
    { label: "Link expires", value: formatDate(details.expiresAt) },
  ];

  return (
    <Stack
      gap="12px"
      p="20px"
      border="1px solid"
      borderColor="border"
      borderRadius="12px"
      bg="bg.subtle"
    >
      {rows.map((row) => (
        <Flex key={row.label} gap="12px" justify="space-between" wrap="wrap">
          <Text fontSize="13px" color="fg.muted">
            {row.label}
          </Text>
          <Text
            fontSize="13px"
            fontWeight="600"
            color="fg"
            textAlign="right"
            maxW="60%"
          >
            {row.value}
          </Text>
        </Flex>
      ))}

      {details.message && (
        <Box borderTop="1px solid" borderColor="border" pt="12px">
          <Text fontSize="13px" color="fg.muted" mb="4px">
            Why it is needed
          </Text>
          <Text fontSize="13px" color="fg" lineHeight="1.6">
            {details.message}
          </Text>
        </Box>
      )}
    </Stack>
  );
}
