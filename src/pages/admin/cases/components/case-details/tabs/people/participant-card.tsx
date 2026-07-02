import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Info, Mail, Phone } from "lucide-react";
import { participants, roleColors } from "./data";

export function ParticipantCard({
  participant,
}: {
  participant: (typeof participants)[number];
}) {
  const rc = roleColors[participant.role] ?? roleColors.Client;

  return (
    <Box
      border="1px solid"
      borderColor="border.muted"
      borderRadius="lg"
      bg="bg"
      p={5}
    >
      <Text
        color="fg.subtle"
        fontSize="11px"
        fontWeight="500"
        letterSpacing="0.44px"
        textTransform="uppercase"
        mb={2.5}
      >
        {participant.section}
      </Text>

      <HStack gap={3} mb={3}>
        <Avatar.Root
          size="sm"
          w="40px"
          h="40px"
          bg="bg.subtle"
          border="1px solid"
          borderColor="border.muted"
        >
          <Avatar.Fallback
            fontSize="13px"
            fontWeight="500"
            color="fg.muted"
          >
            {participant.initials}
          </Avatar.Fallback>
        </Avatar.Root>
        <Box>
          <Text fontSize="15px" fontWeight="500" color="fg" lineHeight="18px">
            {participant.name}
          </Text>
          <Badge
            size="xs"
            borderRadius="full"
            px={2}
            py={0.5}
            bg={rc.bg}
            color={rc.color}
            fontWeight="500"
            fontSize="10px"
            textTransform="none"
            mt={1}
          >
            {participant.role}
          </Badge>
        </Box>
      </HStack>

      {"email" in participant && participant.email && (
        <VStack gap={1} align="start" mb={2.5}>
          <HStack gap={1.5}>
            <Box color="fg.subtle" flexShrink={0}>
              <Mail size={12} />
            </Box>
            <Text fontSize="12px" color="fg.muted" lineHeight="16px">
              {participant.email}
            </Text>
          </HStack>
          <HStack gap={1.5}>
            <Box color="fg.subtle" flexShrink={0}>
              <Phone size={12} />
            </Box>
            <Text fontSize="12px" color="fg.muted" lineHeight="16px">
              {participant.phone}
            </Text>
          </HStack>
        </VStack>
      )}

      {"refNumber" in participant && participant.refNumber && (
        <VStack gap={1} align="start" mb={2.5}>
          <HStack gap={1.5}>
            <Box color="fg.subtle" flexShrink={0}>
              <Info size={11} />
            </Box>
            <Text
              fontSize="11px"
              color="fg.muted"
              fontFamily="mono"
              lineHeight="16px"
            >
              {participant.refNumber}
            </Text>
          </HStack>
          <HStack gap={1.5}>
            <Box color="fg.subtle" flexShrink={0}>
              <Info size={11} />
            </Box>
            <Text fontSize="12px" color="fg.muted" lineHeight="16px">
              {participant.agency}
            </Text>
          </HStack>
        </VStack>
      )}

      {"status" in participant && participant.status && (
        <HStack gap={1.5} mb={3}>
          {participant.status.dot && (
            <Box w="6px" h="6px" borderRadius="full" bg="green.500" />
          )}
          <Text fontSize="12px" color="fg.muted">
            {participant.status.label}
          </Text>
        </HStack>
      )}

      <Box borderTop="1px solid" borderColor="border.muted" />

      <Flex
        gap={2}
        pt={3.5}
        flexWrap="wrap"
        align="center"
      >
        {participant.buttons.map((btn) => (
          <Button
            key={btn.label}
            size="xs"
            variant="outline"
            borderColor="border"
            h="36px"
            fontSize="13px"
            fontWeight="400"
            color="fg.muted"
            px={4}
          >
            <btn.icon size={13} />
            {btn.label}
          </Button>
        ))}
      </Flex>
    </Box>
  );
}
