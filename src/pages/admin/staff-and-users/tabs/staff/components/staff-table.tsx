import { useRemoveStaff } from "@/hooks/use-remove-staff";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useAuthStore } from "@/store/auth-store";
import { useConfirmStore } from "@/store/confirm-store";
import {
  Avatar,
  Badge,
  Box,
  HStack,
  IconButton,
  Menu,
  Portal,
  Progress,
  ScrollArea,
  Table,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { Ellipsis, Eye, UserX } from "lucide-react";
import { useState } from "react";
import {
  getProgressColor,
  getStatusBadgeStyles,
  getStatusLabel,
  type StaffMember,
} from "../../../data";
import { useStaffData } from "../staff-data-context";
import { StaffDetailsDrawer } from "./staff-details/drawer";

function TableActionMenu({ staff }: { staff: StaffMember }) {
  const [open, setOpen] = useState(false);
  const { showConfirm } = useConfirmDialog();
  const removeStaff = useRemoveStaff();

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
    <StaffDetailsDrawer
      staffId={staff.id}
      open={open}
      onOpenChange={({ open }) => setOpen(open)}
    >
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
  );
}

export function StaffTable() {
  const { filteredStaff } = useStaffData();
  const currentUserId = useAuthStore((s) => s.user?.id);

  return (
    <Box
      display={{ base: "none", lg: "block" }}
      w="full"
      border="1px solid"
      borderColor="border"
      borderRadius="lg"
      overflow="hidden"
      bg="bg"
    >
      {filteredStaff.length === 0 ? (
        <VStack py={16} gap={2} textAlign="center">
          <Text color="fg.muted" textStyle="lg" fontWeight="600">
            No staff found
          </Text>
          <Text color="fg.subtle" textStyle="body-sm">
            Try adjusting your filters or search terms.
          </Text>
        </VStack>
      ) : (
        <ScrollArea.Root w="full" size="xs">
          <ScrollArea.Viewport>
            <ScrollArea.Content>
              <Table.Root size="md">
                <Table.Header borderBottom="1px solid" borderColor="border">
                  <Table.Row bg={"bg.subtle"}>
                    <Table.ColumnHeader
                      textStyle="body-sm"
                      fontWeight="bold"
                      color="fg.subtle"
                      pb={3}
                      whiteSpace="nowrap"
                    >
                      STAFF MEMBER
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      textStyle="body-sm"
                      fontWeight="bold"
                      color="fg.subtle"
                      pb={3}
                      whiteSpace="nowrap"
                    >
                      ROLE
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      textStyle="body-sm"
                      fontWeight="bold"
                      color="fg.subtle"
                      pb={3}
                      whiteSpace="nowrap"
                    >
                      TEAMS
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      textStyle="body-sm"
                      fontWeight="bold"
                      color="fg.subtle"
                      pb={3}
                      whiteSpace="nowrap"
                    >
                      PRACTICE AREAS
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      textStyle="body-sm"
                      fontWeight="bold"
                      color="fg.subtle"
                      pb={3}
                      whiteSpace="nowrap"
                    >
                      CASELOAD
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      textStyle="body-sm"
                      fontWeight="bold"
                      color="fg.subtle"
                      pb={3}
                      whiteSpace="nowrap"
                    >
                      STATUS
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      textStyle="body-sm"
                      fontWeight="bold"
                      color="fg.subtle"
                      pb={3}
                      textAlign="right"
                      whiteSpace="nowrap"
                    >
                      ACTIONS
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {filteredStaff.map((staff, index) => (
                    <Table.Row
                      key={index}
                      _last={{ borderBottomWidth: 0 }}
                      borderBottom="1px solid"
                      borderColor="border.muted"
                      _hover={{ bg: "bg.muted" }}
                    >
                      <Table.Cell py={4} whiteSpace="nowrap">
                        <HStack gap={3}>
                          <Avatar.Root size="sm" width="32px" height="32px">
                            <Avatar.Fallback
                              name={staff.name}
                              bg="bg.muted"
                              color="fg"
                              fontSize="xs"
                            />
                          </Avatar.Root>
                          <Box>
                            <HStack gap={1}>
                              <Text fontWeight="600" color="fg">
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
                                >
                                  You
                                </Badge>
                              )}
                            </HStack>
                            <Text textStyle="body-sm" color="fg.muted">
                              {staff.email}
                            </Text>
                          </Box>
                        </HStack>
                      </Table.Cell>

                      <Table.Cell py={4} whiteSpace="nowrap">
                        <Text color="fg">{staff.role}</Text>
                      </Table.Cell>

                      <Table.Cell py={4} whiteSpace="nowrap">
                        {staff.teams.length === 0 ? (
                          <Text color="fg.subtle">None</Text>
                        ) : (
                          <HStack gap={1.5} wrap="wrap">
                            {staff.teams.slice(0, 1).map((t) => (
                              <Badge
                                key={t.id}
                                size="sm"
                                borderRadius="full"
                                px={2.5}
                                py={0.5}
                                variant="subtle"
                                textTransform="none"
                                fontWeight="400"
                                bg="rgba(29, 158, 117, 0.12)"
                                color="#1D9E75"
                              >
                                {t.name}
                              </Badge>
                            ))}
                            {staff.teams.length > 1 && (
                              <Tooltip.Root
                                positioning={{ placement: "top" }}
                              >
                                <Tooltip.Trigger asChild>
                                  <Badge
                                    size="sm"
                                    variant="subtle"
                                    textTransform="none"
                                    fontWeight="500"
                                    borderRadius="full"
                                    px={2.5}
                                    py={0.5}
                                    bg="rgba(180, 178, 169, 0.2)"
                                    color="fg.muted"
                                    cursor="pointer"
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
                      </Table.Cell>

                      <Table.Cell py={4} whiteSpace="nowrap">
                        {staff.practiceAreas.length === 0 ? (
                          <Text color="fg.subtle">None</Text>
                        ) : (
                          <HStack gap={1.5} wrap="wrap">
                            {(() => {
                              const areas = staff.practiceAreas;
                              const visible = areas.slice(0, 2);
                              const extra = areas.length - 2;
                              const colorMap: Record<
                                string,
                                { bg: string; color: string }
                              > = {
                                Immigration: {
                                  bg: "rgba(29, 158, 117, 0.12)",
                                  color: "#1D9E75",
                                },
                                "Family law": {
                                  bg: "rgba(55, 138, 221, 0.12)",
                                  color: "#378ADD",
                                },
                              };
                              return (
                                <>
                                  {visible.map((area, idx) => {
                                    const style = colorMap[area.name] || {
                                      bg: "rgba(186, 117, 23, 0.12)",
                                      color: "#BA7517",
                                    };
                                    return (
                                      <Badge
                                        key={idx}
                                        size="sm"
                                        borderRadius="full"
                                        px={2.5}
                                        py={0.5}
                                        variant="subtle"
                                        textTransform="none"
                                        fontWeight="400"
                                        bg={style.bg}
                                        color={style.color}
                                      >
                                        {area.name}
                                      </Badge>
                                    );
                                  })}
                                  {extra > 0 && (
                                    <Tooltip.Root
                                      positioning={{ placement: "top" }}
                                    >
                                      <Tooltip.Trigger asChild>
                                        <Badge
                                          size="sm"
                                          variant="subtle"
                                          textTransform="none"
                                          fontWeight="500"
                                          borderRadius="full"
                                          px={2.5}
                                          py={0.5}
                                          bg="rgba(180, 178, 169, 0.2)"
                                          color="fg.muted"
                                          cursor="pointer"
                                        >
                                          +{extra}
                                        </Badge>
                                      </Tooltip.Trigger>
                                      <Portal>
                                        <Tooltip.Positioner>
                                          <Tooltip.Content>
                                            {areas
                                              .map((a) => a.name)
                                              .join(", ")}
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
                      </Table.Cell>

                      <Table.Cell py={4} whiteSpace="nowrap">
                        <Box maxW="100px">
                          <HStack
                            justify="space-between"
                            mb={1}
                            textStyle="body-sm"
                            fontWeight="bold"
                          >
                            <Text color="fg">
                              {staff.caseloadCurrent} / {staff.caseloadMax}
                            </Text>
                          </HStack>
                          <Progress.Root
                            value={
                              (staff.caseloadCurrent / staff.caseloadMax) *
                                100 || 0
                            }
                            size="xs"
                            borderRadius="full"
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
                      </Table.Cell>

                      <Table.Cell py={4} whiteSpace="nowrap">
                        <Badge
                          px={2.5}
                          py={1}
                          borderRadius="full"
                          textTransform="none"
                          fontWeight="500"
                          style={getStatusBadgeStyles(staff.status)}
                        >
                          {getStatusLabel(staff.status)}
                        </Badge>
                      </Table.Cell>

                      <Table.Cell py={4} textAlign="right" whiteSpace="nowrap">
                        <TableActionMenu staff={staff} />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="horizontal" />
          <ScrollArea.Corner />
        </ScrollArea.Root>
      )}
    </Box>
  );
}
