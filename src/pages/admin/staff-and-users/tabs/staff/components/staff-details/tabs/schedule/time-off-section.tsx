import type { TimeOffDTO } from "@/api/staff-availability";
import { useDeleteTimeOff } from "@/hooks/use-staff-schedule-mutations";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useConfirmStore } from "@/store/confirm-store";
import { Badge, Box, chakra, Flex, Text } from "@chakra-ui/react";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  formatDateRange,
  TIME_OFF_STATUS_COLORS,
  TIME_OFF_TYPE_LABELS,
} from "./constants";
import { EmptyState, SectionActionButton, SectionCard } from "./section-card";
import { TimeOffDialog } from "./time-off-dialog";

interface TimeOffSectionProps {
  staffId: string;
  timeOff: TimeOffDTO[];
  canManage: boolean;
}

export function TimeOffSection({
  staffId,
  timeOff,
  canManage,
}: TimeOffSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TimeOffDTO | null>(null);
  const { showConfirm } = useConfirmDialog();
  const deleteMutation = useDeleteTimeOff();

  const handleDelete = (entry: TimeOffDTO) => {
    showConfirm({
      title: "Delete time off",
      description: `Delete the ${TIME_OFF_TYPE_LABELS[entry.type] ?? entry.type} time off from ${formatDateRange(entry.startDate, entry.endDate)}?`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        useConfirmStore.getState().setLoading(true);
        try {
          await deleteMutation.mutateAsync({ staffId, timeOffId: entry.id });
        } finally {
          useConfirmStore.getState().setLoading(false);
          useConfirmStore.getState().close();
        }
      },
    });
  };

  return (
    <SectionCard
      title="Time off"
      action={
        canManage ? (
          <SectionActionButton
            label="+ Add time off"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          />
        ) : undefined
      }
    >
      {timeOff.length === 0 ? (
        <EmptyState>No time off scheduled.</EmptyState>
      ) : (
        <Flex direction="column">
          {timeOff.map((entry) => (
            <Box
              key={entry.id}
              borderBottom="1px solid"
              borderColor="border.muted"
              py={2}
            >
              <Flex align="center" gap={2}>
                <Badge size="sm" variant="surface">
                  {TIME_OFF_TYPE_LABELS[entry.type] ?? entry.type}
                </Badge>
                <Text color="fg" fontSize="12px" flex="1">
                  {formatDateRange(entry.startDate, entry.endDate)}
                </Text>
                <Badge
                  size="sm"
                  colorPalette={TIME_OFF_STATUS_COLORS[entry.status] ?? "gray"}
                >
                  {entry.status}
                </Badge>
                {canManage && (
                  <Flex gap={1}>
                    <chakra.button
                      type="button"
                      aria-label="Edit time off"
                      display="grid"
                      placeItems="center"
                      w="26px"
                      h="26px"
                      color="fg.muted"
                      bg="transparent"
                      border="none"
                      cursor="pointer"
                      _hover={{ color: "fg" }}
                      onClick={() => {
                        setEditing(entry);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil size={13} />
                    </chakra.button>
                    <chakra.button
                      type="button"
                      aria-label="Delete time off"
                      display="grid"
                      placeItems="center"
                      w="26px"
                      h="26px"
                      color="fg.muted"
                      bg="transparent"
                      border="none"
                      cursor="pointer"
                      _hover={{ color: "red.solid" }}
                      onClick={() => handleDelete(entry)}
                    >
                      <Trash2 size={13} />
                    </chakra.button>
                  </Flex>
                )}
              </Flex>
              {entry.reason && (
                <Text color="fg.muted" fontSize="11px" mt={0.5}>
                  {entry.reason}
                </Text>
              )}
            </Box>
          ))}
        </Flex>
      )}

      {canManage && (
        <TimeOffDialog
          staffId={staffId}
          timeOff={editing}
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditing(null);
          }}
        />
      )}
    </SectionCard>
  );
}
