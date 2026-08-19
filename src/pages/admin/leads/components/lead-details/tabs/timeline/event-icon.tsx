import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  FileText,
  Inbox,
  Play,
  Search,
  Send,
  ThumbsUp,
  UserPlus,
  Users,
  XCircle,
  Eye,
  GitBranch,
} from "lucide-react";

const iconProps = { size: 13 };

/**
 * The glyph for one row of a lead timeline.
 *
 * Keyed on the registry action name, with no re-casing — see `@/lib/audit`.
 * The fallback is real: an action written by a newer deployment must still
 * draw a timeline node.
 */
export function EventIcon({ action }: { action: string }) {
  switch (action) {
    case "lead.received":
      return <Inbox {...iconProps} />;
    case "lead.updated":
      return <AlertTriangle {...iconProps} />;
    case "lead.viewed":
      return <Eye {...iconProps} />;
    case "lead.stage_changed":
      return <ArrowRight {...iconProps} />;
    case "lead.assigned":
      return <UserPlus {...iconProps} />;
    case "lead.archived":
      return <Clock {...iconProps} />;
    case "lead.restored":
      return <Play {...iconProps} />;
    case "lead.conflict_check_run":
      return <Search {...iconProps} />;
    case "lead.conflict_check_approved":
    case "lead.conflict_overridden":
      return <ThumbsUp {...iconProps} />;
    case "lead.conflict_check_declined":
      return <XCircle {...iconProps} />;
    case "lead.questionnaire_sent":
    case "lead.questionnaire_response_received":
    case "lead.questionnaire_file_uploaded":
      return <Send {...iconProps} />;
    case "lead.questionnaire_opened":
    case "lead.questionnaire_draft_saved":
      return <FileText {...iconProps} />;
    case "lead.consultation_scheduled":
    case "lead.consultation_rescheduled":
    case "lead.consultation_booking_opened":
    case "lead.consultation_slot_selected":
      return <Calendar {...iconProps} />;
    case "lead.consultation_completed":
      return <CheckCircle {...iconProps} />;
    case "lead.consultation_cancelled":
      return <XCircle {...iconProps} />;
    case "lead.fee_agreement_generated":
      return <FileText {...iconProps} />;
    case "lead.fee_agreement_sent":
      return <Send {...iconProps} />;
    case "lead.fee_agreement_signed":
      return <CheckCircle {...iconProps} />;
    case "lead.fee_agreement_voided":
      return <XCircle {...iconProps} />;
    case "lead.pipeline_initialized":
      return <GitBranch {...iconProps} />;
    case "lead.case_opened":
      return <Briefcase {...iconProps} />;
    case "lead.task_assigned":
      return <UserPlus {...iconProps} />;
    case "lead.task_completed":
    case "lead.task_approved":
      return <CheckCircle {...iconProps} />;
    case "lead.task_submitted_for_review":
      return <Send {...iconProps} />;
    case "lead.task_rejected":
      return <XCircle {...iconProps} />;
    case "lead.document_linked":
    case "lead.document_unlinked":
      return <FileText {...iconProps} />;
    case "lead.nudge_sent":
    case "lead.reminder_sent":
      return <Send {...iconProps} />;
    case "lead.missing_documents_requested":
      return <Search {...iconProps} />;
    case "lead.adverse_party_added":
    case "lead.adverse_party_updated":
    case "lead.adverse_party_deleted":
      return <Users {...iconProps} />;
    case "lead.case_workflow_step_updated":
      return <GitBranch {...iconProps} />;
    default:
      return <Circle {...iconProps} />;
  }
}
