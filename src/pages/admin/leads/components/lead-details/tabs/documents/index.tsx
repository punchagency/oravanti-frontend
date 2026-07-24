import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { useLeadQuestionnaireFiles } from "@/hooks/use-lead-workflows";
import { downloadResponseFile } from "@/api/questionnaires";
import { Box, Flex, HStack, IconButton, Table, Text } from "@chakra-ui/react";
import { Download, FileText } from "lucide-react";

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function LeadDocumentsTab({ leadId }: { leadId: string }) {
  const { data: questionnaireFiles, isLoading: isLoadingFiles } =
    useLeadQuestionnaireFiles(leadId);

  const isLoading = isLoadingFiles;

  const allFiles: {
    id: string;
    name: string;
    size: number;
    createdAt: string;
  }[] = [
    ...(questionnaireFiles ?? []).map((f) => ({
      id: f.id,
      name: f.originalFilename,
      size: f.fileSize,
      createdAt: f.createdAt,
    })),
  ];

  return (
    <>
      <Flex justify="space-between" align="flex-start" mb={3} gap={4}>
        <Box>
          <Text fontSize="16px" fontWeight="500" color="fg" textStyle="none">
            Lead documents
          </Text>
          <Text fontSize="13px" color="fg.muted" mt={0.5}>
            All files collected during intake and linked to this lead
          </Text>
        </Box>
      </Flex>

      {isLoading ? (
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="8px"
          overflow="hidden"
        >
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row bg="bg.subtle">
                <Table.ColumnHeader px={3} py={2} w="40%">
                  <ThemeSkeleton h="10px" w="60px" borderRadius="4px" />
                </Table.ColumnHeader>
                <Table.ColumnHeader px={3} py={2} w="120px">
                  <ThemeSkeleton h="10px" w="55px" borderRadius="4px" />
                </Table.ColumnHeader>
                <Table.ColumnHeader px={3} py={2} w="100px">
                  <ThemeSkeleton h="10px" w="35px" borderRadius="4px" />
                </Table.ColumnHeader>
                <Table.ColumnHeader px={3} py={2} w="120px">
                  <ThemeSkeleton h="10px" w="45px" borderRadius="4px" />
                </Table.ColumnHeader>
                <Table.ColumnHeader px={3} py={2} w="80px">
                  <ThemeSkeleton h="10px" w="40px" borderRadius="4px" />
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {Array.from({ length: 3 }, (_, i) => (
                <Table.Row key={i}>
                  <Table.Cell px={3} py={2.5}>
                    <HStack gap={2}>
                      <ThemeSkeleton h="14px" w="14px" borderRadius="4px" />
                      <ThemeSkeleton
                        h="12px"
                        w={`${120 + i * 15}px`}
                        borderRadius="4px"
                      />
                    </HStack>
                  </Table.Cell>
                  <Table.Cell px={3} py={2.5}>
                    <ThemeSkeleton h="16px" w="70px" borderRadius="full" />
                  </Table.Cell>
                  <Table.Cell px={3} py={2.5}>
                    <ThemeSkeleton h="11px" w="40px" borderRadius="4px" />
                  </Table.Cell>
                  <Table.Cell px={3} py={2.5}>
                    <ThemeSkeleton h="11px" w="50px" borderRadius="4px" />
                  </Table.Cell>
                  <Table.Cell px={3} py={2.5}>
                    <ThemeSkeleton h="16px" w="16px" borderRadius="4px" />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      ) : allFiles.length === 0 ? (
        <Box
          border="1px dashed"
          borderColor="border.muted"
          borderRadius="lg"
          p={8}
          textAlign="center"
        >
          <Text fontSize="13px" color="fg.muted">
            No documents collected yet.
          </Text>
        </Box>
      ) : (
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="8px"
          overflow="hidden"
        >
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row bg="bg.subtle">
                <Table.ColumnHeader
                  px={3}
                  py={2}
                  fontSize="10px"
                  textTransform="uppercase"
                  color="fg.muted"
                  fontWeight="500"
                >
                  Document
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  px={3}
                  py={2}
                  fontSize="10px"
                  textTransform="uppercase"
                  color="fg.muted"
                  fontWeight="500"
                  w="100px"
                >
                  Size
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  px={3}
                  py={2}
                  fontSize="10px"
                  textTransform="uppercase"
                  color="fg.muted"
                  fontWeight="500"
                  w="120px"
                >
                  Date
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  px={3}
                  py={2}
                  fontSize="10px"
                  textTransform="uppercase"
                  color="fg.muted"
                  fontWeight="500"
                  w="80px"
                >
                  Actions
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {allFiles.map((file) => (
                <Table.Row key={file.id}>
                  <Table.Cell px={3} py={2.5}>
                    <HStack gap={2}>
                      <Box color="fg.muted">
                        <FileText size={14} />
                      </Box>
                      <Text
                        fontSize="12px"
                        color="fg"
                        fontWeight="500"
                        truncate
                        maxW="200px"
                      >
                        {file.name}
                      </Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell px={3} py={2.5}>
                    <Text fontSize="11px" color="fg.muted">
                      {formatBytes(file.size)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell px={3} py={2.5}>
                    <Text fontSize="11px" color="fg.muted">
                      {new Date(file.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </Table.Cell>
                  <Table.Cell px={3} py={2.5}>
                    <IconButton
                      variant="ghost"
                      size="xs"
                      color="fg.muted"
                      aria-label="Download"
                      onClick={() => downloadResponseFile(file.id, file.name)}
                    >
                      <Download size={14} />
                    </IconButton>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </>
  );
}
