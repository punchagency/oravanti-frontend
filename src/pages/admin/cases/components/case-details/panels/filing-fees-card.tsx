import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { useCaseFilingFees } from "@/hooks/use-case-details";

/**
 * What USCIS charges for this matter's package.
 *
 * Every figure comes from the server, quoted against the case's own filing date
 * — never a constant in this file. That rule is not stylistic: the source
 * document listed the I-765 at $470/$520, when filed with a pending I-485 it is
 * $260, and a number written into a component has no effective date to be wrong
 * about. A matter filed before a fee change keeps quoting the fee that applied
 * to it, which only works if the component asks rather than knows.
 *
 * The concurrent rate is called out per row for the same reason: it is the
 * difference between quoting a client $260 and $520 for the same form.
 */

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

export function FilingFeesCard({ caseId }: { caseId: string }) {
  const { data, isError } = useCaseFilingFees(caseId);

  if (isError || !data || data.length === 0) return null;

  const total = data.reduce((sum, fee) => sum + fee.amountCents, 0);

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
        Filing fees
      </Text>

      <Stack gap={1.5}>
        {data.map((fee) => (
          <HStack
            key={`${fee.formCode}-${fee.context}`}
            justify="space-between"
            align="baseline"
            borderBottom="1px solid"
            borderColor="border.subtle"
            pb={1.5}
          >
            <Box>
              <Text fontSize="12px" fontWeight="500">
                {fee.formCode}
              </Text>
              {fee.context === "with_pending_i485" && (
                <Text fontSize="10px" color="fg.subtle">
                  concurrent-filing rate
                </Text>
              )}
            </Box>
            <Text fontSize="12px" color="fg.muted" whiteSpace="nowrap">
              {money(fee.amountCents)}
            </Text>
          </HStack>
        ))}

        <HStack justify="space-between" align="baseline" pt={0.5}>
          <Text fontSize="12px" fontWeight="600">
            Total
          </Text>
          <Text fontSize="12px" fontWeight="600">
            {money(total)}
          </Text>
        </HStack>
      </Stack>

      <Text fontSize="10px" color="fg.subtle" mt={1.5}>
        Quoted at this matter's filing date. Forms with no fee on record are omitted.
      </Text>
    </Box>
  );
}
