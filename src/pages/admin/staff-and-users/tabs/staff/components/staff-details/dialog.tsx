import type { StaffMemberDTO } from "@/hooks/use-staff-list";
import { useAuthStore } from "@/store/auth-store";
import {
  Avatar,
  Badge,
  Box,
  CloseButton,
  Drawer,
  Flex,
  HStack,
  Portal,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { StepActivity } from "./step-activity";
import { StepCertifications } from "./step-certifications";
import { StepOverview } from "./step-overview";

interface StaffDetailsDrawerProps {
  staff: StaffMemberDTO;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (details: { open: boolean }) => void;
}

export function StaffDetailsDrawer({
  staff,
  children,
  open,
  onOpenChange,
}: StaffDetailsDrawerProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);

  return (
    <Drawer.Root placement="end" size="md" open={open} onOpenChange={onOpenChange}>
      {children && <Drawer.Trigger asChild>{children}</Drawer.Trigger>}
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
                      name={`${staff.firstName} ${staff.lastName}`}
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
                        {staff.firstName} {staff.lastName}
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
                  <StepOverview staff={staff} />
                </Tabs.Content>

                <Tabs.Content value="certifications">
                  <StepCertifications />
                </Tabs.Content>

                <Tabs.Content value="activity">
                  <StepActivity />
                </Tabs.Content>
              </Tabs.Root>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
