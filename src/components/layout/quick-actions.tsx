import { AddLeadDialog } from "@/components/ui/add-lead";
import { QuickAddEventDialog } from "@/pages/admin/calendar/quick-add-event-dialog";
import { useCreateCalendarEvent } from "@/pages/admin/calendar/use-calendar";
import { InstantConsultationDialog } from "@/pages/admin/leads/components/intake-pipeline/dialogs/instant-consultation-dialog";
import { InviteStaffDialog } from "@/pages/admin/staff-and-users/invite-staff/dialog";
import { CreateTeamDialog } from "@/pages/admin/staff-and-users/tabs/teams/components/create-team/dialog";
import { Box, Button, Menu, Portal, Text } from "@chakra-ui/react";
import { CalendarDays, ChevronDown, Plus, UserRoundPlus, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNav } from "./nav-context";

export function QuickActions({ collapsed }: { collapsed: boolean }) {
  const { setSuppressCollapse, forceCollapse } = useNav();
  const [menuOpen, setMenuOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [instantConsultOpen, setInstantConsultOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [inviteStaffOpen, setInviteStaffOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const createEvent = useCreateCalendarEvent();

  useEffect(() => {
    setSuppressCollapse(
      menuOpen || addLeadOpen || instantConsultOpen || createTeamOpen || inviteStaffOpen || addEventOpen,
    );
  }, [menuOpen, addLeadOpen, instantConsultOpen, createTeamOpen, inviteStaffOpen, addEventOpen, setSuppressCollapse]);

  return (
    <>
      <Menu.Root onOpenChange={(details) => setMenuOpen(details.open)}>
        <Menu.Trigger asChild>
          <Button
            variant="ghost"
            justifyContent={collapsed ? "center" : "flex-start"}
            gap="8px"
            px={collapsed ? "0" : "12px"}
            py="8px"
            h="auto"
            fontSize="12px"
            fontWeight={500}
            color="fg"
            _hover={{ bg: "bg.hover" }}
            w="100%"
          >
            <Box color="brand.solid">
              <Zap size={16} strokeWidth={2} />
            </Box>
            {!collapsed && (
              <>
                <Text m={0} flex="1" textAlign="left">
                  Quick Actions
                </Text>
                <ChevronDown size={14} />
              </>
            )}
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content
              minW="180px"
              bg="bg.panel"
              border="1px solid"
              borderColor="border"
              borderRadius="md"
              p="4px"
            >
              <Menu.Item
                value="add-lead"
                bg="transparent"
                color="fg"
                borderRadius="md"
                px="12px"
                py="8px"
                gap="8px"
                fontSize="13px"
                _hover={{ bg: "bg.hover" }}
                onClick={() => { setAddLeadOpen(true); forceCollapse(); }}
              >
                <Box color="fg">
                  <UserRoundPlus size={15} />
                </Box>
                Add a lead
              </Menu.Item>
              <Menu.Item
                value="instant-consultation"
                bg="transparent"
                color="fg"
                borderRadius="md"
                px="12px"
                py="8px"
                gap="8px"
                fontSize="13px"
                _hover={{ bg: "bg.hover" }}
                onClick={() => { setInstantConsultOpen(true); forceCollapse(); }}
              >
                <Box color="fg">
                  <Zap size={15} />
                </Box>
                Start instant consultation
              </Menu.Item>
              <Menu.Item
                value="create-team"
                bg="transparent"
                color="fg"
                borderRadius="md"
                px="12px"
                py="8px"
                gap="8px"
                fontSize="13px"
                _hover={{ bg: "bg.hover" }}
                onClick={() => { setCreateTeamOpen(true); forceCollapse(); }}
              >
                <Box color="fg">
                  <Users size={15} />
                </Box>
                Create a team
              </Menu.Item>
              <Menu.Item
                value="invite-staff"
                bg="transparent"
                color="fg"
                borderRadius="md"
                px="12px"
                py="8px"
                gap="8px"
                fontSize="13px"
                _hover={{ bg: "bg.hover" }}
                onClick={() => { setInviteStaffOpen(true); forceCollapse(); }}
              >
                <Box color="fg">
                  <Plus size={15} />
                </Box>
                Invite a staff
              </Menu.Item>
              <Menu.Item
                value="add-calendar-event"
                bg="transparent"
                color="fg"
                borderRadius="md"
                px="12px"
                py="8px"
                gap="8px"
                fontSize="13px"
                _hover={{ bg: "bg.hover" }}
                onClick={() => { setAddEventOpen(true); forceCollapse(); }}
              >
                <Box color="fg">
                  <CalendarDays size={15} />
                </Box>
                Add calendar event
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} />
      <InstantConsultationDialog
        open={instantConsultOpen}
        onOpenChange={setInstantConsultOpen}
      />
      <CreateTeamDialog
        open={createTeamOpen}
        onOpenChange={setCreateTeamOpen}
      />
      <InviteStaffDialog
        open={inviteStaffOpen}
        onOpenChange={setInviteStaffOpen}
      />
      <QuickAddEventDialog
        open={addEventOpen}
        onOpenChange={setAddEventOpen}
        onAdd={(payload) => createEvent.mutate(payload)}
      />
    </>
  );
}
