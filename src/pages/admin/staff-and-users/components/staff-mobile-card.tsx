import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Progress,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  getProgressColor,
  getStatusBadgeStyles,
  getStatusLabel,
  type StaffMember,
} from "../data";
import { StaffDetailsDrawer } from "./staff-details-drawer";

interface StaffMobileCardProps {
  staff: StaffMember;
}

export function StaffMobileCard({ staff }: StaffMobileCardProps) {
  return (
    <Box
      p={4}
      border="1px solid"
      borderColor="border"
      borderRadius="lg"
      bg="bg"
      _hover={{ borderColor: "brand.solid" }}
      transition="border-color 0.2s"
    >
      <Flex justify="space-between" align="flex-start" mb={3}>
        <HStack gap={3} minW={0}>
          <Avatar.Root size="sm" flexShrink={0}>
            <Avatar.Fallback
              name={staff.name}
              bg="bg.muted"
              color="fg"
            />
          </Avatar.Root>
          <Box minW={0}>
            <Text fontWeight="600" color="fg" truncate>
              {staff.name}
            </Text>
            <Text textStyle="body-sm" color="fg.muted" truncate>
              {staff.email}
            </Text>
          </Box>
        </HStack>
        <Badge
          px={2.5}
          py={0.5}
          borderRadius="full"
          textTransform="none"
          style={getStatusBadgeStyles(staff.status)}
          flexShrink={0}
        >
          {getStatusLabel(staff.status)}
        </Badge>
      </Flex>

      <Stack
        gap={2}
        textStyle="body-sm"
        pt={2}
        borderTop="1px solid"
        borderColor="border.muted"
      >
        <Flex justify="space-between" align="center">
          <Text color="fg.subtle">Role:</Text>
          <Text color="fg" fontWeight="500">
            {staff.role}
          </Text>
        </Flex>
        <Flex justify="space-between" align="center">
          <Text color="fg.subtle">Team:</Text>
          <Text color={staff.team ? "fg" : "fg.subtle"} textAlign="right">
            {staff.team || "None"}
          </Text>
        </Flex>
        <Flex justify="space-between" align="center">
          <Text color="fg.subtle" flexShrink={0}>
            Practice Areas:
          </Text>
          {staff.practiceAreas.length === 0 ? (
            <Text color="fg.subtle">None</Text>
          ) : (
          <HStack gap={1} wrap="wrap" justify="flex-end">
            {staff.practiceAreas.map((area, idx) => (
              <Badge
                key={idx}
                size="sm"
                variant="subtle"
                textTransform="none"
              >
                {area}
              </Badge>
            ))}
          </HStack>
          )}
        </Flex>
        <Box pt={1}>
          <Flex justify="space-between" mb={1}>
            <Text color="fg.subtle">Caseload Capacity:</Text>
            <Text fontWeight="bold" color="fg">
              {staff.caseloadCurrent} / {staff.caseloadMax}
            </Text>
          </Flex>
          <Progress.Root
            value={
              (staff.caseloadCurrent / staff.caseloadMax) * 100 || 0
            }
            size="xs"
          >
            <Progress.Track bg="border.muted">
              <Progress.Range
                bg={getProgressColor(
                  staff.caseloadCurrent,
                  staff.caseloadMax,
                )}
              />
            </Progress.Track>
          </Progress.Root>
        </Box>
      </Stack>

      {staff.status === "pending_invitation" ? (
        <Button
          variant="outline"
          size="sm"
          w="full"
          mt={4}
          borderColor="border"
          _hover={{ bg: "bg.muted" }}
        >
          Resend Invitation
        </Button>
      ) : (
        <StaffDetailsDrawer staff={staff}>
          <Button
            variant="outline"
            size="sm"
            w="full"
            mt={4}
            borderColor="border"
            _hover={{ bg: "bg.muted" }}
          >
            View Details
          </Button>
        </StaffDetailsDrawer>
      )}
    </Box>
  );
}
