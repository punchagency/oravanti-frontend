import {
  getPayableInvoice,
  startInvoiceCheckout,
  type PayableInvoice,
} from "@/api/invoice-payment";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { Box, Button, Center, Flex, Spinner, Text } from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info } from "lucide-react";
import { useParams } from "react-router";
import { toast } from "sonner";

/**
 * The client-facing invoice payment page.
 *
 * Public and token-gated, like the consultation booking and document upload
 * pages — no auth, the token in the URL is the credential.
 *
 * **No payment provider is wired yet**, and this page says so rather than
 * showing a button that cannot work. That is a deliberate departure from the
 * consultation booking page, whose "pay" button is a dummy that marks the fee
 * settled: this invoice is on the finance ledger, and a payment recorded here
 * against money that never moved would make the firm's accounts wrong, not just
 * their UI optimistic.
 */
export function InvoicePaymentPage() {
  useDocumentTitle("Pay invoice - Oravanti");
  const { token } = useParams<{ token: string }>();

  const invoice = useQuery({
    queryKey: ["invoice-payment", token],
    queryFn: () => getPayableInvoice(token!),
    enabled: Boolean(token),
    retry: false,
  });

  const checkout = useMutation({
    mutationFn: () => startInvoiceCheckout(token!),
    onSuccess: (session) => {
      window.location.href = session.url;
    },
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
        maxW="480px"
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

        {data.paymentsEnabled ? (
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
