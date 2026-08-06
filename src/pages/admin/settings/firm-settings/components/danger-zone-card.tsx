import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DangerZoneCard() {
  function handleExport() {
    toast.info("Feature coming soon", {
      description: "Firm data export is not yet available.",
    });
  }

  function handleDelete() {
    toast.info("Feature coming soon", {
      description: "Firm account deletion is not yet available.",
    });
  }

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      overflow="hidden"
    >
      <Flex
        align="flex-start"
        justify="space-between"
        gap="4"
        p="20px"
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Box>
          <Text fontSize="16px" fontWeight="600" color="fg.error">
            Danger zone
          </Text>
        </Box>
      </Flex>

      <Box p="20px" display="flex" flexDirection="column" gap="3">
        <Button
          variant="outline"
          borderColor="border"
          bg="bg"
          color="fg"
          h="40px"
          fontSize="13px"
          fontWeight="500"
          justifyContent="center"
          gap="2"
          onClick={handleExport}
          loading={false}
          _hover={{ bg: "bg.hover" }}
        >
          <Download size={15} />
          Export all firm data
        </Button>
        <Button
          variant="outline"
          borderColor="fg.error"
          bg="bg"
          color="fg.error"
          h="40px"
          fontSize="13px"
          fontWeight="500"
          justifyContent="center"
          gap="2"
          onClick={handleDelete}
          loading={false}
          _hover={{ bg: "rgba(176, 0, 32, 0.08)" }}
        >
          <Trash2 size={15} />
          Delete firm account
        </Button>
      </Box>
    </Box>
  );
}
