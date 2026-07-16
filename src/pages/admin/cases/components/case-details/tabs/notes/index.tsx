import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Skeleton,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { Pencil, Pin, Trash2, X } from "lucide-react";
import { useState } from "react";
import {
  useCaseNotes,
  useCreateCaseNote,
  useDeleteCaseNote,
  useUpdateCaseNote,
} from "@/hooks/use-workflows";
import type { CaseNote } from "@/api/workflows";

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

function roleColor(role: string | null): { bg: string; color: string } {
  switch (role) {
    case "admin":
      return { bg: "brand.subtle", color: "brand.fg" };
    case "staff":
      return { bg: "purple.subtle", color: "purple.fg" };
    default:
      return { bg: "bg.subtle", color: "fg.muted" };
  }
}

export function Notes({ caseId }: { caseId: string }) {
  const { data: notes, isLoading } = useCaseNotes(caseId);
  const createNote = useCreateCaseNote(caseId);

  const [newNote, setNewNote] = useState("");

  const handleAdd = () => {
    if (!newNote.trim()) return;
    createNote.mutate(
      { content: newNote.trim() },
      { onSuccess: () => setNewNote("") },
    );
  };

  const pinnedNotes = notes?.filter((n) => n.visibility === "attorneys_only") ?? [];
  const regularNotes = notes?.filter((n) => n.visibility !== "attorneys_only") ?? [];

  return (
    <>
      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={3} gap={4}>
        <Box>
          <Text fontSize="16px" fontWeight="500" color="fg" textStyle="none">
            Case notes
          </Text>
          <Text fontSize="13px" color="fg.muted" mt={0.5}>
            Internal notes — not visible to clients
          </Text>
        </Box>
        <HStack
          gap={1.5}
          bg="transparent"
          border="1px solid"
          borderColor="brand.emphasized"
          borderRadius="full"
          px={3}
          py={1.5}
          flexShrink={0}
          color={"fg.muted"}
        >
          <Box asChild>
            <Pin size={10} />
          </Box>
          <Text fontSize="11px" whiteSpace="nowrap">
            Attorney notes: attorney + admin only
          </Text>
        </HStack>
      </Flex>

      {/* Add note */}
      <Box mb={4}>
        <Textarea
          placeholder="Add a case note... Use @name to mention a team member. Internal only."
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
            <Skeleton key={i} h="80px" borderRadius="lg" />
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
        <>
          {/* Pinned notes (attorney-only visibility) */}
          {pinnedNotes.length > 0 && (
            <>
              <Flex
                align="center"
                gap={1.5}
                mb={2.5}
                fontSize="11px"
                fontWeight="500"
                color="fg.subtle"
              >
                <Box asChild color="fg.subtle" display="inline-flex">
                  <Pin size={11} />
                </Box>
                <Text
                  as="span"
                  fontSize="11px"
                  fontWeight="500"
                  color="fg.subtle"
                  letterSpacing="0.44px"
                  textTransform="uppercase"
                >
                  PINNED NOTES
                </Text>
              </Flex>
              <VStack gap={3} mb={5} w="full">
                {pinnedNotes.map((note) => (
                  <NoteCard key={note.id} note={note} caseId={caseId} />
                ))}
              </VStack>
            </>
          )}

          {/* Regular notes */}
          <Flex align="center" mb={2.5}>
            <Text
              as="span"
              fontSize="11px"
              fontWeight="500"
              color="fg.subtle"
              letterSpacing="0.44px"
              textTransform="uppercase"
            >
              NOTES
            </Text>
          </Flex>
          <VStack gap={3} w="full">
            {regularNotes.map((note) => (
              <NoteCard key={note.id} note={note} caseId={caseId} />
            ))}
          </VStack>
        </>
      )}
    </>
  );
}

function NoteCard({ note, caseId }: { note: CaseNote; caseId: string }) {
  const deleteNote = useDeleteCaseNote(caseId);
  const updateNote = useUpdateCaseNote(caseId);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(note.content);

  const rc = roleColor(note.authorRole);

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
          <Badge
            size="xs"
            borderRadius="full"
            px={2}
            py={0.5}
            bg={rc.bg}
            color={rc.color}
            fontWeight="500"
            fontSize="10px"
            textTransform="none"
          >
            {note.authorRole}
          </Badge>
        )}
        {note.visibility === "attorneys_only" && (
          <Flex align="center" gap={1} color="fg.warning" fontSize="11px">
            <Box asChild color="fg.warning" display="inline-flex">
              <Pin size={11} />
            </Box>
            <Text as="span" fontSize="11px" color="fg.warning">
              Pinned
            </Text>
          </Flex>
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
        </>
      )}
    </Box>
  );
}