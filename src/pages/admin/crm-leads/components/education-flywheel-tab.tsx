import { Box, Stack, Text } from "@chakra-ui/react";
import { GraduationCap } from "lucide-react";

/**
 * Coming soon. The backend has no education-flywheel concept beyond
 * `source: "education_flywheel"` — no tiers, no content attribution, no
 * nurture tracking — so there is nothing real to render here. The previous
 * version showed a tier breakdown with hardcoded "—" counts, which implied a
 * feature that does not exist.
 */
export function EducationFlywheelTab() {
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
          <GraduationCap size={28} />
        </Box>

        <Text m="0" color="fg" fontSize="15px" fontWeight="500">
          Education flywheel — coming soon
        </Text>

        <Text m="0" maxW="440px" color="fg.muted" fontSize="13px">
          Content tiers, attribution and nurture tracking for education-sourced
          leads will appear here once the flywheel is configured. Leads from this
          source are already captured and move through the Intake pipeline.
        </Text>
      </Stack>
    </Box>
  );
}
