import {
  Box,
  Flex,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Pin } from "lucide-react";
import { notes } from "./data";
import { NoteCard } from "./note-card";
import { AddNoteCard } from "./add-note-card";

export function Notes() {
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const regularNotes = notes.filter((n) => !n.isPinned);

  return (
    <>
      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={3} gap={4}>
        <Box>
          <Text fontSize="16px" fontWeight="500" color="fg" textStyle="none">
            Case notes
          </Text>
          <Text fontSize="13px" color="fg.muted" mt={0.5}>
            Internal notes \u2014 not visible to clients
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

      <AddNoteCard />

      {/* Pinned notes */}
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
              <NoteCard key={note.id} note={note} />
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
          <NoteCard key={note.id} note={note} />
        ))}
      </VStack>
    </>
  );
}
