import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import {
  useInvoice,
  useRemoveInvoiceSchedule,
  useSetInvoiceSchedule,
} from "@/hooks/use-finance";
import { formatCurrency } from "@/utils/currency";
import { Box, Center, Flex, Spinner, Text } from "@chakra-ui/react";
import { Info } from "lucide-react";
import { useCallback, useState } from "react";
import { DialogShell } from "./dialog-shell";
import { ScheduleEditor } from "./schedule-editor";
import {
  isScheduleBalanced,
  toInstalmentInput,
  type ScheduleDraft,
} from "./schedule-utils";

/**
 * Set or revise a payment plan on an invoice the client already has.
 *
 * Line items freeze on send — a sent invoice is a statement of what is owed,
 * corrected by voiding and reissuing. A schedule does not, because renegotiating
 * one is the whole point of offering it. The revision is recorded as its own
 * event so the trail shows the plan changed and who changed it.
 */
export function RescheduleDialog({
  invoiceId,
  open,
  onOpenChange,
}: {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
}) {
  const { data: invoice, isLoading } = useInvoice(open ? invoiceId : null);
  const setSchedule = useSetInvoiceSchedule();
  const removeSchedule = useRemoveInvoiceSchedule();

  const [rows, setRows] = useState<ScheduleDraft[]>([]);

  // Seed the editor from the saved schedule when the dialog opens on an
  // invoice. Adjusted during render rather than in an effect: React re-runs the
  // component immediately without committing the first pass, so there is no
  // cascading render, and an effect here would fight the user's own edits every
  // time the query refetched.
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const readyFor = open && invoice ? invoice.id : null;
  if (readyFor !== seededFor) {
    setSeededFor(readyFor);
    if (readyFor && invoice) {
      setRows(
        invoice.instalments.map((i) => ({
          dueDate: i.dueDate,
          amount: i.amount.toFixed(2),
        })),
      );
    }
  }

  // Oldest-first allocation means the settled instalments are always the
  // leading ones, so a count is enough to lock them.
  const paidCount =
    invoice?.instalments.filter((i) => i.state === "paid").length ?? 0;

  const total = invoice?.totals.total ?? 0;
  const balanced = isScheduleBalanced(rows, total);
  const hadSchedule = (invoice?.instalments.length ?? 0) > 0;

  const onSave = useCallback(() => {
    if (!invoiceId) return;
    setSchedule.mutate(
      { invoiceId, instalments: toInstalmentInput(rows) },
      { onSuccess: () => onOpenChange({ open: false }) },
    );
  }, [invoiceId, rows, setSchedule, onOpenChange]);

  const onRemove = useCallback(() => {
    if (!invoiceId) return;
    removeSchedule.mutate(invoiceId, {
      onSuccess: () => onOpenChange({ open: false }),
    });
  }, [invoiceId, removeSchedule, onOpenChange]);

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={hadSchedule ? "Revise payment schedule" : "Add a payment schedule"}
      subtitle={
        invoice
          ? `${invoice.invoiceNumber} · ${formatCurrency(invoice.totals.total)}`
          : undefined
      }
      footer={
        <Flex justify="space-between" w="100%" gap="8px" flexWrap="wrap">
          {hadSchedule ? (
            <OutlineButton
              loading={removeSchedule.isPending}
              onClick={onRemove}
            >
              Remove schedule
            </OutlineButton>
          ) : (
            <Box />
          )}
          <Flex gap="8px">
            <OutlineButton onClick={() => onOpenChange({ open: false })}>
              Cancel
            </OutlineButton>
            <BrandButton
              loading={setSchedule.isPending}
              disabled={!balanced || rows.length === 0}
              onClick={onSave}
            >
              Save schedule
            </BrandButton>
          </Flex>
        </Flex>
      }
    >
      {isLoading || !invoice ? (
        <Center py={10}>
          <Spinner />
        </Center>
      ) : (
        <Flex direction="column" gap="14px">
          <Flex
            gap="10px"
            align="flex-start"
            p="12px 14px"
            borderRadius="10px"
            border="1px solid"
            borderColor="#cfe0f5"
            bg="#eef5fd"
            _dark={{
              bg: "rgba(59, 130, 196, 0.12)",
              borderColor: "rgba(59,130,196,0.35)",
            }}
          >
            <Box color="#3b82c4" mt="1px">
              <Info size={16} />
            </Box>
            <Text fontSize="12px" color="fg.muted">
              The client already has this invoice. Changing the schedule is
              recorded here, but it does not notify them — resend the invoice if
              they need the new dates.
            </Text>
          </Flex>

          {invoice.totals.amountPaid > 0 && (
            <Text fontSize="12px" color="fg.muted">
              {formatCurrency(invoice.totals.amountPaid)} has already been paid
              against this invoice. Payments settle instalments in date order, so
              the schedule must still add up to the full{" "}
              {formatCurrency(invoice.totals.total)}.
            </Text>
          )}

          <ScheduleEditor
            rows={rows}
            onChange={setRows}
            invoiceTotal={invoice.totals.total}
            lockedCount={paidCount}
          />
        </Flex>
      )}
    </DialogShell>
  );
}
