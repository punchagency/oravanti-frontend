import { submitDocumentByToken } from "@/api/document-requests";
import type { APIError } from "@/hooks/types";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, FileUp, Upload } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";

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

  const submit = useMutation({
    mutationFn: () =>
      submitDocumentByToken(token, {
        file: file as File,
        uploadedByName: name,
        uploadedByEmail: email,
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
            Your legal team has asked for a document. Upload it below — this link
            is unique to you, so there is no need to sign in.
          </Text>
        </Stack>

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
