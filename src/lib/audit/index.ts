/**
 * The audit action vocabulary, mirrored from the backend.
 *
 * `./actions.ts` is a **byte-identical copy** of
 * `oravanti-be/src/lib/audit/actions.ts`. That file has no imports precisely so
 * it can be copied across whole; when the backend adds an action, copy the file
 * again rather than hand-patching the one entry, or the two drift and this app
 * starts rendering raw action names it does not recognise.
 *
 * Import from `@/lib/audit`, not from `@/lib/audit/actions` — this module is
 * the seam, and it is where anything frontend-only (icons, colours) belongs.
 */
export {
  ACCESS_ACTIONS,
  AUDIT_ACTIONS,
  domainOf,
  isAccessAction,
  isAuditAction,
  labelFor,
  type AccessActionDefinition,
  type AccessActionName,
  type AuditActionDefinition,
  type AuditActionName,
  type AuditActionTypeName,
  type AuditCategoryName,
} from "./actions";

import { domainOf } from "./actions";

/**
 * One icon per domain, not one per action.
 *
 * The registry has ~150 actions and grows every time a feature lands. A map
 * keyed on the action name is a map that is always one deployment out of date,
 * which is exactly what the two hand-maintained emoji maps in the lead and case
 * audit tabs were. Keying on the domain means a new `lead.*` action renders
 * correctly the day it ships, with no frontend change at all.
 */
const DOMAIN_ICONS: Record<string, string> = {
  lead: "🎯",
  case: "💼",
  case_review: "🔍",
  client: "👤",
  task: "✅",
  document: "📄",
  finance: "💰",
  invoice: "🧾",
  auth: "🔐",
  security: "🛡️",
  admin: "⚙️",
  system: "🤖",
  audit_log: "📋",
};

/** Falls back rather than returning undefined: an unknown action still gets a marker. */
export const iconForAction = (action: string): string =>
  DOMAIN_ICONS[domainOf(action)] ?? "•";

/**
 * Chakra colour palette per category, for the badge on a feed row.
 *
 * Category comes from the API, which reads it from the registry entry — this
 * app never decides which category an action belongs to.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  business: "blue",
  security: "red",
  admin: "purple",
  system: "gray",
  access: "teal",
};

export const colorForCategory = (category: string): string =>
  CATEGORY_COLORS[category] ?? "gray";

/** Human label for a category, for filter controls and badges. */
export const CATEGORY_LABELS: Record<string, string> = {
  business: "Business",
  security: "Security",
  admin: "Administration",
  system: "System",
  access: "Access",
};

export const labelForCategory = (category: string): string =>
  CATEGORY_LABELS[category] ?? category;

/** Title case for a domain name — "case_review" reads as "Case review". */
export const labelForDomain = (domain: string): string => {
  const words = domain.split("_");
  const [first, ...rest] = words;
  if (!first) return domain;
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(" ");
};
