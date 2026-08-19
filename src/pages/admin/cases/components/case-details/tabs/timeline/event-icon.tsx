import {
  ArrowRight,
  CheckCircle,
  Circle,
  Eye,
  FileText,
  Link,
  MessageSquare,
  Pin,
  Play,
  RotateCcw,
  Send,
  SkipForward,
  ThumbsUp,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

const iconProps = { size: 13 };

/**
 * The glyph for one row of a matter's timeline.
 *
 * Keyed on the registry action name, with no re-casing — see `@/lib/audit`.
 * The plain circle is a real fallback, not an oversight: an action written by a
 * newer deployment must still draw a timeline node.
 */
export function EventIcon({ action }: { action: string }) {
  switch (action) {
    // Workflow steps
    case "case.step_assigned":
      return <UserPlus {...iconProps} />;
    case "case.step_started":
      return <Play {...iconProps} />;
    case "case.step_submitted_for_review":
      return <Send {...iconProps} />;
    case "case.step_approved":
      return <ThumbsUp {...iconProps} />;
    case "case.step_rejected":
      return <XCircle {...iconProps} />;
    case "case.step_completed":
      return <CheckCircle {...iconProps} />;
    case "case.step_reopened":
      return <RotateCcw {...iconProps} />;
    case "case.step_skipped":
      return <SkipForward {...iconProps} />;

    // Workflow lifecycle
    case "case.module_activated":
    case "case.workflow_initialized":
      return <Play {...iconProps} />;

    // Notes
    case "case.note_created":
    case "case.note_updated":
    case "case.note_deleted":
      return <MessageSquare {...iconProps} />;
    case "case.note_pinned":
    case "case.note_unpinned":
      return <Pin {...iconProps} />;

    // Documents
    case "case.document_linked":
    case "case.document_unlinked":
      return <Link {...iconProps} />;

    // Teams
    case "case.team_assigned":
    case "case.team_reassigned":
      return <Users {...iconProps} />;

    // The matter itself
    case "case.created":
    case "case.updated":
    case "case.deleted":
    case "case.description_updated":
      return <FileText {...iconProps} />;
    case "case.status_changed":
    case "case.priority_changed":
      return <ArrowRight {...iconProps} />;
    case "case.closed":
      return <CheckCircle {...iconProps} />;
    case "case.reopened":
      return <RotateCcw {...iconProps} />;
    case "case.viewed":
      return <Eye {...iconProps} />;

    default:
      return <Circle {...iconProps} />;
  }
}
