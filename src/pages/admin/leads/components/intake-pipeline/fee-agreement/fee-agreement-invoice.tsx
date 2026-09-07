import type { FeeAgreement } from "@/api/leads";
import { MutedText } from "@/components/ui/intake-ui";
import { formatCurrency } from "@/utils/currency";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { AlertTriangle, Receipt } from "lucide-react";

/**
 * The money half of the fee-agreement card.
 *
 * Lives here rather than in either host because the tracker is implemented
 * twice — once in the stage page (`lead-consultation-section.tsx`) and once in
 * the collapsible card list (`views/consultation-view.tsx`). Both need this and
 * neither should own it; a third copy of "is this paid?" is exactly how the
 * flag-based version drifted from the ledger in the first place.
 */

const DELIVERY_COPY: Record<
  NonNullable<FeeAgreement["invoice"]>["delivery"],
  string | null
> = {
  sent: null,
  // The one state worth interrupting for: it is why the case will not open, and
  // it is invisible everywhere else on this screen.
  failed: "This invoice could not be delivered — resend it from Finance.",
  not_attempted: "Not emailed — you agreed to collect this payment directly.",
};

export function FeeAgreementInvoicePanel({
  agreement,
}: {
  agreement: FeeAgreement;
}) {
  const invoice = agreement.invoice;
  if (!invoice) return null;

  const note = DELIVERY_COPY[invoice.delivery];
  const outstanding = invoice.balanceDue > 0;

  return (
    <Box
      p="12px 14px"
      borderRadius="10px"
      border="1px solid"
      borderColor={invoice.delivery === "failed" ? "#e7b8b8" : "border"}
      bg={invoice.delivery === "failed" ? "#fdf3f3" : "bg.subtle"}
    >
      <Stack gap="6px">
        <HStack justify="space-between" gap="12px" wrap="wrap">
          <HStack gap="6px">
            <Receipt size={13} />
            <Text m="0" fontSize="13px" fontWeight="600" color="fg">
              {invoice.invoiceNumber}
            </Text>
          </HStack>
          <Text
            m="0"
            fontSize="13px"
            fontWeight="600"
            color={outstanding ? "fg" : "#00785a"}
          >
            {outstanding
              ? `${formatCurrency(invoice.balanceDue)} outstanding`
              : "Paid in full"}
          </Text>
        </HStack>

        <HStack gap="10px" wrap="wrap">
          <MutedText>
            {formatCurrency(invoice.amountPaid)} of{" "}
            {formatCurrency(invoice.total)} received
          </MutedText>
          {/*
           * Only worth showing when it differs from the balance — an invoice on
           * an instalment plan owes the whole amount but is only being ASKED for
           * the next slice, and quoting the balance would contradict what the
           * client sees on their own payment page.
           */}
          {outstanding && invoice.amountDueNow < invoice.balanceDue ? (
            <MutedText>
              · {formatCurrency(invoice.amountDueNow)} due now
            </MutedText>
          ) : null}
        </HStack>

        {note ? (
          <HStack gap="6px" align="flex-start">
            {invoice.delivery === "failed" ? (
              <Box mt="2px" color="#b42318">
                <AlertTriangle size={12} />
              </Box>
            ) : null}
            <Text
              m="0"
              fontSize="12px"
              color={invoice.delivery === "failed" ? "#b42318" : "fg.muted"}
            >
              {note}
            </Text>
          </HStack>
        ) : null}
      </Stack>
    </Box>
  );
}
