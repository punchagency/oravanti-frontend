import { useSetSurcharge, useSurchargeSettings } from "@/hooks/use-payment-settings";
import { Box, Flex, Switch, Text } from "@chakra-ui/react";

/**
 * Credit-card surcharging: passing the processing cost to the client.
 *
 * Confido gates this twice and we mirror rather than copy — they approve the
 * firm, then the firm chooses. Read live every time, so a firm approved this
 * morning is not told to contact support because we cached a "no" yesterday.
 *
 * Off is the default. Nothing here enables it on a firm's behalf.
 */
export function SurchargeCard({ active }: { active: boolean }) {
  const { data, isLoading } = useSurchargeSettings(active);
  const setSurcharge = useSetSurcharge();

  // Only meaningful once the firm can actually take payments.
  if (!active) return null;

  const rate = data?.rate != null ? `${data.rate.toFixed(2)}%` : "3.00%";

  return (
    <Box border="1px solid" borderColor="border" borderRadius="10px" bg="bg">
      <Box p="20px" borderBottom="1px solid" borderColor="border.subtle">
        <Text textStyle="label">Card surcharging</Text>
      </Box>

      <Box p="20px">
        {isLoading ? (
          <Text fontSize="13px" color="fg.muted">
            Checking with Confido…
          </Text>
        ) : !data?.allowed ? (
          // Not ours to grant, so do not offer a switch that would 409.
          <Text fontSize="13px" color="fg.muted" lineHeight="1.6">
            Surcharging is not enabled for your firm. Confido reviews this
            separately — contact{" "}
            <Text as="span" fontWeight="600">
              support@confidolegal.com
            </Text>{" "}
            to request it.
          </Text>
        ) : (
          <>
            <Flex justify="space-between" align="center" gap="16px">
              <Box>
                <Text fontSize="14px" fontWeight="600">
                  Pass card fees to clients
                </Text>
                <Text fontSize="13px" color="fg.muted" mt="2px">
                  Adds {rate} to credit-card payments. The client sees the
                  surcharge before they pay.
                </Text>
              </Box>
              <Switch.Root
                checked={Boolean(data.enabled)}
                disabled={setSurcharge.isPending}
                onCheckedChange={(e) => setSurcharge.mutate(e.checked)}
              >
                <Switch.HiddenInput />
                <Switch.Control />
              </Switch.Root>
            </Flex>

            <Box
              mt="16px"
              p="12px 14px"
              borderRadius="8px"
              bg="bg.subtle"
              border="1px solid"
              borderColor="border.subtle"
            >
              <Text fontSize="12px" color="fg.muted" lineHeight="1.7">
                {/* Both facts are card-brand and processor rules rather than
                    our choices, and a firm turning this on should know them. */}
                Debit cards are never surcharged, so this applies unevenly
                depending on how a client pays. The rate is set by Confido and
                cannot be changed here.
                <br />
                Surcharging is regulated and the rules vary by state — check{" "}
                <Text as="span" fontWeight="600">
                  Confido&rsquo;s surcharging guide by state
                </Text>{" "}
                before enabling it.
              </Text>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
