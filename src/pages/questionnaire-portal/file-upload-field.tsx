import { uploadFileByToken } from "@/api/questionnaires";
import type { APIError } from "@/hooks/types";
import { Button, FileUpload, HStack, Text } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Attaching a document to one question.
 *
 * Uploads immediately rather than waiting for the section's Save, because a
 * file is not an answer: it belongs to the response, and holding it in the
 * browser until a later press is how a client loses a passport scan to a closed
 * tab.
 */
export function FileUploadField({
  token,
  questionId,
  initialFilename,
  ensureResponseId,
  onUploaded,
}: {
  token: string;
  questionId: string;
  initialFilename: string | null;
  /** A file can only attach to a saved response, so one is created if needed. */
  ensureResponseId: () => Promise<string>;
  onUploaded: () => void;
}) {
  const [uploadedName, setUploadedName] = useState<string | null>(
    initialFilename,
  );

  // The server is the authority on what has been uploaded, and a refetch after
  // somebody else's upload — or this client's, on another device — should reach
  // an untouched field. Adjusted during render off the changed prop rather than
  // in an effect, which is React's documented pattern for exactly this.
  const [syncedFrom, setSyncedFrom] = useState(initialFilename);
  if (initialFilename !== syncedFrom) {
    setSyncedFrom(initialFilename);
    setUploadedName(initialFilename);
  }

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const responseId = await ensureResponseId();
      return uploadFileByToken(token, { responseId, questionId, file });
    },
    onSuccess: (_data, file) => {
      setUploadedName(file.name);
      onUploaded();
      toast.success("Document uploaded");
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Upload failed — please try again",
      );
    },
  });

  return (
    <FileUpload.Root
      maxFiles={1}
      onFileAccept={(details) => {
        const file = details.files[0];
        if (file) upload.mutate(file);
      }}
    >
      <FileUpload.HiddenInput />
      <FileUpload.Trigger asChild>
        <Button
          size="sm"
          variant="outline"
          borderColor="border"
          borderStyle="dashed"
          w="full"
          justifyContent="flex-start"
          fontWeight="400"
          fontSize="13px"
          color="fg.muted"
          loading={upload.isPending}
        >
          <HStack gap={2}>
            <Upload size={14} />
            <Text truncate>
              {uploadedName ?? "Choose a file to upload"}
            </Text>
          </HStack>
        </Button>
      </FileUpload.Trigger>
    </FileUpload.Root>
  );
}
