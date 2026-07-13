import type { AvailabilityBreakDTO } from "@/api/staff-availability";
import { Flex, Text } from "@chakra-ui/react";
import { useState } from "react";
import { BreaksDialog } from "./breaks-dialog";
import { DAY_NAMES, formatTime } from "./constants";
import { EmptyState, SectionActionButton, SectionCard } from "./section-card";

interface BreaksSectionProps {
  staffId: string;
  breaks: AvailabilityBreakDTO[];
  canManage: boolean;
}

export function BreaksSection({
  staffId,
  breaks,
  canManage,
}: BreaksSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <SectionCard
      title="Breaks"
      action={
        canManage ? (
          <SectionActionButton label="Edit" onClick={() => setDialogOpen(true)} />
        ) : undefined
      }
    >
      {breaks.length === 0 ? (
        <EmptyState>No recurring breaks set.</EmptyState>
      ) : (
        <Flex direction="column">
          {breaks.map((b) => (
            <Flex
              key={b.id}
              align="baseline"
              gap={2}
              borderBottom="1px solid"
              borderColor="border.muted"
              py={1.5}
            >
              <Text
                color="fg"
                fontSize="12px"
                fontWeight="500"
                minW="80px"
                flexShrink={0}
              >
                {DAY_NAMES[b.dayOfWeek]}
              </Text>
              <Text color="fg" fontSize="12px">
                {formatTime(b.startTime)} – {formatTime(b.endTime)}
              </Text>
              {b.label && (
                <Text color="fg.muted" fontSize="12px">
                  · {b.label}
                </Text>
              )}
            </Flex>
          ))}
        </Flex>
      )}

      {canManage && (
        <BreaksDialog
          staffId={staffId}
          breaks={breaks}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </SectionCard>
  );
}
