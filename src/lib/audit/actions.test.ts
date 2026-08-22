import { describe, expect, it } from "vitest";
import { AUDIT_ACTIONS, labelFor, type AuditActionName } from "./actions";

/*
  The first test in this repo, and deliberately this one.

  `src/lib/audit/actions.ts` is copied byte-for-byte from the backend, and the
  rule in CLAUDE.md is that the two stay identical. That makes it the one file
  where a frontend-side edit is always a mistake — someone "fixing" a label
  here silently desynchronises the wire vocabulary from the column value.

  These assert the properties the UI actually relies on, so a bad copy fails
  here rather than as a blank row in a customer's audit feed.
*/
describe("the audit action registry", () => {
  it("names every action as domain.verb in lower snake case", () => {
    const malformed = Object.keys(AUDIT_ACTIONS).filter(
      (action) => !/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/.test(action),
    );
    expect(malformed).toEqual([]);
  });

  it("gives every action a non-empty label", () => {
    const unlabelled = Object.entries(AUDIT_ACTIONS)
      .filter(([, meta]) => !meta.label?.trim())
      .map(([action]) => action);
    expect(unlabelled).toEqual([]);
  });

  it("returns the registry label for a known action", () => {
    expect(labelFor("lead.stage_changed" as AuditActionName)).toBe(
      AUDIT_ACTIONS["lead.stage_changed"].label,
    );
  });

  /*
    The fall-through that keeps an older build readable.

    A row written by a newer deployment carries an action this bundle has
    never seen. labelFor must hand back something renderable rather than
    throwing or returning undefined — a thrown error here takes down the whole
    audit feed, and undefined renders as a blank row that looks like data loss.
  */
  it("falls through to the raw action for one it has never seen", () => {
    const unknown = "lead.invented_by_a_newer_deploy" as AuditActionName;
    expect(labelFor(unknown)).toBe(unknown);
  });
});
