import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
} from "@chakra-ui/react";
import { Plus, Upload } from "lucide-react";
import { AlertSection } from "./alert-card";
import { DocumentTable } from "./document-table";

export function Documents() {
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
          >
            <Plus size={13} />
            Request from client
          </Button>
        </HStack>
      </Flex>

      <AlertSection />

      <DocumentTable />
    </>
  );
}
