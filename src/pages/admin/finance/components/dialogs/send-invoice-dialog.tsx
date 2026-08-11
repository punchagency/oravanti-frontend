import { fetchInvoicePdfBlob } from "@/api/finance";
import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { useSendInvoice } from "@/hooks/use-finance";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { Box, Center, chakra, Flex, Spinner, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Download, Mail } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { DialogShell } from "./dialog-shell";

/**
 * What the client is about to receive, and the confirmation before they receive
 * it.
 *
 * The preview is the **actual PDF** the server will attach — same endpoint, same
 * bytes, same renderer. A confirmation step showing a re-creation of the
 * document would be worse than no preview at all: it would invite people to
 * approve one thing and send another.
 *
 * Sending is the irreversible step the draft state exists to protect. Voiding
 * afterwards does not unsend an email, so the Send button sits behind a look at
 * the document rather than beside it.
 */
export type SendableInvoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string | null;
  /** A lead has not retained the firm yet — the confirmation says so. */
  isLead: boolean;
  totalAmount: number;
  dueDate: string;
};

export function SendInvoiceDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: SendableInvoice | null;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
}) {
  const sendInvoice = useSendInvoice();

  const pdf = useQuery({
    queryKey: ["finance", "invoice-pdf", invoice?.id ?? ""],
    queryFn: () => fetchInvoicePdfBlob(invoice!.id),
    enabled: open && Boolean(invoice),
    staleTime: 0,
    gcTime: 0,
  });

  // An object URL is a live handle into memory, not a value: it is derived from
  // the blob during render, and the effect exists only to hand it back when it
  // is replaced or the dialog closes. Without the revoke the tab leaks one PDF
  // per preview.
  const blob = pdf.data;
  const previewUrl = useMemo(
    () => (blob ? URL.createObjectURL(blob) : null),
    [blob],
  );
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

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
      size="xl"
      title="Review before sending"
      subtitle={
        invoice ? `${invoice.invoiceNumber} · ${invoice.clientName}` : undefined
      }
      footer={
        <Flex justify="space-between" gap="8px" w="100%" flexWrap="wrap">
          <OutlineButton
            disabled={!previewUrl}
            onClick={() => previewUrl && window.open(previewUrl, "_blank")}
          >
            <Download size={14} />
            Open full size
          </OutlineButton>
          <Flex gap="8px">
            <OutlineButton onClick={() => onOpenChange({ open: false })}>
              Not yet
            </OutlineButton>
            <BrandButton
              loading={sendInvoice.isPending}
              disabled={noEmail || pdf.isError}
              onClick={onSend}
            >
              <Mail size={14} />
              Send to client
            </BrandButton>
          </Flex>
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

        <Box>
          <Text fontSize="12px" fontWeight="600" mb="6px">
            The document they will receive
          </Text>
          <Box
            border="1px solid"
            borderColor="border"
            borderRadius="10px"
            overflow="hidden"
            bg="bg.muted"
            h={{ base: "320px", md: "440px" }}
          >
            {pdf.isLoading ? (
              <Center h="100%">
                <Spinner />
              </Center>
            ) : pdf.isError ? (
              <Center h="100%" px="20px">
                <Text fontSize="12px" color="fg.muted" textAlign="center">
                  The invoice PDF could not be rendered, so there is nothing to
                  review. Sending is blocked until it can be — the client would
                  have received this same document.
                </Text>
              </Center>
            ) : previewUrl ? (
              // chakra.iframe, not Box as="iframe": the polymorphic `as` keeps
              // the div's prop types, which have no `src`.
              <chakra.iframe
                src={previewUrl}
                title={`Invoice ${invoice?.invoiceNumber ?? ""} preview`}
                w="100%"
                h="100%"
                border="none"
              />
            ) : null}
          </Box>
          <Text fontSize="10px" color="fg.subtle" mt="6px">
            This is the PDF the server renders and attaches — not a preview of
            it.
          </Text>
        </Box>

        <Text fontSize="12px" color="fg.muted">
          {invoice?.isLead
            ? // They have not retained the firm yet — worth saying, because a
              // consultation fee is often the first bill someone ever gets and
              // "your invoice" reads oddly before they are a client.
              "This goes to a lead who has not yet retained the firm. They receive the invoice as a PDF attachment. This cannot be unsent — voiding it afterwards does not retract the email."
            : "The client receives the invoice as a PDF attachment. This cannot be unsent — voiding the invoice afterwards does not retract the email."}
        </Text>
      </Flex>
    </DialogShell>
  );
}
