import {
  Avatar,
  Badge,
  Box,
  Flex,
  HStack,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { MessageSquare, Pencil, Pin, Trash2 } from "lucide-react";
import { type Note, roleColors } from "./data";

export function NoteCard({ note }: { note: Note }) {
  const rc = roleColors[note.role] ?? roleColors.Attorney;

  return (
    <Box
      w="full"
      border="1px solid"
      borderColor={note.isPinned ? "brand.emphasized" : "border.muted"}
      borderRadius="lg"
      bg="bg"
      p={5}
    >
      {/* Header row */}
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
            {note.initials}
          </Avatar.Fallback>
        </Avatar.Root>
        <Text fontSize="13px" fontWeight="500" color="fg" textStyle="none">
          {note.author}
        </Text>
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
          {note.role}
        </Badge>
        {note.isPinned && (
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
          {note.date}
        </Text>
      </HStack>

      {/* Body */}
      <Text fontSize="13px" color="fg" lineHeight="160%">
        {note.body}
      </Text>

      {/* Visibility */}
      {note.visibility && (
        <HStack gap={1} mt={2}>
          <Box color="fg.subtle" asChild>
            <Pin size={10} />
          </Box>
          <Text fontSize="11px" color="fg.subtle">
            {note.visibility}
          </Text>
        </HStack>
      )}

      {/* Action buttons */}
      <Flex gap={2} mt={2.5}>
        <IconButton
          variant="outline"
          borderColor="border"
          size="sm"
          color="fg.muted"
        >
          <MessageSquare size={13} />
        </IconButton>
        <IconButton
          variant="outline"
          borderColor="border"
          size="sm"
          color="fg.muted"
        >
          <Pencil size={13} />
        </IconButton>
        <IconButton
          variant="outline"
          borderColor="border"
          size="sm"
          color="fg.muted"
        >
          <Trash2 size={13} />
        </IconButton>
      </Flex>
    </Box>
  );
}
