import type { DocumentRequest, DocumentRequestStatus } from "@/api/documents";
import {
  useCancelDocumentRequest,
  useDocumentRequests,
  useReissueDocumentRequest,
} from "@/hooks/use-documents";
import { useConfirmStore } from "@/store/confirm-store";
import { Badge, Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import { Copy, MailCheck, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  const reissue = useReissueDocumentRequest();
  const showConfirm = useConfirmStore((s) => s.showConfirm);
  /**
   * Links minted by a resend in this session, keyed by request. The token is
   * only stored hashed, so this is the one moment the link can be read — it is
   * deliberately not persisted and goes on reload.
   */
  const [issuedLinks, setIssuedLinks] = useState<Record<string, string>>({});

  const open = (data ?? []).filter((request) =>
    OPEN_STATUSES.includes(request.status),
  );

  if (open.length === 0) return null;

  const confirmResend = (request: DocumentRequest) =>
    showConfirm({
      title: "Resend this request?",
      description: `${request.recipientEmail} will get a reminder with a new upload link. The link they already have will stop working — if they are part-way through uploading, they will have to start from the new email.`,
      confirmLabel: "Resend",
      cancelLabel: "Keep as is",
      onConfirm: () =>
        reissue.mutate(request.id, {
          onSuccess: (fresh) =>
            setIssuedLinks((prev) => ({
              ...prev,
              [request.id]: fresh.uploadLink,
            })),
        }),
    });

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
            issuedLink={issuedLinks[request.id] ?? null}
            onResend={() => confirmResend(request)}
            onCancel={() => cancelRequest.mutate(request.id)}
            busy={cancelRequest.isPending || reissue.isPending}
          />
        ))}
      </Flex>
    </Box>
  );
}

function RequestRow({
  request,
  issuedLink,
  onResend,
  onCancel,
  busy,
}: {
  request: DocumentRequest;
  issuedLink: string | null;
  onResend: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const style = statusStyle[request.status];

  const copy = () =>
    issuedLink &&
    navigator.clipboard.writeText(issuedLink).then(
      () => toast.success("Upload link copied"),
      () => toast.error("Couldn't reach the clipboard"),
    );

  return (
    <Box
      borderTop="1px solid"
      borderColor="border.muted"
      pt={2}
      _first={{ borderTop: "none", pt: 0 }}
    >
      <Flex align="center" gap={3} justify="space-between" flexWrap="wrap">
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
            onClick={onResend}
            disabled={busy}
          >
            <Send size={12} />
            Resend
          </Button>
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

      {/* Shown only just after a resend — the link cannot be read back later. */}
      {issuedLink && (
        <HStack
          mt={2}
          gap={2}
          border="1px solid"
          borderColor="border.muted"
          borderRadius="md"
          bg="bg.subtle"
          px={3}
          py={2}
        >
          <Text fontSize="11px" color="fg.muted" truncate flex={1}>
            {issuedLink}
          </Text>
          <Button
            size="xs"
            variant="outline"
            borderColor="border"
            fontSize="12px"
            fontWeight="400"
            onClick={copy}
          >
            <Copy size={12} />
            Copy
          </Button>
        </HStack>
      )}
    </Box>
  );
}
