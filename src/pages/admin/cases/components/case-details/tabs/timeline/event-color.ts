/**
 * The dot colour for one row of a matter's timeline.
 *
 * Keyed on the registry action name — the same string the backend stored, with
 * no re-casing. Grouped by what the event *means* to a reader rather than by
 * domain, which is why this is a switch and not the category colour from
 * `@/lib/audit`: an approval and a rejection share a category but must never
 * share a colour.
 *
 * An action with no case here falls through to a neutral dot, so a row written
 * by a newer deployment renders rather than disappearing.
 */
export function eventColor(action: string): string {
  switch (action) {
    // Completed / approved
    case "case.step_completed":
    case "case.step_approved":
    case "case.workflow_initialized":
    case "case.created":
    case "case.closed":
      return "green.500";

    // Assignment
    case "case.step_assigned":
    case "case.team_assigned":
    case "case.team_reassigned":
      return "blue.500";

    // Waiting on someone
    case "case.step_submitted_for_review":
      return "yellow.500";

    // Refused or removed
    case "case.step_rejected":
    case "case.step_skipped":
    case "case.deleted":
    case "case.note_deleted":
    case "case.document_unlinked":
      return "red.500";

    // Started or highlighted
    case "case.step_started":
    case "case.step_reopened":
    case "case.reopened":
    case "case.module_activated":
    case "case.note_pinned":
    case "case.note_unpinned":
      return "purple.500";

    // Ordinary edits
    case "case.note_created":
    case "case.note_updated":
    case "case.document_linked":
    case "case.updated":
    case "case.status_changed":
    case "case.priority_changed":
    case "case.description_updated":
    case "case.viewed":
      return "brand.solid";

    default:
      return "fg.subtle";
  }
}
