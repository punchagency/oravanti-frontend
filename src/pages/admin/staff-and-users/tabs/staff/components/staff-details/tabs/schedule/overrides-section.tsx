import type { AvailabilityOverrideDTO } from "@/api/staff-availability";
import { useDeleteOverride } from "@/hooks/use-staff-schedule-mutations";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useConfirmStore } from "@/store/confirm-store";
import { Badge, Box, chakra, Flex, Text } from "@chakra-ui/react";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatDisplayDate, formatTime } from "./constants";
import { EmptyState, SectionActionButton, SectionCard } from "./section-card";
import { OverrideDialog } from "./override-dialog";

interface OverridesSectionProps {
  staffId: string;
  overrides: AvailabilityOverrideDTO[];
  canManage: boolean;
}

export function OverridesSection({
  staffId,
  overrides,
  canManage,
}: OverridesSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AvailabilityOverrideDTO | null>(null);
  const { showConfirm } = useConfirmDialog();
  const deleteMutation = useDeleteOverride();

  const handleDelete = (override: AvailabilityOverrideDTO) => {
    showConfirm({
      title: "Delete date override",
      description: `Delete the override on ${formatDisplayDate(override.date)}?`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        useConfirmStore.getState().setLoading(true);
        try {
          await deleteMutation.mutateAsync({
            staffId,
            overrideId: override.id,
          });
        } finally {
          useConfirmStore.getState().setLoading(false);
          useConfirmStore.getState().close();
        }
      },
    });
  };

  return (
    <SectionCard
      title="Date overrides"
      action={
        canManage ? (
          <SectionActionButton
            label="+ Add override"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          />
        ) : undefined
      }
    >
      {overrides.length === 0 ? (
        <EmptyState>No date overrides.</EmptyState>
      ) : (
        <Flex direction="column">
          {overrides.map((override) => (
            <Box
              key={override.id}
              borderBottom="1px solid"
              borderColor="border.muted"
              py={2}
            >
              <Flex align="center" gap={2}>
                <Text
                  color="fg"
                  fontSize="12px"
                  fontWeight="500"
                  flexShrink={0}
                >
                  {formatDisplayDate(override.date)}
                </Text>
                {override.type === "closed" ? (
                  <Badge size="sm" colorPalette="red" variant="surface">
                    Closed
                  </Badge>
                ) : (
                  <Text color="fg" fontSize="12px" flex="1">
                    {override.startTime && override.endTime
                      ? `${formatTime(override.startTime)} – ${formatTime(override.endTime)}`
                      : "Custom hours"}
                  </Text>
                )}
                <Box flex="1" />
                {canManage && (
                  <Flex gap={1}>
                    <chakra.button
                      type="button"
                      aria-label="Edit override"
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
                        setEditing(override);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil size={13} />
                    </chakra.button>
                    <chakra.button
                      type="button"
                      aria-label="Delete override"
                      display="grid"
                      placeItems="center"
                      w="26px"
                      h="26px"
                      color="fg.muted"
                      bg="transparent"
                      border="none"
                      cursor="pointer"
                      _hover={{ color: "red.solid" }}
                      onClick={() => handleDelete(override)}
                    >
                      <Trash2 size={13} />
                    </chakra.button>
                  </Flex>
                )}
              </Flex>
              {override.reason && (
                <Text color="fg.muted" fontSize="11px" mt={0.5}>
                  {override.reason}
                </Text>
              )}
            </Box>
          ))}
        </Flex>
      )}

      {canManage && dialogOpen && (
        <OverrideDialog
          staffId={staffId}
          override={editing}
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
