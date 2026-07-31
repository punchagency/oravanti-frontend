import { StatusPill } from "@/components/ui/intake-ui";
import { Box, HStack, IconButton, Text } from "@chakra-ui/react";
import { Bell, Download, Eye, Flag } from "lucide-react";
import type { ReactNode } from "react";
import {
  FILING_STATUS_LABELS,
  REVIEW_LABELS,
  type DocumentMatter,
  type DocumentReview,
  type FilingStatus,
} from "../data";

/** Client name over a monospaced matter reference — used by every table here. */
export function MatterCell({ matter }: { matter: DocumentMatter }) {
  return (
    <Box>
      <Text fontWeight="500" fontSize="13px">
        {matter.client}
      </Text>
      <Text fontSize="11px" color="fg.muted" fontFamily="mono">
        {matter.reference}
      </Text>
    </Box>
  );
}

/**
 * A missing document reads as plain emphasised text rather than a pill — it is
 * the absence of a file, not a status the AI assigned. Everything else is a
 * soft pill, green once verified and gold while it still needs a human.
 */
export function ReviewCell({ review }: { review: DocumentReview }) {
  if (review === "none") {
    return (
      <Text color="fg.muted" fontSize="13px">
        —
      </Text>
    );
  }
  if (review === "missing") {
    return (
      <Text fontSize="12px" fontWeight="600" color="fg">
        {REVIEW_LABELS.missing}
      </Text>
    );
  }
  return (
    <StatusPill tone={review === "verified" ? "success" : "gold"}>
      {REVIEW_LABELS[review]}
    </StatusPill>
  );
}

export function FilingStatusPill({ status }: { status: FilingStatus }) {
  const settled = status === "approved" || status === "filed";
  return (
    <StatusPill tone={settled ? "success" : "gold"}>
      {FILING_STATUS_LABELS[status]}
    </StatusPill>
  );
}

export function ActionIconButton({
  label,
  children,
  color,
  onClick,
}: {
  label: string;
  children: ReactNode;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <IconButton
      aria-label={label}
      title={label}
      variant="outline"
      size="xs"
      h="28px"
      minW="28px"
      w="28px"
      borderRadius="6px"
      borderColor="border"
      bg="bg"
      color={color ?? "fg.muted"}
      _hover={{ bg: "bg.muted", color: color ?? "fg" }}
      onClick={onClick}
    >
      {children}
    </IconButton>
  );
}

/**
 * Actions follow from the document's state: a file that was never uploaded can
 * only be chased, so it gets a reminder instead of view/download.
 */
export function DocumentRowActions({
  review,
  flagged,
}: {
  review: DocumentReview;
  flagged: boolean;
}) {
  const uploaded = review !== "missing";
  return (
    <HStack gap="6px">
      {uploaded ? (
        <ActionIconButton label="Preview document">
          <Eye size={14} />
        </ActionIconButton>
      ) : (
        <ActionIconButton label="Send reminder">
          <Bell size={14} />
        </ActionIconButton>
      )}
      {flagged && (
        <ActionIconButton label="Review AI flag" color="red.500">
          <Flag size={14} />
        </ActionIconButton>
      )}
      {uploaded && (
        <ActionIconButton label="Download">
          <Download size={14} />
        </ActionIconButton>
      )}
    </HStack>
  );
}
