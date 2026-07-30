import type { IssueBadge } from "@/api/case-review";
import type { DocumentAiReview } from "@/api/questionnaires";
import { StatusPill } from "@/components/ui/intake-ui";
import { HStack } from "@chakra-ui/react";
import { badgeTone } from "../severity";

type GroupedFlag = { flag: string; badge: IssueBadge; count: number };

/**
 * Collapse repeats of the same label into one pill with a count.
 *
 * A document with three conflicts is three issues, but three identical
 * "Conflict" pills read as noise rather than as information. The group takes the
 * most severe badge of its members, so collapsing can never make a critical
 * finding look like a warning.
 */
const groupFlags = (flags: DocumentAiReview["flags"]): GroupedFlag[] => {
  const groups = new Map<string, GroupedFlag>();
  for (const f of flags) {
    const existing = groups.get(f.flag);
    if (!existing) {
      groups.set(f.flag, { flag: f.flag, badge: f.badge, count: 1 });
      continue;
    }
    existing.count += 1;
    if (f.badge === "critical") existing.badge = "critical";
  }
  return [...groups.values()];
};

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
        {groupFlags(review.flags).map((g) => (
          <StatusPill key={g.flag} tone={badgeTone(g.badge)}>
            {g.count > 1 ? `${g.count}x ${g.flag}` : g.flag}
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
