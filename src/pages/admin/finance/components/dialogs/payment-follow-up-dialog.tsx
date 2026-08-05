import type { InvoiceListRow } from "@/api/finance";
import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { useSendFollowUp } from "@/hooks/use-finance";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { Box, Flex, Text, Textarea, chakra } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Mail, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { DialogShell, FormField } from "./dialog-shell";
import { fieldStyles } from "./dialog-styles";

const schema = z.object({
  message: z.string().trim().min(1, "Write a message").max(2000),
  channel: z.enum(["email", "sms", "both"]),
});

type FollowUpForm = z.infer<typeof schema>;

const CHANNELS: { value: FollowUpForm["channel"]; label: string; icon: typeof Mail }[] =
  [
    { value: "email", label: "Email", icon: Mail },
    { value: "sms", label: "SMS", icon: MessageSquare },
    { value: "both", label: "Both", icon: MessageSquare },
  ];

const daysOverdue = (dueDate: string): number => {
  const due = Date.parse(`${dueDate}T00:00:00Z`);
  const now = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  return Math.max(Math.floor((now - due) / 86_400_000), 0);
};

export function PaymentFollowUpDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: InvoiceListRow | null;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
}) {
  const sendFollowUp = useSendFollowUp();
  const overdueDays = invoice ? daysOverdue(invoice.dueDate) : 0;

  const defaults: FollowUpForm = useMemo(
    () => ({
      message: invoice
        ? `Dear ${invoice.clientName}, this is a reminder that invoice ${invoice.invoiceNumber} for ${formatCurrency(invoice.balanceDue)} was due on ${formatDate(invoice.dueDate)}. Please arrange payment at your earliest convenience. Contact us if you have any questions.`
        : "",
      channel: "email",
    }),
    [invoice],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FollowUpForm>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  // Reset on open rather than unmounting Dialog.Root, which would break the
  // focus trap.
  useEffect(() => {
    if (open) reset(defaults);
  }, [open, defaults, reset]);

  const channel = useWatch({ control, name: "channel" });

  const onSubmit = useCallback(
    (values: FollowUpForm) => {
      if (!invoice) return;
      sendFollowUp.mutate(
        { invoiceId: invoice.id, input: values },
        { onSuccess: () => onOpenChange({ open: false }) },
      );
    },
    [invoice, sendFollowUp, onOpenChange],
  );

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Payment follow-up"
      subtitle={
        invoice
          ? `${invoice.invoiceNumber} is ${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`
          : undefined
      }
      footer={
        <Flex justify="flex-end" gap="8px" w="100%">
          <OutlineButton onClick={() => onOpenChange({ open: false })}>
            Cancel
          </OutlineButton>
          <BrandButton
            loading={sendFollowUp.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            Send follow-up
          </BrandButton>
        </Flex>
      }
    >
      <Flex direction="column" gap="14px">
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
          <Box>
            <Text fontSize="13px" fontWeight="600" color="#d64545">
              Overdue reminder
            </Text>
            <Text fontSize="12px" color="fg.muted">
              {formatCurrency(invoice?.balanceDue ?? 0)} has been outstanding for{" "}
              {overdueDays} day{overdueDays === 1 ? "" : "s"}.
            </Text>
          </Box>
        </Flex>

        <FormField label="Message" error={errors.message?.message}>
          <Textarea
            {...register("message")}
            rows={5}
            {...fieldStyles}
            h="auto"
            py="10px"
          />
        </FormField>

        <Box>
          <Text fontSize="11px" fontWeight="500" mb="5px">
            Send method
          </Text>
          <Controller
            control={control}
            name="channel"
            render={({ field }) => (
              <Flex gap="8px">
                {CHANNELS.map((option) => {
                  const Icon = option.icon;
                  const selected = field.value === option.value;
                  return (
                    <chakra.button
                      type="button"
                      key={option.value}
                      flex="1"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      gap="6px"
                      h="38px"
                      borderRadius="8px"
                      border="1px solid"
                      borderColor={selected ? "brand.solid" : "border"}
                      bg={selected ? "bg.muted" : "bg"}
                      fontSize="12px"
                      fontWeight={selected ? "600" : "400"}
                      cursor="pointer"
                      onClick={() => field.onChange(option.value)}
                      _hover={{ borderColor: "brand.solid" }}
                    >
                      <Icon size={14} />
                      {option.label}
                    </chakra.button>
                  );
                })}
              </Flex>
            )}
          />
          {channel !== "email" && (
            <Text fontSize="11px" color="fg.muted" mt="6px">
              SMS delivery is not yet wired to a provider — the follow-up is
              recorded, but only the email is actually sent.
            </Text>
          )}
        </Box>
      </Flex>
    </DialogShell>
  );
}
