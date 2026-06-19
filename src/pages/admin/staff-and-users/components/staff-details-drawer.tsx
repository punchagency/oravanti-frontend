import {
  Avatar,
  Badge,
  Box,
  Button,
  CloseButton,
  Drawer,
  Flex,
  HStack,
  Portal,
  Progress,
  Separator,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CalendarOff, FileText, Pencil } from "lucide-react";
import {
  getProgressColor,
  getStatusBadgeStyles,
  getStatusLabel,
  type StaffMember,
} from "../data";
import { EditStaffDialog } from "./edit-staff-dialog";
import { useAuthStore } from "@/store/auth-store";

interface StaffDetailsDrawerProps {
  staff: StaffMember;
  children: React.ReactNode;
}

interface FieldRowProps {
  label: string;
  value: string;
}

function FieldRow({ label, value }: FieldRowProps) {
  return (
    <Box borderBottom="1px solid" borderColor="border.muted" py={2}>
      <Text
        color="fg.subtle"
        fontSize="10px"
        fontWeight="500"
        letterSpacing="0.5px"
        textTransform="uppercase"
        mb={0.5}
      >
        {label}
      </Text>
      <Text color="fg" fontSize="12px" lineHeight="150%">
        {value}
      </Text>
    </Box>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      color="fg.subtle"
      fontSize="11px"
      fontWeight="500"
      letterSpacing="0.55px"
      textTransform="uppercase"
      mb={2}
    >
      {children}
    </Text>
  );
}

export function StaffDetailsDrawer({
  staff,
  children,
}: StaffDetailsDrawerProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  return (
    <Drawer.Root placement="end" size="md">
      <Drawer.Trigger asChild>{children}</Drawer.Trigger>
      <Portal>
        <Drawer.Backdrop backdropFilter="blur(1.5px)" />
        <Drawer.Positioner>
          <Drawer.Content borderLeft="1px solid" borderColor="border" w="full">
            <Drawer.Header
              borderBottom="1px solid"
              borderColor="border"
              px={5}
              py={5}
            >
              <Flex align="flex-start" justify="space-between">
                <Flex align="center" gap={2.5}>
                  <Avatar.Root size="md" width="40px" height="40px">
                    <Avatar.Fallback
                      name={staff.name}
                      bg="bg.muted"
                      color="fg"
                      fontSize="13px"
                      fontWeight="500"
                    />
                  </Avatar.Root>
                  <Box>
                    <HStack gap={1}>
                      <Text
                        color="fg"
                        fontSize="15px"
                        fontWeight="500"
                        lineHeight="18px"
                      >
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
                    <HStack gap={1} mt={1}>
                      <Box bg="#FAEEDA" borderRadius="10px" px={1.5} py={0.5}>
                        <Text
                          color="#633806"
                          fontSize="10px"
                          fontWeight="500"
                          lineHeight="12px"
                        >
                          {staff.role ?? "N/A"}
                        </Text>
                      </Box>
                    </HStack>
                  </Box>
                </Flex>
                <Drawer.CloseTrigger asChild>
                  <CloseButton
                    size="sm"
                    border="1px solid"
                    borderColor="border.emphasized"
                    borderRadius="50%"
                    w="32px"
                    h="32px"
                    color="fg.muted"
                  />
                </Drawer.CloseTrigger>
              </Flex>
            </Drawer.Header>

            <Drawer.Body p={0} overflow="auto">
              <Tabs.Root defaultValue="overview" size="sm">
                <Tabs.List
                  borderBottom="1px solid"
                  borderColor="border"
                  px={3}
                  mb={3.5}
                >
                  <Tabs.Trigger
                    value="overview"
                    px={3.5}
                    py={2.5}
                    color="fg.muted"
                    fontSize="12px"
                    borderBottom="1px solid"
                    borderColor="transparent"
                    _selected={{
                      color: "fg",
                      borderColor: "brand.solid",
                      fontWeight: "500",
                    }}
                  >
                    Overview
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="certifications"
                    px={3.5}
                    py={2.5}
                    color="fg.muted"
                    fontSize="12px"
                    borderBottom="1px solid"
                    borderColor="transparent"
                    _selected={{
                      color: "fg",
                      borderColor: "brand.solid",
                      fontWeight: "500",
                    }}
                  >
                    Certifications
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="activity"
                    px={3.5}
                    py={2.5}
                    color="fg.muted"
                    fontSize="12px"
                    borderBottom="1px solid"
                    borderColor="transparent"
                    _selected={{
                      color: "fg",
                      borderColor: "brand.solid",
                      fontWeight: "500",
                    }}
                  >
                    Activity
                  </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="overview">
                  <VStack gap={0} align="stretch" px={5} pb={5}>
                    <HStack gap={0} wrap="wrap">
                      <Box borderBottom="1px solid" borderColor="border.muted" py={2} flex="1 1 50%" minW="140px">
                        <Text
                          color="fg.subtle"
                          fontSize="10px"
                          fontWeight="500"
                          letterSpacing="0.5px"
                          textTransform="uppercase"
                          mb={0.5}
                        >
                          First name
                        </Text>
                        <Text color="fg" fontSize="12px" lineHeight="150%">
                          {staff.firstName || "N/A"}
                        </Text>
                      </Box>
                      <Box borderBottom="1px solid" borderColor="border.muted" py={2} flex="1 1 50%" minW="140px">
                        <Text
                          color="fg.subtle"
                          fontSize="10px"
                          fontWeight="500"
                          letterSpacing="0.5px"
                          textTransform="uppercase"
                          mb={0.5}
                        >
                          Last name
                        </Text>
                        <Text color="fg" fontSize="12px" lineHeight="150%">
                          {staff.lastName || "N/A"}
                        </Text>
                      </Box>
                    </HStack>
                    <FieldRow
                      label="Personal email"
                      value={staff.email ?? "N/A"}
                    />
                    <FieldRow
                      label="Organization email"
                      value={staff.orgEmail || "N/A"}
                    />
                    <FieldRow label="Phone" value={staff.phone ?? "N/A"} />
                    <FieldRow label="Role" value={staff.role ?? "N/A"} />
                    <FieldRow label="Team" value={staff.team || "None"} />
                    <FieldRow
                      label="Start date"
                      value={staff.startDate ?? "N/A"}
                    />
                    <FieldRow label="Bar registration" value="—" />
                    <Box pt={2} pb={2}>
                      <Text
                        color="fg.subtle"
                        fontSize="10px"
                        fontWeight="500"
                        letterSpacing="0.5px"
                        textTransform="uppercase"
                        mb={1}
                      >
                        Practice areas
                      </Text>
                      <HStack gap={1} wrap="wrap" mt={0.5}>
                        {staff.practiceAreas.length === 0 ? (
                          <Text color="fg.muted" fontSize="12px">
                            None
                          </Text>
                        ) : (
                          staff.practiceAreas.map((area, idx) => {
                            const colorMap: Record<
                              string,
                              { bg: string; color: string }
                            > = {
                              Immigration: {
                                bg: "#E1F5EE",
                                color: "#085041",
                              },
                              "Family law": {
                                bg: "#E6F1FB",
                                color: "#0C447C",
                              },
                            };
                            const style = colorMap[area.name] || {
                              bg: "#FAEEDA",
                              color: "#633806",
                            };
                            return (
                              <Box
                                key={idx}
                                bg={style.bg}
                                borderRadius="10px"
                                px={1.5}
                                py={0.5}
                              >
                                <Text
                                  color={style.color}
                                  fontSize="10px"
                                  fontWeight="500"
                                  lineHeight="12px"
                                >
                                  {area.name}
                                </Text>
                              </Box>
                            );
                          })
                        )}
                      </HStack>
                    </Box>

                    <Separator borderColor="border" my={3} />

                    <SectionLabel>Caseload</SectionLabel>
                    <Text
                      color="#1D9E75"
                      fontSize="20px"
                      fontWeight="500"
                      lineHeight="24px"
                    >
                      {staff.caseloadCurrent} of {staff.caseloadMax} cases
                    </Text>
                    <Progress.Root
                      value={
                        (staff.caseloadCurrent / staff.caseloadMax) * 100 || 0
                      }
                      size="xs"
                      borderRadius="3px"
                      mt={1.5}
                      h="6px"
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
                    <Text color="fg.subtle" fontSize="11px" mt={1.5}>
                      {staff.caseloadMax - staff.caseloadCurrent} slots
                      available
                    </Text>

                    <Separator borderColor="border" my={3} />

                    <SectionLabel>Status</SectionLabel>
                    <Box>
                      <Badge
                        px={2.5}
                        py={1}
                        borderRadius="12px"
                        textTransform="none"
                        fontWeight="500"
                        fontSize="10px"
                        style={getStatusBadgeStyles(staff.status)}
                      >
                        {getStatusLabel(staff.status)}
                      </Badge>
                    </Box>

                    <Separator borderColor="border" my={3} />

                    <Text
                      color="fg.subtle"
                      fontSize="10px"
                      fontWeight="500"
                      letterSpacing="0.5px"
                      textTransform="uppercase"
                      mb={1}
                    >
                      Notes
                    </Text>
                    <Box bg="bg.subtle" borderRadius="8px" px={3} py={2.5}>
                      <Text color="fg.muted" fontSize="12px" lineHeight="160%">
                        No notes recorded for this staff member.
                      </Text>
                    </Box>

                    <Separator borderColor="border" my={3} />

                    <SectionLabel>Quick actions</SectionLabel>
                    <VStack gap={1.5} w="full">
                      <EditStaffDialog staff={staff}>
                        <Button
                          variant="outline"
                          size="sm"
                          w="full"
                          h="32px"
                          borderColor="border"
                          color="fg"
                          fontSize="12px"
                          fontWeight="400"
                          _hover={{ bg: "bg.muted" }}
                          justifyContent="center"
                          gap={1.5}
                        >
                          <Pencil size={14} />
                          Edit staff details
                        </Button>
                      </EditStaffDialog>
                      <Button
                        variant="outline"
                        size="sm"
                        w="full"
                        h="32px"
                        borderColor="border"
                        color="fg"
                        fontSize="12px"
                        fontWeight="400"
                        _hover={{ bg: "bg.muted" }}
                        justifyContent="center"
                        gap={1.5}
                      >
                        <FileText size={14} />
                        View assigned cases
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        w="full"
                        h="32px"
                        borderColor="border"
                        color="fg"
                        fontSize="12px"
                        fontWeight="400"
                        _hover={{ bg: "bg.muted" }}
                        justifyContent="center"
                        gap={1.5}
                      >
                        <CalendarOff size={14} />
                        Manage leave
                      </Button>
                    </VStack>
                  </VStack>
                </Tabs.Content>

                <Tabs.Content value="certifications">
                  <VStack gap={4} align="stretch" px={5} pb={5}>
                    <Text
                      color="fg.muted"
                      fontSize="12px"
                      textAlign="center"
                      py={8}
                    >
                      Certifications view coming soon.
                    </Text>
                  </VStack>
                </Tabs.Content>

                <Tabs.Content value="activity">
                  <VStack gap={4} align="stretch" px={5} pb={5}>
                    <Text
                      color="fg.muted"
                      fontSize="12px"
                      textAlign="center"
                      py={8}
                    >
                      Activity view coming soon.
                    </Text>
                  </VStack>
                </Tabs.Content>
              </Tabs.Root>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
