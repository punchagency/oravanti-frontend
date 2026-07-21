import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Circle,
  FileText,
  Link,
  MessageSquare,
  Pin,
  Play,
  Send,
  Shuffle,
  ThumbsUp,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

const iconProps = { size: 13 };

export function EventIcon({ eventType }: { eventType: string }) {
  switch (eventType) {
    // Step events
    case "step_assigned":
      return <UserPlus {...iconProps} />;
    case "step_assigned_override":
      return <AlertTriangle {...iconProps} />;
    case "step_reassigned":
      return <Shuffle {...iconProps} />;
    case "step_submitted_for_review":
      return <Send {...iconProps} />;
    case "step_approved":
      return <ThumbsUp {...iconProps} />;
    case "step_rejected":
      return <XCircle {...iconProps} />;
    case "step_completed":
      return <CheckCircle {...iconProps} />;
    // Module/workflow events
    case "module_activated":
      return <Play {...iconProps} />;
    case "workflow_initialized":
      return <Play {...iconProps} />;
    // Note events
    case "case_note_created":
      return <MessageSquare {...iconProps} />;
    case "case_note_updated":
      return <MessageSquare {...iconProps} />;
    case "case_note_deleted":
      return <MessageSquare {...iconProps} />;
    case "case_note_pinned":
      return <Pin {...iconProps} />;
    case "case_note_unpinned":
      return <Pin {...iconProps} />;
    // Document events
    case "case_document_linked":
      return <Link {...iconProps} />;
    case "case_document_unlinked":
      return <Link {...iconProps} />;
    // Team events
    case "case_team_assigned":
      return <Users {...iconProps} />;
    case "case_team_reassigned":
      return <Users {...iconProps} />;
    // Case events
    case "case_created":
      return <FileText {...iconProps} />;
    case "case_updated":
      return <FileText {...iconProps} />;
    case "case_deleted":
      return <FileText {...iconProps} />;
    case "case_status_changed":
      return <ArrowRight {...iconProps} />;
    case "case_priority_changed":
      return <ArrowRight {...iconProps} />;
    case "case_description_updated":
      return <FileText {...iconProps} />;
    default:
      return <Circle {...iconProps} />;
  }
}

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
