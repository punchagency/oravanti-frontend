import { Box, HStack, Text, Textarea, VStack } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import {
  formatReceivedDateDetail,
  type LeadNote,
  type LeadNoteType,
} from "@/api/leads";
import { FormSelect, type FormSelectOption } from "@/components/ui/form-select";
import {
  BrandButton,
  IntakeListSkeleton,
  MutedText,
  PracticePill,
} from "@/components/ui/intake-ui";
import { useAddLeadNote, useLeadNotes } from "@/hooks/use-leads";

/**
 * Notes are append-only, matching the server: there is no PATCH or DELETE
 * endpoint, so this view offers no edit or delete control. A correction is a
 * new note.
 */

const NOTE_TYPE_LABELS: Record<LeadNoteType, string> = {
  general: "General",
  phone_call: "Phone call",
  email: "Email",
  voicemail: "Voicemail",
  system_log: "System log",
  pre_consultation: "Pre-consultation",
  post_consultation: "Post-consultation",
};

// system_log is written by the server, not by a person — don't offer it.
const AUTHORABLE_TYPES: LeadNoteType[] = [
  "general",
  "pre_consultation",
  "post_consultation",
  "phone_call",
  "email",
  "voicemail",
];

const fieldStyles = {
  px: "12px",
  py: "10px",
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
} as const;

function NoteCard({ note }: { note: LeadNote }) {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      p="14px 16px"
    >
      <HStack justify="space-between" gap="8px" mb="8px" wrap="wrap">
        <PracticePill tone="neutral">
          {NOTE_TYPE_LABELS[note.type] ?? note.type}
        </PracticePill>
        <Text m="0" color="fg.subtle" fontSize="11px">
          {note.authorName ?? "Author not recorded"}
          {" · "}
          {formatReceivedDateDetail(note.createdAt)}
        </Text>
      </HStack>

      <Text m="0" color="fg" fontSize="13px" whiteSpace="pre-wrap">
        {note.content}
      </Text>
    </Box>
  );
}

export function NotesTab({
  leadId,
  isActive,
}: {
  leadId: string;
  isActive: boolean;
}) {
  const { data: notes, isLoading } = useLeadNotes(leadId, isActive);
  const addNote = useAddLeadNote();

  const [type, setType] = useState<LeadNoteType>("general");
  const [content, setContent] = useState("");

  const typeOptions = useMemo<FormSelectOption[]>(
    () =>
      AUTHORABLE_TYPES.map((value) => ({
        label: NOTE_TYPE_LABELS[value],
        value,
      })),
    [],
  );

  const trimmed = content.trim();

  function handleSubmit() {
    if (!trimmed) return;
    addNote.mutate(
      { id: leadId, data: { type, content: trimmed } },
      {
        onSuccess: () => {
          setContent("");
          setType("general");
        },
      },
    );
  }

  return (
    <VStack align="stretch" gap="20px">
      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="10px"
        bg="bg.subtle"
        p="14px 16px"
      >
        <Text m="0 0 10px" color="fg" fontSize="13px" fontWeight="500">
          Add a note
        </Text>

        <VStack align="stretch" gap="10px">
          <Box maxW="220px">
            <FormSelect
              options={typeOptions}
              value={type}
              onChange={(value) => setType(value as LeadNoteType)}
              ariaLabel="Note type"
            />
          </Box>

          <Textarea
            aria-label="Note"
            placeholder="What happened? This cannot be edited once saved."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            resize="vertical"
            {...fieldStyles}
          />

          <HStack justify="space-between" gap="8px" wrap="wrap">
            <MutedText fontSize="11px">
              Notes are permanent — they cannot be edited or deleted.
            </MutedText>
            <BrandButton
              onClick={handleSubmit}
              disabled={!trimmed || addNote.isPending}
              loading={addNote.isPending}
            >
              Add note
            </BrandButton>
          </HStack>
        </VStack>
      </Box>

      {isLoading ? (
        <IntakeListSkeleton rows={3} />
      ) : !notes?.length ? (
        <Box py="24px" textAlign="center">
          <MutedText>No notes on this lead yet.</MutedText>
        </Box>
      ) : (
        <VStack align="stretch" gap="10px">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </VStack>
      )}
    </VStack>
  );
}
