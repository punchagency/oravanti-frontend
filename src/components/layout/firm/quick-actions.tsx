import { AddLeadDialog } from "@/components/ui/add-lead";
import { QuickAddEventDialog } from "@/pages/admin/calendar/quick-add-event-dialog";
import { useCanCreateStaff } from "@/hooks/use-can-create-staff";
import { InstantConsultationDialog } from "@/pages/admin/leads/components/intake-pipeline/dialogs/instant-consultation-dialog";
import { InviteStaffDialog } from "@/pages/admin/staff-and-users/invite-staff/dialog";
import { CreateTeamDialog } from "@/pages/admin/staff-and-users/tabs/teams/components/create-team/dialog";
import { Box, Button, Menu, Portal, Text } from "@chakra-ui/react";
import { CalendarDays, ChevronDown, Plus, UserRoundPlus, Users, Zap } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useNav } from "@/components/layout/shared/use-nav";

/** One styled row of the quick-actions menu. */
function QuickActionItem({
  value,
  icon,
  label,
  onClick,
}: {
  value: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Menu.Item
      value={value}
      bg="transparent"
      color="fg"
      borderRadius="md"
      px="12px"
      py="8px"
      gap="8px"
      fontSize="13px"
      _hover={{ bg: "bg.hover" }}
      onClick={onClick}
    >
      <Box color="fg">{icon}</Box>
      {label}
    </Menu.Item>
  );
}

export function QuickActions({ collapsed }: { collapsed: boolean }) {
  const { setSuppressCollapse, forceCollapse } = useNav();
  const [menuOpen, setMenuOpen] = useState(false);
  // Mirrors the backend's `staffs:create` gate on POST /organization/teams
  // and POST /organization/invite — without the grant those dialogs can
  // only ever end in a 403, so their menu items are hidden entirely.
  const canCreateStaff = useCanCreateStaff();

  /*
    Dialogs follow the Chakra "open a dialog from a menu item" pattern:
    each Menu.Item's onClick opens a CONTROLLED dialog rendered outside
    the menu (a Dialog.Trigger inside Menu.Content unmounts when the menu
    closes, which can swallow the open). At most one is open at a time.

    Sidebar freeze while a dialog is up:

    – suppressCollapse = true → DesktopNav ignores onMouseEnter/onMouseLeave,
      so the sidebar stays put while the portaled dialog is open.
    – forceCollapse() shrinks the sidebar immediately when an item is
      clicked, and it stays collapsed until the dialog closes.

    suppressCollapse is derived from menuOpen/openDialog in an effect: it
    fires one extra (cheap) commit after paint, but stays correct no matter
    which of the two sources changed.
  */
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const openItem = (name: string) => () => {
    forceCollapse();
    setOpenDialog(name);
  };
  // Closing via X / backdrop / Esc funnels through here too.
  const handleDialogChange = (open: boolean) => {
    if (!open) setOpenDialog(null);
  };

  useEffect(() => {
    setSuppressCollapse(menuOpen || openDialog !== null);
  }, [menuOpen, openDialog, setSuppressCollapse]);

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
              <QuickActionItem
                value="add-lead"
                icon={<UserRoundPlus size={15} />}
                label="Add a lead"
                onClick={openItem("add-lead")}
              />
              <QuickActionItem
                value="instant-consultation"
                icon={<Zap size={15} />}
                label="Start instant consultation"
                onClick={openItem("instant-consultation")}
              />
              {canCreateStaff && (
                <QuickActionItem
                  value="create-team"
                  icon={<Users size={15} />}
                  label="Create a team"
                  onClick={openItem("create-team")}
                />
              )}
              {canCreateStaff && (
                <QuickActionItem
                  value="invite-staff"
                  icon={<Plus size={15} />}
                  label="Invite a staff"
                  onClick={openItem("invite-staff")}
                />
              )}
              <QuickActionItem
                value="add-calendar-event"
                icon={<CalendarDays size={15} />}
                label="Add calendar event"
                onClick={openItem("add-calendar-event")}
              />
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      {/* Outside the menu so closing the menu never unmounts them. */}
      <AddLeadDialog
        open={openDialog === "add-lead"}
        onOpenChange={handleDialogChange}
      />
      <InstantConsultationDialog
        open={openDialog === "instant-consultation"}
        onOpenChange={handleDialogChange}
      />
      {canCreateStaff && (
        <CreateTeamDialog
          open={openDialog === "create-team"}
          onOpenChange={handleDialogChange}
        />
      )}
      {canCreateStaff && (
        <InviteStaffDialog
          open={openDialog === "invite-staff"}
          onOpenChange={handleDialogChange}
        />
      )}
      <QuickAddEventDialog
        open={openDialog === "add-calendar-event"}
        onOpenChange={handleDialogChange}
      />
    </>
  );
}
