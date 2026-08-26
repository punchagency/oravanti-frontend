import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import type { CaseMilestone } from "@/api/case-details";
import { useCaseMilestones } from "@/hooks/use-case-details";
import { RecordMilestoneDialog } from "./record-milestone-dialog";

/**
 * The chronology of what the agency did, oldest first.
 *
 * Read-only by design. Every row here was written by the one function that also
 * updates the projection, the calendar and the audit trail, so editing in place
 * would be a second write path into the thing that exists to prevent one. To
 * change a date you record it again, which is audited as a correction.
 *
 * This list is also what a mandamus complaint's factual background is built from
 * later, which is why the notice number sits next to the date rather than being
 * hidden behind a hover.
 */

/** Keyed on the exact API strings — never a re-cased variant. */
const LABEL: Record<CaseMilestone, string> = {
  receipt: "Receipt notice",
  biometrics_appointment: "Biometrics appointment",
  interview_scheduled: "Interview",
  decision: "Decision",
  card_valid_to: "EAD/AP card expiry",
  green_card_expiration: "Green card expiry",
};

/** A row written by a newer deployment carries a milestone this build has never seen. */
const labelFor = (milestone: CaseMilestone) => LABEL[milestone] ?? milestone;

export function MilestoneTimeline({ caseId }: { caseId: string }) {
  const { data, isError } = useCaseMilestones(caseId);

  if (isError) return null;
  const milestones = data ?? [];

  return (
    <Box mt={4}>
      <HStack justify="space-between" align="center" mb={2}>
        <Text
          color="fg.subtle"
          fontSize="11px"
          fontWeight="500"
          letterSpacing="0.55px"
          textTransform="uppercase"
        >
          Agency milestones
        </Text>
        <RecordMilestoneDialog caseId={caseId} />
      </HStack>

      {milestones.length === 0 ? (
        <Text fontSize="11px" color="fg.subtle">
          Nothing recorded yet. Until a receipt notice is entered, every task from filing
          onward shows as due once recorded.
        </Text>
      ) : (
        <Stack gap={1.5}>
          {milestones.map((m) => (
            <HStack
              key={m.id}
              justify="space-between"
              align="baseline"
              borderBottom="1px solid"
              borderColor="border.subtle"
              pb={1.5}
            >
              <Box>
                <Text fontSize="12px" fontWeight="500">
                  {labelFor(m.milestone)}
                </Text>
                {(m.noticeNumber || m.note) && (
                  <Text fontSize="10px" color="fg.subtle">
                    {[m.noticeNumber, m.note].filter(Boolean).join(" · ")}
                  </Text>
                )}
              </Box>
              <Text fontSize="12px" color="fg.muted" whiteSpace="nowrap">
                {m.occurredOn}
              </Text>
            </HStack>
          ))}
        </Stack>
      )}
    </Box>
  );
}
