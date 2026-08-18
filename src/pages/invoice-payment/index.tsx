import {
  getPayableInvoice,
  startInvoiceCheckout,
  type PayableInvoice,
} from "@/api/invoice-payment";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import {
  Box,
  Button,
  Center,
  chakra,
  Flex,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";

/**
 * The client-facing invoice payment page.
 *
 * Public and token-gated, like the consultation booking and document upload
 * pages — no auth, the token in the URL is the credential.
 *
 * Payment happens in a Confido-hosted iframe rather than by redirect. Confido
 * provides no return URL, so a redirect would strand the payer on someone
 * else's confirmation screen with no route back — embedding keeps them here and
 * lets us tell them the invoice is settled.
 *
 * Because there is no redirect, the webhook is the only completion signal. The
 * page therefore polls while a payment is in flight, and stops as soon as the
 * balance clears.
 */
export function InvoicePaymentPage() {
  useDocumentTitle("Pay invoice - Oravanti");
  const { token } = useParams<{ token: string }>();

  const [payUrl, setPayUrl] = useState<string | null>(null);

  const invoice = useQuery({
    queryKey: ["invoice-payment", token],
    queryFn: () => getPayableInvoice(token!),
    enabled: Boolean(token),
    // A bad token should fail immediately rather than retrying three times in
    // front of the payer. But once the frame is open a transient blip must not
    // become "this link is not available", so retries are allowed from then on.
    retry: (failureCount) => Boolean(payUrl) && failureCount < 3,
    // Poll only while a payment is actually in flight: the webhook is what
    // settles the invoice, and it arrives seconds after the payer finishes.
    // Three seconds because someone is watching a card go through; the settings
    // tab's thirty would feel broken here.
    refetchInterval: (query) =>
      payUrl && query.state.data && !query.state.data.settled ? 3000 : false,
  });

  const checkout = useMutation({
    mutationFn: () => startInvoiceCheckout(token!),
    onSuccess: (session) => setPayUrl(session.url),
    onError: () =>
      toast.error("Payment could not be started. Please contact the firm."),
  });

  if (invoice.isLoading) {
    return (
      <Center minH="100vh">
        <Spinner />
      </Center>
    );
  }

  if (invoice.isError || !invoice.data) {
    return (
      <Center minH="100vh" px="20px">
        <Box maxW="440px" textAlign="center">
          <Box color="#d64545" mb="12px">
            <AlertTriangle size={28} style={{ margin: "0 auto" }} />
          </Box>
          <Text fontSize="18px" fontWeight="600" mb="6px">
            This payment link is not available
          </Text>
          {/* The server distinguishes expired / cancelled / already paid, and
              its message is more useful than anything generic we could write. */}
          <Text fontSize="14px" color="fg.muted">
            {(invoice.error as { response?: { data?: { message?: string } } })
              ?.response?.data?.message ??
              "It may have expired, or the invoice may already be settled. Please contact the firm."}
          </Text>
        </Box>
      </Center>
    );
  }

  const data: PayableInvoice = invoice.data;

  return (
    <Center minH="100vh" px="20px" py="40px">
      <Box
        w="100%"
        maxW={payUrl ? "720px" : "480px"}
        bg="bg"
        border="1px solid"
        borderColor="border"
        borderRadius="14px"
        p="28px"
      >
        <Text fontSize="12px" color="fg.muted" letterSpacing="0.06em">
          INVOICE
        </Text>
        <Text fontSize="22px" fontWeight="700" mt="2px">
          {data.invoiceNumber}
        </Text>
        <Text fontSize="14px" color="fg.muted" mt="4px">
          {data.payerName}
        </Text>

        <Box mt="24px" p="16px" borderRadius="10px" bg="bg.muted">
          {[
            ["Invoice total", formatCurrency(data.total)],
            ...(data.amountPaid > 0
              ? [["Already paid", formatCurrency(data.amountPaid)] as const]
              : []),
            ["Due date", formatDate(data.dueDate)],
          ].map(([label, value]) => (
            <Flex key={label} justify="space-between" py="4px" gap="12px">
              <Text fontSize="13px" color="fg.muted">
                {label}
              </Text>
              <Text fontSize="13px" fontWeight="600">
                {value}
              </Text>
            </Flex>
          ))}
          <Flex
            justify="space-between"
            pt="10px"
            mt="8px"
            gap="12px"
            borderTop="1px solid"
            borderColor="border.muted"
          >
            <Text fontSize="15px" fontWeight="700">
              Amount due
            </Text>
            <Text fontSize="15px" fontWeight="700">
              {formatCurrency(data.balanceDue)}
            </Text>
          </Flex>
        </Box>

        {data.settled ? (
          // The end state, and the reason a settled invoice resolves instead of
          // erroring: the payer needs to be told it worked.
          <Flex
            gap="10px"
            align="center"
            mt="20px"
            p="14px"
            borderRadius="10px"
            border="1px solid"
            borderColor="border"
            bg="bg.muted"
          >
            <Text fontSize="14px" fontWeight="600">
              Paid in full — thank you.
            </Text>
          </Flex>
        ) : payUrl ? (
          <Box mt="20px">
            {/* chakra.iframe, not Box as="iframe": the polymorphic `as` keeps
                the div's prop types, which have no `src`. */}
            <Box
              border="1px solid"
              borderColor="border"
              borderRadius="10px"
              overflow="hidden"
              bg="bg.muted"
              h={{ base: "520px", md: "620px" }}
            >
              <chakra.iframe
                src={payUrl}
                title={`Pay invoice ${data.invoiceNumber}`}
                w="100%"
                h="100%"
                border="none"
              />
            </Box>
            <Text fontSize="12px" color="fg.subtle" mt="10px" textAlign="center">
              This page updates on its own once your payment goes through.
            </Text>
          </Box>
        ) : data.paymentsEnabled ? (
          <Button
            w="100%"
            mt="20px"
            h="44px"
            borderRadius="8px"
            layerStyle="brand-button"
            loading={checkout.isPending}
            onClick={() => checkout.mutate()}
          >
            Pay {formatCurrency(data.balanceDue)}
          </Button>
        ) : (
          <Flex
            gap="10px"
            align="flex-start"
            mt="20px"
            p="14px"
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
            <Text fontSize="13px" color="fg.muted">
              Online payment is not available yet. Please contact the firm to
              arrange payment — this page will show the current balance in the
              meantime.
            </Text>
          </Flex>
        )}
      </Box>
    </Center>
  );
}

export default InvoicePaymentPage;
