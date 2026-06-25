import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { Download } from "lucide-react";
import { OutlineButton } from "@/components/ui/intake-ui";
import { caseStatuses } from "../data";
import { OpenMatterButton } from "./open-matter-dialog";

export function CasesPageHeader() {
  return (
    <>
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

      <HStack gap="12px" py="16px" wrap="wrap">
        {caseStatuses.map((status) => (
          <HStack
            key={status.label}
            gap="6px"
            px="12px"
            py="6px"
            border="1px solid"
            borderColor="border.muted"
            borderRadius="full"
            bg="bg"
          >
            <Box
              w="8px"
              h="8px"
              borderRadius="50%"
              bg={`${status.color}.500`}
              flexShrink="0"
            />
            <Text fontSize="13px" color="fg">
              {status.label}{" "}
              <Text as="span" fontWeight="600">
                {status.count}
              </Text>
            </Text>
          </HStack>
        ))}
      </HStack>
    </>
  );
}
