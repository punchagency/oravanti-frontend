import type { DocumentRequest, DocumentRequestStatus } from "@/api/documents";
import {
  useCancelDocumentRequest,
  useDocumentRequests,
} from "@/hooks/use-documents";
import { Badge, Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import { MailCheck } from "lucide-react";

const statusStyle: Record<
  DocumentRequestStatus,
  { label: string; bg: string; color: string }
> = {
  PENDING: {
    label: "Awaiting upload",
    bg: "yellow.subtle",
    color: "yellow.fg",
  },
  PARTIALLY_SUBMITTED: {
    label: "Partially received",
    bg: "brand.subtle",
    color: "brand.fg",
  },
  SUBMITTED: { label: "Received", bg: "green.subtle", color: "green.fg" },
  EXPIRED: { label: "Expired", bg: "bg.subtle", color: "fg.muted" },
  CANCELLED: { label: "Cancelled", bg: "bg.subtle", color: "fg.muted" },
};

const OPEN_STATUSES: DocumentRequestStatus[] = [
  "PENDING",
  "PARTIALLY_SUBMITTED",
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/**
 * Requests this matter is still waiting on. Settled ones drop off — a closed
 * request is history, and the document itself shows in the table below.
 */
export function PendingRequests({ caseId }: { caseId: string }) {
  const { data } = useDocumentRequests({ caseId });
  const cancelRequest = useCancelDocumentRequest();

  const open = (data ?? []).filter((request) =>
    OPEN_STATUSES.includes(request.status),
  );

  if (open.length === 0) return null;

  return (
    <Box
      border="1px solid"
      borderColor="border.muted"
      borderRadius="lg"
      p={4}
      mb={4}
    >
      <HStack gap={2} mb={3}>
        <Box color="fg.muted">
          <MailCheck size={13} />
        </Box>
        <Text
          fontSize="11px"
          fontWeight="500"
          color="fg"
          letterSpacing="0.44px"
          textTransform="uppercase"
        >
          Requested from client ({open.length})
        </Text>
      </HStack>

      <Flex direction="column" gap={2}>
        {open.map((request) => (
          <RequestRow
            key={request.id}
            request={request}
            onCancel={() => cancelRequest.mutate(request.id)}
            busy={cancelRequest.isPending}
          />
        ))}
      </Flex>
    </Box>
  );
}

function RequestRow({
  request,
  onCancel,
  busy,
}: {
  request: DocumentRequest;
  onCancel: () => void;
  busy: boolean;
}) {
  const style = statusStyle[request.status];

  return (
    <Flex
      align="center"
      gap={3}
      justify="space-between"
      borderTop="1px solid"
      borderColor="border.muted"
      pt={2}
      _first={{ borderTop: "none", pt: 0 }}
      flexWrap="wrap"
    >
      <Box minW={0}>
        <Text fontSize="13px" color="fg" truncate>
          {request.requestedLabel ?? "Document"}
        </Text>
        <Text fontSize="11px" color="fg.muted" truncate>
          {request.recipientEmail} · expires {formatDate(request.expiresAt)}
        </Text>
      </Box>
      <HStack gap={2}>
        <Badge
          size="xs"
          borderRadius="full"
          px={2}
          py={0.5}
          bg={style.bg}
          color={style.color}
          fontWeight="500"
          fontSize="10px"
          textTransform="none"
        >
          {style.label}
        </Badge>
        <Button
          size="xs"
          variant="ghost"
          color="fg.muted"
          fontSize="12px"
          fontWeight="400"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </Button>
      </HStack>
    </Flex>
  );
}
