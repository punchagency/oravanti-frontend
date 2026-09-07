/**
 * A field key's domain, and what to call it on screen.
 *
 * The first segment of a key is either the datum's domain
 * (`beneficiary.date_of_birth`) or the form's own compacted code
 * (`i485.pt1.1_family_name`) — the one rule that tells the two populations of
 * field key apart, stated the same way on the backend in `pdf-field-naming.ts`.
 *
 * These live here rather than beside the CRM's box mapper because both tiers
 * need them now: the mapper groups its picker by domain, and so does the
 * question dialog, which is shared by the firm and the platform. A helper
 * imported upward out of `pages/platform/` into a shared component is a
 * layering the next person has to justify.
 */

/** The key's first segment: `beneficiary.date_of_birth` → `beneficiary`. */
export const datumDomain = (fieldKey: string) =>
  fieldKey.split(".")[0] ?? fieldKey;

/** The first segment a generated key gets: the form's code, compacted. */
export const formLocalPrefix = (formCode: string) =>
  formCode.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Whether this key names a datum the questionnaire can actually answer.
 *
 * **Not the runtime rule any more.** Everything on screen reads
 * `CatalogueField.schemaNodeId` instead: null exactly when the box carries no
 * shared datum, and a foreign key cannot drift from the vocabulary the way a
 * rule about the shape of a string could. The mapper's overlay, the CRM's
 * coverage bar and population all read that column.
 *
 * What is left is measurement over static text. `rank-field-keys.test.ts`
 * scores the ranking against `wired-by-hand.fixture.ts` — 252 pairs of strings,
 * no database, no rows to join — and it needs to know which of them are shared
 * data. That is this function's whole remaining job; reach for the column
 * anywhere a row exists.
 */
export const isSharedDatum = (fieldKey: string, formCode: string) =>
  datumDomain(fieldKey) !== formLocalPrefix(formCode);

/**
 * What a domain is called on screen.
 *
 * Only the domains the six catalogued forms actually use. A domain with no
 * entry falls back to its own segment title-cased, so a seventh form naming a
 * ninth domain gets a readable heading rather than nothing — this is a display
 * table, and it must never be the thing that decides whether a datum appears.
 */
const DOMAIN_LABELS: Record<string, string> = {
  beneficiary: "Beneficiary / applicant",
  petitioner: "Petitioner",
  sponsor: "Sponsor",
  family: "Family",
  marriage: "Marriage",
  employment: "Employment",
  immigration: "Immigration history",
  biographic: "Biographic",
  medical: "Medical",
  travel: "Travel",
};

export const domainLabel = (domain: string) =>
  DOMAIN_LABELS[domain] ??
  domain.charAt(0).toUpperCase() + domain.slice(1).replace(/_/g, " ");

/** The order domains appear in, most-used first, then anything unlisted. */
const DOMAIN_ORDER = Object.keys(DOMAIN_LABELS);

export const compareDomains = (a: string, b: string) => {
  const ai = DOMAIN_ORDER.indexOf(a);
  const bi = DOMAIN_ORDER.indexOf(b);
  if (ai === bi) return a.localeCompare(b);
  if (ai < 0) return 1;
  if (bi < 0) return -1;
  return ai - bi;
};
