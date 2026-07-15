import { Box, Stack, Text } from "@chakra-ui/react";
import { Workflow } from "lucide-react";

/**
 * Coming soon. The pipeline view was descoped after a client review; the lead
 * table, filters and detail drawer live on in git history and can be restored
 * from the CrmLeadsDataProvider / LeadDrawer components if the decision is
 * revisited.
 */
export function PipelineTab() {
  return (
    <Box
      mt="24px"
      border="1px dashed"
      borderColor="border"
      borderRadius="10px"
      bg="bg.subtle"
      py="56px"
      px="24px"
    >
      <Stack gap="10px" align="center" textAlign="center">
        <Box color="fg.subtle">
          <Workflow size={28} />
        </Box>

        <Text m="0" color="fg" fontSize="15px" fontWeight="500">
          Pipeline — coming soon
        </Text>

        <Text m="0" maxW="440px" color="fg.muted" fontSize="13px">
          The full lead pipeline view is being reworked and will return here.
          Leads continue to move through the intake stages in the Intake
          pipeline section.
        </Text>
      </Stack>
    </Box>
  );
}
