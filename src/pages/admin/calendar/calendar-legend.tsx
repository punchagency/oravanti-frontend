import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { CALENDAR_FILTER_TYPES, EVENT_TYPE_CONFIG } from "./types";

export function CalendarLegend() {
  return (
    <Flex align="center" wrap="wrap" gap="4" py="4">
      {CALENDAR_FILTER_TYPES.map((type) => {
        const config = EVENT_TYPE_CONFIG[type];
        return (
          <HStack key={type} gap="8px">
            <Box
              w="10px"
              h="10px"
              borderRadius="5px"
              bg={config.color}
              flexShrink="0"
            />
            <Text fontSize="12px" color="fg.muted" whiteSpace="nowrap">
              {config.label}
            </Text>
          </HStack>
        );
      })}
    </Flex>
  );
}
