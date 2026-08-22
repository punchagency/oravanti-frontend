import type { CaseDocument } from "@/api/workflows";
import { useCanDownloadDocuments } from "@/hooks/use-can-download-documents";
import { useCaseDocuments } from "@/hooks/use-workflows";
import {
  Badge,
  Box,
  HStack,
  IconButton,
  ScrollArea,
  Table,
  Text,
} from "@chakra-ui/react";
import { Download, Eye, FileText } from "lucide-react";
import { ThemeSkeleton } from "../../../../../../../components/ui/theme-skeleton";

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function categoryColor(category: string | null): { bg: string; color: string } {
  switch (category) {
    case "application":
      return { bg: "brand.subtle", color: "brand.contrast" };
    case "supporting":
      return { bg: "green.subtle", color: "green.fg" };
    case "identity":
      return { bg: "purple.subtle", color: "purple.fg" };
    case "uscis_response":
      return { bg: "orange.subtle", color: "orange.fg" };
    default:
      return { bg: "bg.subtle", color: "fg.muted" };
  }
}

function scanStatusBadge(
  status: string | null,
): { label: string; bg: string; color: string } | null {
  if (!status) return null;
  switch (status) {
    case "CLEAN":
      return { label: "Verified", bg: "green.subtle", color: "green.fg" };
    case "PENDING":
      return { label: "Pending scan", bg: "yellow.subtle", color: "yellow.fg" };
    case "INFECTED":
      return { label: "Threat detected", bg: "red.subtle", color: "red.fg" };
    case "FAILED":
      return { label: "Scan failed", bg: "red.subtle", color: "red.fg" };
    // SKIPPED and anything unrecognised carry no claim worth a badge.
    default:
      return null;
  }
}

/**
 * Category labels come from a DB enum, so render them as words rather than as
 * the raw `uscis_response`.
 */
function categoryLabel(category: string | null): string {
  if (!category) return "—";
  const spaced = category.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function DocumentTable({ caseId }: { caseId: string }) {
  const { data: response, isLoading } = useCaseDocuments(caseId);
  const documents = response?.data ?? [];

  if (isLoading) {
    return (
      <Box
        border="1px solid"
        borderColor="border.muted"
        borderRadius="lg"
        overflow="hidden"
      >
        <Table.Root size="sm" variant="line">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              <Table.ColumnHeader py={2.5} px={4}>
                <ThemeSkeleton h="10px" w="60px" borderRadius="4px" />
              </Table.ColumnHeader>
              <Table.ColumnHeader py={2.5} px={4}>
                <ThemeSkeleton h="10px" w="55px" borderRadius="4px" />
              </Table.ColumnHeader>
              <Table.ColumnHeader py={2.5} px={4}>
                <ThemeSkeleton h="10px" w="35px" borderRadius="4px" />
              </Table.ColumnHeader>
              <Table.ColumnHeader py={2.5} px={4}>
                <ThemeSkeleton h="10px" w="45px" borderRadius="4px" />
              </Table.ColumnHeader>
              <Table.ColumnHeader py={2.5} px={4}>
                <ThemeSkeleton h="10px" w="50px" borderRadius="4px" />
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {Array.from({ length: 4 }, (_, i) => (
              <Table.Row key={i}>
                <Table.Cell py={3.5} px={4}>
                  <HStack gap={2}>
                    <ThemeSkeleton h="16px" w="16px" borderRadius="4px" />
                    <Box>
                      <ThemeSkeleton
                        h="12px"
                        w={`${120 + i * 15}px`}
                        borderRadius="4px"
                        mb={1}
                      />
                      <ThemeSkeleton
                        h="9px"
                        w={`${90 + i * 10}px`}
                        borderRadius="4px"
                      />
                    </Box>
                  </HStack>
                </Table.Cell>
                <Table.Cell py={3.5} px={4}>
                  <ThemeSkeleton h="16px" w="55px" borderRadius="full" />
                </Table.Cell>
                <Table.Cell py={3.5} px={4}>
                  <ThemeSkeleton h="11px" w="40px" borderRadius="4px" />
                </Table.Cell>
                <Table.Cell py={3.5} px={4}>
                  <ThemeSkeleton h="11px" w="50px" borderRadius="4px" />
                </Table.Cell>
                <Table.Cell py={3.5} px={4}>
                  <ThemeSkeleton h="11px" w="40px" borderRadius="4px" />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    );
  }

  if (documents.length === 0) {
    return (
      <Box
        border="1px dashed"
        borderColor="border.muted"
        borderRadius="lg"
        p={8}
        textAlign="center"
      >
        <Text fontSize="13px" color="fg.muted">
          No documents uploaded yet.
        </Text>
      </Box>
    );
  }

  return (
    <Box
      border="1px solid"
      borderColor="border.muted"
      borderRadius="lg"
      overflow="hidden"
    >
      <ScrollArea.Root w="full" size="xs">
        <ScrollArea.Viewport>
          <ScrollArea.Content>
            <Table.Root size="sm" variant="line">
              <Table.Header>
                <Table.Row bg="bg.subtle">
                  <Table.ColumnHeader
                    textTransform="uppercase"
                    fontSize="11px"
                    fontWeight="500"
                    color="fg.subtle"
                    letterSpacing="0.44px"
                    py={2.5}
                    px={4}
                  >
                    Document
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    textTransform="uppercase"
                    fontSize="11px"
                    fontWeight="500"
                    color="fg.subtle"
                    letterSpacing="0.44px"
                    py={2.5}
                    px={4}
                  >
                    Category
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    textTransform="uppercase"
                    fontSize="11px"
                    fontWeight="500"
                    color="fg.subtle"
                    letterSpacing="0.44px"
                    py={2.5}
                    px={4}
                  >
                    Size
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    textTransform="uppercase"
                    fontSize="11px"
                    fontWeight="500"
                    color="fg.subtle"
                    letterSpacing="0.44px"
                    py={2.5}
                    px={4}
                  >
                    Scan Status
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    textTransform="uppercase"
                    fontSize="11px"
                    fontWeight="500"
                    color="fg.subtle"
                    letterSpacing="0.44px"
                    py={2.5}
                    px={4}
                  >
                    Uploaded
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    textTransform="uppercase"
                    fontSize="11px"
                    fontWeight="500"
                    color="fg.subtle"
                    letterSpacing="0.44px"
                    py={2.5}
                    px={4}
                  >
                    Actions
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {documents.map((doc) => (
                  <DocumentRow key={doc.id} doc={doc} />
                ))}
              </Table.Body>
            </Table.Root>
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="horizontal" />
        <ScrollArea.Corner />
      </ScrollArea.Root>
    </Box>
  );
}

function DocumentRow({ doc }: { doc: CaseDocument }) {
  const cat = categoryColor(doc.category);
  const scan = scanStatusBadge(doc.currentVersion?.virusScanStatus ?? null);
  const canDownload = useCanDownloadDocuments();
  // The list endpoint already signs each current version, so viewing and
  // downloading need no extra round trip.
  const fileUrl = doc.currentVersion?.fileUrl ?? null;

  const download = () => {
    if (!fileUrl) return;
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = doc.currentVersion?.originalFileName ?? doc.title;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Table.Row>
      <Table.Cell px={4} py={3.5}>
        <HStack gap={2}>
          <Box color="fg.muted">
            <FileText size={16} />
          </Box>
          <Box minW={0}>
            <Text fontSize="13px" color="fg" fontWeight="400" truncate>
              {doc.title}
            </Text>
            {doc.currentVersion?.originalFileName && (
              <Text fontSize="10px" color="fg.muted" truncate>
                {doc.currentVersion.originalFileName}
              </Text>
            )}
          </Box>
        </HStack>
      </Table.Cell>
      <Table.Cell px={4} py={3.5}>
        <Box
          fontSize="10px"
          fontWeight="500"
          color={cat.color}
          bg={cat.bg}
          borderRadius="full"
          px={2}
          py={0.5}
          display="inline-block"
        >
          {categoryLabel(doc.category)}
        </Box>
      </Table.Cell>
      <Table.Cell px={4} py={3.5}>
        <Text fontSize="13px" color="fg.muted">
          {formatBytes(doc.currentVersion?.fileSize ?? null)}
        </Text>
      </Table.Cell>
      <Table.Cell px={4} py={3.5}>
        {scan ? (
          <Badge
            size="xs"
            borderRadius="full"
            px={2}
            py={0.5}
            bg={scan.bg}
            color={scan.color}
            fontWeight="500"
            fontSize="10px"
            textTransform="none"
          >
            {scan.label}
          </Badge>
        ) : (
          <Text fontSize="13px" color="fg.muted">
            —
          </Text>
        )}
      </Table.Cell>
      <Table.Cell px={4} py={3.5}>
        <Text fontSize="13px" color="fg.muted">
          {new Date(doc.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
      </Table.Cell>
      <Table.Cell px={4} py={2.5}>
        <HStack gap={1}>
          {canDownload && (
            <IconButton
              variant="ghost"
              size="xs"
              color="fg.muted"
              aria-label={`Download ${doc.title}`}
              disabled={!fileUrl}
              onClick={download}
            >
              <Download size={14} />
            </IconButton>
          )}
          <IconButton
            variant="ghost"
            size="xs"
            color="fg.muted"
            aria-label={`View ${doc.title}`}
            disabled={!fileUrl}
            onClick={() =>
              fileUrl && window.open(fileUrl, "_blank", "noopener,noreferrer")
            }
          >
            <Eye size={14} />
          </IconButton>
        </HStack>
      </Table.Cell>
    </Table.Row>
  );
}
