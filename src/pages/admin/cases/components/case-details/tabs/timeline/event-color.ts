export function eventColor(eventType: string): string {
  switch (eventType) {
    // Completed / approved = green
    case "step_completed":
    case "step_approved":
    case "workflow_initialized":
    case "case_created":
      return "green.500";
    // Assigned = blue
    case "step_assigned":
    case "step_assigned_override":
    case "step_reassigned":
    case "case_team_assigned":
    case "case_team_reassigned":
      return "blue.500";
    // Submitted for review = yellow
    case "step_submitted_for_review":
      return "yellow.500";
    // Rejected / deleted = red
    case "step_rejected":
    case "case_deleted":
    case "case_note_deleted":
    case "case_document_unlinked":
      return "red.500";
    // Activated / pinned = purple
    case "step_activated":
    case "module_activated":
    case "case_note_pinned":
    case "case_note_unpinned":
      return "purple.500";
    // Notes, documents, updates = brand
    case "case_note_created":
    case "case_note_updated":
    case "case_document_linked":
    case "case_updated":
    case "case_status_changed":
    case "case_priority_changed":
    case "case_description_updated":
    case "case_viewed":
      return "brand.solid";
    default:
      return "fg.subtle";
  }
}
