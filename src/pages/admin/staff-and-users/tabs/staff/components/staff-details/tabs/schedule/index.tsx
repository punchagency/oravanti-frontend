import { useCanManageStaffSchedule } from "@/hooks/use-can-manage-staff-schedule";
import { useStaffSchedule } from "@/hooks/use-staff-schedule";
import { useAuthStore } from "@/store/auth-store";
import { Flex, Skeleton, Text, VStack } from "@chakra-ui/react";
import { BreaksSection } from "./breaks-section";
import { OverridesSection } from "./overrides-section";
import { TimeOffSection } from "./time-off-section";
import { WorkingHoursSection } from "./working-hours-section";

export function ScheduleTab({ staffId }: { staffId: string }) {
  const { data: schedule, isLoading } = useStaffSchedule(staffId);
  const canManage = useCanManageStaffSchedule();
  const firmTimezone = useAuthStore((s) => s.firmTimezone);

  if (isLoading || !schedule) {
    return (
      <VStack gap={3} align="stretch" px={5} pb={5}>
        <Skeleton height="120px" borderRadius="8px" />
        <Skeleton height="60px" borderRadius="8px" />
        <Skeleton height="60px" borderRadius="8px" />
        <Skeleton height="60px" borderRadius="8px" />
      </VStack>
    );
  }

  return (
    <Flex direction="column" gap={5} px={5} pb={5}>
      {firmTimezone && (
        <Text color="fg.muted" fontSize="11px">
          Times are in {firmTimezone}
        </Text>
      )}
      <WorkingHoursSection
        staffId={staffId}
        windows={schedule.windows}
        canManage={canManage}
      />
      <BreaksSection
        staffId={staffId}
        breaks={schedule.breaks}
        canManage={canManage}
      />
      <TimeOffSection
        staffId={staffId}
        timeOff={schedule.timeOff}
        canManage={canManage}
      />
      <OverridesSection
        staffId={staffId}
        overrides={schedule.overrides}
        canManage={canManage}
      />
    </Flex>
  );
}
