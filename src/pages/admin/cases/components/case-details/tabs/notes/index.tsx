import type { CaseNote, CaseNoteContext } from "@/api/workflows";
import { BrandButton } from "@/components/ui/intake-ui";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { useCurrentStaff } from "@/hooks/use-current-staff";
import {
  useCaseNotes,
  useCreateCaseNote,
  useDeleteCaseNote,
  useToggleCaseNotePin,
  useUpdateCaseNote,
} from "@/hooks/use-workflows";
import { useConfirmStore } from "@/store/confirm-store";
import {
  Avatar,
  Badge,
  Box,
  Button,
  chakra,
  Checkbox,
  createListCollection,
  Dialog,
  Flex,
  HStack,
  Menu,
  Portal,
  Select,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { MoreHorizontal, Pencil, Pin, Plus, Trash2, X } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useMemo, useState } from "react";

const CONTEXT_LABELS: Record<CaseNoteContext, string> = {
  notes_tab: "Manual",
  workflow_step: "Workflow Step",
  task: "Task",
  lead_conversion: "Lead Conversion",
  system: "System",
};

const CONTEXT_FILTER_OPTIONS = [
  { label: "All contexts", value: "all" },
  { label: "Manual", value: "notes_tab" },
  { label: "Workflow Step", value: "workflow_step" },
  { label: "Task", value: "task" },
  { label: "Lead Conversion", value: "lead_conversion" },
  { label: "System", value: "system" },
] as const;

const VISIBILITY_OPTIONS = [
  { label: "All staff", value: "all_staff" },
  { label: "Attorneys only", value: "attorneys_only" },
  { label: "Admins only", value: "admins_only" },
] as const;

const fieldStyles = {
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
    boxShadow: "0 0 0 1px var(--chakra-colors-brand-solid)",
  },
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function Notes({ caseId }: { caseId: string }) {
  const [{ context, page, author, limit }, setParams] = useQueryStates({
    context: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    author: parseAsString.withDefault(""),
    limit: parseAsInteger.withDefault(10),
  });

  const { data: pinnedResult } = useCaseNotes(caseId, {
    pinnedOnly: true,
    limit: 100,
  });
  const pinnedNotes = pinnedResult?.data ?? [];

  const { data: regularResult, isLoading } = useCaseNotes(caseId, {
    context: (context as CaseNoteContext) || undefined,
    authorId: author || undefined,
    page,
    limit,
  });
  const regularNotes = regularResult?.data ?? [];
  const pagination = regularResult?.pagination;

  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <Flex justify="space-between" align="center" mb={3} gap={2}>
        <Box minW={0}>
          <Text fontSize="16px" fontWeight="500" color="fg">
            Case notes
          </Text>
          <Text fontSize="12px" color="fg.muted" mt={0.5}>
            Internal notes — not visible to clients
          </Text>
        </Box>
        <Button
          size="sm"
          h="34px"
          bg="brand.solid"
          color="brand.contrast"
          borderRadius="7px"
          fontSize="13px"
          fontWeight="500"
          onClick={() => setAddOpen(true)}
          flexShrink={0}
        >
          <Plus size={14} /> Add note
        </Button>
      </Flex>

      {!isLoading && (
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          mb={4}
          gap={2}
        >
          <HStack gap={2} wrap="wrap" flex={1}>
            <ContextFilterSelect
              value={context || "all"}
              onChange={(v) =>
                setParams({ context: v === "all" ? null : v, page: 1 })
              }
            />
            <AuthorFilterSelect
              value={author || "all"}
              onChange={(v) =>
                setParams({ author: v === "all" ? null : v, page: 1 })
              }
            />
          </HStack>
          {pagination && (
            <Text fontSize="12px" color="fg.muted" flexShrink={0}>
              {pagination.total} note{pagination.total === 1 ? "" : "s"}
            </Text>
          )}
        </Flex>
      )}

      {pinnedNotes.length > 0 && (
        <Box mb={4}>
          <Flex align="center" gap={1.5} mb={2.5}>
            <Pin size={11} color="fg.subtle" />
            <Text
              fontSize="11px"
              fontWeight="500"
              color="fg.subtle"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Pinned
            </Text>
          </Flex>
          <VStack gap={3} align="stretch">
            {pinnedNotes.map((note) => (
              <CaseNoteCard key={note.id} note={note} caseId={caseId} />
            ))}
          </VStack>
        </Box>
      )}

      {isLoading ? (
        <VStack align="stretch" gap={3}>
          {Array.from({ length: 3 }, (_, i) => (
            <Box
              key={i}
              w="full"
              border="1px solid"
              borderColor="border.muted"
              borderRadius="md"
              bg="bg"
              p={{ base: 3, md: 5 }}
            >
              <HStack gap={2} mb={2.5}>
                <ThemeSkeleton h="28px" w="28px" borderRadius="full" />
                <ThemeSkeleton
                  h="13px"
                  w={`${100 + i * 20}px`}
                  borderRadius="4px"
                />
                <ThemeSkeleton h="16px" w="50px" borderRadius="full" />
                <Box ms="auto">
                  <ThemeSkeleton h="12px" w="70px" borderRadius="4px" />
                </Box>
              </HStack>
              <ThemeSkeleton h="12px" w="100%" borderRadius="4px" mb={1} />
              <ThemeSkeleton
                h="12px"
                w={`${250 + i * 30}px`}
                borderRadius="4px"
              />
            </Box>
          ))}
        </VStack>
      ) : regularNotes.length === 0 && pinnedNotes.length === 0 ? (
        <Box
          border="1px dashed"
          borderColor="border.muted"
          borderRadius="md"
          p={8}
          textAlign="center"
        >
          <Text fontSize="13px" color="fg.muted">
            {context || author
              ? "No notes match this filter."
              : "No notes yet. Add the first note above."}
          </Text>
        </Box>
      ) : regularNotes.length === 0 ? (
        <Text fontSize="13px" color="fg.muted" textAlign="center" py={4}>
          No additional notes match this filter.
        </Text>
      ) : (
        <VStack gap={3} align="stretch">
          {regularNotes.map((note) => (
            <CaseNoteCard key={note.id} note={note} caseId={caseId} />
          ))}
        </VStack>
      )}

      {pagination && pagination.totalPages > 1 && (
        <PaginationControls
          total={pagination.total}
          currentPage={page}
          limit={limit}
          onPageChange={(p) => setParams({ page: p })}
          onLimitChange={(l) => setParams({ limit: l, page: 1 })}
          pageSizeOptions={[5, 10, 20, 50]}
        />
      )}
      <AddNoteModal caseId={caseId} open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}

// ─── Modals ──────────────────────────────────────────────────────────────────

function AddNoteModal({
  caseId,
  open,
  onOpenChange,
}: {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createNote = useCreateCaseNote(caseId);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("all_staff");
  const [isPinned, setIsPinned] = useState(false);

  const handleCreate = () => {
    if (!content.trim()) return;
    createNote.mutate(
      { content: content.trim(), visibility, isPinned, context: "notes_tab" },
      {
        onSuccess: () => {
          setContent("");
          setVisibility("all_staff");
          setIsPinned(false);
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="center"
    >
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
              aria-label="Close add note dialog"
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
          <Box p="32px 24px 24px">
            <Dialog.Title
              color="fg"
              fontSize="17px"
              fontWeight="600"
              lineHeight="1.2"
            >
              Add note
            </Dialog.Title>
            <Dialog.Description
              mt="10px"
              color="fg.muted"
              fontSize="13px"
              lineHeight="1.35"
            >
              Create a new note for this case.
            </Dialog.Description>
            <VStack align="stretch" gap="12px" mt="18px">
              <Box>
                <Text
                  as="label"
                  display="block"
                  mb="5px"
                  color="fg"
                  fontSize="11px"
                  fontWeight="500"
                >
                  Note
                </Text>
                <Textarea
                  placeholder="Write your note..."
                  minH="100px"
                  resize="vertical"
                  {...fieldStyles}
                  h="auto"
                  px="12px"
                  py="8px"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </Box>
              <Box>
                <Text
                  as="label"
                  display="block"
                  mb="5px"
                  color="fg"
                  fontSize="11px"
                  fontWeight="500"
                >
                  Visibility
                </Text>
                <Select.Root
                  collection={createListCollection({
                    items: [...VISIBILITY_OPTIONS],
                  })}
                  size="sm"
                  value={[visibility]}
                  onValueChange={(e) =>
                    setVisibility((e.value[0] as "all_staff" | "attorneys_only" | "admins_only") ?? "all_staff")
                  }
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger {...fieldStyles} h="36px">
                      <Select.ValueText />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {VISIBILITY_OPTIONS.map((opt) => (
                          <Select.Item item={opt} key={opt.value}>
                            <Select.ItemText>{opt.label}</Select.ItemText>
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Box>
              <Checkbox.Root
                size="sm"
                checked={isPinned}
                onCheckedChange={(e) => setIsPinned(Boolean(e.checked))}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control
                  borderColor="border.emphasized"
                  borderRadius="md"
                />
                <Checkbox.Label fontSize="12px" color="fg.muted">
                  Pin this note
                </Checkbox.Label>
              </Checkbox.Root>
            </VStack>
            <Flex justify="flex-end" gap="12px" mt="18px">
              <BrandButton
                onClick={handleCreate}
                loading={createNote.isPending}
                disabled={!content.trim()}
              >
                Add note
              </BrandButton>
            </Flex>
          </Box>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function EditNoteModal({
  note,
  caseId,
  open,
  onOpenChange,
}: {
  note: CaseNote;
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateNote = useUpdateCaseNote(caseId);
  const [content, setContent] = useState(note.content);
  const [visibility, setVisibility] = useState(note.visibility);
  const [isPinned, setIsPinned] = useState(note.isPinned);

  const handleSave = () => {
    if (!content.trim()) return;
    updateNote.mutate(
      { noteId: note.id, content: content.trim(), visibility, isPinned },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="center"
    >
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
              aria-label="Close edit note dialog"
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
          <Box p="32px 24px 24px">
            <Dialog.Title
              color="fg"
              fontSize="17px"
              fontWeight="600"
              lineHeight="1.2"
            >
              Edit note
            </Dialog.Title>
            <Dialog.Description
              mt="10px"
              color="fg.muted"
              fontSize="13px"
              lineHeight="1.35"
            >
              Update the note content, visibility, and pin status.
            </Dialog.Description>
            <VStack align="stretch" gap="12px" mt="18px">
              <Box>
                <Text
                  as="label"
                  display="block"
                  mb="5px"
                  color="fg"
                  fontSize="11px"
                  fontWeight="500"
                >
                  Note
                </Text>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  minH="100px"
                  resize="vertical"
                  {...fieldStyles}
                  h="auto"
                  px="12px"
                  py="8px"
                />
              </Box>
              <Box>
                <Text
                  as="label"
                  display="block"
                  mb="5px"
                  color="fg"
                  fontSize="11px"
                  fontWeight="500"
                >
                  Visibility
                </Text>
                <Select.Root
                  collection={createListCollection({
                    items: [...VISIBILITY_OPTIONS],
                  })}
                  size="sm"
                  value={[visibility]}
                  onValueChange={(e) =>
                    setVisibility((e.value[0] as "all_staff" | "attorneys_only" | "admins_only") ?? "all_staff")
                  }
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger {...fieldStyles} h="36px">
                      <Select.ValueText />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {VISIBILITY_OPTIONS.map((opt) => (
                          <Select.Item item={opt} key={opt.value}>
                            <Select.ItemText>{opt.label}</Select.ItemText>
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Box>
              <Checkbox.Root
                size="sm"
                checked={isPinned}
                onCheckedChange={(e) => setIsPinned(Boolean(e.checked))}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control
                  borderColor="border.emphasized"
                  borderRadius="md"
                />
                <Checkbox.Label fontSize="12px" color="fg.muted">
                  Pin this note
                </Checkbox.Label>
              </Checkbox.Root>
            </VStack>
            <Flex justify="flex-end" gap="12px" mt="18px">
              <BrandButton
                onClick={handleSave}
                loading={updateNote.isPending}
                disabled={!content.trim()}
              >
                Save
              </BrandButton>
            </Flex>
          </Box>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

// ─── Filter Selects ──────────────────────────────────────────────────────────

function ContextFilterSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const collection = useMemo(
    () => createListCollection({ items: [...CONTEXT_FILTER_OPTIONS] }),
    [],
  );
  return (
    <Select.Root
      collection={collection}
      size="sm"
      w={{ base: "full", md: "auto" }}
      minW={{ base: "0", md: "140px" }}
      value={[value]}
      onValueChange={(e) => onChange(e.value[0] ?? value)}
      aria-label="Filter by context"
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger
          {...fieldStyles}
          h="32px"
          fontSize="12px"
          borderRadius="7px"
        >
          <Select.ValueText />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {collection.items.map((item) => (
              <Select.Item item={item} key={item.value}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}

function AuthorFilterSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { data: currentStaff } = useCurrentStaff();
  const items = useMemo(() => {
    const list = [{ label: "All authors", value: "all" }];
    if (currentStaff) list.push({ label: "My notes", value: currentStaff.id });
    return list;
  }, [currentStaff]);
  const collection = useMemo(() => createListCollection({ items }), [items]);
  return (
    <Select.Root
      collection={collection}
      size="sm"
      w={{ base: "full", md: "auto" }}
      minW={{ base: "0", md: "120px" }}
      value={[value]}
      onValueChange={(e) => onChange(e.value[0] ?? value)}
      aria-label="Filter by author"
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger
          {...fieldStyles}
          h="32px"
          fontSize="12px"
          borderRadius="7px"
        >
          <Select.ValueText />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {collection.items.map((item) => (
              <Select.Item item={item} key={item.value}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}

// ─── Note Card ───────────────────────────────────────────────────────────────

function CaseNoteCard({ note, caseId }: { note: CaseNote; caseId: string }) {
  const { data: currentStaff } = useCurrentStaff();
  const deleteNote = useDeleteCaseNote(caseId);
  const togglePin = useToggleCaseNotePin(caseId);
  const showConfirm = useConfirmStore((s) => s.showConfirm);
  const isAuthor = currentStaff?.id === note.createdByUserId;
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = () => {
    showConfirm({
      title: "Delete note",
      description:
        "Are you sure you want to delete this note? This action cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      onConfirm: () => {
        deleteNote.mutate(note.id);
      },
    });
  };

  return (
    <>
      <Box
        w="full"
        border="1px solid"
        borderColor={note.isPinned ? "brand.solid" : "border.muted"}
        borderRadius="md"
        bg="bg"
        p={{ base: 3, md: 5 }}
      >
        <Flex gap={2} mb={2} align="flex-start">
          <Avatar.Root
            size="xs"
            w="28px"
            h="28px"
            bg="bg.subtle"
            border="1px solid"
            borderColor="border.muted"
            flexShrink={0}
          >
            <Avatar.Fallback fontSize="11px" fontWeight="500" color="fg.muted">
              {getInitials(note.authorName)}
            </Avatar.Fallback>
          </Avatar.Root>
          <VStack gap={0} align="flex-start" flex={1} minW={0}>
            <HStack gap={1.5} wrap="wrap">
              <Text fontSize="13px" fontWeight="500" color="fg">
                {note.authorName ?? "Unknown"}
              </Text>
              {note.authorRole && (
                <Badge
                  size="xs"
                  variant="subtle"
                  colorScheme="gray"
                  borderRadius="md"
                >
                  {note.authorRole}
                </Badge>
              )}
              {note.context !== "notes_tab" && (
                <Badge
                  size="xs"
                  variant="subtle"
                  colorScheme="blue"
                  borderRadius="md"
                >
                  {CONTEXT_LABELS[note.context]}
                </Badge>
              )}
              {note.visibility !== "all_staff" && (
                <Badge
                  size="xs"
                  variant="subtle"
                  colorScheme="orange"
                  borderRadius="md"
                >
                  {note.visibility === "attorneys_only"
                    ? "Attorneys only"
                    : "Admins only"}
                </Badge>
              )}
              {note.isPinned && (
                <Pin size={12} color="var(--chakra-colors-yellow-500)" />
              )}
            </HStack>
            <Text fontSize="11px" color="fg.subtle">
              {formatDateTime(note.createdAt)}
              {note.isEdited && " (edited)"}
            </Text>
          </VStack>
          <Menu.Root>
            <Menu.Trigger asChild>
              <chakra.button
                type="button"
                aria-label="Note actions"
                display="grid"
                placeItems="center"
                flex="0 0 auto"
                w="28px"
                h="28px"
                border="1px solid"
                borderColor="border"
                borderRadius="7px"
                bg="bg"
                color="fg.muted"
                cursor="pointer"
                _hover={{ bg: "bg.subtle" }}
              >
                <MoreHorizontal size={14} />
              </chakra.button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content borderRadius="7px">
                  {isAuthor && (
                    <Menu.Item
                      value="edit"
                      onClick={() => setEditOpen(true)}
                      borderRadius="7px"
                      fontSize="13px"
                    >
                      <Pencil size={13} /> Edit
                    </Menu.Item>
                  )}
                  <Menu.Item
                    value="pin"
                    onClick={() => togglePin.mutate(note.id)}
                    borderRadius="7px"
                    fontSize="13px"
                  >
                    <Pin size={13} /> {note.isPinned ? "Unpin" : "Pin"}
                  </Menu.Item>
                  {isAuthor && (
                    <Menu.Item
                      value="delete"
                      onClick={handleDelete}
                      color="red.500"
                      borderRadius="7px"
                      fontSize="13px"
                    >
                      <Trash2 size={13} /> Delete
                    </Menu.Item>
                  )}
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Flex>
        <Text
          fontSize="13px"
          color="fg"
          lineHeight="160%"
          whiteSpace="pre-wrap"
        >
          {note.content}
        </Text>
      </Box>
      <EditNoteModal
        note={note}
        caseId={caseId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
