import { Box } from "@chakra-ui/react";
import { CheckCircle, Circle, Clock, AlertTriangle, XCircle } from "lucide-react";

/**
 * Renders a status icon for a workflow step based on its current state.
 *
 * - complete → green checkmark
 * - in_progress → blue clock
 * - in_review → orange clock
 * - rejected → red cross (sent back by a reviewer)
 * - blocked → orange warning
 * - any other (e.g. not_started) → muted circle
 */
export function StepIcon({ status }: { status: string }) {
  const iconProps = { size: 14 };
  switch (status) {
    case "complete":
      return <Box as="span" color="green.500"><CheckCircle {...iconProps} /></Box>;
    case "in_progress":
      return <Box as="span" color="blue.500"><Clock {...iconProps} /></Box>;
    case "in_review":
      return <Box as="span" color="orange.500"><Clock {...iconProps} /></Box>;
    case "rejected":
      return <Box as="span" color="red.500"><XCircle {...iconProps} /></Box>;
    case "blocked":
      return <Box as="span" color="orange.500"><AlertTriangle {...iconProps} /></Box>;
    default:
      return <Box as="span" color="fg.subtle"><Circle {...iconProps} /></Box>;
  }
}
