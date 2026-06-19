import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { Download, UserPlus } from "lucide-react";
import { InviteStaffDialog } from "../invite-dialog";

export function StaffPageHeader() {
  return (
    <Flex
      as="header"
      direction={{ base: "column", md: "row" }}
      align={{ base: "stretch", md: "flex-start" }}
      justify="space-between"
      gap="16px"
      py="28px"
      pb="16px"
    >
      <Box>
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
      <HStack gap="8px" w={{ base: "full", md: "auto" }}>
        <OutlineButton flex={{ base: 1, md: "initial" }}>
          <Download size={14} />
          Export
        </OutlineButton>
        <InviteStaffDialog>
          <BrandButton flex={{ base: 1, md: "initial" }}>
            <UserPlus size={15} />
            Invite staff
          </BrandButton>
        </InviteStaffDialog>
      </HStack>
    </Flex>
  );
}
