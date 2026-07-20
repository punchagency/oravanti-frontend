import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { ThemeSkeleton } from "../../../../../staff-and-users/components/theme-skeleton";
import { Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useCurrentStaff } from "@/hooks/use-current-staff";
import {
  useCreateLeadNote,
  useDeleteLeadNote,
  useLeadNotes,
  useUpdateLeadNote,
} from "@/hooks/use-lead-workflows";
import type { LeadNote } from "@/api/lead-workflows";

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function LeadNotesTab({ leadId }: { leadId: string }) {
  const { data: notes, isLoading } = useLeadNotes(leadId);
  const createNote = useCreateLeadNote(leadId);

  const [newNote, setNewNote] = useState("");

  const handleAdd = () => {
    if (!newNote.trim()) return;
    createNote.mutate(
      { content: newNote.trim() },
      { onSuccess: () => setNewNote("") },
    );
  };

  return (
    <>
      <Flex justify="space-between" align="flex-start" mb={3} gap={4}>
        <Box>
          <Text fontSize="16px" fontWeight="500" color="fg" textStyle="none">
            Lead notes
          </Text>
          <Text fontSize="13px" color="fg.muted" mt={0.5}>
            All notes from lead intake inception
          </Text>
        </Box>
      </Flex>

      {/* Add note */}
      <Box mb={4}>
        <Textarea
          placeholder="Add a lead note..."
          minH="80px"
          resize="vertical"
          variant="outline"
          borderColor="border"
          _focus={{ borderColor: "brand.solid" }}
          mb={3}
          fontSize="13px"
          bg="bg"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />
        <Flex justify="flex-end">
          <Button
            size="sm"
            bg="brand.solid"
            color="brand.contrast"
            fontSize="13px"
            fontWeight="500"
            _hover={{ bg: "brand.solid/90" }}
            onClick={handleAdd}
            loading={createNote.isPending}
            disabled={!newNote.trim()}
          >
            Add note
          </Button>
        </Flex>
      </Box>

      {isLoading ? (
        <VStack align="stretch" gap={3}>
          {Array.from({ length: 3 }, (_, i) => (
            <Box
              key={i}
              w="full"
              border="1px solid"
              borderColor="border.muted"
              borderRadius="lg"
              bg="bg"
              p={5}
            >
              <HStack gap={2} mb={2.5}>
                <ThemeSkeleton h="28px" w="28px" borderRadius="full" />
                <ThemeSkeleton h="13px" w={`${100 + i * 20}px`} borderRadius="4px" />
                <ThemeSkeleton h="16px" w="50px" borderRadius="full" />
                <Box ms="auto">
                  <ThemeSkeleton h="12px" w="70px" borderRadius="4px" />
                </Box>
              </HStack>
              <ThemeSkeleton h="12px" w="100%" borderRadius="4px" mb={1} />
              <ThemeSkeleton h="12px" w={`${250 + i * 30}px`} borderRadius="4px" />
              <HStack gap={2} mt={2.5}>
                <ThemeSkeleton h="28px" w="28px" borderRadius="6px" />
                <ThemeSkeleton h="28px" w="28px" borderRadius="6px" />
              </HStack>
            </Box>
          ))}
        </VStack>
      ) : !notes || notes.length === 0 ? (
        <Box
          border="1px dashed"
          borderColor="border.muted"
          borderRadius="lg"
          p={8}
          textAlign="center"
        >
          <Text fontSize="13px" color="fg.muted">
            No notes yet. Add the first note above.
          </Text>
        </Box>
      ) : (
        <VStack gap={3} align="stretch">
          {notes.map((note) => (
            <LeadNoteCard key={note.id} note={note} leadId={leadId} />
          ))}
        </VStack>
      )}
    </>
  );
}

function LeadNoteCard({ note, leadId }: { note: LeadNote; leadId: string }) {
  const { data: currentStaff } = useCurrentStaff();
  const deleteNote = useDeleteLeadNote(leadId);
  const updateNote = useUpdateLeadNote(leadId);
  const [editing, setEditing] = useState(false);
  const isAuthor = currentStaff?.id === note.authorId;
  const [editText, setEditText] = useState(note.content);

  const handleSave = () => {
    if (!editText.trim()) return;
    updateNote.mutate(
      { noteId: note.id, content: editText.trim() },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <Box
      w="full"
      border="1px solid"
      borderColor="border.muted"
      borderRadius="lg"
      bg="bg"
      p={5}
    >
      <HStack gap={2} mb={2.5}>
        <Avatar.Root
          size="xs"
          w="28px"
          h="28px"
          bg="bg.subtle"
          border="1px solid"
          borderColor="border.muted"
        >
          <Avatar.Fallback fontSize="11px" fontWeight="500" color="fg.muted">
            {getInitials(note.authorName)}
          </Avatar.Fallback>
        </Avatar.Root>
        <Text fontSize="13px" fontWeight="500" color="fg" textStyle="none">
          {note.authorName ?? "Unknown"}
        </Text>
        {note.authorRole && (
          <Box
            fontSize="10px"
            fontWeight="500"
            color="fg.muted"
            bg="bg.subtle"
            borderRadius="full"
            px={2}
            py={0.5}
          >
            {note.authorRole}
          </Box>
        )}
        <Text fontSize="12px" color="fg.subtle" ms="auto" flexShrink={0}>
          {formatDate(note.createdAt)}
        </Text>
      </HStack>

      {editing ? (
        <Box>
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            minH="60px"
            fontSize="13px"
            variant="outline"
            borderColor="border"
            mb={2}
          />
          <HStack gap={2} justify="flex-end">
            <Button
              size="xs"
              variant="outline"
              borderColor="border"
              onClick={() => {
                setEditing(false);
                setEditText(note.content);
              }}
            >
              <X size={12} />
              Cancel
            </Button>
            <Button
              size="xs"
              bg="brand.solid"
              color="brand.contrast"
              onClick={handleSave}
              loading={updateNote.isPending}
            >
              Save
            </Button>
          </HStack>
        </Box>
      ) : (
        <>
          <Text fontSize="13px" color="fg" lineHeight="160%" whiteSpace="pre-wrap">
            {note.content}
          </Text>
          {isAuthor && (
            <Flex gap={2} mt={2.5}>
              <IconButton
                variant="outline"
                borderColor="border"
                size="sm"
                color="fg.muted"
                onClick={() => setEditing(true)}
                aria-label="Edit note"
              >
                <Pencil size={13} />
              </IconButton>
              <IconButton
                variant="outline"
                borderColor="border"
                size="sm"
                color="fg.muted"
                onClick={() => deleteNote.mutate(note.id)}
                loading={deleteNote.isPending}
                aria-label="Delete note"
              >
                <Trash2 size={13} />
              </IconButton>
            </Flex>
          )}
        </>
      )}
    </Box>
  );
}