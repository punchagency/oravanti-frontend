import type { InvoiceDetail } from "@/api/finance";
import { FormSelect } from "@/components/ui/form-select";
import { BrandButton, OutlineButton, StatusPill } from "@/components/ui/intake-ui";
import { useCases } from "@/hooks/use-cases";
import { useClients } from "@/hooks/use-clients";
import {
  useCaseDefaults,
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
import { ListPlus, Plus, Save, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { DialogShell, FormField } from "./dialog-shell";
import { fieldStyles } from "./dialog-styles";
import { LinePresetPicker, type PickedLine } from "./line-preset-picker";
import { ScheduleEditor } from "./schedule-editor";
import { isScheduleBalanced, toInstalmentInput } from "./schedule-utils";

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
  /**
   * The catalog preset this line came from, when it came from one. Provenance
   * only — the three fields above are what gets billed, and editing any of
   * them afterwards is expected rather than a contradiction.
   */
  presetId: z.string().optional(),
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
    // In the form rather than beside it, so `reset()` restores the schedule
    // along with everything else and no effect has to setState to sync it.
    scheduled: z.boolean(),
    schedule: z.array(
      z.object({ dueDate: z.string(), amount: z.string() }),
    ),
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
  presetId: undefined,
});

/** A line the picker composed. Quantity is always 1 — it is per-use, not a
 *  property of the charge, so it stays on the row for the author to change. */
const lineFromPick = (pick: PickedLine) => ({
  description: pick.description,
  quantity: "1",
  rate: pick.rate,
  account: pick.account,
  presetId: pick.presetId,
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
  // No blank row: the picker is the way in, and an empty grid sitting above it
  // only invites the retyping this catalog exists to end. "Add line" is still
  // there for anything the catalog does not cover.
  lines: [],
  timeEntryIds: [],
  scheduled: false,
  schedule: [],
});

/** Split a saved draft back into the two halves this form edits. */
const formFromInvoice = (invoice: InvoiceDetail): InvoiceForm => {
  const manual = invoice.lineItems.filter((l) => l.timeEntryId == null);
  return {
    // Empty on a lead-billed invoice. The client select is disabled in edit
    // mode regardless, so there is nothing to prefill and nothing to lose.
    clientId: invoice.client?.id ?? "",
    caseId: invoice.matter?.id ?? "",
    attorneyId: invoice.attorneyId ?? "",
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    notes: invoice.notes ?? "",
    lines: manual.map((l) => ({
      description: l.description,
      quantity: String(l.quantity),
      rate: String(l.rate),
      account: l.account,
      // Round-trips provenance, so re-saving a draft does not orphan every
      // line the picker composed.
      presetId: l.presetId ?? undefined,
    })),
    timeEntryIds: invoice.lineItems
      .map((l) => l.timeEntryId)
      .filter((id): id is string => id != null),
    scheduled: invoice.instalments.length > 0,
    schedule: invoice.instalments.map((i) => ({
      dueDate: i.dueDate,
      amount: i.amount.toFixed(2),
    })),
  };
};

const PREFILL_HINT = {
  team_lead: "Prefilled from the matter's team lead",
  sole_attorney: "Prefilled — the only attorney on this matter's team",
} as const;

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

  /**
   * Whether the catalog picker is showing.
   *
   * Open by default on a new invoice: picking from the catalog is the intended
   * way in, and a dialog that opens on an empty grid teaches the old habit.
   * Closed when editing, where the lines already exist.
   *
   * Reset during render rather than from the effect below — React's documented
   * "adjusting state when a prop changes" pattern. Doing it in the effect
   * triggers a cascading render, which the lint rule correctly objects to.
   */
  const [pickerOpen, setPickerOpen] = useState(!isEdit);
  const [openedAs, setOpenedAs] = useState(open);
  if (open !== openedAs) {
    setOpenedAs(open);
    setPickerOpen(open && !isEdit);
  }


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

  // Settled instalments cannot be edited away: the money has arrived, and
  // rewriting the row it paid would only make the schedule disagree with the
  // ledger. Allocation is oldest-first, so the paid ones are always the first N.
  const paidInstalmentCount =
    loaded?.instalments.filter((i) => i.state === "paid").length ?? 0;

  // useWatch, not watch(): watch() returns a fresh function each render, which
  // the React Compiler cannot memoize.
  const clientId = useWatch({ control, name: "clientId" });
  const caseId = useWatch({ control, name: "caseId" });
  const attorneyId = useWatch({ control, name: "attorneyId" });
  const lines = useWatch({ control, name: "lines" });
  const scheduled = useWatch({ control, name: "scheduled" });
  const scheduleRows = useWatch({ control, name: "schedule" });
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
  const caseDefaults = useCaseDefaults(open ? caseId : null);

  /**
   * Which matter the author just picked and is still owed an attorney for.
   *
   * The attorney is filled in as a *consequence of choosing a matter*, never by
   * an effect watching the resolved value — otherwise it would overwrite a
   * choice the author made by hand, and would fight the prefill when editing a
   * draft that already names someone.
   */
  const awaitingAttorneyFor = useRef<string | null>(null);

  const defaults = caseDefaults.data;
  useEffect(() => {
    if (!defaults?.attorneyId) return;
    if (awaitingAttorneyFor.current !== defaults.caseId) return;
    awaitingAttorneyFor.current = null;
    setValue("attorneyId", defaults.attorneyId, { shouldDirty: true });
  }, [defaults, setValue]);

  // Derived, not remembered: the hint is true whenever the selected attorney is
  // the one this matter resolves to, whether it got there automatically or by
  // hand. Storing "was it prefilled?" would only let the two drift apart.
  const prefillHint =
    defaults?.source &&
    defaults.caseId === caseId &&
    defaults.attorneyId != null &&
    defaults.attorneyId === attorneyId
      ? PREFILL_HINT[defaults.source]
      : undefined;

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
          presetId: l.presetId,
        }));

      const done = (invoice: InvoiceDetail) => {
        onOpenChange({ open: false });
        if (intent === "send") onReadyToSend(invoice);
      };

      // Sent as [] when the toggle is off, so switching a scheduled invoice
      // back to a single payment actually clears it. Omitting the key would
      // mean "leave the schedule alone".
      const instalments = values.scheduled
        ? toInstalmentInput(values.schedule)
        : [];

      if (isEdit) {
        updateInvoice.mutate(
          {
            invoiceId,
            input: {
              caseId: values.caseId,
              // null unassigns; "" would fail uuid validation.
              attorneyId: values.attorneyId || null,
              issueDate: values.issueDate,
              // The schedule owns the due date once there is one; sending both
              // is refused, since they could contradict each other.
              ...(instalments.length ? {} : { dueDate: values.dueDate }),
              notes: values.notes?.trim() || undefined,
              lineItems: filledLines,
              timeEntryIds: values.timeEntryIds,
              ...(instalments.length ? { instalments } : {}),
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
          ...(instalments.length ? { instalments } : {}),
        },
        { onSuccess: done },
      );
    },
    [
      createInvoice,
      updateInvoice,
      invoiceId,
      isEdit,
      onOpenChange,
      onReadyToSend,
    ],
  );

  const isSaving = createInvoice.isPending || updateInvoice.isPending;
  const isLoadingDraft = isEdit && existing.isLoading;

  // The server rejects a schedule that does not sum to the total, so hold the
  // save here where the author can still see which figure to change.
  const scheduleUnbalanced =
    scheduled && !isScheduleBalanced(scheduleRows, totals.total);

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
              disabled={isLoadingDraft || scheduleUnbalanced}
              onClick={handleSubmit((v) => save(v, "draft"))}
            >
              <Save size={14} />
              Save as draft
            </OutlineButton>
            <BrandButton
              loading={isSaving}
              disabled={isLoadingDraft || scheduleUnbalanced}
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
                    onChange={(v) => {
                      field.onChange(v);
                      // Ask for the matter's attorney; the effect above fills it
                      // in when the answer arrives.
                      awaitingAttorneyFor.current = v || null;
                      if (!v) setValue("attorneyId", "");
                    }}
                    placeholder={
                      clientId ? "Select matter" : "Choose a client first"
                    }
                  />
                )}
              />
            </FormField>

            <FormField label="Attorney" hint={prefillHint}>
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
              <Flex gap="6px">
                <OutlineButton onClick={() => append(emptyLine())}>
                  <Plus size={13} />
                  Blank line
                </OutlineButton>
                {!pickerOpen && (
                  <BrandButton onClick={() => setPickerOpen(true)}>
                    <ListPlus size={13} />
                    Add from catalog
                  </BrandButton>
                )}
              </Flex>
            </Flex>

            {pickerOpen && (
              <Box mb="10px">
                <LinePresetPicker
                  // From the matter, so the catalog narrows to what this kind
                  // of case actually attracts. Undefined until a matter is
                  // picked — the general tier still applies.
                  practiceAreaId={defaults?.practiceAreaId ?? undefined}
                  caseTypeId={defaults?.caseTypeId ?? undefined}
                  onAdd={(pick: PickedLine) => append(lineFromPick(pick))}
                  onClose={() => setPickerOpen(false)}
                />
              </Box>
            )}

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
                    // No longer guarded on being the last row: the form starts
                    // with none and the picker is how lines arrive, so removing
                    // the only one is a legitimate way back to an empty list.
                    onClick={() => remove(index)}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </Grid>
              ))}
              {fields.length === 0 && !pickerOpen && (
                <Text fontSize="12px" color="fg.muted">
                  No line items yet. Add them from the catalog, or select
                  unbilled time below.
                </Text>
              )}
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

          <Box>
            <Flex justify="space-between" align="center" mb="8px" gap="10px">
              <Text fontSize="12px" fontWeight="600">
                Payment schedule
              </Text>
              <Checkbox.Root
                size="sm"
                checked={scheduled}
                onCheckedChange={(d) => {
                  const on = Boolean(d.checked);
                  setValue("scheduled", on);
                  // Leaving stale rows behind would send a schedule the author
                  // had just switched off.
                  if (!on) setValue("schedule", []);
                }}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label fontSize="12px" color="fg.muted">
                  Pay in instalments
                </Checkbox.Label>
              </Checkbox.Root>
            </Flex>

            {scheduled ? (
              <ScheduleEditor
                rows={scheduleRows}
                onChange={(rows) => setValue("schedule", rows)}
                invoiceTotal={totals.total}
                lockedCount={paidInstalmentCount}
              />
            ) : (
              <Text fontSize="12px" color="fg.muted">
                Due in full on the due date above.
              </Text>
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
