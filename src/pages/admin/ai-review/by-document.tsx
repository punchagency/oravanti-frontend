import type { DocumentFlag } from "@/api/case-review";
import {
  OutlineButton,
  StatusPill,
  SurfaceCard,
} from "@/components/ui/intake-ui";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useIssuesByDocument } from "@/hooks/use-case-review";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { Box, HStack, Skeleton, Table, Text } from "@chakra-ui/react";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";
import { badgeTone, matterDocumentsPath } from "./severity";

const SOURCE_LABEL: Record<DocumentFlag["source"], string> = {
  client_upload: "Client upload",
  pending_client: "Pending client",
  firm: "Firm",
};

export function AiReviewByDocumentPage() {
  useDocumentTitle("Document flags");
  const navigate = useNavigate();
  const { currentPage, limit, setPagination } = usePaginationQueryStates();
  const query = useIssuesByDocument({ page: currentPage, limit });

  return (
    <Box p="24px" maxW="1100px" mx="auto">
      <Text textStyle="heading">Document flags</Text>
      <Text color="fg.muted" mt="2px" fontSize="14px">
        All documents with AI-detected issues
      </Text>

      <SurfaceCard>
        <Box overflowX="auto">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Document</Table.ColumnHeader>
                <Table.ColumnHeader>Type</Table.ColumnHeader>
                <Table.ColumnHeader>Case</Table.ColumnHeader>
                <Table.ColumnHeader>Source</Table.ColumnHeader>
                <Table.ColumnHeader>Date</Table.ColumnHeader>
                <Table.ColumnHeader>AI flag</Table.ColumnHeader>
                <Table.ColumnHeader>Action</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {query.isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <Table.Row key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <Table.Cell key={j}>
                          <Skeleton h="16px" w="80%" />
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))
                : query.data?.data.map((flag, i) => (
                    <Table.Row key={flag.documentId ?? `missing-${i}`}>
                      <Table.Cell>
                        <HStack gap="6px">
                          <Box color="red.500">
                            <AlertTriangle size={14} />
                          </Box>
                          <Text fontWeight="500">{flag.title}</Text>
                        </HStack>
                      </Table.Cell>
                      <Table.Cell color="fg.muted">
                        {flag.type ?? "—"}
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontWeight="500">{flag.matter.name}</Text>
                        {flag.matter.reference && (
                          <Text fontSize="11px" color="fg.muted" fontFamily="mono">
                            {flag.matter.reference}
                          </Text>
                        )}
                      </Table.Cell>
                      <Table.Cell color="fg.muted">
                        {SOURCE_LABEL[flag.source]}
                      </Table.Cell>
                      <Table.Cell color="fg.muted">
                        {flag.date
                          ? new Date(flag.date).toLocaleDateString()
                          : "—"}
                      </Table.Cell>
                      <Table.Cell>
                        <StatusPill tone={badgeTone(flag.badge)}>
                          {flag.flag}
                        </StatusPill>
                      </Table.Cell>
                      <Table.Cell>
                        <OutlineButton
                          onClick={() =>
                            navigate(
                              matterDocumentsPath(
                                flag.matter.type,
                                flag.matter.id,
                              ),
                            )
                          }
                        >
                          View issue
                        </OutlineButton>
                      </Table.Cell>
                    </Table.Row>
                  ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </SurfaceCard>

      {query.data && query.data.pagination.total > limit && (
        <Box mt="16px">
          <PaginationControls
            total={query.data.pagination.total}
            currentPage={currentPage}
            limit={limit}
            onPageChange={(page) => setPagination({ currentPage: page })}
            onLimitChange={(l) => setPagination({ limit: l, currentPage: 1 })}
          />
        </Box>
      )}
    </Box>
  );
}
