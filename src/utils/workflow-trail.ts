import type { StepActionLogEntry } from "@/api/workflows";

export interface TrailEntry {
  label: string;
  text: string;
}

const ACTION_LABEL_MAP: Record<string, string> = {
  SUBMITTED: "Submission note",
  REJECTED: "Review feedback",
  APPROVED: "Approval note",
  COMPLETED: "Completion note",
  ASSIGNED: "Assignment",
};

export function stepActionLabel(action: string): string {
  return ACTION_LABEL_MAP[action] ?? action;
}

function formatDuration(ms: number | null | undefined): string | null {
  if (ms == null) return null;
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m ${totalSeconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export function toTrailEntries(log: StepActionLogEntry[]): TrailEntry[] {
  return log
    .filter((entry) => entry.note)
    .map((entry) => {
      const actor = entry.actorName;
      const assignee = entry.assigneeName;
      const dur = formatDuration(entry.timeTakenMs);
      const parts: string[] = [entry.note!];
      const meta: string[] = [];
      if (actor) meta.push(`by ${actor}`);
      if (assignee) meta.push(`to ${assignee}`);
      if (dur) meta.push(`took ${dur}`);
      if (meta.length > 0) parts.push(`(${meta.join(", ")})`);
      return {
        label: stepActionLabel(entry.action),
        text: parts.join(" "),
      };
    });
}

/**
 * Legacy: parses the old `---`-separated notes string.
 * Use `toTrailEntries` for new StepActionLogEntry[] data.
 */
export function parseTrail(notes: string | null): TrailEntry[] {
  if (!notes) return [];
  const PREFIX_MAP: [string, string][] = [
    ["Submit note: ", "Submission note"],
    ["Review feedback: ", "Review feedback"],
    ["Approval note: ", "Approval note"],
    ["Completion note: ", "Completion note"],
  ];
  return notes
    .split("---")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      for (const [prefix, label] of PREFIX_MAP) {
        if (entry.startsWith(prefix)) {
          return { label, text: entry.slice(prefix.length).trim() };
        }
      }
      return { label: "Note", text: entry };
    });
}
