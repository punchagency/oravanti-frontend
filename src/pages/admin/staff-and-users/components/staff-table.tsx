import {
  Avatar,
  Badge,
  Box,
  Button,
  HStack,
  Portal,
  Progress,
  ScrollArea,
  Table,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import {
  getProgressColor,
  getStatusBadgeStyles,
  getStatusLabel,
} from "../data";
import { useStaffData } from "../staff-data-context";
import { StaffDetailsDrawer } from "./staff-details-drawer";
import { useAuthStore } from "@/store/auth-store";

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
                      TEAM
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
                      ACTION
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

                      <Table.Cell py={4} color="fg.muted" whiteSpace="nowrap">
                        {staff.team || "None"}
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
                                          borderRadius="full"
                                          px={2.5}
                                          py={0.5}
                                          variant="subtle"
                                          textTransform="none"
                                          fontWeight="500"
                                          bg="bg.muted"
                                          color="fg.muted"
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
                        <StaffDetailsDrawer staff={staff}>
                          <Button
                            variant="outline"
                            size="xs"
                            borderColor="border"
                            color="fg"
                            px={4}
                            _hover={{ bg: "bg.muted" }}
                          >
                            View
                          </Button>
                        </StaffDetailsDrawer>
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
