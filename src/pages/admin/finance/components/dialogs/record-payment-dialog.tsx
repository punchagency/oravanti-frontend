import {
  PAYMENT_METHOD_LABELS,
  type InvoiceListRow,
  type PaymentMethod,
} from "@/api/finance";
import { FormSelect } from "@/components/ui/form-select";
import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { useInvoice, useRecordPayment } from "@/hooks/use-finance";
import { formatCurrency } from "@/utils/currency";
import { Box, Flex, Grid, Input, Text, Textarea, chakra } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { DialogShell, FormField } from "./dialog-shell";
import { fieldStyles } from "./dialog-styles";

const schema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than zero"),
  paymentDate: z.string().min(1, "Pick a payment date"),
  method: z.enum([
    "credit_card",
    "bank_transfer",
    "check",
    "cash",
    "wire",
    "other",
  ]),
  reference: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  /** Only used when the invoice has trust money and the user overrides. */
  overrideSplit: z.boolean().optional(),
  amountTrust: z.coerce.number().nonnegative().optional(),
});

type PaymentForm = z.input<typeof schema>;

const METHOD_OPTIONS = (
  Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]
).map((value) => ({ value, label: PAYMENT_METHOD_LABELS[value] }));

const today = () => new Date().toISOString().slice(0, 10);

export function RecordPaymentDialog({
  invoice: row,
  open,
  onOpenChange,
}: {
  invoice: InvoiceListRow | null;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
}) {
  // The list row lacks the payment ledger, so the outstanding split comes from
  // the detail — the pro-rata default must apportion against what is still
  // owed, not the original totals.
  const { data: detail } = useInvoice(open ? (row?.id ?? null) : null);
  const recordPayment = useRecordPayment();

  const defaults: PaymentForm = useMemo(
    () => ({
      amount: row?.balanceDue ?? 0,
      paymentDate: today(),
      method: "bank_transfer",
      reference: "",
      notes: "",
      overrideSplit: false,
      amountTrust: 0,
    }),
    [row?.balanceDue],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentForm>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  // Reset on open rather than unmounting the dialog, which would break the
  // focus trap.
  useEffect(() => {
    if (open) reset(defaults);
  }, [open, defaults, reset]);

  // useWatch, not watch(): watch() returns a fresh function each render, which
  // the React Compiler cannot memoize.
  const amount = Number(useWatch({ control, name: "amount" }) ?? 0);
  const overrideSplit = useWatch({ control, name: "overrideSplit" });
  const amountTrust = Number(useWatch({ control, name: "amountTrust" }) ?? 0);

  const paidOperating = useMemo(
    () => (detail?.payments ?? []).reduce((a, p) => a + p.amountOperating, 0),
    [detail],
  );
  const paidTrust = useMemo(
    () => (detail?.payments ?? []).reduce((a, p) => a + (p.amountTrust ?? 0), 0),
    [detail],
  );

  const operatingOutstanding = Math.max(
    (detail?.totals.operating ?? 0) - paidOperating,
    0,
  );
  const trustOutstanding = Math.max(
    (detail?.totals.trust ?? 0) - paidTrust,
    0,
  );

  const hasTrust = detail?.totals.trust != null && trustOutstanding > 0;

  // Mirrors the server's proRateSplit so the preview matches what is stored.
  const proRataTrust = useMemo(() => {
    const total = operatingOutstanding + trustOutstanding;
    if (total <= 0) return 0;
    return Math.round(((amount * trustOutstanding) / total) * 100) / 100;
  }, [amount, operatingOutstanding, trustOutstanding]);

  const effectiveTrust = overrideSplit ? amountTrust : proRataTrust;
  const effectiveOperating = Math.round((amount - effectiveTrust) * 100) / 100;

  const previouslyPaid = detail?.totals.amountPaid ?? 0;
  const invoiceTotal = detail?.totals.total ?? row?.totalAmount ?? 0;
  const remaining = Math.max(
    Math.round((invoiceTotal - previouslyPaid - amount) * 100) / 100,
    0,
  );

  const onSubmit = useCallback(
    (values: PaymentForm) => {
      if (!row) return;
      recordPayment.mutate(
        {
          invoiceId: row.id,
          input: {
            amount: Number(values.amount),
            paymentDate: values.paymentDate,
            method: values.method as PaymentMethod,
            reference: values.reference || undefined,
            notes: values.notes || undefined,
            // Only sent when the user overrode it; otherwise the server
            // pro-rates and stores the result.
            ...(values.overrideSplit && hasTrust
              ? {
                  amountTrust: Number(values.amountTrust ?? 0),
                  amountOperating:
                    Math.round(
                      (Number(values.amount) - Number(values.amountTrust ?? 0)) *
                        100,
                    ) / 100,
                }
              : {}),
          },
        },
        { onSuccess: () => onOpenChange({ open: false }) },
      );
    },
    [row, hasTrust, recordPayment, onOpenChange],
  );

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Record payment"
      subtitle={
        row ? `${row.invoiceNumber} · ${row.clientName}` : undefined
      }
      footer={
        <Flex justify="flex-end" gap="8px" w="100%">
          <OutlineButton onClick={() => onOpenChange({ open: false })}>
            Cancel
          </OutlineButton>
          <BrandButton
            loading={recordPayment.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            Save payment
          </BrandButton>
        </Flex>
      }
    >
      <Flex direction="column" gap="14px">
        <FormField label="Amount received" error={errors.amount?.message}>
          <Input type="number" step="0.01" {...register("amount")} {...fieldStyles} />
        </FormField>

        <FormField label="Payment date" error={errors.paymentDate?.message}>
          <Input type="date" {...register("paymentDate")} {...fieldStyles} />
        </FormField>

        <FormField label="Payment method" error={errors.method?.message}>
          <Controller
            control={control}
            name="method"
            render={({ field }) => (
              <FormSelect
                options={METHOD_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select method"
              />
            )}
          />
        </FormField>

        <FormField label="Reference / transaction ID (optional)">
          <Input
            placeholder="e.g. TXN-8823991"
            {...register("reference")}
            {...fieldStyles}
          />
        </FormField>

        <FormField label="Notes (optional)">
          <Textarea
            {...register("notes")}
            rows={2}
            {...fieldStyles}
            h="auto"
            py="8px"
          />
        </FormField>

        {hasTrust && (
          <Box
            p="14px"
            borderRadius="10px"
            border="1px solid"
            borderColor="border"
          >
            <Flex justify="space-between" align="center">
              <Text fontSize="12px" fontWeight="600">
                Operating / trust split
              </Text>
              <Controller
                control={control}
                name="overrideSplit"
                render={({ field }) => (
                  <chakra.button
                    type="button"
                    fontSize="11px"
                    color="brand.solid"
                    textDecoration="underline"
                    cursor="pointer"
                    onClick={() => field.onChange(!field.value)}
                  >
                    {field.value ? "Use pro-rata" : "Override"}
                  </chakra.button>
                )}
              />
            </Flex>
            <Text fontSize="11px" color="fg.muted" mt="2px">
              IOLTA funds are tracked, not estimated — this split is stored with
              the payment.
            </Text>

            {overrideSplit ? (
              <Grid templateColumns="1fr 1fr" gap="10px" mt="10px">
                <FormField label="Trust (IOLTA)">
                  <Input
                    type="number"
                    step="0.01"
                    {...register("amountTrust")}
                    {...fieldStyles}
                  />
                </FormField>
                <FormField label="Operating">
                  <Input
                    value={effectiveOperating.toFixed(2)}
                    readOnly
                    {...fieldStyles}
                    bg="bg.muted"
                  />
                </FormField>
              </Grid>
            ) : (
              <Grid templateColumns="1fr 1fr" gap="10px" mt="10px">
                <Box>
                  <Text fontSize="11px" color="fg.muted">
                    Trust (IOLTA)
                  </Text>
                  <Text fontSize="13px" fontWeight="600" color="#2e9e6b">
                    {formatCurrency(effectiveTrust)}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="11px" color="fg.muted">
                    Operating
                  </Text>
                  <Text fontSize="13px" fontWeight="600" color="#6a5cc7">
                    {formatCurrency(effectiveOperating)}
                  </Text>
                </Box>
              </Grid>
            )}
          </Box>
        )}

        <Box p="14px" borderRadius="10px" bg="bg.muted">
          {[
            ["Invoice total:", formatCurrency(invoiceTotal), "fg"],
            ["Previously paid:", formatCurrency(previouslyPaid), "fg"],
            ["This payment:", formatCurrency(amount), "#2e9e6b"],
            ["Remaining balance:", formatCurrency(remaining), "#2e9e6b"],
          ].map(([label, value, color]) => (
            <Flex key={label} justify="space-between" py="3px">
              <Text fontSize="12px" color="fg.muted">
                {label}
              </Text>
              <Text fontSize="12px" fontWeight="600" color={color}>
                {value}
              </Text>
            </Flex>
          ))}
        </Box>
      </Flex>
    </DialogShell>
  );
}
