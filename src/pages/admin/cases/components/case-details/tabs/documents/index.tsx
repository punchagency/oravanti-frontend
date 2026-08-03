import { getCaseById } from "@/api/cases";
import { Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Upload } from "lucide-react";
import { useState } from "react";
import { AlertSection } from "./alert-card";
import { DocumentTable } from "./document-table";
import { PendingRequests } from "./pending-requests";
import { RequestDocumentDialog } from "./request-document-dialog";
import { UploadDocumentDialog } from "./upload-document-dialog";

export function Documents({ caseId }: { caseId: string }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  // Already cached by the case shell; read here only to prefill the recipient.
  const { data: caseRow } = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => getCaseById(caseId),
    enabled: Boolean(caseId),
    staleTime: 60_000,
  });

  return (
    <>
      {/* Header */}
      <Flex
        justify="space-between"
        align="flex-start"
        mb={4}
        gap={4}
        flexWrap="wrap"
      >
        <Box>
          <Text fontSize="16px" fontWeight="500" color="fg" lineHeight="20px">
            Case documents
          </Text>
          <Text fontSize="13px" color="fg.muted" mt={0.5}>
            All files tied to this matter
          </Text>
        </Box>
        <HStack gap={2} flexWrap="wrap">
          <Button
            size="xs"
            variant="outline"
            borderColor="border"
            h="36px"
            fontSize="13px"
            fontWeight="400"
            color="fg.muted"
            px={4}
            onClick={() => setUploadOpen(true)}
          >
            <Upload size={13} />
            Upload document
          </Button>
          <Button
            size="xs"
            bg="brand.solid"
            color="brand.contrast"
            h="36px"
            fontSize="13px"
            fontWeight="500"
            px={4}
            _hover={{ bg: "brand.solid/90" }}
            onClick={() => setRequestOpen(true)}
          >
            <Plus size={13} />
            Request from client
          </Button>
        </HStack>
      </Flex>

      <AlertSection caseId={caseId} />

      <PendingRequests caseId={caseId} />

      <DocumentTable caseId={caseId} />

      <UploadDocumentDialog
        caseId={caseId}
        open={uploadOpen}
        onOpenChange={({ open }) => setUploadOpen(open)}
      />
      <RequestDocumentDialog
        caseId={caseId}
        client={caseRow?.client ?? null}
        open={requestOpen}
        onOpenChange={({ open }) => setRequestOpen(open)}
      />
    </>
  );
}
