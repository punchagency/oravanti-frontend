import { PAYMENT_METHOD_LABELS, downloadInvoicePdf } from "@/api/finance";
import { OutlineButton, StatusPill } from "@/components/ui/intake-ui";
import { REPORT_CELL_PY, ReportTable } from "@/components/ui/report-table";
import {
  useInvoice,
  useInvoiceDeliveries,
  useResendInvoice,
} from "@/hooks/use-finance";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { Box, Center, Flex, Grid, Spinner, Table, Text } from "@chakra-ui/react";
import { Download, Send } from "lucide-react";
import {
  INSTALMENT_LABEL,
  INSTALMENT_TONE,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
} from "../../data";
import { DialogShell } from "./dialog-shell";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Text fontSize="12px">
      <Text as="span" color="fg.muted">
        {label}:{" "}
      </Text>
      <Text as="span" fontWeight="600">
        {value}
      </Text>
    </Text>
  );
}

export function InvoiceDetailDialog({
  invoiceId,
  open,
  onOpenChange,
}: {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
}) {
  const { data: invoice, isLoading } = useInvoice(open ? invoiceId : null);
  const { data: deliveries } = useInvoiceDeliveries(open ? invoiceId : null);
  const resend = useResendInvoice();

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title={
        <Flex align="center" gap="10px">
          <span>Invoice {invoice?.invoiceNumber ?? ""}</span>
          {invoice && (
            <StatusPill tone={INVOICE_STATUS_TONE[invoice.status]}>
              {INVOICE_STATUS_LABEL[invoice.status]}
            </StatusPill>
          )}
        </Flex>
      }
      subtitle={
        invoice
          ? [invoice.client.name, invoice.matter?.reference]
              .filter(Boolean)
              .join(" · ")
          : undefined
      }
      footer={
        <Flex justify="space-between" w="100%" gap="8px">
          <OutlineButton
            onClick={() =>
              invoice && downloadInvoicePdf(invoice.id, invoice.invoiceNumber)
            }
            disabled={!invoice}
          >
            <Download size={14} />
            Download PDF
          </OutlineButton>
          <OutlineButton onClick={() => onOpenChange({ open: false })}>
            Close
          </OutlineButton>
        </Flex>
      }
    >
      {isLoading || !invoice ? (
        <Center py={12}>
          <Spinner />
        </Center>
      ) : (
        <Box>
          <Grid
            templateColumns={{ base: "1fr", sm: "1fr 1fr" }}
            gap="10px 24px"
            p="16px"
            borderRadius="10px"
            bg="bg.muted"
          >
            <Field label="Client" value={invoice.client.name} />
            <Field label="Email" value={invoice.client.email ?? "—"} />
            <Field label="Matter" value={invoice.matter?.reference ?? "—"} />
            <Field label="Filing type" value={invoice.filingType ?? "—"} />
            <Field label="Attorney" value={invoice.attorney ?? "—"} />
            <Field label="Issue date" value={formatDate(invoice.issueDate)} />
            <Field label="Due date" value={formatDate(invoice.dueDate)} />
            <Field
              label="Payment method"
              value={
                invoice.lastPaymentMethod
                  ? PAYMENT_METHOD_LABELS[invoice.lastPaymentMethod]
                  : "—"
              }
            />
            {invoice.lastPaymentDate && (
              <Field
                label="Payment date"
                value={formatDate(invoice.lastPaymentDate)}
              />
            )}
          </Grid>

          <Text textStyle="label" fontWeight="700" mt="20px" mb="10px">
            Line items
          </Text>

          <ReportTable headers={["Description", "Qty", "Rate", "Total"]}>
            {invoice.lineItems.map((line) => (
              <Table.Row key={line.id}>
                <Table.Cell py={REPORT_CELL_PY}>
                  <Text fontSize="13px">{line.description}</Text>
                  {line.account === "trust_iolta" && (
                    <Box mt="3px">
                      <StatusPill tone="success">Trust (IOLTA)</StatusPill>
                    </Box>
                  )}
                </Table.Cell>
                <Table.Cell py={REPORT_CELL_PY} textAlign="right">
                  <Text fontSize="13px">{line.quantity}</Text>
                </Table.Cell>
                <Table.Cell py={REPORT_CELL_PY} textAlign="right">
                  <Text fontSize="13px">{formatCurrency(line.rate)}</Text>
                </Table.Cell>
                <Table.Cell py={REPORT_CELL_PY} textAlign="right">
                  <Text fontSize="13px" fontWeight="700">
                    {formatCurrency(line.amount)}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </ReportTable>

          {invoice.restrictions.trust === "no_access" && (
            <Text fontSize="11px" color="fg.muted" mt="8px">
              Trust (IOLTA) lines are hidden — you do not have access to trust
              account data.
            </Text>
          )}

          <Flex justify="flex-end" mt="16px">
            <Box minW="240px">
              <Flex justify="space-between" py="3px">
                <Text fontSize="13px" color="fg.muted">
                  Total:
                </Text>
                <Text fontSize="13px" fontWeight="700">
                  {formatCurrency(invoice.totals.total)}
                </Text>
              </Flex>
              <Flex justify="space-between" py="3px">
                <Text fontSize="13px" color="#2e9e6b">
                  Amount paid:
                </Text>
                <Text fontSize="13px" fontWeight="600" color="#2e9e6b">
                  {formatCurrency(invoice.totals.amountPaid)}
                </Text>
              </Flex>
              <Flex justify="space-between" py="3px">
                <Text fontSize="13px" color="fg.muted">
                  Balance due:
                </Text>
                <Text fontSize="13px" fontWeight="700">
                  {formatCurrency(invoice.totals.balanceDue)}
                </Text>
              </Flex>
            </Box>
          </Flex>

          {invoice.instalments.length > 0 && (
            <>
              <Text textStyle="label" fontWeight="700" mt="20px" mb="8px">
                Payment schedule
              </Text>
              {/* State comes from the server: it depends on the firm's today,
                  and a browser-side comparison would disagree either side of
                  midnight. */}
              {invoice.instalments.map((inst, index) => (
                <Flex
                  key={inst.id}
                  justify="space-between"
                  align="center"
                  gap="10px"
                  py="8px"
                  borderTop={index === 0 ? "none" : "1px solid"}
                  borderColor="border.muted"
                >
                  <Flex align="center" gap="10px" minW={0}>
                    <Text fontSize="12px" color="fg.subtle" w="18px">
                      {inst.sequence}.
                    </Text>
                    <Box minW={0}>
                      <Text fontSize="12px" fontWeight="600">
                        {formatDate(inst.dueDate)}
                      </Text>
                      {inst.amountPaid > 0 && inst.outstanding > 0 && (
                        <Text fontSize="11px" color="fg.muted">
                          {formatCurrency(inst.outstanding)} still outstanding
                        </Text>
                      )}
                    </Box>
                  </Flex>
                  <Flex align="center" gap="10px" flexShrink={0}>
                    <Text fontSize="13px" fontWeight="700">
                      {formatCurrency(inst.amount)}
                    </Text>
                    <StatusPill tone={INSTALMENT_TONE[inst.state]}>
                      {INSTALMENT_LABEL[inst.state]}
                    </StatusPill>
                  </Flex>
                </Flex>
              ))}
            </>
          )}

          {invoice.payments.length > 0 && (
            <>
              <Text textStyle="label" fontWeight="700" mt="20px" mb="8px">
                Payments
              </Text>
              {invoice.payments.map((p) => (
                <Flex
                  key={p.id}
                  justify="space-between"
                  py="7px"
                  borderTop="1px solid"
                  borderColor="border.muted"
                >
                  <Text fontSize="12px" color="fg.muted">
                    {formatDate(p.paymentDate)} ·{" "}
                    {PAYMENT_METHOD_LABELS[p.method]}
                    {p.reference ? ` · ${p.reference}` : ""}
                  </Text>
                  <Text fontSize="12px" fontWeight="600">
                    {formatCurrency(p.amount)}
                  </Text>
                </Flex>
              ))}
            </>
          )}

          <Box mt="20px">
            <Flex justify="space-between" align="center" mb="8px">
              <Text textStyle="label" fontWeight="700">
                Delivery
              </Text>
              {invoice.status !== "draft" && invoice.status !== "void" && (
                <OutlineButton
                  loading={resend.isPending}
                  onClick={() => resend.mutate(invoice.id)}
                >
                  <Send size={13} />
                  Resend
                </OutlineButton>
              )}
            </Flex>

            {!deliveries || deliveries.length === 0 ? (
              /* Honest for invoices issued before delivery tracking existed —
                 claiming a send we have no record of is the original bug. */
              <Text fontSize="12px" color="fg.muted">
                No delivery recorded. This invoice has not been emailed to the
                client from Oravanti.
              </Text>
            ) : (
              deliveries.map((delivery, index) => (
                <Flex
                  key={delivery.id}
                  justify="space-between"
                  align="flex-start"
                  gap="10px"
                  py="8px"
                  borderTop={index === 0 ? "none" : "1px solid"}
                  borderColor="border.muted"
                >
                  <Box minW={0}>
                    <Text fontSize="12px" fontWeight="600" truncate>
                      {delivery.recipientEmail}
                    </Text>
                    <Text fontSize="11px" color="fg.muted">
                      {[
                        delivery.deliveredAt
                          ? formatDate(delivery.deliveredAt)
                          : formatDate(delivery.createdAt),
                        delivery.sentBy,
                        delivery.attemptCount > 1
                          ? `attempt ${delivery.attemptCount}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                    {delivery.failureReason && (
                      <Text fontSize="11px" color="#c0392b" mt="2px">
                        {delivery.failureReason}
                      </Text>
                    )}
                  </Box>
                  <StatusPill
                    tone={
                      delivery.status === "sent"
                        ? "success"
                        : delivery.status === "failed"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {delivery.status === "sent" ? "Sent" : delivery.status === "failed" ? "Failed" : "Pending"}
                  </StatusPill>
                </Flex>
              ))
            )}

            {deliveries && deliveries.some((d) => d.status === "sent") && (
              /* Same honesty as smsDelivered: we know the provider took it, not
                 that it reached an inbox. */
              <Text fontSize="10px" color="fg.subtle" mt="8px">
                "Sent" means the email provider accepted the message. Bounces are
                not yet tracked.
              </Text>
            )}
          </Box>

          {invoice.notes && (
            <Box mt="20px">
              <Text
                fontSize="10px"
                letterSpacing="0.06em"
                color="fg.muted"
                fontWeight="600"
              >
                NOTES
              </Text>
              <Text fontSize="13px" mt="4px">
                {invoice.notes}
              </Text>
            </Box>
          )}
        </Box>
      )}
    </DialogShell>
  );
}
