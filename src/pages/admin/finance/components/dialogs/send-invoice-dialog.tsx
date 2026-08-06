import type { InvoiceListRow } from "@/api/finance";
import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { useSendInvoice } from "@/hooks/use-finance";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { Box, Flex, Text } from "@chakra-ui/react";
import { AlertTriangle, Mail } from "lucide-react";
import { useCallback } from "react";
import { DialogShell } from "./dialog-shell";

/**
 * Confirmation before delivering an invoice.
 *
 * This is the irreversible step the draft state exists to protect: voiding
 * afterwards does not unsend an email. Hence a confirm rather than a bare
 * button, showing the address it will actually go to.
 */
export function SendInvoiceDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: InvoiceListRow | null;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
}) {
  const sendInvoice = useSendInvoice();

  const onSend = useCallback(() => {
    if (!invoice) return;
    sendInvoice.mutate(invoice.id, {
      // Closes on a recorded failure too — the toast carries the reason and the
      // delivery history in the detail dialog has the rest.
      onSettled: () => onOpenChange({ open: false }),
    });
  }, [invoice, sendInvoice, onOpenChange]);

  const noEmail = !invoice?.clientEmail;

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Send invoice to client"
      subtitle={
        invoice ? `${invoice.invoiceNumber} · ${invoice.clientName}` : undefined
      }
      footer={
        <Flex justify="flex-end" gap="8px" w="100%">
          <OutlineButton onClick={() => onOpenChange({ open: false })}>
            Cancel
          </OutlineButton>
          <BrandButton
            loading={sendInvoice.isPending}
            disabled={noEmail}
            onClick={onSend}
          >
            <Mail size={14} />
            Send invoice
          </BrandButton>
        </Flex>
      }
    >
      <Flex direction="column" gap="14px">
        {noEmail ? (
          <Flex
            gap="10px"
            align="flex-start"
            p="14px"
            borderRadius="10px"
            border="1px solid"
            borderColor="#f3c9c9"
            bg="#fdeeee"
            _dark={{
              bg: "rgba(214, 69, 69, 0.12)",
              borderColor: "rgba(214,69,69,0.35)",
            }}
          >
            <Box color="#d64545" mt="1px">
              <AlertTriangle size={16} />
            </Box>
            <Text fontSize="12px" color="fg.muted">
              This client has no email address on file, so the invoice cannot be
              sent. Add one to their record first.
            </Text>
          </Flex>
        ) : (
          <Box p="14px" borderRadius="10px" bg="bg.muted">
            {[
              ["Recipient", invoice?.clientEmail ?? "—"],
              ["Invoice", invoice?.invoiceNumber ?? "—"],
              ["Amount due", formatCurrency(invoice?.totalAmount ?? 0)],
              ["Due date", invoice ? formatDate(invoice.dueDate) : "—"],
            ].map(([label, value]) => (
              <Flex key={label} justify="space-between" py="3px" gap="12px">
                <Text fontSize="12px" color="fg.muted">
                  {label}
                </Text>
                <Text fontSize="12px" fontWeight="600" textAlign="right">
                  {value}
                </Text>
              </Flex>
            ))}
          </Box>
        )}

        <Text fontSize="12px" color="fg.muted">
          The client receives the invoice as a PDF attachment. This cannot be
          unsent — voiding the invoice afterwards does not retract the email.
        </Text>
      </Flex>
    </DialogShell>
  );
}
