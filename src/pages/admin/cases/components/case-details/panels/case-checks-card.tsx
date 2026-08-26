import { Alert, Box, Stack, Text } from "@chakra-ui/react";
import { useCasePitfalls } from "@/hooks/use-case-details";
import type { CasePitfall } from "@/api/case-details";

/**
 * The § 1.5 checks, in front of the attorney rather than buried in a tab.
 *
 * Two things about how this renders are deliberate:
 *
 *   • **The message is shown verbatim.** The backend writes it naming the actual
 *     dates and amounts — "Sponsor income is $30,000" — and rebuilding a
 *     sentence here would either lose those facts or restate them from a second
 *     copy of the rule. The heading is the only text this component supplies.
 *
 *   • **Only one severity can block.** A superseded form edition is a certain
 *     USCIS rejection with no judgement in it; every other check turns on facts
 *     the system cannot see, so it is offered as something to weigh. Rendering
 *     them all identically would flatten that distinction, which is the one
 *     thing an attorney most needs to see at a glance.
 *
 * Renders nothing when there is nothing to say — an empty card is noise on the
 * overview of a case that has no problems.
 */

/** Short heading per check. The detail is in the message the API sends. */
const HEADING: Record<CasePitfall["code"], string> = {
  travel_without_advance_parole: "Travel without advance parole",
  employment_before_work_authorization: "Employment before work authorisation",
  i864_income_below_threshold: "I-864 income below the threshold",
  i693_bound_to_closed_application: "I-693 tied to a closed application",
  status_expired_before_filing: "Status expired before filing",
  form_edition_superseded: "Form edition will be rejected",
};

/**
 * A check written by a newer deployment carries a code this build has never
 * seen. Falling back to the code beats rendering "undefined" — same rule the
 * audit registry follows.
 */
const headingFor = (code: CasePitfall["code"]) => HEADING[code] ?? code;

export function CaseChecksCard({ caseId }: { caseId: string }) {
  const { data, isError } = useCasePitfalls(caseId);

  if (isError || !data || data.length === 0) return null;

  // Blocks first: one of these stops the filing, and it should not be below a
  // list of things that merely want thinking about.
  const ordered = [...data].sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "block" ? -1 : 1,
  );

  return (
    <Box mt={4}>
      <Text
        color="fg.subtle"
        fontSize="11px"
        fontWeight="500"
        letterSpacing="0.55px"
        textTransform="uppercase"
        mb={2}
      >
        Checks
      </Text>

      <Stack gap={2}>
        {ordered.map((pitfall) => (
          <Alert.Root
            key={pitfall.code}
            status={pitfall.severity === "block" ? "error" : "warning"}
            size="sm"
            variant="subtle"
          >
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title fontSize="12px">{headingFor(pitfall.code)}</Alert.Title>
              <Alert.Description fontSize="11px">{pitfall.message}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        ))}
      </Stack>

      <Text fontSize="10px" color="fg.subtle" mt={1.5}>
        Only a superseded form edition blocks a filing. The rest are for you to weigh — they turn
        on facts the system cannot see.
      </Text>
    </Box>
  );
}
