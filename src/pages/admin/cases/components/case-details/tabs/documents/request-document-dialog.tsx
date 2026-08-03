import { useCreateDocumentRequest } from "@/hooks/use-documents";
import {
  Box,
  Button,
  chakra,
  Dialog,
  Field,
  HStack,
  Input,
  Portal,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { Copy, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/** Matches the backend default so the field and the server agree. */
const DEFAULT_EXPIRY_DAYS = 14;

type FormState = {
  requestedLabel: string;
  recipientName: string;
  recipientEmail: string;
  message: string;
  expiryDays: string;
};

const emptyForm: FormState = {
  requestedLabel: "",
  recipientName: "",
  recipientEmail: "",
  message: "",
  expiryDays: String(DEFAULT_EXPIRY_DAYS),
};

type Client = { name: string; email?: string | null } | null;

export function RequestDocumentDialog({
  caseId,
  client,
  open,
  onOpenChange,
}: {
  caseId: string;
  client: Client;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
      placement="center"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="480px"
            border="1px solid"
            borderColor="border"
            borderRadius="14px"
            bg="bg"
            p="0"
            boxShadow="0 24px 70px rgba(0, 0, 0, 0.26)"
          >
            <Dialog.CloseTrigger asChild>
              <chakra.button
                type="button"
                aria-label="Close document request dialog"
                position="absolute"
                top="22px"
                right="22px"
                display="grid"
                placeItems="center"
                w="32px"
                h="32px"
                border="1px solid"
                borderColor="border"
                borderRadius="8px"
                bg="bg"
                color="fg.muted"
              >
                <X size={16} />
              </chakra.button>
            </Dialog.CloseTrigger>

            <RequestForm
              caseId={caseId}
              client={client}
              onDone={() => onOpenChange({ open: false })}
            />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

/**
 * Below `unmountOnExit`, so the draft (and the sent link) is discarded when the
 * dialog closes and the client prefill is read fresh on each open.
 */
function RequestForm({
  caseId,
  client,
  onDone,
}: {
  caseId: string;
  client: Client;
  onDone: () => void;
}) {
  const createRequest = useCreateDocumentRequest();
  const [form, setForm] = useState<FormState>({
    ...emptyForm,
    recipientName: client?.name ?? "",
    recipientEmail: client?.email ?? "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  /** Kept after a send so the firm can pass the link on if the email bounced. */
  const [sentLink, setSentLink] = useState<string | null>(null);

  const set = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.requestedLabel.trim()) {
      nextErrors.requestedLabel = "Say what you need from the client";
    }
    if (!form.recipientEmail.trim()) {
      nextErrors.recipientEmail = "A recipient email is required";
    }
    const days = Number(form.expiryDays);
    if (!Number.isFinite(days) || days < 1) {
      nextErrors.expiryDays = "Enter a number of days";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    createRequest.mutate(
      {
        caseId,
        requestedLabel: form.requestedLabel.trim(),
        recipientEmail: form.recipientEmail.trim(),
        recipientName: form.recipientName.trim() || undefined,
        message: form.message.trim() || undefined,
        expiresAt: new Date(
          Date.now() + days * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      { onSuccess: (request) => setSentLink(request.uploadLink) },
    );
  };

  const copyLink = async () => {
    if (!sentLink) return;
    await navigator.clipboard.writeText(sentLink);
    toast.success("Upload link copied");
  };

  return (
    <>
      {sentLink ? (
        <Box p="32px 24px 24px">
          <Dialog.Title
            color="fg"
            fontSize="17px"
            fontWeight="600"
            lineHeight="1.2"
          >
            Request sent
          </Dialog.Title>
          <Text fontSize="13px" color="fg.muted" mt="6px">
            {form.recipientEmail} can upload straight from the email. The link
            below is the same one — share it only with them.
          </Text>
          <HStack
            mt="16px"
            gap="8px"
            border="1px solid"
            borderColor="border"
            borderRadius="8px"
            bg="bg.subtle"
            p="10px 12px"
          >
            <Text
              fontSize="12px"
              color="fg.muted"
              truncate
              flex="1"
              title={sentLink}
            >
              {sentLink}
            </Text>
            <Button
              size="xs"
              variant="outline"
              borderColor="border"
              onClick={copyLink}
            >
              <Copy size={13} />
              Copy
            </Button>
          </HStack>
          <Button
            w="full"
            mt="20px"
            h="40px"
            bg="brand.solid"
            color="brand.fg"
            _hover={{ bg: "brand.600" }}
            fontWeight="600"
            onClick={onDone}
          >
            Done
          </Button>
        </Box>
      ) : (
        <Box as="form" p="32px 24px 24px" onSubmit={onSubmit}>
          <Dialog.Title
            color="fg"
            fontSize="17px"
            fontWeight="600"
            lineHeight="1.2"
          >
            Request from client
          </Dialog.Title>
          <Text fontSize="13px" color="fg.muted" mt="4px">
            Emails a one-time upload link. Whatever they send lands on this
            matter.
          </Text>

          <VStack align="stretch" gap="12px" mt="18px">
            <Field.Root invalid={Boolean(errors.requestedLabel)}>
              <Field.Label>
                Document requested
                <Field.RequiredIndicator />
              </Field.Label>
              <Input
                value={form.requestedLabel}
                onChange={(e) => set("requestedLabel")(e.target.value)}
                placeholder="e.g. I-693 medical examination report"
                {...inputStyles}
              />
              {errors.requestedLabel && (
                <Field.ErrorText>{errors.requestedLabel}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root>
              <Field.Label>Recipient name</Field.Label>
              <Input
                value={form.recipientName}
                onChange={(e) => set("recipientName")(e.target.value)}
                placeholder="Full name"
                {...inputStyles}
              />
            </Field.Root>

            <Field.Root invalid={Boolean(errors.recipientEmail)}>
              <Field.Label>
                Recipient email
                <Field.RequiredIndicator />
              </Field.Label>
              <Input
                type="email"
                value={form.recipientEmail}
                onChange={(e) => set("recipientEmail")(e.target.value)}
                placeholder="client@example.com"
                {...inputStyles}
              />
              {errors.recipientEmail && (
                <Field.ErrorText>{errors.recipientEmail}</Field.ErrorText>
              )}
            </Field.Root>

            <Field.Root>
              <Field.Label>Why it is needed (optional)</Field.Label>
              <Textarea
                value={form.message}
                onChange={(e) => set("message")(e.target.value)}
                placeholder="Shown to the client in the email."
                rows={3}
                borderColor="border"
                borderRadius="7px"
                bg="bg"
                fontSize="13px"
                _placeholder={{ color: "fg.muted" }}
              />
            </Field.Root>

            <Field.Root invalid={Boolean(errors.expiryDays)}>
              <Field.Label>Link expires in (days)</Field.Label>
              <Input
                type="number"
                min={1}
                value={form.expiryDays}
                onChange={(e) => set("expiryDays")(e.target.value)}
                {...inputStyles}
              />
              {errors.expiryDays && (
                <Field.ErrorText>{errors.expiryDays}</Field.ErrorText>
              )}
            </Field.Root>
          </VStack>

          <Button
            type="submit"
            w="full"
            mt="24px"
            h="40px"
            bg="brand.solid"
            color="brand.fg"
            _hover={{ bg: "brand.600" }}
            fontWeight="600"
            loading={createRequest.isPending}
          >
            Send request
          </Button>
        </Box>
      )}
    </>
  );
}

const inputStyles = {
  h: "36px",
  px: "12px",
  border: "1px solid",
  borderColor: "border",
  borderRadius: "7px",
  bg: "bg",
  color: "fg",
  fontSize: "13px",
  _placeholder: { color: "fg.muted" },
  _focus: {
    borderColor: "brand.solid",
    boxShadow: "0 0 0 1px var(--brand-cta)",
  },
};
