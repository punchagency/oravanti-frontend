import type { FeeAgreement } from "@/api/leads";
import { BrandButton, MutedText, OutlineButton } from "@/components/ui/intake-ui";
import { useMarkFeeAgreementPaymentReceived } from "@/hooks/use-leads";
import { formatCurrency } from "@/utils/currency";
import { Dialog, HStack, Portal, Stack, Text, chakra } from "@chakra-ui/react";
import { Check } from "lucide-react";
import { useState } from "react";

/**
 * Attest that the client's money arrived.
 *
 * On an invoice paid in one go this is the button it always was. On a payment
 * plan it has to ask how much arrived, because the answer is almost never "all
 * of it" — and the previous version recorded the entire outstanding balance
 * regardless, which marked every future instalment paid and silenced the
 * reminders that would have chased them.
 *
 * The count is instalments rather than an amount: staff are attesting to a
 * schedule the firm agreed, and a free-text amount invites a typo that lands in
 * the ledger. The amount is shown, not typed.
 */
export function MarkPaymentReceivedButton({
  agreement,
}: {
  agreement: FeeAgreement;
}) {
  const markPayment = useMarkFeeAgreementPaymentReceived();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(1);

  const outstanding = (agreement.invoice?.instalments ?? []).filter(
    (row) => row.outstanding > 0,
  );

  // No schedule, or nothing left on it: one click, whole balance, as before.
  if (outstanding.length === 0) {
    return (
      <BrandButton
        loading={markPayment.isPending}
        onClick={() => markPayment.mutate({ agreementId: agreement.id })}
      >
        <Check size={14} />
        Mark payment received
      </BrandButton>
    );
  }

  const selected = outstanding.slice(0, count);
  const total = selected.reduce((sum, row) => sum + row.outstanding, 0);

  return (
    <>
      <BrandButton onClick={() => setOpen(true)}>
        <Check size={14} />
        Mark payment received
      </BrandButton>

      <Dialog.Root
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
        placement="center"
        lazyMount
        unmountOnExit
      >
        <Portal>
          <Dialog.Backdrop bg="rgba(0, 0, 0, 0.46)" />
          <Dialog.Positioner px="16px">
            <Dialog.Content w="full" maxW="440px" p="20px" borderRadius="12px">
              <Stack gap="14px">
                <Stack gap="4px">
                  <Text m="0" fontSize="14px" fontWeight="600">
                    How much has been paid?
                  </Text>
                  <MutedText>
                    This agreement is on a payment plan. Record only the
                    instalments that have actually arrived — the rest stay
                    outstanding and keep being chased.
                  </MutedText>
                </Stack>

                <Stack gap="6px">
                  {outstanding.map((row, index) => {
                    const included = index < count;
                    return (
                      <chakra.button
                        key={row.sequence}
                        type="button"
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        gap="10px"
                        p="10px 12px"
                        textAlign="left"
                        borderRadius="8px"
                        border="1px solid"
                        borderColor={included ? "border.emphasized" : "border.subtle"}
                        bg={included ? "bg.subtle" : "transparent"}
                        // Clicking a row selects everything up to it: instalments
                        // are paid oldest-first, so a gap in the middle is not a
                        // state the ledger can represent.
                        onClick={() => setCount(index + 1)}
                      >
                        <Text m="0" fontSize="13px" color="fg">
                          Instalment {row.sequence}
                          <chakra.span color="fg.muted"> · due {row.dueDate}</chakra.span>
                        </Text>
                        <Text m="0" fontSize="13px" fontWeight="600" color="fg">
                          {formatCurrency(row.outstanding)}
                        </Text>
                      </chakra.button>
                    );
                  })}
                </Stack>

                <HStack justify="space-between">
                  <Text m="0" fontSize="13px" color="fg.muted">
                    Recording {count} of {outstanding.length}
                  </Text>
                  <Text m="0" fontSize="14px" fontWeight="600" color="fg">
                    {formatCurrency(total)}
                  </Text>
                </HStack>

                <HStack gap="8px" justify="flex-end">
                  <OutlineButton onClick={() => setOpen(false)}>
                    Cancel
                  </OutlineButton>
                  <BrandButton
                    loading={markPayment.isPending}
                    onClick={() =>
                      markPayment.mutate(
                        { agreementId: agreement.id, instalments: count },
                        {
                          onSuccess: () => {
                            setOpen(false);
                            setCount(1);
                          },
                        },
                      )
                    }
                  >
                    <Check size={14} />
                    Record payment
                  </BrandButton>
                </HStack>
              </Stack>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
