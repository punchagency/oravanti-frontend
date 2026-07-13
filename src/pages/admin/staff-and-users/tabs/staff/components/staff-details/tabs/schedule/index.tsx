import { useCanManageStaffSchedule } from "@/hooks/use-can-manage-staff-schedule";
import { useStaffSchedule } from "@/hooks/use-staff-schedule";
import { useAuthStore } from "@/store/auth-store";
import { Flex, Skeleton, Tabs, Text, VStack } from "@chakra-ui/react";
import { BreaksSection } from "./breaks-section";
import { OverridesSection } from "./overrides-section";
import { TimeOffSection } from "./time-off-section";
import { WorkingHoursSection } from "./working-hours-section";

const SECTION_TABS = [
  { value: "hours", label: "Working hours" },
  { value: "breaks", label: "Breaks" },
  { value: "time-off", label: "Time off" },
  { value: "overrides", label: "Overrides" },
];

export function ScheduleTab({ staffId }: { staffId: string }) {
  const { data: schedule, isLoading } = useStaffSchedule(staffId);
  const canManage = useCanManageStaffSchedule();
  const firmTimezone = useAuthStore((s) => s.firmTimezone);

  if (isLoading || !schedule) {
    return (
      <VStack gap={3} align="stretch" px={5} pb={5}>
        <Skeleton height="28px" borderRadius="8px" />
        <Skeleton height="140px" borderRadius="8px" />
      </VStack>
    );
  }

  return (
    <Flex direction="column" gap={2} px={5} pb={5}>
      {firmTimezone && (
        <Text color="fg.muted" fontSize="11px">
          Times are in {firmTimezone}
        </Text>
      )}
      <Tabs.Root defaultValue="hours" size="sm" variant="enclosed">
        <Tabs.List>
          {SECTION_TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              px={2.5}
              fontSize="11px"
              color="fg.muted"
              _selected={{ color: "fg", fontWeight: "500" }}
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="hours" pt={3}>
          <WorkingHoursSection
            staffId={staffId}
            windows={schedule.windows}
            canManage={canManage}
          />
        </Tabs.Content>

        <Tabs.Content value="breaks" pt={3}>
          <BreaksSection
            staffId={staffId}
            breaks={schedule.breaks}
            canManage={canManage}
          />
        </Tabs.Content>

        <Tabs.Content value="time-off" pt={3}>
          <TimeOffSection
            staffId={staffId}
            timeOff={schedule.timeOff}
            canManage={canManage}
          />
        </Tabs.Content>

        <Tabs.Content value="overrides" pt={3}>
          <OverridesSection
            staffId={staffId}
            overrides={schedule.overrides}
            canManage={canManage}
          />
        </Tabs.Content>
      </Tabs.Root>
    </Flex>
  );
}
