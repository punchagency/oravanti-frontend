import type { IssueBadge, ScenarioType } from "@/api/case-review";

/** Tint used behind a critical vs warning issue card (semantic tokens). */
export const cardTint = (badge: IssueBadge) =>
  badge === "critical"
    ? { bg: "red.50", borderColor: "red.200" }
    : { bg: "orange.50", borderColor: "orange.200" };

/** intake-ui pill tone for a badge. */
export const badgeTone = (badge: IssueBadge): "danger" | "warning" =>
  badge === "critical" ? "danger" : "warning";

export const badgeLabel = (badge: IssueBadge) =>
  badge === "critical" ? "Critical" : "Warning";

/** Route to a matter's detail page. */
export const matterPath = (type: ScenarioType, id: string) =>
  type === "lead" ? `/leads/${id}` : `/cases/${id}`;

/** Route to a matter's documents tab. */
export const matterDocumentsPath = (type: ScenarioType, id: string) =>
  `${matterPath(type, id)}/documents`;
