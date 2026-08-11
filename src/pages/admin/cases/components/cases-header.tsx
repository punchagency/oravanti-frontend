import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { Download } from "lucide-react";
import { OutlineButton } from "@/components/ui/intake-ui";
import { PageTitle } from "@/components/layout/shared/nav-context";
import { OpenMatterButton } from "./open-matter-dialog";

export function CasesPageHeader() {
  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      gap="24px"
      py="20px"
      pb="20px"
      borderBottom="1px solid"
      borderColor="border.subtle"
    >
      <Box flex="1">
        <PageTitle>
          <Text
            as="h1"
            m="0"
            color="fg"
            fontSize="24px"
            fontWeight="600"
            lineHeight="1.2"
          >
            Cases
          </Text>
        </PageTitle>
        <Text m="8px 0 0" color="fg.muted" fontSize="14px">
          All active and closed matters across your practice areas
        </Text>
      </Box>
      <HStack gap="12px" flexShrink="0">
        <OpenMatterButton />
        <OutlineButton>
          <Download size={16} />
          Export
        </OutlineButton>
      </HStack>
    </Flex>
  );
}
