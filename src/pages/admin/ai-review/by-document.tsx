import type { DocumentFlag } from "@/api/case-review";
import { OutlineButton, StatusPill } from "@/components/ui/intake-ui";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useIssuesByDocument } from "@/hooks/use-case-review";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { Box, HStack, Skeleton, Table, Text } from "@chakra-ui/react";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";
import { matterDocumentsPath } from "./severity";
import {
  ReportRow,
  ReportTable,
  REPORT_CELL_PY,
} from "./components/report-table";

const SOURCE_LABEL: Record<DocumentFlag["source"], string> = {
  client_upload: "Client upload",
  pending_client: "Pending client",
  firm: "Firm",
};

/** In the prototype every flag is a soft pill except "Missing", which is plain. */
function FlagCell({ flag }: { flag: DocumentFlag }) {
  if (flag.issueType === "missing_required_document") {
    return (
      <Text fontSize="12px" fontWeight="600" color="fg">
        {flag.flag}
      </Text>
    );
  }
  return <StatusPill tone="gold">{flag.flag}</StatusPill>;
}

const HEADERS = ["Document", "Type", "Case", "Source", "Date", "AI flag", "Action"];

export function AiReviewByDocumentPage() {
  useDocumentTitle("Document flags");
  const navigate = useNavigate();
  const { currentPage, limit, setPagination } = usePaginationQueryStates();
  const query = useIssuesByDocument({ page: currentPage, limit });

  return (
    <Box pt="24px">
      <Text textStyle="heading">Document flags</Text>
      <Text color="fg.muted" mt="2px" fontSize="14px">
        All documents with AI-detected issues
      </Text>

      <ReportTable mt="24px" headers={HEADERS}>
        {query.isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <ReportRow key={i}>
                {Array.from({ length: 7 }).map((__, j) => (
                  <Table.Cell key={j} py={REPORT_CELL_PY}>
                    <Skeleton h="16px" w="80%" />
                  </Table.Cell>
                ))}
              </ReportRow>
            ))
          : query.data?.data.map((flag, i) => (
              <ReportRow key={flag.documentId ?? `missing-${i}`}>
                <Table.Cell py={REPORT_CELL_PY}>
                  <HStack gap="6px">
                    <Box color="red.500">
                      <AlertTriangle size={14} />
                    </Box>
                    <Text fontWeight="500">{flag.title}</Text>
                  </HStack>
                </Table.Cell>
                <Table.Cell py={REPORT_CELL_PY} color="fg.muted">
                  {flag.type ?? "—"}
                </Table.Cell>
                <Table.Cell py={REPORT_CELL_PY}>
                  <Text fontWeight="500">{flag.matter.name}</Text>
                  {flag.matter.reference && (
                    <Text fontSize="11px" color="fg.muted" fontFamily="mono">
                      {flag.matter.reference}
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell py={REPORT_CELL_PY} color="fg.muted">
                  {SOURCE_LABEL[flag.source]}
                </Table.Cell>
                <Table.Cell py={REPORT_CELL_PY} color="fg.muted">
                  {flag.date ? new Date(flag.date).toLocaleDateString() : "—"}
                </Table.Cell>
                <Table.Cell py={REPORT_CELL_PY}>
                  <FlagCell flag={flag} />
                </Table.Cell>
                <Table.Cell py={REPORT_CELL_PY}>
                  <OutlineButton
                    onClick={() =>
                      navigate(
                        matterDocumentsPath(flag.matter.type, flag.matter.id),
                      )
                    }
                  >
                    View issue
                  </OutlineButton>
                </Table.Cell>
              </ReportRow>
            ))}
      </ReportTable>

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
