import type { AvailabilityWindowDTO } from "@/api/staff-availability";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useState } from "react";
import { DAY_NAMES, formatTime } from "./constants";
import { SectionActionButton, SectionCard } from "./section-card";
import { WorkingHoursDialog } from "./working-hours-dialog";

interface WorkingHoursSectionProps {
  staffId: string;
  windows: AvailabilityWindowDTO[];
  canManage: boolean;
}

export function WorkingHoursSection({
  staffId,
  windows,
  canManage,
}: WorkingHoursSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <SectionCard
      title="Working hours"
      action={
        canManage ? (
          <SectionActionButton label="Edit" onClick={() => setDialogOpen(true)} />
        ) : undefined
      }
    >
      <Box>
        {DAY_NAMES.map((dayName, dayIndex) => {
          const dayWindows = windows.filter((w) => w.dayOfWeek === dayIndex);
          return (
            <Flex
              key={dayName}
              align="baseline"
              justify="space-between"
              gap={3}
              borderBottom="1px solid"
              borderColor="border.muted"
              py={1.5}
            >
              <Text color="fg" fontSize="12px" fontWeight="500" flexShrink={0}>
                {dayName}
              </Text>
              {dayWindows.length === 0 ? (
                <Text color="fg.muted" fontSize="12px">
                  Unavailable
                </Text>
              ) : (
                <Text color="fg" fontSize="12px" textAlign="right">
                  {dayWindows
                    .map(
                      (w) =>
                        `${formatTime(w.startTime)} – ${formatTime(w.endTime)}`,
                    )
                    .join(", ")}
                </Text>
              )}
            </Flex>
          );
        })}
      </Box>

      {canManage && (
        <WorkingHoursDialog
          staffId={staffId}
          windows={windows}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </SectionCard>
  );
}
