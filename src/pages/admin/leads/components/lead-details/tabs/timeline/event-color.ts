export function eventColor(eventType: string): string {
  switch (eventType) {
    case "lead_received":
      return "blue.500";
    case "lead_viewed":
      return "fg.subtle";
    case "stage_changed":
      return "purple.500";
    case "conflict_check_run":
      return "yellow.500";
    case "conflict_check_approved":
    case "conflict_overridden":
    case "consultation_completed":
    case "fee_agreement_signed":
    case "task_completed":
    case "task_approved":
      return "green.500";
    case "conflict_check_declined":
    case "consultation_cancelled":
    case "task_rejected":
    case "fee_agreement_voided":
    case "adverse_party_deleted":
      return "red.500";
    case "questionnaire_sent":
    case "questionnaire_response_received":
    case "questionnaire_file_uploaded":
    case "fee_agreement_sent":
    case "task_submitted_for_review":
    case "nudge_sent":
    case "reminder_sent":
      return "yellow.500";
    case "questionnaire_opened":
    case "questionnaire_draft_saved":
    case "consultation_booking_opened":
      return "blue.500";
    case "lead_assigned":
    case "task_assigned":
      return "blue.500";
    case "case_opened":
      return "brand.solid";
    case "adverse_party_added":
    case "adverse_party_updated":
    case "case_workflow_step_updated":
    case "pipeline_initialized":
      return "purple.500";
    default:
      return "fg.subtle";
  }
}
