import {
  Box,
  chakra,
  Container,
  Flex,
  Heading,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import {
  getQuestionnaireByToken,
  saveDraftByToken,
  submitByToken,
  uploadFileByToken,
  type PortalQuestion,
} from "@/api/questionnaires";
import { DateField } from "@/components/ui/date-field";

const fieldStyles = {
  w: "full",
  px: "12px",
  py: "9px",
  border: "1px solid",
  borderColor: "border",
  borderRadius: "8px",
  bg: "bg",
  color: "fg",
  fontSize: "14px",
} as const;

export function QuestionnairePortalPage() {
  const { token } = useParams<{ firmSlug: string; token: string }>();
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["portal-questionnaire", token],
    queryFn: () => getQuestionnaireByToken(token as string),
    enabled: Boolean(token),
  });

  const responseId = data?.response?.id ?? null;
  const sections = data?.questionnaire?.sections ?? [];

  // Seed the form with previously-saved answers the first time the response loads
  // (render-phase "adjust state on prop change" — keyed by response id so it runs
  // once and never clobbers in-progress edits or the post-submit refetch).
  if (data && responseId && hydratedFor !== responseId) {
    setHydratedFor(responseId);
    const seeded: Record<string, unknown> = {};
    for (const a of data.response?.answers ?? []) seeded[a.questionId] = a.value;
    setAnswers(seeded);
  }

  // Map of questionId -> filename for documents already uploaded, so resumed
  // file fields show the upload instead of an empty picker.
  const uploadedFiles = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of data?.response?.files ?? []) map[f.questionId] = f.originalFilename;
    return map;
  }, [data?.response?.files]);

  const flatAnswers = useMemo(
    () =>
      Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      })),
    [answers],
  );

  const saveDraft = useMutation({
    mutationFn: () =>
      saveDraftByToken(token as string, { answers: flatAnswers }),
    onSuccess: () => toast.success("Progress saved"),
    onError: () => toast.error("Could not save progress"),
  });

  const submit = useMutation({
    mutationFn: () => submitByToken(token as string, { answers: flatAnswers }),
    onSuccess: () => {
      setSubmitted(true);
      qc.invalidateQueries({ queryKey: ["portal-questionnaire", token] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(
        err.response?.data?.message ??
          "Please complete all required fields before submitting",
      ),
  });

  const setAnswer = (questionId: string, value: unknown) =>
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

  if (isLoading) {
    return (
      <Center>
        <Loader2 className="spin" />
        <Text mt="12px" color="fg.muted">
          Loading your questionnaire…
        </Text>
      </Center>
    );
  }

  if (isError || !data) {
    return (
      <Center>
        <Heading size="md">Link not found or expired</Heading>
        <Text mt="8px" color="fg.muted" textAlign="center">
          This questionnaire link is invalid, expired, or has already been
          submitted. Please contact your attorney's office for assistance.
        </Text>
      </Center>
    );
  }

  if (submitted || data.response?.status === "submitted") {
    return (
      <Center>
        <Box color="#1f9e75" display="flex" justifyContent="center" alignItems="center">
          <CheckCircle2 size={48} />
        </Box>
        <Heading size="md" mt="16px">
          Thank you — your responses were submitted
        </Heading>
        <Text mt="8px" color="fg.muted" textAlign="center">
          Your attorney's office has received your questionnaire and will be in
          touch. You can close this window.
        </Text>
      </Center>
    );
  }

  return (
    <Box minH="100dvh" bg="bg.subtle" py={{ base: "24px", md: "48px" }}>
      <Container maxW="720px">
        <Box mb="24px">
          <Heading size="lg" color="fg">
            {data.questionnaire?.title ?? "Intake Questionnaire"}
          </Heading>
          <Text mt="6px" color="fg.muted" fontSize="14px">
            Please answer the questions below. Your responses are confidential
            and secured. You can save your progress and return later.
          </Text>
        </Box>

        <Stack gap="20px">
          {sections.map((section) => (
            <Box
              key={section.id}
              border="1px solid"
              borderColor="border"
              borderRadius="12px"
              bg="bg"
              p={{ base: "16px", md: "24px" }}
            >
              <Heading size="sm" color="fg" mb="4px">
                {section.title}
              </Heading>
              {section.description ? (
                <Text color="fg.muted" fontSize="13px" mb="8px">
                  {section.description}
                </Text>
              ) : null}
              <Stack gap="18px" mt="14px">
                {section.questions.map((q) => (
                  <QuestionField
                    key={q.id}
                    question={q}
                    value={answers[q.id]}
                    token={token as string}
                    responseId={responseId}
                    uploadedFilename={uploadedFiles[q.id] ?? null}
                    onChange={(v) => setAnswer(q.id, v)}
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>

        <Flex justify="space-between" gap="12px" mt="24px" wrap="wrap">
          <chakra.button
            type="button"
            onClick={() => saveDraft.mutate()}
            disabled={saveDraft.isPending}
            px="18px"
            py="10px"
            borderRadius="8px"
            border="1px solid"
            borderColor="border"
            bg="bg"
            color="fg"
            fontSize="14px"
            fontWeight="500"
          >
            {saveDraft.isPending ? "Saving…" : "Save progress"}
          </chakra.button>
          <chakra.button
            type="button"
            onClick={() => submit.mutate()}
            disabled={submit.isPending}
            px="22px"
            py="10px"
            borderRadius="8px"
            bg="brand.solid"
            color="brand.fg"
            fontSize="14px"
            fontWeight="600"
          >
            {submit.isPending ? "Submitting…" : "Submit questionnaire"}
          </chakra.button>
        </Flex>
      </Container>
    </Box>
  );
}

function QuestionField({
  question,
  value,
  token,
  responseId,
  uploadedFilename,
  onChange,
}: {
  question: PortalQuestion;
  value: unknown;
  token: string;
  responseId: string | null;
  uploadedFilename: string | null;
  onChange: (value: unknown) => void;
}) {
  const label = (
    <Text fontSize="14px" fontWeight="500" color="fg" mb="6px">
      {question.label}
      {question.isRequired ? (
        <chakra.span color="#ff2d55"> *</chakra.span>
      ) : null}
    </Text>
  );

  if (question.type === "long_text") {
    return (
      <Box>
        {label}
        <chakra.textarea
          {...fieldStyles}
          minH="92px"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </Box>
    );
  }

  if (question.type === "yes_no") {
    return (
      <Box>
        {label}
        <HStack gap="8px">
          {["Yes", "No"].map((opt) => {
            const active = value === opt;
            return (
              <chakra.button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                px="18px"
                py="8px"
                borderRadius="8px"
                border="1px solid"
                borderColor={active ? "brand.solid" : "border"}
                bg={active ? "brand.solid" : "bg"}
                color={active ? "brand.fg" : "fg"}
                fontSize="13px"
                fontWeight="500"
              >
                {opt}
              </chakra.button>
            );
          })}
        </HStack>
      </Box>
    );
  }

  if (question.type === "file_upload") {
    return (
      <Box>
        {label}
        <FileUploadField
          token={token}
          responseId={responseId}
          questionId={question.id}
          initialFilename={uploadedFilename}
        />
      </Box>
    );
  }

  if (question.type === "date") {
    return (
      <Box>
        {label}
        <DateField
          ariaLabel={question.label}
          value={(value as string) ?? ""}
          onChange={(next) => onChange(next)}
        />
      </Box>
    );
  }

  const inputType =
    question.type === "email"
      ? "email"
      : question.type === "phone"
        ? "tel"
        : question.type === "number"
          ? "number"
          : "text";

  return (
    <Box>
      {label}
      <chakra.input
        {...fieldStyles}
        type={inputType}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </Box>
  );
}

function FileUploadField({
  token,
  responseId,
  questionId,
  initialFilename,
}: {
  token: string;
  responseId: string | null;
  questionId: string;
  initialFilename: string | null;
}) {
  const [uploadedName, setUploadedName] = useState<string | null>(
    initialFilename,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const upload = useMutation({
    mutationFn: (file: File) => {
      if (!responseId) {
        throw new Error(
          "Please answer a question or save progress before uploading documents.",
        );
      }
      return uploadFileByToken(token, { responseId, questionId, file });
    },
    onSuccess: (_data, file) => {
      setUploadedName(file.name);
      toast.success("Document uploaded");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Upload failed — please try again");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  });

  return (
    <chakra.label
      display="flex"
      alignItems="center"
      gap="10px"
      px="14px"
      py="12px"
      border="1px dashed"
      borderColor="border"
      borderRadius="8px"
      bg="bg.subtle"
      cursor="pointer"
      fontSize="13px"
      color="fg.muted"
    >
      <Upload size={16} />
      {upload.isPending
        ? "Uploading…"
        : (uploadedName ?? "Choose a file to upload")}
      <chakra.input
        type="file"
        display="none"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload.mutate(file);
        }}
      />
    </chakra.label>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <Flex
      minH="100dvh"
      direction="column"
      align="center"
      justify="center"
      bg="bg.subtle"
      px="24px"
    >
      <Box maxW="420px" textAlign="center">
        {children}
      </Box>
    </Flex>
  );
}
