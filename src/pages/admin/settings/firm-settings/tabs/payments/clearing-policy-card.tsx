import {
  useClearingPolicy,
  useSetClearingPolicy,
} from "@/hooks/use-payment-settings";
import type { ClearingPolicy } from "@/api/payment-settings";
import { Box, Flex, Text, chakra } from "@chakra-ui/react";

/**
 * How settled a payment must be before it opens a case.
 *
 * The firm's answer to a real trade-off. A card sits pending for roughly two
 * business days and can be voided in that window; an ACH payment can be
 * returned by the client's bank days after it appears, and R01 (insufficient
 * funds) is routine. Opening a case the moment money is reported occasionally
 * means doing billable work against money that goes back.
 *
 * The default is the middle option, because the risks are not symmetric: an ACH
 * return arrives within days and is exactly what this guards against, whereas a
 * card is more likely to be disputed months later as a chargeback, which no
 * waiting period can prevent.
 */
const OPTIONS: {
  value: ClearingPolicy;
  label: string;
  detail: string;
}[] = [
  {
    value: "on_report",
    label: "As soon as the payment is reported",
    detail:
      "Fastest. A case can open on money that has not cleared and could still be returned.",
  },
  {
    value: "ach_only",
    label: "Wait for bank transfers to clear — cards open at once",
    detail:
      "Recommended. Card payments open a case immediately; ACH waits until the money lands.",
  },
  {
    value: "all_payments",
    label: "Wait for every payment to clear",
    detail:
      "Safest. Adds about two business days to every card-paid intake.",
  },
];

export function ClearingPolicyCard({ active }: { active: boolean }) {
  const { data, isLoading } = useClearingPolicy(active);
  const setPolicy = useSetClearingPolicy();

  // Before a processor is connected every payment is hand-recorded, and those
  // count immediately under all three rules — so the control would have no
  // observable effect.
  if (!active) return null;

  const current = data?.policy ?? "ach_only";

  return (
    <Box border="1px solid" borderColor="border" borderRadius="10px" bg="bg">
      <Box p="20px" borderBottom="1px solid" borderColor="border.subtle">
        <Text textStyle="label">Opening a case on a fee payment</Text>
        <Text fontSize="12px" color="fg.muted" mt="4px" lineHeight="1.6">
          A fee-agreement payment moves a lead into case opening. This decides
          whether it has to clear the bank first.
        </Text>
      </Box>

      <Box p="20px">
        {isLoading ? (
          <Text fontSize="13px" color="fg.muted">
            Loading…
          </Text>
        ) : (
          <Flex direction="column" gap="10px">
            {OPTIONS.map((option) => {
              const selected = current === option.value;
              return (
                // `chakra.button` rather than `Flex as="button"`: the `as`
                // prop does not widen Flex's prop types, so `type="button"`
                // is rejected — and dropping it would make this submit any
                // form it is ever nested in.
                <chakra.button
                  key={option.value}
                  type="button"
                  display="flex"
                  disabled={setPolicy.isPending}
                  onClick={() => {
                    if (!selected) setPolicy.mutate(option.value);
                  }}
                  textAlign="left"
                  gap="10px"
                  p="12px"
                  borderRadius="8px"
                  border="1px solid"
                  borderColor={selected ? "border.emphasized" : "border.subtle"}
                  bg={selected ? "bg.subtle" : "transparent"}
                  cursor={selected ? "default" : "pointer"}
                  _hover={selected ? undefined : { borderColor: "border" }}
                  opacity={setPolicy.isPending ? 0.6 : 1}
                >
                  <Box
                    mt="3px"
                    w="14px"
                    h="14px"
                    flexShrink={0}
                    borderRadius="full"
                    border="2px solid"
                    borderColor={selected ? "fg" : "border.emphasized"}
                    bg={selected ? "fg" : "transparent"}
                  />
                  <Box>
                    <Text fontSize="13px" fontWeight="600">
                      {option.label}
                    </Text>
                    <Text fontSize="12px" color="fg.muted" lineHeight="1.6">
                      {option.detail}
                    </Text>
                  </Box>
                </chakra.button>
              );
            })}
          </Flex>
        )}

        {/* Worth stating outright: this one is not a delay the firm chose, and
            it is the case most likely to prompt a support call. */}
        <Text fontSize="12px" color="fg.muted" mt="14px" lineHeight="1.6">
          A payment Confido holds for review never opens a case, whichever rule
          you pick. Large or unusual payments — a filing fee from a newly
          onboarded firm, typically — can be held pending documentation.
        </Text>
      </Box>
    </Box>
  );
}
