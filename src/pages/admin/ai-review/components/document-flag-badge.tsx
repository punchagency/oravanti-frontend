import type { DocumentAiReview } from "@/api/questionnaires";
import { StatusPill } from "@/components/ui/intake-ui";
import { HStack } from "@chakra-ui/react";
import { badgeTone } from "../severity";

/**
 * The AI's verdict on one document, small enough to sit in a checklist row.
 *
 * Every scanned document says something. A document with no flags is only
 * "Clear" once its scan actually completed — otherwise a failed or never-run
 * scan would be indistinguishable from a clean bill of health, which is the
 * more dangerous of the two to get wrong.
 */
export function DocumentFlagBadge({ review }: { review?: DocumentAiReview }) {
  if (!review) return null;

  if (review.flags.length > 0) {
    return (
      <HStack gap="4px" flexWrap="wrap">
        {review.flags.map((f) => (
          <StatusPill key={f.issueId} tone={badgeTone(f.badge)}>
            {f.flag}
          </StatusPill>
        ))}
      </HStack>
    );
  }

  switch (review.status) {
    case "complete":
      return <StatusPill tone="success">Clear</StatusPill>;
    case "pending":
    case "queued":
    case "running":
      return <StatusPill tone="neutral">Scanning…</StatusPill>;
    default:
      return <StatusPill tone="neutral">Not scanned</StatusPill>;
  }
}
