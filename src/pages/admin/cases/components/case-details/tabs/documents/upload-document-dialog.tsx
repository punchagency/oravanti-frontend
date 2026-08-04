import { DOCUMENT_CATEGORIES, type DocumentCategory } from "@/api/documents";
import { useUploadCaseDocument } from "@/hooks/use-documents";
import {
  Box,
  Button,
  chakra,
  createListCollection,
  Dialog,
  Field,
  Input,
  Portal,
  Select,
  Text,
  VStack,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { useState } from "react";

const categoryOptions = createListCollection({
  items: [
    { value: "", label: "Uncategorised" },
    ...DOCUMENT_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
  ],
});

/** Strip the extension so the suggested title reads like a name, not a file. */
const titleFromFile = (name: string) => name.replace(/\.[^.]+$/, "");

export function UploadDocumentDialog({
  caseId,
  open,
  onOpenChange,
}: {
  caseId: string;
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
            maxW="460px"
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
                aria-label="Close upload dialog"
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

            <UploadForm
              caseId={caseId}
              onDone={() => onOpenChange({ open: false })}
            />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

/**
 * The form lives below `unmountOnExit`, so closing the dialog discards its
 * state. Resetting on `open` instead would mean either an effect that fights
 * the render cycle or tearing down `Dialog.Root` under its own focus trap.
 */
function UploadForm({
  caseId,
  onDone,
}: {
  caseId: string;
  onDone: () => void;
}) {
  const upload = useUploadCaseDocument(caseId);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("Choose a file to upload");
      return;
    }
    const resolvedTitle = title.trim() || titleFromFile(file.name);
    upload.mutate(
      {
        caseId,
        title: resolvedTitle,
        category: (category || undefined) as DocumentCategory | undefined,
        file,
      },
      { onSuccess: onDone },
    );
  };

  return (
    <Box as="form" p="32px 24px 24px" onSubmit={onSubmit}>
      <Dialog.Title
        color="fg"
        fontSize="17px"
        fontWeight="600"
        lineHeight="1.2"
      >
        Upload document
      </Dialog.Title>
      <Text fontSize="13px" color="fg.muted" mt="4px">
        The file is attached to this matter and queued for AI review.
      </Text>

      <VStack align="stretch" gap="12px" mt="18px">
        <Field.Root invalid={Boolean(error)}>
          <Field.Label>
            File
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            type="file"
            p="6px"
            bg="bg"
            borderColor="border"
            borderRadius="7px"
            fontSize="13px"
            onChange={(e) => {
              const picked = e.target.files?.[0] ?? null;
              setFile(picked);
              setError(null);
              if (picked && !title.trim()) {
                setTitle(titleFromFile(picked.name));
              }
            }}
          />
          {error && <Field.ErrorText>{error}</Field.ErrorText>}
        </Field.Root>

        <Field.Root>
          <Field.Label>Title</Field.Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Passport biographic page"
            {...inputStyles}
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>Category</Field.Label>
          <Select.Root
            collection={categoryOptions}
            size="sm"
            value={[category]}
            onValueChange={(e) => setCategory(e.value[0] ?? "")}
          >
            <Select.Control>
              <Select.Trigger
                h="36px"
                border="1px solid"
                borderColor="border"
                borderRadius="7px"
                bg="bg"
              >
                <Select.ValueText placeholder="Uncategorised" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {categoryOptions.items.map((opt) => (
                    <Select.Item
                      item={opt}
                      key={opt.value}
                      _hover={{ bg: "bg.muted" }}
                      _focus={{ bg: "bg.subtle" }}
                      bg="transparent"
                      _selected={{ bg: "transparent" }}
                    >
                      <Select.ItemText>{opt.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
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
        loading={upload.isPending}
      >
        Upload
      </Button>
    </Box>
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
