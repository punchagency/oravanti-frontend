import { Box } from "@chakra-ui/react";
import {
  CheckCircle,
  Circle,
  Clock,
  MinusCircle,
  XCircle,
} from "lucide-react";
import type { TaskStatus } from "@/api/tasks";

/**
 * Status icon for a task, keyed on the exact `task_status` value the API sends.
 *
 * The `default` branch is deliberate, not defensive padding: a row written by a
 * newer deployment can carry a status this build has never seen, and it must
 * render as an unstarted step rather than as a blank cell.
 */
export function TaskStatusIcon({ status }: { status: TaskStatus | string }) {
  const size = 14;

  switch (status) {
    case "completed":
      return <Box as="span" color="green.500"><CheckCircle size={size} /></Box>;
    case "in_progress":
      return <Box as="span" color="blue.500"><Clock size={size} /></Box>;
    case "in_review":
      return <Box as="span" color="orange.500"><Clock size={size} /></Box>;
    case "rejected":
      return <Box as="span" color="red.500"><XCircle size={size} /></Box>;
    case "skipped":
    case "cancelled":
      return <Box as="span" color="fg.subtle"><MinusCircle size={size} /></Box>;
    default:
      return <Box as="span" color="fg.subtle"><Circle size={size} /></Box>;
  }
}
