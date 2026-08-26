import { ReviewQueue } from "../review-queue/review-queue";

/**
 * Intake checklist steps waiting on a reviewer.
 *
 * Same component as the case queue at `/cases/review-queue`, mounted on
 * `source: "pipeline"` — see `review-queue.tsx` for why there is one
 * implementation behind two pages.
 */
export function LeadReviewQueuePage() {
  return (
    <ReviewQueue
      source="pipeline"
      heading="Lead Review Queue"
      description="Approve or reject lead intake tasks submitted for review"
      emptyText="No intake tasks match this filter."
    />
  );
}
