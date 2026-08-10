import type { InvoiceDetail } from "@/api/finance";
import { FormSelect } from "@/components/ui/form-select";
import { BrandButton, OutlineButton, StatusPill } from "@/components/ui/intake-ui";
import { useCases } from "@/hooks/use-cases";
import { useClients } from "@/hooks/use-clients";
import {
  useCreateInvoice,
  useInvoice,
  useUnbilledTime,
  useUpdateInvoice,
} from "@/hooks/use-finance";
import { useStaffsList } from "@/hooks/use-staff-list";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import {
  Box,
  Center,
  Checkbox,
  Flex,
  Grid,
  IconButton,
  Input,
  Spinner,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { DialogShell, FormField } from "./dialog-shell";
import { fieldStyles } from "./dialog-styles";

/**
 * Compose an invoice from manual lines and/or approved unbilled time — for a
 * new one or for editing a draft.
 *
 * Two things this dialog is deliberate about:
 *
 *   - **Saving and sending are separate acts.** Both buttons write a draft;
 *     only one goes on to offer the send, and the send itself is confirmed
 *     against a preview of the real PDF in the next dialog. Nothing leaves the
 *     firm as a side effect of pressing Save.
 *   - **Editing is draft-only**, enforced by the server. A sent invoice is a
 *     statement the client already holds; it gets voided and reissued, not
 *     rewritten.
 *
 * A matter is required, because the server needs a practice area whenever there
 * is no case to infer one from (otherwise revenue-by-practice-area silently
 * undercounts the invoice) and this dialog has no practice-area field.
 */

const lineSchema = z.object({
  description: z.string().trim(),
  quantity: z.string(),
  rate: z.string(),
  account: z.enum(["operating", "trust_iolta"]),
});

const schema = z
  .object({
    clientId: z.string().min(1, "Choose a client"),
    caseId: z
      .string()
      .min(
        1,
        "Select a matter — invoices without one need a practice area, which cannot be set here yet",
      ),
    attorneyId: z.string().optional(),
    issueDate: z.string().min(1, "Pick an issue date"),
    dueDate: z.string().min(1, "Pick a due date"),
    notes: z.string().max(4000).optional(),
    lines: z.array(lineSchema),
    timeEntryIds: z.array(z.string()),
  })
  .refine((v) => v.dueDate >= v.issueDate, {
    message: "Due date cannot precede the issue date",
    path: ["dueDate"],
  })
  .refine(
    (v) =>
      v.timeEntryIds.length > 0 ||
      v.lines.some((l) => l.description.trim() && Number(l.rate) > 0),
    {
      message: "Add a line item or select some unbilled time",
      path: ["lines"],
    },
  );

type InvoiceForm = z.infer<typeof schema>;

const ACCOUNT_OPTIONS = [
  { value: "operating", label: "Operating" },
  { value: "trust_iolta", label: "Trust (IOLTA)" },
];

const emptyLine = () => ({
  description: "",
  quantity: "1",
  rate: "",
  account: "operating" as const,
});

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) =>
  new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

const blankForm = (): InvoiceForm => ({
  clientId: "",
  caseId: "",
  attorneyId: "",
  issueDate: today(),
  dueDate: inDays(14),
  notes: "",
  lines: [emptyLine()],
  timeEntryIds: [],
});

/** Split a saved draft back into the two halves this form edits. */
const formFromInvoice = (invoice: InvoiceDetail): InvoiceForm => {
  const manual = invoice.lineItems.filter((l) => l.timeEntryId == null);
  return {
    clientId: invoice.client.id,
    caseId: invoice.matter?.id ?? "",
    attorneyId: invoice.attorneyId ?? "",
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    notes: invoice.notes ?? "",
    lines: manual.length
      ? manual.map((l) => ({
          description: l.description,
          quantity: String(l.quantity),
          rate: String(l.rate),
          account: l.account,
        }))
      : [emptyLine()],
    timeEntryIds: invoice.lineItems
      .map((l) => l.timeEntryId)
      .filter((id): id is string => id != null),
  };
};

export function InvoiceFormDialog({
  invoiceId,
  open,
  onOpenChange,
  onReadyToSend,
}: {
  /** null creates a new invoice; an id edits that draft. */
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  /** Saved and the author asked to send it — hand off to the send confirmation. */
  onReadyToSend: (invoice: InvoiceDetail) => void;
}) {
  const isEdit = invoiceId != null;
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const existing = useInvoice(open && isEdit ? invoiceId : null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<InvoiceForm>({
    resolver: zodResolver(schema),
    defaultValues: blankForm(),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });

  // Reset on open rather than unmounting Dialog.Root, which would break the
  // focus trap. In edit mode this runs again when the draft arrives — until
  // then there is nothing to prefill with.
  const loaded = existing.data;
  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      if (loaded) reset(formFromInvoice(loaded));
    } else {
      reset(blankForm());
    }
  }, [open, isEdit, loaded, reset]);

  // useWatch, not watch(): watch() returns a fresh function each render, which
  // the React Compiler cannot memoize.
  const clientId = useWatch({ control, name: "clientId" });
  const lines = useWatch({ control, name: "lines" });
  const timeEntryIds = useWatch({ control, name: "timeEntryIds" });

  const clients = useClients();
  const cases = useCases({ clientId: clientId || undefined, limit: 100 });
  const staff = useStaffsList({ limit: 100 });
  const unbilled = useUnbilledTime(
    clientId || undefined,
    undefined,
    open,
    invoiceId ?? undefined,
  );

  const clientOptions = useMemo(
    () =>
      (clients.data ?? []).map((c) => ({
        value: c.id,
        label: c.displayName,
      })),
    [clients.data],
  );

  const caseOptions = useMemo(
    () =>
      (cases.data?.data ?? []).map((c) => ({
        value: c.id,
        label: `${c.caseNumber} — ${c.caseType?.name ?? ""}`.trim(),
      })),
    [cases.data],
  );

  const attorneyOptions = useMemo(
    () => [
      { value: "", label: "Unassigned" },
      ...(staff.data?.data ?? []).map((member) => ({
        value: member.id,
        label: `${member.firstName} ${member.lastName}`.trim(),
      })),
    ],
    [staff.data],
  );

  // Entries with no resolvable rate cannot be invoiced — the server refuses
  // them — so they are counted separately rather than offered and then denied.
  const billableEntries = useMemo(
    () => (unbilled.data ?? []).filter((e) => !e.rateUnset),
    [unbilled.data],
  );
  const unratedCount = (unbilled.data ?? []).length - billableEntries.length;

  const totals = useMemo(() => {
    let operating = 0;
    let trust = 0;
    for (const line of lines ?? []) {
      const amount = (Number(line.quantity) || 0) * (Number(line.rate) || 0);
      if (line.account === "trust_iolta") trust += amount;
      else operating += amount;
    }
    for (const id of timeEntryIds ?? []) {
      const entry = billableEntries.find((e) => e.id === id);
      if (entry) operating += entry.amount ?? 0;
    }
    return {
      operating: Math.round(operating * 100) / 100,
      trust: Math.round(trust * 100) / 100,
      total: Math.round((operating + trust) * 100) / 100,
    };
  }, [lines, timeEntryIds, billableEntries]);

  const save = useCallback(
    (values: InvoiceForm, intent: "draft" | "send") => {
      const filledLines = values.lines
        .filter((l) => l.description.trim() && Number(l.rate) > 0)
        .map((l) => ({
          description: l.description.trim(),
          quantity: Number(l.quantity) || 1,
          rate: Number(l.rate),
          account: l.account,
        }));

      const done = (invoice: InvoiceDetail) => {
        onOpenChange({ open: false });
        if (intent === "send") onReadyToSend(invoice);
      };

      if (isEdit) {
        updateInvoice.mutate(
          {
            invoiceId,
            input: {
              caseId: values.caseId,
              // null unassigns; "" would fail uuid validation.
              attorneyId: values.attorneyId || null,
              issueDate: values.issueDate,
              dueDate: values.dueDate,
              notes: values.notes?.trim() || undefined,
              lineItems: filledLines,
              timeEntryIds: values.timeEntryIds,
            },
          },
          { onSuccess: done },
        );
        return;
      }

      createInvoice.mutate(
        {
          clientId: values.clientId,
          caseId: values.caseId,
          attorneyId: values.attorneyId || undefined,
          issueDate: values.issueDate,
          dueDate: values.dueDate,
          notes: values.notes?.trim() || undefined,
          lineItems: filledLines,
          timeEntryIds: values.timeEntryIds,
        },
        { onSuccess: done },
      );
    },
    [createInvoice, updateInvoice, invoiceId, isEdit, onOpenChange, onReadyToSend],
  );

  const isSaving = createInvoice.isPending || updateInvoice.isPending;
  const isLoadingDraft = isEdit && existing.isLoading;

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title={isEdit ? `Edit draft ${loaded?.invoiceNumber ?? ""}` : "New invoice"}
      subtitle="Saving keeps this a draft. Nothing reaches the client until you send it, and you will see the invoice first."
      footer={
        <Flex
          justify="space-between"
          align="center"
          w="100%"
          gap="12px"
          flexWrap="wrap"
        >
          <Flex gap="14px" flexWrap="wrap">
            <Text fontSize="12px" color="#6a5cc7">
              Operating: <b>{formatCurrency(totals.operating)}</b>
            </Text>
            <Text fontSize="12px" color="#2e9e6b">
              Trust: <b>{formatCurrency(totals.trust)}</b>
            </Text>
            <Text fontSize="12px">
              Total: <b>{formatCurrency(totals.total)}</b>
            </Text>
          </Flex>
          <Flex gap="8px" flexWrap="wrap">
            <OutlineButton onClick={() => onOpenChange({ open: false })}>
              Cancel
            </OutlineButton>
            <OutlineButton
              loading={isSaving}
              disabled={isLoadingDraft}
              onClick={handleSubmit((v) => save(v, "draft"))}
            >
              <Save size={14} />
              Save as draft
            </OutlineButton>
            <BrandButton
              loading={isSaving}
              disabled={isLoadingDraft}
              onClick={handleSubmit((v) => save(v, "send"))}
            >
              <Send size={14} />
              Save and review to send
            </BrandButton>
          </Flex>
        </Flex>
      }
    >
      {isLoadingDraft ? (
        <Center py={12}>
          <Spinner />
        </Center>
      ) : (
        <Flex direction="column" gap="14px">
          <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap="12px">
            <FormField label="Client" error={errors.clientId?.message}>
              <Controller
                control={control}
                name="clientId"
                render={({ field }) => (
                  <FormSelect
                    options={clientOptions}
                    value={field.value}
                    // The client of an existing invoice is not editable: its
                    // time entries and matter both hang off them, and moving an
                    // invoice between clients is a new invoice, not an edit.
                    disabled={isEdit}
                    onChange={(v) => {
                      field.onChange(v);
                      // Matters and unbilled time both hang off the client, so
                      // they stop being valid the moment it changes.
                      setValue("caseId", "");
                      setValue("timeEntryIds", []);
                      setValue("attorneyId", "");
                    }}
                    placeholder="Select client"
                  />
                )}
              />
            </FormField>

            <FormField label="Matter" error={errors.caseId?.message}>
              <Controller
                control={control}
                name="caseId"
                render={({ field }) => (
                  <FormSelect
                    options={caseOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={
                      clientId ? "Select matter" : "Choose a client first"
                    }
                  />
                )}
              />
            </FormField>

            <FormField label="Attorney">
              <Controller
                control={control}
                name="attorneyId"
                render={({ field }) => (
                  <FormSelect
                    options={attorneyOptions}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Select attorney"
                  />
                )}
              />
            </FormField>

            <Grid templateColumns="1fr 1fr" gap="10px">
              <FormField label="Issue date" error={errors.issueDate?.message}>
                <Input type="date" {...register("issueDate")} {...fieldStyles} />
              </FormField>
              <FormField label="Due date" error={errors.dueDate?.message}>
                <Input type="date" {...register("dueDate")} {...fieldStyles} />
              </FormField>
            </Grid>
          </Grid>

          <Box>
            <Flex justify="space-between" align="center" mb="8px">
              <Text fontSize="12px" fontWeight="600">
                Line items
              </Text>
              <OutlineButton onClick={() => append(emptyLine())}>
                <Plus size={13} />
                Add line
              </OutlineButton>
            </Flex>

            <Flex direction="column" gap="8px">
              {fields.map((field, index) => (
                <Grid
                  key={field.id}
                  templateColumns={{
                    base: "1fr",
                    md: "minmax(0, 2.4fr) 70px 100px 130px 32px",
                  }}
                  gap="8px"
                  alignItems="center"
                >
                  <Input
                    placeholder="Description"
                    {...register(`lines.${index}.description`)}
                    {...fieldStyles}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Qty"
                    {...register(`lines.${index}.quantity`)}
                    {...fieldStyles}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Rate"
                    {...register(`lines.${index}.rate`)}
                    {...fieldStyles}
                  />
                  <Controller
                    control={control}
                    name={`lines.${index}.account`}
                    render={({ field: accountField }) => (
                      <FormSelect
                        options={ACCOUNT_OPTIONS}
                        value={accountField.value}
                        onChange={accountField.onChange}
                        placeholder="Account"
                      />
                    )}
                  />
                  <IconButton
                    aria-label="Remove line"
                    size="sm"
                    variant="ghost"
                    color="fg.muted"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </Grid>
              ))}
            </Flex>
            {errors.lines?.message && (
              <Text fontSize="11px" color="#c0392b" mt="6px">
                {errors.lines.message}
              </Text>
            )}
          </Box>

          <Box>
            <Text fontSize="12px" fontWeight="600" mb="6px">
              Approved unbilled time
            </Text>

            {!clientId ? (
              <Text fontSize="12px" color="fg.muted">
                Choose a client to see their unbilled time.
              </Text>
            ) : billableEntries.length === 0 ? (
              <Text fontSize="12px" color="fg.muted">
                No approved unbilled time for this client.
              </Text>
            ) : (
              <Controller
                control={control}
                name="timeEntryIds"
                render={({ field }) => (
                  <Flex
                    direction="column"
                    border="1px solid"
                    borderColor="border"
                    borderRadius="10px"
                    overflow="hidden"
                  >
                    {billableEntries.map((entry, index) => {
                      const checked = field.value.includes(entry.id);
                      return (
                        <Flex
                          key={entry.id}
                          align="center"
                          gap="10px"
                          p="10px 12px"
                          borderTop={index === 0 ? "none" : "1px solid"}
                          borderColor="border.muted"
                          bg={checked ? "bg.muted" : "bg"}
                        >
                          <Checkbox.Root
                            checked={checked}
                            onCheckedChange={(d) =>
                              field.onChange(
                                d.checked
                                  ? [...field.value, entry.id]
                                  : field.value.filter(
                                      (id: string) => id !== entry.id,
                                    ),
                              )
                            }
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                          </Checkbox.Root>

                          <Box flex="1" minW={0}>
                            <Text fontSize="12px" fontWeight="600" truncate>
                              {entry.description || "Legal services"}
                            </Text>
                            <Text fontSize="11px" color="fg.muted">
                              {[
                                entry.staffName,
                                entry.caseNumber,
                                formatDate(entry.entryDate),
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </Text>
                          </Box>

                          <Text fontSize="11px" color="fg.muted" flexShrink={0}>
                            {entry.hours}h × {formatCurrency(entry.rate)}
                          </Text>
                          <Text
                            fontSize="12px"
                            fontWeight="700"
                            minW="72px"
                            textAlign="right"
                            flexShrink={0}
                          >
                            {formatCurrency(entry.amount)}
                          </Text>
                        </Flex>
                      );
                    })}
                  </Flex>
                )}
              />
            )}

            {unratedCount > 0 && (
              <Flex align="center" gap="6px" mt="6px">
                <StatusPill tone="warning">
                  {unratedCount} without a rate
                </StatusPill>
                <Text fontSize="11px" color="fg.muted">
                  Set a billing rate for those staff members before invoicing
                  their time.
                </Text>
              </Flex>
            )}
          </Box>

          <FormField label="Notes (optional)">
            <Textarea
              {...register("notes")}
              rows={2}
              {...fieldStyles}
              h="auto"
              py="8px"
            />
          </FormField>
        </Flex>
      )}
    </DialogShell>
  );
}
