import { Box, Grid, HStack, Table, Text } from "@chakra-ui/react";
import { useMandamusCandidacy } from "@/hooks/use-workflows";
import { LinkCaseDialog } from "./link-case-dialog";
import { PanelStat } from "./panel-shell";

/**
 * How long each of the matter's filings has been pending against USCIS's own
 * published median for that form and office.
 *
 * Figures for an attorney to read, never a button that files anything. Opening
 * a mandamus matter is a separate, deliberate act: the case is created on its
 * own and then linked here — which is why the action below says "Link" and not
 * "File".
 *
 * ─── Why a table and not three numbers ──────────────────────────────────────
 *
 * A concurrent adjustment filing is four core forms on four separate clocks.
 * This card used to show one "days pending" for the matter, read off whichever
 * form had been recorded as its filing type — so an I-485 sitting 900 days past
 * its median was invisible whenever the matter had been recorded as an I-130.
 * Each form is now measured against its own median from its own filing date,
 * and the headline names the one an action would actually be brought over.
 *
 * `delayRatio` is null when no processing-time reference matches this form and
 * office. That means **unknown**, not "not delayed", and it renders as "—"
 * rather than as a zero that would read as reassurance.
 *
 * ─── When it appears ────────────────────────────────────────────────────────
 *
 * Only once there is a comparison to make: at least one form awaiting
 * adjudication with a median on file. Without that the card had nothing to say
 * and said it in three empty figures under a heading suggesting the matter was
 * a candidate for a lawsuit.
 *
 * Deliberately not gated on case type. Mandamus is the remedy for a USCIS
 * filing that has stalled, so a delayed I-485 or N-400 is exactly what it is
 * for.
 */
export function MandamusCandidacyCard({ caseId }: { caseId: string }) {
  const { data, isError } = useMandamusCandidacy(caseId);

  if (isError || !data?.mostDelayed) return null;

  // Nothing to compare against on any form — every median unknown. The days
  // pending are still true, but without a median there is no candidacy
  // question to put in front of an attorney.
  const comparable = data.forms.filter((f) => f.medianDays !== null);
  if (comparable.length === 0) return null;

  const lead = data.mostDelayed;

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
        Mandamus candidacy
      </Text>

      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={2}>
        <PanelStat
          label="Most delayed"
          value={lead.formCode}
          hint={
            lead.pendingSinceIsFormDate
              ? `filed ${lead.pendingSince}`
              : `from the matter's filing date — no date on the form itself`
          }
        />
        <PanelStat
          label="Days pending"
          value={String(lead.daysPending)}
          hint={lead.medianDays !== null ? `median ${lead.medianDays}` : "no published median"}
        />
        <PanelStat
          label="Delay ratio"
          value={lead.delayRatio !== null ? `${lead.delayRatio}×` : "—"}
          hint={lead.delayRatio === null ? "no published median to compare" : undefined}
        />
      </Grid>

      {/*
        The rest of the package, when there is a rest. One form filed alone has
        nothing to be compared with and the headline above already says it.
      */}
      {data.forms.length > 1 && (
        <Table.Root size="sm" variant="outline" mt={3}>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Form</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Days pending</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">USCIS median</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Delay ratio</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.forms.map((form) => (
              <Table.Row key={form.formCode}>
                <Table.Cell>
                  <HStack gap={1.5}>
                    <Text fontSize="13px">{form.formCode}</Text>
                    {!form.pendingSinceIsFormDate && (
                      <Text fontSize="10px" color="fg.subtle" title="No filing date on this form — measured from the matter's">
                        approx.
                      </Text>
                    )}
                  </HStack>
                </Table.Cell>
                <Table.Cell textAlign="end">{form.daysPending}</Table.Cell>
                <Table.Cell textAlign="end">
                  {form.medianDays !== null ? form.medianDays : "—"}
                </Table.Cell>
                <Table.Cell textAlign="end">
                  {form.delayRatio !== null ? `${form.delayRatio}×` : "—"}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}

      <Box mt={2}>
        <LinkCaseDialog
          parentCaseId={caseId}
          defaultRelationType="mandamus"
          triggerLabel="Link mandamus case"
        />
      </Box>

      <Text fontSize="10px" color="fg.subtle" mt={1.5}>
        A triage figure, not a recommendation. Open the mandamus matter as its own
        case first, then link it here.
      </Text>
    </Box>
  );
}
