import { Stack, Text, VStack } from "@chakra-ui/react";
import { useStaffData } from "../staff-data-context";
import { StaffMobileCard } from "./staff-mobile-card";

export function StaffMobileList() {
  const { filteredStaff } = useStaffData();

  if (filteredStaff.length === 0) {
    return (
      <VStack py={16} gap={2} textAlign="center" display={{ base: "flex", lg: "none" }}>
        <Text color="fg.muted" textStyle="lg" fontWeight="600">
          No staff found
        </Text>
        <Text color="fg.subtle" textStyle="body-sm">
          Try adjusting your filters or search terms.
        </Text>
      </VStack>
    );
  }

  return (
    <Stack gap={4} display={{ base: "flex", lg: "none" }}>
      {filteredStaff.map((staff, index) => (
        <StaffMobileCard key={index} staff={staff} />
      ))}
    </Stack>
  );
}
