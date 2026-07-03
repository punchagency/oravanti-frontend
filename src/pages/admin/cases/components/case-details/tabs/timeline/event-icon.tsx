import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Circle,
  Play,
  Shuffle,
  UserPlus,
} from "lucide-react";

const iconProps = { size: 13 };

export function EventIcon({ eventType }: { eventType: string }) {
  switch (eventType) {
    case "step_assigned":
      return <UserPlus {...iconProps} />;
    case "step_assigned_override":
      return <AlertTriangle {...iconProps} />;
    case "step_reassigned":
      return <Shuffle {...iconProps} />;
    case "step_activated":
      return <ArrowRight {...iconProps} />;
    case "step_completed":
      return <CheckCircle {...iconProps} />;
    case "module_activated":
      return <Play {...iconProps} />;
    case "module_completed":
      return <CheckCircle {...iconProps} />;
    case "workflow_started":
      return <Play {...iconProps} />;
    default:
      return <Circle {...iconProps} />;
  }
}

export function eventColor(eventType: string): string {
  switch (eventType) {
    case "step_completed":
    case "module_completed":
      return "green.500";
    case "step_assigned":
    case "step_assigned_override":
    case "step_reassigned":
      return "blue.500";
    case "step_activated":
    case "module_activated":
      return "purple.500";
    case "workflow_started":
      return "brand.solid";
    default:
      return "fg.subtle";
  }
}
