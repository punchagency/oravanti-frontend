import { ImmigrationPanel } from "./immigration-panel";
import { PersonalInjuryPanel } from "./personal-injury-panel";

/**
 * Renders whichever practice-area panel this case's area calls for, or nothing.
 *
 * This is the front-end half of "practice-area-specific fields don't bloat the
 * generic case view": a family-law matter has no immigration filing track, so
 * it gets no filing-track field.
 *
 * Matched on the practice area's *name* because that is what the case record
 * carries — case-type IDs are per-firm taxonomy rows, of which Personal Injury
 * alone has seventy, so keying on them would mean shipping a list that goes
 * stale the moment a firm adds a leaf. The match is a case-insensitive
 * substring so "Immigration & Nationality" and "Immigration" both resolve, and
 * an unrecognised area renders nothing rather than guessing.
 *
 * ─── The practice area picks the panel, not its contents ────────────────────
 *
 * Two different questions, and conflating them was a bug. *Which* panel is a
 * practice-area question, because each area has its own extension table and a
 * case has at most one of them. *What is on it* is a case-type question: an
 * N-400 and an I-485 are both Immigration, read the same extension table, and
 * share almost no facts. So the area routes to a panel and the panel decides
 * its own fields from the workflow the case actually runs — see
 * `case-type-fields.ts`. Personal Injury needs no such split: its seventy case
 * types all run the one lifecycle template.
 */
export function PracticeAreaPanel({
  caseId,
  caseTypeId,
  practiceAreaName,
}: {
  caseId: string;
  caseTypeId: string | null | undefined;
  practiceAreaName: string | null | undefined;
}) {
  const area = (practiceAreaName ?? "").toLowerCase();

  if (area.includes("immigration")) {
    return <ImmigrationPanel caseId={caseId} caseTypeId={caseTypeId} />;
  }
  if (area.includes("personal injury")) return <PersonalInjuryPanel caseId={caseId} />;

  return null;
}
