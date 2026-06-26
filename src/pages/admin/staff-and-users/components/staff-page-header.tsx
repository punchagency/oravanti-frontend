import { Box, Text } from "@chakra-ui/react";

export function StaffPageHeader() {
  return (
    <Box py="28px" pb="16px">
      <Text
        as="h1"
        m="0"
        color="fg"
        fontSize="22px"
        fontWeight="500"
        lineHeight="1.2"
      >
        Staff Management
      </Text>
      <Text m="6px 0 0" color="fg.muted" fontSize="13px">
        Manage firm staff, teams, certifications, and leave
      </Text>
    </Box>
  );
}
