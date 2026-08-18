/**
 * The dot colour for one row of a lead timeline.
 *
 * Keyed on the registry action name, with no re-casing — see `@/lib/audit`.
 * Grouped by what the event means to a reader rather than by domain, which is
 * why this is a switch and not the category colour: an approval and a
 * rejection share a category but must never share a colour. Unknown actions
 * fall through to a neutral dot rather than disappearing.
 */
export function eventColor(action: string): string {
  switch (action) {
    case "lead.received":
      return "blue.500";
    case "lead.viewed":
      return "fg.subtle";
    case "lead.stage_changed":
      return "purple.500";
    case "lead.conflict_check_run":
      return "yellow.500";
    case "lead.conflict_check_approved":
    case "lead.conflict_overridden":
    case "lead.consultation_completed":
    case "lead.fee_agreement_signed":
    case "lead.task_completed":
    case "lead.task_approved":
      return "green.500";
    case "lead.conflict_check_declined":
    case "lead.consultation_cancelled":
    case "lead.task_rejected":
    case "lead.fee_agreement_voided":
    case "lead.adverse_party_deleted":
      return "red.500";
    case "lead.questionnaire_sent":
    case "lead.questionnaire_response_received":
    case "lead.questionnaire_file_uploaded":
    case "lead.fee_agreement_sent":
    case "lead.task_submitted_for_review":
    case "lead.nudge_sent":
    case "lead.reminder_sent":
      return "yellow.500";
    case "lead.questionnaire_opened":
    case "lead.questionnaire_draft_saved":
    case "lead.consultation_booking_opened":
      return "blue.500";
    case "lead.assigned":
    case "lead.task_assigned":
      return "blue.500";
    case "lead.case_opened":
      return "brand.solid";
    case "lead.adverse_party_added":
    case "lead.adverse_party_updated":
    case "lead.case_workflow_step_updated":
    case "lead.pipeline_initialized":
      return "purple.500";
    default:
      return "fg.subtle";
  }
}
