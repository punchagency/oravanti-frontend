import { useConfidoStatements } from "@/hooks/use-payment-settings";
import { formatCurrency } from "@/utils/currency";
import { Box, Flex, Text } from "@chakra-ui/react";

/**
 * What processing cost the firm, by month.
 *
 * This is the entry that makes the operating account reconcilable. Fees never
 * appear in the invoice ledger — they are a firm expense rather than a client
 * payment — so without these lines the operating bank balance is simply lower
 * than "collected" with nothing to explain the difference.
 *
 * The trust account needs no such reconciliation: deposits are gross and fees
 * never touch it.
 */
export function StatementsCard() {
  const { data, isLoading } = useConfidoStatements();

  // Nothing to show for a firm that has not taken payments yet, and an empty
  // card would just be a question mark.
  if (isLoading || !data?.length) return null;

  return (
    <Box border="1px solid" borderColor="border" borderRadius="10px" bg="bg">
      <Box p="20px" borderBottom="1px solid" borderColor="border.subtle">
        <Text textStyle="label">Processing statements</Text>
        <Text fontSize="12px" color="fg.muted" mt="4px">
          What Confido charged, and what they debit from your operating account.
        </Text>
      </Box>

      <Box p="20px">
        {data.map((statement) => (
          <Box
            key={statement.id}
            pb="16px"
            mb="16px"
            borderBottom="1px solid"
            borderColor="border.subtle"
            _last={{ pb: 0, mb: 0, borderBottom: "none" }}
          >
            <Flex justify="space-between" align="baseline" gap="12px">
              <Text fontSize="14px" fontWeight="600">
                {statement.month}
              </Text>
              <Text fontSize="12px" color="fg.subtle">
                {statement.effectiveRate != null
                  ? `${(statement.effectiveRate * 100).toFixed(2)}% effective rate`
                  : ""}
              </Text>
            </Flex>

            <Flex gap="20px" mt="8px" wrap="wrap">
              {[
                ["Processed", statement.paymentVolume],
                ["Total fees", statement.totalFees],
                ...(statement.feesPaidByClients > 0
                  ? ([["Paid by clients", statement.feesPaidByClients]] as const)
                  : []),
                ["Your cost", statement.netFees],
              ].map(([label, value]) => (
                <Box key={label}>
                  <Text fontSize="11px" color="fg.subtle">
                    {label}
                  </Text>
                  <Text fontSize="13px" fontWeight="600">
                    {formatCurrency(value as number)}
                  </Text>
                </Box>
              ))}
            </Flex>

            {statement.debits.length > 0 && (
              <Box mt="10px">
                {statement.debits.map((debit, i) => (
                  <Flex
                    key={`${statement.id}-${i}`}
                    justify="space-between"
                    gap="12px"
                    fontSize="12px"
                    color="fg.muted"
                    py="2px"
                  >
                    <Text>
                      {debit.statementDescriptor ?? "Debit"}
                      {debit.fromBankAccountMask
                        ? ` · ${debit.fromBankAccountCategory ?? ""} ••${debit.fromBankAccountMask}`
                        : ""}
                    </Text>
                    <Text>{formatCurrency(debit.amount)}</Text>
                  </Flex>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
