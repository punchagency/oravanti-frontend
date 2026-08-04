import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Menu,
  Portal,
  Progress,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import {
  getProgressColor,
  getStatusBadgeStyles,
  getStatusLabel,
  type StaffMember,
} from "../../../data";
import { StaffDetailsDrawer } from "./staff-details/drawer";
import { useAuthStore } from "@/store/auth-store";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useConfirmStore } from "@/store/confirm-store";
import { useRemoveStaffMember } from "@/hooks/use-remove-staff-member";
import { Ellipsis, Eye, UserX } from "lucide-react";
import { useState } from "react";

interface StaffMobileCardProps {
  staff: StaffMember;
}

export function StaffMobileCard({ staff }: StaffMobileCardProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [open, setOpen] = useState(false);
  const { showConfirm } = useConfirmDialog();
  const removeStaff = useRemoveStaffMember();

  const handleRemove = () => {
    showConfirm({
      title: "Remove staff member",
      description: `Are you sure you want to remove ${staff.name}? This will revoke their access and remove all associated data.`,
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        useConfirmStore.getState().setLoading(true);
        try {
          await removeStaff.mutateAsync(staff.id);
          useConfirmStore.getState().close();
        } catch {
          useConfirmStore.getState().setLoading(false);
          useConfirmStore.getState().close();
        }
      },
    });
  };

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
            <Avatar.Image src={staff.avatarUrl ?? undefined} />
          </Avatar.Root>
          <Box minW={0}>
            <HStack gap={1}>
              <Text fontWeight="600" color="fg" truncate>
                {staff.name}
              </Text>
              {staff.userId === currentUserId && (
                <Badge
                  size="xs"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  bg="brand.solid"
                  color="white"
                  fontSize="10px"
                  fontWeight="500"
                  lineHeight="1"
                  flexShrink={0}
                >
                  You
                </Badge>
              )}
            </HStack>
            <Text textStyle="body-sm" color="fg.muted" truncate>
              {staff.email}
            </Text>
          </Box>
        </HStack>
        <HStack gap={1}>
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
          <StaffDetailsDrawer staffId={staff.id} open={open} onOpenChange={({ open }) => setOpen(open)}>
            <Menu.Root>
              <Menu.Trigger asChild>
                <IconButton
                  variant="ghost"
                  size="xs"
                  color="fg.muted"
                  _hover={{ color: "fg", bg: "bg.muted" }}
                >
                  <Ellipsis size={15} />
                </IconButton>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content minW="150px">
                    <Menu.Item value="view" onClick={() => setOpen(true)}>
                      <Eye size={14} />
                      <Box flex="1">View details</Box>
                    </Menu.Item>
                    <Menu.Item
                      value="remove"
                      color="fg.error"
                      _hover={{ bg: "bg.error", color: "fg.error" }}
                      onClick={handleRemove}
                    >
                      <UserX size={14} />
                      <Box flex="1">Remove staff</Box>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </StaffDetailsDrawer>
        </HStack>
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
          <Text color="fg.subtle" flexShrink={0}>
            Team{staff.teams.length !== 1 ? "s" : ""}:
          </Text>
          {staff.teams.length === 0 ? (
            <Text color="fg.subtle">None</Text>
          ) : (
            <HStack gap={1} wrap="wrap" justify="flex-end">
              {staff.teams.slice(0, 1).map((t) => (
                <Badge
                  key={t.id}
                  size="sm"
                  variant="subtle"
                  textTransform="none"
                  bg="rgba(29, 158, 117, 0.12)"
                  color="#1D9E75"
                >
                  {t.name}
                </Badge>
              ))}
              {staff.teams.length > 1 && (
                <Tooltip.Root positioning={{ placement: "top" }}>
                  <Tooltip.Trigger asChild>
                    <Badge
                      size="sm"
                      variant="subtle"
                      textTransform="none"
                      fontWeight="500"
                      bg="rgba(180, 178, 169, 0.2)"
                      color="fg.muted"
                    >
                      +{staff.teams.length - 1}
                    </Badge>
                  </Tooltip.Trigger>
                  <Portal>
                    <Tooltip.Positioner>
                      <Tooltip.Content>
                        {staff.teams
                          .slice(1)
                          .map((t) => t.name)
                          .join(", ")}
                      </Tooltip.Content>
                    </Tooltip.Positioner>
                  </Portal>
                </Tooltip.Root>
              )}
            </HStack>
          )}
        </Flex>
        <Flex justify="space-between" align="center">
          <Text color="fg.subtle" flexShrink={0}>
            Practice Areas:
          </Text>
          {staff.practiceAreas.length === 0 ? (
            <Text color="fg.subtle">None</Text>
          ) : (
            <HStack gap={1} wrap="wrap" justify="flex-end">
              {(() => {
                const areas = staff.practiceAreas;
                const visible = areas.slice(0, 2);
                const extra = areas.length - 2;
                return (
                  <>
                    {visible.map((area, idx) => (
                      <Badge
                        key={idx}
                        size="sm"
                        variant="subtle"
                        textTransform="none"
                      >
                        {area.name}
                      </Badge>
                    ))}
                    {extra > 0 && (
                      <Tooltip.Root positioning={{ placement: "top" }}>
                        <Tooltip.Trigger asChild>
                          <Badge
                            size="sm"
                            variant="subtle"
                            textTransform="none"
                            fontWeight="500"
                            cursor="pointer"
                          >
                            +{extra}
                          </Badge>
                        </Tooltip.Trigger>
                        <Portal>
                          <Tooltip.Positioner>
                            <Tooltip.Content>
                              {areas.map((a) => a.name).join(", ")}
                            </Tooltip.Content>
                          </Tooltip.Positioner>
                        </Portal>
                      </Tooltip.Root>
                    )}
                  </>
                );
              })()}
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

      {staff.status === "pending_invitation" && (
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
      )}
    </Box>
  );
}
