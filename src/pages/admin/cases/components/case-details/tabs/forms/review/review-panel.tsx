import type { FilingReview, FormCorrection } from "@/api/case-details";
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
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { paletteFor } from "./correction-color";

/**
 * Where the filing package stands, and everything still open on it.
 *
 * ─── Why this sits above the forms rather than inside one ──────────────────
 *
 * A filing is reviewed as a package. The question somebody brings to this tab
 * during a review is "what is still open?", and answering it by clicking
 * through six forms is exactly what a package view exists to prevent. Each row
 * says which form and which part or field it is on, and selects that form.
 *
 * ─── What each person sees ──────────────────────────────────────────────────
 *
 * `canReview` comes from the server, because "who is an attorney" is answered
 * from three columns that disagree in real data. The team can resolve; the
 * attorney additionally sees Reopen. Nothing is rendered disabled-but-present:
 * a control that 403s is a promise the app cannot keep.
 *
 * The package's own actions — Send for review, Approve filing — are *not* here.
 * They act on the whole filing, so they sit in the tab's header with the other
 * package actions; this panel is where the review is read, not where the
 * package's state is set from.
 *
 * ─── It gets out of the way when it has nothing to say ──────────────────────
 *
 * It was a permanent block: a heading, a badge and a sentence, above the work,
 * on every visit. Folded to one line when nothing is open, it still answers the
 * question it exists for — where does this filing stand — in the space a status
 * line deserves. The fold follows the marks rather than being remembered, so a
 * correction raised while somebody is looking opens it; pressing the chevron
 * takes that decision back off it for as long as the tab is open.
 */
export function ReviewPanel({
  review,
  onSelectForm,
  onResolve,
  onReopen,
  onComment,
}: {
  review: FilingReview;
  onSelectForm: (formCode: string) => void;
  onResolve: (correction: FormCorrection) => void;
  onReopen: (correction: FormCorrection) => void;
  onComment: (correction: FormCorrection, body: string) => void;
}) {
  const open = review.corrections.filter((c) => c.status === "open");
  const answered = review.corrections.filter((c) => c.status === "resolved");
  const [showAnswered, setShowAnswered] = useState(false);

  /** `null` while nobody has overridden it — see the note above. */
  const [override, setOverride] = useState<boolean | null>(null);
  const isExpanded = override ?? open.length > 0;

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="md"
      px={4}
      py={isExpanded ? 4 : 2.5}
      mb={4}
      borderLeft="3px solid"
      borderLeftColor={accentFor(review)}
    >
      <Flex justify="space-between" align="flex-start" gap={4} flexWrap="wrap">
        <Box minW={0}>
          <HStack gap={2} align="center">
            <Text fontSize="14px" fontWeight="500" color="fg">
              Attorney review
            </Text>
            <StatusBadge review={review} />
            {!isExpanded && open.length > 0 && (
              <Text fontSize="12px" color="fg.muted">
                {open.length} open
              </Text>
            )}
          </HStack>
          {isExpanded && (
            <Text fontSize="12px" color="fg.muted" mt={1} lineHeight="17px">
              {describe(review)}
            </Text>
          )}
        </Box>

        <IconButton
          aria-label={
            isExpanded ? "Hide the review detail" : "Show the review detail"
          }
          size="xs"
          variant="ghost"
          color="fg.muted"
          _hover={{ bg: "bg.emphasized/50", color: "fg" }}
          onClick={() => setOverride(!isExpanded)}
        >
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </IconButton>
      </Flex>

      {isExpanded && review.corrections.length > 0 && (
        <VStack align="stretch" gap={2} mt={4}>
          {open.map((correction) => (
            <CorrectionCard
              key={correction.id}
              correction={correction}
              canReview={review.canReview}
              onSelectForm={onSelectForm}
              onResolve={onResolve}
              onReopen={onReopen}
              onComment={onComment}
            />
          ))}

          {answered.length > 0 && (
            <>
              <Button
                variant="plain"
                size="xs"
                alignSelf="flex-start"
                px={0}
                h="24px"
                fontSize="12px"
                fontWeight="400"
                color="fg.subtle"
                onClick={() => setShowAnswered((was) => !was)}
              >
                {showAnswered ? "Hide" : "Show"} {answered.length} answered
                correction{answered.length === 1 ? "" : "s"}
              </Button>

              {showAnswered &&
                answered.map((correction) => (
                  <CorrectionCard
                    key={correction.id}
                    correction={correction}
                    canReview={review.canReview}
                    onSelectForm={onSelectForm}
                    onResolve={onResolve}
                    onReopen={onReopen}
                    onComment={onComment}
                  />
                ))}
            </>
          )}
        </VStack>
      )}
    </Box>
  );
}

/** One mark: where it is, what it says, and the conversation under it. */
function CorrectionCard({
  correction,
  canReview,
  onSelectForm,
  onResolve,
  onReopen,
  onComment,
}: {
  correction: FormCorrection;
  canReview: boolean;
  onSelectForm: (formCode: string) => void;
  onResolve: (correction: FormCorrection) => void;
  onReopen: (correction: FormCorrection) => void;
  onComment: (correction: FormCorrection, body: string) => void;
}) {
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const palette = paletteFor(correction.color);
  const isOpen = correction.status === "open";

  return (
    <Box
      border="1px solid"
      borderColor="border.muted"
      borderRadius="sm"
      p={3}
      opacity={isOpen ? 1 : 0.75}
    >
      <Flex gap={2.5} align="flex-start">
        <Circle size="9px" bg={`${palette}.solid`} mt="5px" flexShrink={0} />

        <Box flex={1} minW={0}>
          <HStack gap={1.5} flexWrap="wrap" align="baseline">
            {/* The form is a link because the mark's whole purpose is to send
                somebody to the thing that is wrong. */}
            <Button
              variant="plain"
              size="xs"
              px={0}
              h="auto"
              minW={0}
              fontSize="12px"
              fontWeight="500"
              color="fg"
              textDecoration="underline"
              textUnderlineOffset="2px"
              onClick={() => onSelectForm(correction.formCode)}
            >
              {correction.formCode}
            </Button>
            <Text fontSize="12px" color="fg.muted" wordBreak="break-word">
              {correction.partLabel ?? correction.fieldKey}
            </Text>
            {!isOpen && (
              <Badge
                size="sm"
                variant="subtle"
                colorPalette="green"
                fontSize="10px"
              >
                answered
              </Badge>
            )}
          </HStack>

          <Text fontSize="13px" color="fg" mt={1} lineHeight="18px">
            {correction.note}
          </Text>
          <Text fontSize="11px" color="fg.subtle" mt={0.5}>
            {correction.raisedByName ?? "An attorney"} ·{" "}
            {new Date(correction.raisedAt).toLocaleDateString()}
          </Text>

          {correction.comments.length > 0 && (
            <VStack
              align="stretch"
              gap={1.5}
              mt={2.5}
              pl={2.5}
              borderLeft="2px solid"
              borderLeftColor="border.muted"
            >
              {correction.comments.map((comment) => (
                <Box key={comment.id}>
                  <Text fontSize="12px" color="fg" lineHeight="17px">
                    {comment.body}
                  </Text>
                  <Text fontSize="11px" color="fg.subtle">
                    {comment.authorName ?? "Someone"} ·{" "}
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </Text>
                </Box>
              ))}
            </VStack>
          )}

          {replying ? (
            <VStack align="stretch" gap={2} mt={2.5}>
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Add to this thread"
                rows={2}
                fontSize="13px"
                autoFocus
              />
              <HStack gap={2}>
                <Button
                  layerStyle="brand-button"
                  size="xs"
                  h="30px"
                  fontSize="12px"
                  disabled={reply.trim().length === 0}
                  onClick={() => {
                    onComment(correction, reply.trim());
                    setReply("");
                    setReplying(false);
                  }}
                >
                  Comment
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  borderColor="border"
                  h="30px"
                  fontSize="12px"
                  fontWeight="400"
                  onClick={() => setReplying(false)}
                >
                  Cancel
                </Button>
              </HStack>
            </VStack>
          ) : (
            <HStack gap={1.5} mt={2}>
              {isOpen ? (
                <Button
                  size="xs"
                  variant="outline"
                  borderColor="border"
                  h="28px"
                  px={2.5}
                  fontSize="12px"
                  fontWeight="400"
                  color="fg.muted"
                  onClick={() => onResolve(correction)}
                >
                  <CheckCircle2 size={12} />
                  Resolve
                </Button>
              ) : (
                canReview && (
                  <Button
                    size="xs"
                    variant="outline"
                    borderColor="border"
                    h="28px"
                    px={2.5}
                    fontSize="12px"
                    fontWeight="400"
                    color="fg.muted"
                    onClick={() => onReopen(correction)}
                  >
                    <RotateCcw size={12} />
                    Reopen
                  </Button>
                )
              )}
              <Button
                size="xs"
                variant="plain"
                h="28px"
                px={1.5}
                fontSize="12px"
                fontWeight="400"
                color="fg.subtle"
                onClick={() => setReplying(true)}
              >
                <MessageSquare size={12} />
                Comment
              </Button>
            </HStack>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

function StatusBadge({ review }: { review: FilingReview }) {
  const { palette, label } = STATUS[review.status] ?? STATUS.in_preparation;

  return (
    <Badge size="sm" variant="subtle" colorPalette={palette} fontSize="10px">
      {label}
    </Badge>
  );
}

/**
 * The four states, and a default for one a newer deployment adds.
 *
 * Keyed on the status the server sends rather than on a re-cased variant of it
 * — the same rule the audit registry documents, arriving here through a
 * different door.
 */
const STATUS: Record<string, { palette: string; label: string }> = {
  in_preparation: { palette: "gray", label: "In preparation" },
  in_review: { palette: "blue", label: "In review" },
  changes_requested: { palette: "orange", label: "Changes requested" },
  approved: { palette: "green", label: "Approved" },
};

const accentFor = (review: FilingReview) =>
  review.status === "approved"
    ? "green.solid"
    : review.openCount > 0
      ? "orange.solid"
      : "border";

/** The one sentence under the heading — what this state means for the person reading it. */
function describe(review: FilingReview) {
  if (review.status === "approved") {
    return `Approved${review.approvedByName ? ` by ${review.approvedByName}` : ""}${
      review.approvedAt
        ? ` on ${new Date(review.approvedAt).toLocaleDateString()}`
        : ""
    }. Forms can now be marked ready to file.`;
  }

  if (review.openCount > 0) {
    return `${review.openCount} correction${review.openCount === 1 ? "" : "s"} still to answer. The filing cannot be approved, and no form can be marked ready to file, until every one has been.`;
  }

  if (review.status === "in_review") {
    return "With the reviewing attorney. Nothing is marked for correction.";
  }

  return "Not yet sent for review. A form can only be marked ready to file once an attorney has approved the package.";
}
