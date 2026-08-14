import type { InvoiceListRow } from "@/api/finance";
import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { useExtendDueDate } from "@/hooks/use-finance";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { Box, Flex, Grid, Input, Text } from "@chakra-ui/react";
import { useState } from "react";
import { DialogShell } from "./dialog-shell";
import { fieldStyles } from "./dialog-styles";

/**
 * Give a client longer to pay.
 *
 * Forward only, which is the whole reason this is its own action rather than a
 * date field on the edit form: moving a due date *backwards* would make an
 * invoice overdue at the press of a button, and that is not an extension.
 *
 * The quick presets are the answer to the actual question staff are asked — "can
 * we have another couple of weeks" — measured from the CURRENT due date, not
 * from today. An invoice three weeks overdue extended "by 14 days" from today
 * would be a five-week extension wearing a two-week label.
 *
 * Not offered on an invoice with a payment schedule: its date follows the final
 * instalment, so it moves by revising the schedule. The row menu withholds the
 * action there, and the server refuses it regardless.
 */

const PRESETS = [7, 14, 30] as const;

/** Days added to `from`, as an ISO date. Dates here are plain YYYY-MM-DD. */
const addDays = (from: string, days: number): string => {
  const d = new Date(`${from}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export function ExtendDueDateDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: InvoiceListRow | null;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
}) {
  const extend = useExtendDueDate();
  const [dueDate, setDueDate] = useState("");
  const [reason, setReason] = useState("");

  /**
   * Reset when the dialog opens, as a render-time adjustment rather than an
   * effect — setting state from an effect cascades a second render, which the
   * lint rule objects to and is right to.
   *
   * The default is the first preset, so the common case is one click. Keyed on
   * the invoice as well as `open`: opening the dialog on a different row must
   * not inherit the previous row's date.
   */
  const key = open ? (invoice?.id ?? "") : "";
  const [openedFor, setOpenedFor] = useState(key);
  if (key !== openedFor) {
    setOpenedFor(key);
    setDueDate(invoice ? addDays(invoice.dueDate, PRESETS[0]) : "");
    setReason("");
  }

  const current = invoice?.dueDate ?? "";
  // The server enforces this too; saying so here saves a round trip to be told.
  const isLater = Boolean(dueDate) && dueDate > current;

  const submit = () => {
    if (!invoice || !isLater) return;
    extend.mutate(
      {
        invoiceId: invoice.id,
        dueDate,
        reason: reason.trim() || undefined,
      },
      { onSuccess: () => onOpenChange({ open: false }) },
    );
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={`Extend ${invoice?.invoiceNumber ?? "invoice"}`}
      subtitle={
        invoice
          ? `${invoice.party.name} · ${formatCurrency(invoice.balanceDue)} outstanding`
          : undefined
      }
      footer={
        <Flex justify="flex-end" gap="8px" w="100%">
          <OutlineButton onClick={() => onOpenChange({ open: false })}>
            Cancel
          </OutlineButton>
          <BrandButton onClick={submit} disabled={!isLater || extend.isPending}>
            {extend.isPending ? "Saving…" : "Extend due date"}
          </BrandButton>
        </Flex>
      }
    >
      <Flex direction="column" gap="14px">
        <Box>
          <Text fontSize="12px" color="fg.muted">
            Currently due{" "}
            <Text as="span" fontWeight="600" color="fg">
              {current ? formatDate(current) : "—"}
            </Text>
            .
          </Text>
        </Box>

        <Box>
          <Text fontSize="11px" fontWeight="500" mb="6px">
            Extend by
          </Text>
          <Grid templateColumns="repeat(3, 1fr)" gap="8px">
            {PRESETS.map((days) => {
              const target = current ? addDays(current, days) : "";
              const active = dueDate === target;
              return (
                <OutlineButton
                  key={days}
                  onClick={() => setDueDate(target)}
                  {...(active
                    ? { borderColor: "brand.solid", color: "fg" }
                    : {})}
                >
                  {days} days
                </OutlineButton>
              );
            })}
          </Grid>
        </Box>

        <Box>
          <Text
            as="label"
            display="block"
            mb="5px"
            fontSize="11px"
            fontWeight="500"
          >
            New due date
          </Text>
          <Input
            type="date"
            value={dueDate}
            min={current ? addDays(current, 1) : undefined}
            onChange={(e) => setDueDate(e.target.value)}
            {...fieldStyles}
          />
          {dueDate && !isLater && (
            <Text fontSize="11px" color="#c0392b" mt="4px">
              Pick a date after {formatDate(current)} — this extends a due date,
              it cannot bring one forward.
            </Text>
          )}
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
            placeholder="Client requested more time"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            {...fieldStyles}
          />
          <Text fontSize="11px" color="fg.muted" mt="4px">
            Recorded on the activity trail with the date it moved from.
          </Text>
        </Box>

        <Text fontSize="11px" color="fg.muted">
          The client is not notified. If they already hold this invoice, tell
          them the date has moved.
        </Text>
      </Flex>
    </DialogShell>
  );
}
