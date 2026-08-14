import type { InvoiceListRow } from "@/api/finance";
import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { useVoidInvoice } from "@/hooks/use-finance";
import { formatCurrency } from "@/utils/currency";
import { Box, Flex, Input, Text } from "@chakra-ui/react";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { DialogShell } from "./dialog-shell";
import { fieldStyles } from "./dialog-styles";

/**
 * Withdraw an invoice.
 *
 * Voiding is how a sent invoice is corrected: the document the client holds is
 * withdrawn and a corrected one issued, rather than rewritten underneath them.
 * It is not a delete — the invoice stays readable, keeps its number, and the
 * void is recorded as its own event.
 *
 * Two things this dialog is careful to say out loud, because neither is
 * recoverable by pressing something else afterwards:
 *
 *   - **The client is not told.** No email goes out on a void. If they already
 *     have the invoice, someone has to tell them it is withdrawn.
 *   - **Billed time is released**, so the work returns to the unbilled pool and
 *     can go on the corrected invoice. That is the intended behaviour, but it
 *     is a change to something outside the invoice being voided.
 *
 * An invoice with any payment recorded against it cannot be voided at all —
 * the server refuses it, and the action is not offered. See `voidInvoice` in
 * the backend for why: voiding would drop money the firm holds out of every
 * report while the payments themselves remain on the ledger.
 */
export function VoidInvoiceDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: InvoiceListRow | null;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
}) {
  const voidInvoice = useVoidInvoice();
  const [reason, setReason] = useState("");

  /**
   * Cleared when the dialog opens, not when it closes, so a void that fails
   * keeps what was typed for the retry.
   *
   * Done as a render-time adjustment rather than an effect — React's documented
   * "adjusting state when a prop changes". The sibling dialogs get this free
   * from react-hook-form's `reset`; this one has a single plain field, and
   * setting it from an effect would cascade a second render.
   *
   * The component stays mounted while closed, like its siblings: unmounting
   * Dialog.Root on the open state breaks Chakra's focus trap, which is why
   * DialogShell takes `open` instead of being rendered conditionally.
   */
  const [openedFor, setOpenedFor] = useState(open);
  if (open !== openedFor) {
    setOpenedFor(open);
    if (open) setReason("");
  }

  const confirm = () => {
    if (!invoice) return;
    voidInvoice.mutate(
      { invoiceId: invoice.id, reason: reason.trim() || undefined },
      { onSuccess: () => onOpenChange({ open: false }) },
    );
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={`Void ${invoice?.invoiceNumber ?? "invoice"}?`}
      subtitle={
        invoice
          ? `${invoice.party.name} · ${formatCurrency(invoice.totalAmount)}`
          : undefined
      }
      footer={
        <Flex justify="flex-end" gap="8px" w="100%">
          <OutlineButton onClick={() => onOpenChange({ open: false })}>
            Keep invoice
          </OutlineButton>
          <BrandButton onClick={confirm} disabled={voidInvoice.isPending}>
            {voidInvoice.isPending ? "Voiding…" : "Void invoice"}
          </BrandButton>
        </Flex>
      }
    >
      <Flex direction="column" gap="14px">
        <Flex
          gap="10px"
          p="12px"
          borderRadius="9px"
          bg="bg.subtle"
          border="1px solid"
          borderColor="border"
        >
          <Box color="#d64545" flexShrink={0} mt="1px">
            <AlertTriangle size={16} />
          </Box>
          <Box>
            <Text fontSize="13px" fontWeight="600" mb="4px">
              This cannot be undone.
            </Text>
            <Text fontSize="12px" color="fg.muted">
              The invoice keeps its number and stays readable, but it leaves
              every revenue figure and can never be reinstated. Issue a
              corrected invoice in its place.
            </Text>
          </Box>
        </Flex>

        <Box>
          <Text fontSize="12px" color="fg.muted">
            {invoice?.status === "draft"
              ? "This draft was never sent, so the client has nothing to withdraw."
              : "The client is not notified. If they already have this invoice, tell them it has been withdrawn."}
          </Text>
          <Text fontSize="12px" color="fg.muted" mt="6px">
            Any time entries billed on it return to the unbilled pool, ready for
            the corrected invoice.
          </Text>
        </Box>

        <Box>
          <Text
            as="label"
            display="block"
            mb="5px"
            fontSize="11px"
            fontWeight="500"
          >
            Reason (optional)
          </Text>
          <Input
            placeholder="Issued in error"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            {...fieldStyles}
          />
          <Text fontSize="11px" color="fg.muted" mt="4px">
            Recorded on the activity trail beside the void.
          </Text>
        </Box>
      </Flex>
    </DialogShell>
  );
}
