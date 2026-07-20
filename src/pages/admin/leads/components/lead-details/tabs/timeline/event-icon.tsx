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

export function EventIcon({ eventType }: { eventType: string }) {
  switch (eventType) {
    case "lead_received":
      return <Inbox {...iconProps} />;
    case "lead_updated":
      return <AlertTriangle {...iconProps} />;
    case "lead_viewed":
      return <Eye {...iconProps} />;
    case "stage_changed":
      return <ArrowRight {...iconProps} />;
    case "lead_assigned":
      return <UserPlus {...iconProps} />;
    case "lead_archived":
      return <Clock {...iconProps} />;
    case "lead_restored":
      return <Play {...iconProps} />;
    case "conflict_check_run":
      return <Search {...iconProps} />;
    case "conflict_check_approved":
    case "conflict_overridden":
      return <ThumbsUp {...iconProps} />;
    case "conflict_check_declined":
      return <XCircle {...iconProps} />;
    case "questionnaire_sent":
    case "questionnaire_response_received":
    case "questionnaire_file_uploaded":
      return <Send {...iconProps} />;
    case "questionnaire_opened":
    case "questionnaire_draft_saved":
      return <FileText {...iconProps} />;
    case "consultation_scheduled":
    case "consultation_rescheduled":
    case "consultation_booking_opened":
    case "consultation_slot_selected":
      return <Calendar {...iconProps} />;
    case "consultation_completed":
      return <CheckCircle {...iconProps} />;
    case "consultation_cancelled":
      return <XCircle {...iconProps} />;
    case "fee_agreement_generated":
      return <FileText {...iconProps} />;
    case "fee_agreement_sent":
      return <Send {...iconProps} />;
    case "fee_agreement_signed":
      return <CheckCircle {...iconProps} />;
    case "fee_agreement_voided":
      return <XCircle {...iconProps} />;
    case "pipeline_initialized":
      return <GitBranch {...iconProps} />;
    case "case_opened":
      return <Briefcase {...iconProps} />;
    case "task_assigned":
      return <UserPlus {...iconProps} />;
    case "task_completed":
    case "task_approved":
      return <CheckCircle {...iconProps} />;
    case "task_submitted_for_review":
      return <Send {...iconProps} />;
    case "task_rejected":
      return <XCircle {...iconProps} />;
    case "document_linked":
    case "document_unlinked":
      return <FileText {...iconProps} />;
    case "nudge_sent":
    case "reminder_sent":
      return <Send {...iconProps} />;
    case "missing_documents_requested":
      return <Search {...iconProps} />;
    case "adverse_party_added":
    case "adverse_party_updated":
    case "adverse_party_deleted":
      return <Users {...iconProps} />;
    case "case_workflow_step_updated":
      return <GitBranch {...iconProps} />;
    default:
      return <Circle {...iconProps} />;
  }
}

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
