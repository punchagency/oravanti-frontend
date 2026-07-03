import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { AlertTriangle } from "lucide-react";
import { alerts } from "./data";

export function AlertSection() {
  return (
    <Box
      bg="bg"
      border="1px solid"
      borderColor="brand.emphasized"
      borderRadius="lg"
      p={5}
      mb={4}
    >
      {/* Section header */}
      <HStack gap={2} mb={3}>
        <Box color="brand.emphasized">
          <AlertTriangle size={12} />
        </Box>
        <Text
          fontSize="11px"
          fontWeight="500"
          color="fg"
          letterSpacing="0.44px"
          textTransform="uppercase"
        >
          AI Case Review
        </Text>
        <Badge
          size="xs"
          borderRadius="full"
          px={2}
          py={0.5}
          bg="brand.subtle"
          color="brand.fg"
          fontWeight="500"
          fontSize="10px"
          textTransform="none"
          ml="auto"
        >
          Issues found
        </Badge>
      </HStack>

      {/* Alert cards */}
      <VStack gap={3}>
        {alerts.map((alert) => (
          <Box
            key={alert.title}
            border="1px solid"
            borderColor="border.muted"
            borderRadius="md"
            bg="bg"
            p={4}
            w="full"
          >
            {/* Alert header */}
            <HStack gap={2} mb={2}>
              <Box w="8px" h="8px" borderRadius="sm" bg={alert.dotColor} />
              <Text fontSize="13px" fontWeight="500" color="fg" flex={1}>
                {alert.title}
              </Text>
              <Badge
                size="xs"
                borderRadius="full"
                px={2}
                py={0.5}
                bg={alert.badge.bg}
                color={alert.badge.color}
                fontWeight="500"
                fontSize="10px"
                textTransform="none"
              >
                {alert.badge.label}
              </Badge>
            </HStack>

            {/* Description */}
            <Text
              fontSize="12px"
              color="fg.muted"
              lineHeight="160%"
              mb={3}
            >
              {alert.description}
            </Text>

            {/* Action buttons */}
            <Flex gap={2} flexWrap="wrap">
              {alert.actions.map((action) => (
                <Button
                  key={action.label}
                  size="xs"
                  variant="outline"
                  borderColor="border"
                  h="36px"
                  fontSize="13px"
                  fontWeight="400"
                  color="fg.muted"
                  px={4}
                >
                  {action.label}
                </Button>
              ))}
            </Flex>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
