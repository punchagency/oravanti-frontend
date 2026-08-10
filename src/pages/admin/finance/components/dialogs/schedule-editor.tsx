import { DateField } from "@/components/ui/date-field";
import { FormSelect } from "@/components/ui/form-select";
import { OutlineButton, StatusPill } from "@/components/ui/intake-ui";
import { formatCurrency } from "@/utils/currency";
import { Box, Flex, IconButton, Input, Text } from "@chakra-ui/react";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { fieldStyles } from "./dialog-styles";
import {
  addMonths,
  buildSchedule,
  scheduleTotal,
  type ScheduleDraft,
} from "./schedule-utils";

const FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "weekly", label: "Weekly" },
];

const today = () => new Date().toISOString().slice(0, 10);
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Build and edit a payment schedule.
 *
 * Generate equal instalments from a count, a start date and a frequency, then
 * adjust any row — firms agree a larger deposit followed by smaller payments,
 * and dates get nudged around a client's pay cycle.
 *
 * The running total is the point of the component. The server refuses a
 * schedule that does not sum to the invoice total, so the mismatch is shown
 * here where it can still be fixed, and `isBalanced` lets the parent disable
 * submit rather than letting the request fail.
 */

export function ScheduleEditor({
  rows,
  onChange,
  invoiceTotal,
  /** Instalments already settled, so an edit does not silently unpay one. */
  lockedCount = 0,
}: {
  rows: ScheduleDraft[];
  onChange: (rows: ScheduleDraft[]) => void;
  invoiceTotal: number;
  lockedCount?: number;
}) {
  const [count, setCount] = useState("3");
  const [start, setStart] = useState(today());
  const [frequency, setFrequency] = useState("monthly");

  const total = useMemo(() => scheduleTotal(rows), [rows]);
  const balanced = Math.abs(total - invoiceTotal) < 0.005;
  const difference = round2(invoiceTotal - total);

  const generate = useCallback(() => {
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > 120) return;
    if (!start || invoiceTotal <= 0) return;
    onChange(buildSchedule(invoiceTotal, n, start, frequency));
  }, [count, start, frequency, invoiceTotal, onChange]);

  const setRow = useCallback(
    (index: number, patch: Partial<ScheduleDraft>) =>
      onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r))),
    [rows, onChange],
  );

  const addRow = useCallback(() => {
    const last = rows[rows.length - 1];
    onChange([
      ...rows,
      {
        dueDate: last ? addMonths(last.dueDate, 1) : today(),
        // The shortfall, so adding a row and then balancing is one step.
        amount: difference > 0 ? difference.toFixed(2) : "",
      },
    ]);
  }, [rows, onChange, difference]);

  const removeRow = useCallback(
    (index: number) => onChange(rows.filter((_, i) => i !== index)),
    [rows, onChange],
  );

  const countOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1),
        label: `${i + 1}`,
      })),
    [],
  );

  return (
    <Box>
      <Flex
        gap="8px"
        align="flex-end"
        flexWrap="wrap"
        p="10px 12px"
        borderRadius="10px"
        bg="bg.muted"
        mb="10px"
      >
        <Box>
          <Text fontSize="11px" color="fg.muted" mb="4px">
            Payments
          </Text>
          <Box w="72px">
            <FormSelect
              options={countOptions}
              value={count}
              onChange={setCount}
              placeholder="3"
              ariaLabel="Number of payments"
            />
          </Box>
        </Box>
        <Box>
          <Text fontSize="11px" color="fg.muted" mb="4px">
            Starting
          </Text>
          <Box w="150px">
            <DateField
              ariaLabel="First payment date"
              value={start}
              onChange={setStart}
            />
          </Box>
        </Box>
        <Box>
          <Text fontSize="11px" color="fg.muted" mb="4px">
            Every
          </Text>
          <Box w="130px">
            <FormSelect
              options={FREQUENCIES}
              value={frequency}
              onChange={setFrequency}
              placeholder="Monthly"
              ariaLabel="Frequency"
            />
          </Box>
        </Box>
        <OutlineButton onClick={generate} disabled={invoiceTotal <= 0}>
          Generate
        </OutlineButton>
      </Flex>

      {rows.length === 0 ? (
        <Text fontSize="12px" color="fg.muted">
          {invoiceTotal > 0
            ? "Generate a schedule, or add instalments one at a time."
            : "Add line items first — a schedule has to add up to the invoice total."}
        </Text>
      ) : (
        <Flex direction="column" gap="6px">
          {rows.map((row, index) => {
            const locked = index < lockedCount;
            return (
              <Flex key={index} gap="8px" align="center">
                <Text
                  fontSize="12px"
                  color="fg.muted"
                  w="20px"
                  flexShrink={0}
                  textAlign="right"
                >
                  {index + 1}.
                </Text>
                <Box flex="1" minW={0}>
                  <DateField
                    ariaLabel={`Instalment ${index + 1} due date`}
                    value={row.dueDate}
                    onChange={(v) => setRow(index, { dueDate: v })}
                  />
                </Box>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  w="120px"
                  flexShrink={0}
                  value={row.amount}
                  onChange={(e) => setRow(index, { amount: e.target.value })}
                  {...fieldStyles}
                />
                {locked ? (
                  // Already settled. Editing it would not un-take the money,
                  // it would just make the schedule disagree with the ledger.
                  <Box w="32px" flexShrink={0} textAlign="center">
                    <StatusPill tone="success">Paid</StatusPill>
                  </Box>
                ) : (
                  <IconButton
                    aria-label={`Remove instalment ${index + 1}`}
                    size="sm"
                    variant="ghost"
                    color="fg.muted"
                    flexShrink={0}
                    onClick={() => removeRow(index)}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                )}
              </Flex>
            );
          })}
        </Flex>
      )}

      <Flex justify="space-between" align="center" mt="10px" gap="10px" flexWrap="wrap">
        <OutlineButton onClick={addRow} disabled={invoiceTotal <= 0}>
          <Plus size={13} />
          Add instalment
        </OutlineButton>

        <Flex align="center" gap="8px">
          <Text fontSize="12px" color="fg.muted">
            Scheduled
          </Text>
          <Text fontSize="13px" fontWeight="700">
            {formatCurrency(total)}
          </Text>
          {rows.length > 0 &&
            (balanced ? (
              <StatusPill tone="success">matches the total</StatusPill>
            ) : (
              <StatusPill tone="danger">
                {difference > 0
                  ? `${formatCurrency(difference)} short`
                  : `${formatCurrency(-difference)} over`}
              </StatusPill>
            ))}
        </Flex>
      </Flex>
    </Box>
  );
}
