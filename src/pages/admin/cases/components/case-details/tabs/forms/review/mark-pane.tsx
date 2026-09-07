import type {
  CaseFormField,
  CorrectionColor,
  FormBoxPlacement,
  FormCorrection,
} from "@/api/case-details";
import { CORRECTION_COLORS } from "@/api/case-details";
import {
  Badge,
  Box,
  Button,
  Circle,
  Flex,
  HStack,
  IconButton,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { Flag, MessageSquare } from "lucide-react";
import { useState } from "react";

import { CORRECTION_PALETTE, paletteFor } from "./correction-color";

/**
 * One box on the page: outlined when it is marked, otherwise only on hover.
 *
 * The colour is the mark's own, and there is no legend anywhere — the product
 * asked for "a red mark or any colour of their choice", which is the attorney's
 * shorthand rather than a severity scale the app defines and then defends. A
 * box carrying both an open mark and an answered one paints the open one: what
 * is still outstanding is what the page has to show.
 */
export function MarkedBox({
  placement,
  marks,
  isSelected,
  label,
  onSelect,
}: {
  placement: FormBoxPlacement;
  marks: FormCorrection[];
  isSelected: boolean;
  label: string;
  onSelect: () => void;
}) {
  const open = marks.find((mark) => mark.status === "open");
  const palette = open ? paletteFor(open.color) : null;

  return (
    <Box
      as="button"
      aria-label={
        open ? `${label} — marked for correction` : `${label} on this page`
      }
      position="absolute"
      left={`${placement.left}%`}
      top={`${placement.top}%`}
      w={`${placement.width}%`}
      h={`${placement.height}%`}
      borderRadius="2px"
      cursor="pointer"
      border="1.5px solid"
      borderColor={
        isSelected
          ? "blue.solid"
          : palette
            ? `${palette}.solid`
            : "transparent"
      }
      bg={
        isSelected
          ? "blue.solid/25"
          : palette
            ? `${palette}.solid/18`
            : "transparent"
      }
      _hover={{
        borderColor: isSelected ? "blue.solid" : "fg.muted",
        bg: isSelected ? "blue.solid/25" : "fg.subtle/10",
      }}
      onClick={onSelect}
    />
  );
}

/**
 * What the box under the cursor is, and every mark on the form.
 *
 * Two things in one pane rather than two panes, because they are one question
 * asked at two zooms: *what is wrong with this box* and *what is still open on
 * this form*. The list is the way back — a mark names a field, and selecting it
 * turns the page to where that field prints, which is the whole reason the
 * geometry is fetched.
 *
 * ─── The note is written here, on the page ──────────────────────────────────
 *
 * It used to be a modal: click the box, a dialog opens over the document, type,
 * submit. Reviewing a filing is reading the paper and saying what is wrong with
 * what you are looking at, and a dialog covers the thing being talked about —
 * so the box's own words, what prints in it, and the note being written about
 * it are all one surface now. Same arrangement as the CRM's mapper, where the
 * datum is chosen beside the box rather than over it.
 */
export function MarkPane({
  field,
  marks,
  allMarks,
  canMark,
  hasGeometry,
  isMarking = false,
  onMark,
  onComment,
  onSelect,
}: {
  field: CaseFormField | null;
  marks: FormCorrection[];
  allMarks: FormCorrection[];
  canMark: boolean;
  hasGeometry: boolean;
  isMarking?: boolean;
  /** Raise a mark on the selected field. The page is the only way in. */
  onMark: (input: { color: CorrectionColor; note: string }) => void;
  onComment?: (correction: FormCorrection, body: string) => void;
  onSelect: (fieldKey: string) => void;
}) {
  // Field-anchored only: this list is the way back to a box, and a mark with no
  // field has no box to turn the page to.
  const open = allMarks.filter(
    (mark) => mark.status === "open" && mark.fieldKey,
  );

  if (!field) {
    return (
      <VStack align="stretch" gap={3}>
        <Text fontSize="13px" color="fg.muted" lineHeight="19px">
          {hasGeometry
            ? "Click a box on the page to see what fills it, and to leave a note on it."
            : "This form's boxes are not mapped yet, so nothing on the page can be pointed at. Notes are left on the boxes, so this form cannot be reviewed until Oravanti has mapped it."}
        </Text>

        {open.length > 0 && (
          <Box>
            <Text fontSize="12px" fontWeight="500" color="fg" mb={2}>
              Open on this form
            </Text>
            <VStack align="stretch" gap={2}>
              {open.map((mark) => (
                <MarkRow
                  key={mark.id}
                  mark={mark}
                  onSelect={() => mark.fieldKey && onSelect(mark.fieldKey)}
                />
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap={4}>
      <Box>
        <Text fontSize="14px" fontWeight="500" color="fg" lineHeight="19px">
          {field.label}
        </Text>
        {field.partLabel && (
          <Text fontSize="12px" color="fg.muted" mt={0.5}>
            {field.partLabel}
          </Text>
        )}
        <Text
          fontSize="12px"
          fontFamily="mono"
          color="fg.subtle"
          mt={1}
          overflowWrap="anywhere"
        >
          {field.fieldKey}
        </Text>
      </Box>

      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="md"
        px={3}
        py={2.5}
        bg="bg.subtle"
      >
        <Text fontSize="11px" color="fg.subtle" mb={1}>
          What prints here
        </Text>
        <Text fontSize="13px" color={field.value == null ? "fg.subtle" : "fg"}>
          {field.value == null || field.value === ""
            ? "Nothing yet"
            : String(field.value)}
        </Text>
      </Box>

      {canMark && (
        <NoteComposer
          // Cleared when the selection moves, because a note half-typed about
          // one box must not be submitted against the next one.
          key={field.fieldKey}
          isPending={isMarking}
          onSubmit={onMark}
        />
      )}

      {marks.length === 0 ? (
        <Text fontSize="12px" color="fg.muted">
          {canMark
            ? "Nothing has been marked on this field."
            : "The attorney has left no note on this field."}
        </Text>
      ) : (
        <VStack align="stretch" gap={3}>
          {marks.map((mark) => (
            <MarkThread key={mark.id} mark={mark} onComment={onComment} />
          ))}
        </VStack>
      )}
    </VStack>
  );
}

/**
 * The attorney's note on the box that is selected.
 *
 * The note is required and the button says so by being disabled — a coloured
 * mark with no words is a message the person who has to act on it cannot read,
 * and it is the single most likely thing to be left out in a hurry.
 *
 * The colours carry no legend, here or anywhere. The product asked for "a red
 * mark or any colour of their choice", which is a request for the attorney's
 * own shorthand rather than for a severity scale the app defines and then has
 * to defend.
 */
function NoteComposer({
  isPending,
  onSubmit,
}: {
  isPending: boolean;
  onSubmit: (input: { color: CorrectionColor; note: string }) => void;
}) {
  const [color, setColor] = useState<CorrectionColor>("red");
  const [note, setNote] = useState("");

  return (
    <VStack align="stretch" gap={2}>
      <HStack justify="space-between" align="center">
        <Text fontSize="12px" color="fg.muted">
          Note for the team
        </Text>
        <HStack gap={1}>
          {CORRECTION_COLORS.map((option) => (
            <IconButton
              key={option}
              aria-label={CORRECTION_PALETTE[option].label}
              aria-pressed={option === color}
              size="xs"
              variant="ghost"
              h="22px"
              minW="22px"
              borderWidth="1.5px"
              borderStyle="solid"
              borderColor={option === color ? "fg.muted" : "transparent"}
              onClick={() => setColor(option)}
            >
              <Circle
                size="10px"
                bg={`${CORRECTION_PALETTE[option].palette}.solid`}
              />
            </IconButton>
          ))}
        </HStack>
      </HStack>

      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Say what is wrong, so whoever picks this up knows what to change."
        rows={3}
        fontSize="13px"
      />

      {/* What raising one does to the filing, said where it is raised. Marking
          is what puts the package into changes requested and withdraws any
          approval — a consequence nobody should learn about afterwards. */}
      <Text fontSize="11px" color="fg.subtle" lineHeight="15px">
        The team sees this on the field, and the package goes back to changes
        requested.
      </Text>

      <Button
        size="xs"
        variant="outline"
        borderColor="border"
        h="32px"
        fontSize="13px"
        fontWeight="400"
        color="fg.muted"
        alignSelf="flex-start"
        loading={isPending}
        disabled={note.trim().length === 0}
        onClick={() => {
          onSubmit({ color, note: note.trim() });
          setNote("");
        }}
      >
        <Flag size={13} />
        Mark this field
      </Button>
    </VStack>
  );
}

/** One mark in the list, as the way back to the box it sits on. */
function MarkRow({
  mark,
  onSelect,
}: {
  mark: FormCorrection;
  onSelect: () => void;
}) {
  return (
    <Flex
      as="button"
      textAlign="left"
      align="flex-start"
      gap={2}
      border="1px solid"
      borderColor="border"
      borderRadius="md"
      px={3}
      py={2}
      w="full"
      _hover={{ borderColor: "fg.muted" }}
      onClick={onSelect}
    >
      <Circle size="8px" bg={`${paletteFor(mark.color)}.solid`} mt="5px" />
      <Box minW={0}>
        <Text fontSize="12px" color="fg" lineHeight="17px">
          {mark.note}
        </Text>
        <Text fontSize="11px" color="fg.subtle" mt={0.5}>
          {mark.fieldKey}
        </Text>
      </Box>
    </Flex>
  );
}

/**
 * A mark and the conversation on it.
 *
 * The thread rather than a resolution note, because a correction can go round
 * more than once and the second pass is the one somebody will want to read
 * later. Resolving and reopening stay on the review panel above the forms: this
 * is where the work is discussed, not where the package's state is changed.
 */
function MarkThread({
  mark,
  onComment,
}: {
  mark: FormCorrection;
  onComment?: (correction: FormCorrection, body: string) => void;
}) {
  const [body, setBody] = useState("");
  const palette = paletteFor(mark.color);

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="md"
      borderLeft="3px solid"
      borderLeftColor={`${palette}.solid`}
      px={3}
      py={2.5}
    >
      <HStack gap={2} align="center" mb={1}>
        <Badge
          size="sm"
          variant="subtle"
          colorPalette={mark.status === "open" ? "orange" : "green"}
        >
          {mark.status === "open" ? "Open" : "Answered"}
        </Badge>
        <Text fontSize="11px" color="fg.subtle">
          {mark.raisedByName ?? "An attorney"}
        </Text>
      </HStack>

      <Text fontSize="13px" color="fg" lineHeight="18px">
        {mark.note}
      </Text>

      {mark.comments.length > 0 && (
        <VStack align="stretch" gap={2} mt={2.5}>
          {mark.comments.map((comment) => (
            <Box key={comment.id} borderLeft="2px solid" borderColor="border" pl={2.5}>
              <Text fontSize="11px" color="fg.subtle">
                {comment.authorName ?? "Someone"}
              </Text>
              <Text fontSize="12px" color="fg" lineHeight="17px">
                {comment.body}
              </Text>
            </Box>
          ))}
        </VStack>
      )}

      {onComment && (
        <Box mt={2.5}>
          <Textarea
            size="sm"
            rows={2}
            fontSize="12px"
            placeholder="Say what you changed…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Button
            size="xs"
            variant="outline"
            borderColor="border"
            h="28px"
            mt={1.5}
            fontSize="12px"
            fontWeight="400"
            color="fg.muted"
            disabled={body.trim().length === 0}
            onClick={() => {
              onComment(mark, body.trim());
              setBody("");
            }}
          >
            <MessageSquare size={12} />
            Add a comment
          </Button>
        </Box>
      )}
    </Box>
  );
}
