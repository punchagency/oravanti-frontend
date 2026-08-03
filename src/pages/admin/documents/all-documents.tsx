import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import {
  REPORT_CELL_PY,
  ReportRow,
  ReportTable,
} from "@/components/ui/report-table";
import { StatTile } from "@/components/ui/stat-tile";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Box, chakra, Flex, Grid, HStack, Table, Text } from "@chakra-ui/react";
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  Files,
  Package,
  Plus,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  DocumentRowActions,
  MatterCell,
  ReviewCell,
} from "./components/document-cells";
import {
  DocumentsFilters,
  type DocumentFilters,
} from "./components/documents-filters";
import {
  documentStats,
  flaggedDocuments,
  formatDocumentDate,
  recentDocuments,
  type FirmDocument,
} from "./data";

const HEADERS = [
  "Document",
  "Type",
  "Case",
  "Uploaded by",
  "Date",
  "AI review",
  "Actions",
];

const RECENT_PAGE_SIZE = 8;

const NO_FILTERS: DocumentFilters = {
  search: "",
  matter: "",
  type: "",
  status: "",
  staff: "",
};

function matches(doc: FirmDocument, filters: DocumentFilters) {
  const term = filters.search.trim().toLowerCase();
  if (
    term &&
    ![doc.title, doc.type, doc.matter.client, doc.matter.reference].some(
      (field) => field.toLowerCase().includes(term),
    )
  ) {
    return false;
  }
  if (filters.matter && doc.matter.reference !== filters.matter) return false;
  if (filters.type && doc.type !== filters.type) return false;
  if (filters.status && doc.review !== filters.status) return false;
  if (filters.staff && doc.owner !== filters.staff) return false;
  return true;
}

/** A full-width shaded divider that labels a group of rows and collapses it. */
function GroupRow({
  label,
  count,
  open,
  onToggle,
}: {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Table.Row bg="bg.muted" _hover={{ bg: "bg.subtle" }}>
      <Table.Cell colSpan={HEADERS.length} py="10px">
        <chakra.button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          display="flex"
          alignItems="center"
          gap="6px"
          w="full"
          textAlign="left"
          cursor="pointer"
        >
          <Box
            color="fg.muted"
            display="flex"
            transform={open ? undefined : "rotate(-90deg)"}
            transition="transform 150ms"
          >
            <ChevronDown size={14} />
          </Box>
          <Text
            fontSize="10px"
            fontWeight="600"
            letterSpacing="0.06em"
            color="fg.muted"
          >
            {label.toUpperCase()} ({count})
          </Text>
        </chakra.button>
      </Table.Cell>
    </Table.Row>
  );
}

function DocumentRow({ doc }: { doc: FirmDocument }) {
  return (
    <ReportRow>
      <Table.Cell py={REPORT_CELL_PY}>
        <HStack gap="8px">
          {doc.flagged && (
            <Box color="red.500" flexShrink={0}>
              <AlertTriangle size={14} />
            </Box>
          )}
          <Text fontWeight="500" fontSize="13px">
            {doc.title}
          </Text>
        </HStack>
      </Table.Cell>
      <Table.Cell py={REPORT_CELL_PY} color="fg.muted" fontSize="13px">
        {doc.type}
      </Table.Cell>
      <Table.Cell py={REPORT_CELL_PY}>
        <MatterCell matter={doc.matter} />
      </Table.Cell>
      <Table.Cell py={REPORT_CELL_PY} color="fg.muted" fontSize="13px">
        {doc.source}
      </Table.Cell>
      <Table.Cell py={REPORT_CELL_PY} color="fg.muted" fontSize="13px">
        {formatDocumentDate(doc.date)}
      </Table.Cell>
      <Table.Cell py={REPORT_CELL_PY}>
        <ReviewCell review={doc.review} />
      </Table.Cell>
      <Table.Cell py={REPORT_CELL_PY}>
        <DocumentRowActions review={doc.review} flagged={doc.flagged} />
      </Table.Cell>
    </ReportRow>
  );
}

export function AllDocumentsPage() {
  useDocumentTitle("Documents");
  const [filters, setFilters] = useState<DocumentFilters>(NO_FILTERS);
  const [visibleRecent, setVisibleRecent] = useState(RECENT_PAGE_SIZE);
  const [openGroups, setOpenGroups] = useState({ flagged: true, recent: true });

  const toggleGroup = (group: "flagged" | "recent") =>
    setOpenGroups((groups) => ({ ...groups, [group]: !groups[group] }));

  const flagged = useMemo(
    () => flaggedDocuments.filter((doc) => matches(doc, filters)),
    [filters],
  );
  const recent = useMemo(
    () => recentDocuments.filter((doc) => matches(doc, filters)),
    [filters],
  );

  const shownRecent = recent.slice(0, visibleRecent);
  const isEmpty = flagged.length === 0 && recent.length === 0;

  const handleFilterChange = (next: DocumentFilters) => {
    setFilters(next);
    setVisibleRecent(RECENT_PAGE_SIZE);
  };

  return (
    <Box pt="24px" pb="56px">
      <Flex
        justifyContent="space-between"
        alignItems="flex-start"
        gap="16px"
        flexWrap="wrap"
      >
        <Box>
          <Text textStyle="heading">Documents</Text>
          <Text color="fg.muted" mt="2px" fontSize="14px">
            All case documents, filings, and firm-generated content
          </Text>
        </Box>
        <HStack gap="8px">
          <OutlineButton>
            <HStack gap="6px">
              <Upload size={14} />
              <Text>Bulk upload</Text>
            </HStack>
          </OutlineButton>
          <BrandButton>
            <HStack gap="6px">
              <Plus size={14} />
              <Text>Create document</Text>
            </HStack>
          </BrandButton>
        </HStack>
      </Flex>

      <Grid
        mt="20px"
        templateColumns={{ base: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }}
        gap="16px"
      >
        <StatTile
          label="Total documents"
          value={documentStats.total}
          caption={`Across ${documentStats.totalMatters} matters`}
          tone="info"
          icon={<Files size={16} />}
        />
        <StatTile
          label="Pending upload"
          value={documentStats.pendingUpload}
          caption="Awaiting client"
          tone="warning"
          mutedValue
          icon={<Clock size={16} />}
        />
        <StatTile
          label="AI flags"
          value={documentStats.aiFlags}
          caption="Require attention"
          tone="critical"
          icon={<AlertTriangle size={16} />}
        />
        <StatTile
          label="Interview packages"
          value={documentStats.interviewPackages}
          caption="Ready to transmit"
          tone="success"
          icon={<Package size={16} />}
        />
      </Grid>

      <Box mt="20px">
        <DocumentsFilters filters={filters} onChange={handleFilterChange} />
      </Box>

      <ReportTable mt="16px" headers={HEADERS}>
        {isEmpty ? (
          <Table.Row>
            <Table.Cell colSpan={HEADERS.length} py="40px" textAlign="center">
              <Text fontWeight="600" color="fg">
                No documents match these filters
              </Text>
              <Text fontSize="13px" color="fg.muted" mt="2px">
                Try a different search term or clear a filter.
              </Text>
            </Table.Cell>
          </Table.Row>
        ) : (
          <>
            {flagged.length > 0 && (
              <>
                <GroupRow
                  label="Flagged by AI"
                  count={flagged.length}
                  open={openGroups.flagged}
                  onToggle={() => toggleGroup("flagged")}
                />
                {openGroups.flagged &&
                  flagged.map((doc) => <DocumentRow key={doc.id} doc={doc} />)}
              </>
            )}
            {recent.length > 0 && (
              <>
                <GroupRow
                  label="Recent uploads"
                  count={recent.length}
                  open={openGroups.recent}
                  onToggle={() => toggleGroup("recent")}
                />
                {openGroups.recent &&
                  shownRecent.map((doc) => (
                    <DocumentRow key={doc.id} doc={doc} />
                  ))}
              </>
            )}
          </>
        )}
      </ReportTable>

      {recent.length > 0 && openGroups.recent && (
        <Flex
          mt="16px"
          justifyContent="space-between"
          alignItems="center"
          gap="16px"
          flexWrap="wrap"
        >
          <Text fontSize="13px" color="fg.muted">
            Showing {shownRecent.length} of {recent.length} recent uploads
          </Text>
          {shownRecent.length < recent.length && (
            <OutlineButton
              onClick={() =>
                setVisibleRecent((count) => count + RECENT_PAGE_SIZE)
              }
            >
              Load more
            </OutlineButton>
          )}
        </Flex>
      )}
    </Box>
  );
}
