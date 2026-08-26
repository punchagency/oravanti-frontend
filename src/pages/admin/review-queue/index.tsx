import { ReviewQueue } from "./review-queue";

/**
 * Case workflow steps waiting on a reviewer.
 *
 * The intake twin lives at `/leads/review-queue`. They are separate pages on
 * purpose — a reviewer works one or the other, and merging them would put a
 * matter and a prospect in the same list — but they read the same endpoint and
 * render the same cards, so the two cannot drift apart again.
 */
export function ReviewQueuePage() {
  return (
    <ReviewQueue
      source="workflow"
      heading="Review Queue"
      description="Approve or reject case workflow steps submitted for review"
      emptyText="No case workflow steps match this filter."
    />
  );
}
