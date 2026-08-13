import {
  Badge,
  Box,
  Button,
  Progress,
  Separator,
  Text,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { CalendarOff, FileText, Pencil, ShieldCheck, ShieldOff } from "lucide-react";
import type { StaffMemberDTO } from "@/hooks/use-staff-list";
import {
  getProgressColor,
  getStatusBadgeStyles,
  getStatusLabel,
  type StaffMember,
} from "../../../../../data";
import { useUpdateStaffPortalStatus } from "@/hooks/use-update-staff-portal-status";
import { useAuthStore } from "@/store/auth-store";
import { StaffPortalAccessBadge } from "../../../../../components/staff-portal-access-badge";
import { EditStaffDialog } from "../../edit-staff/dialog";
function FieldRow({ label, value }: { label: string; value: string }) {
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

export function Overview({ staff }: { staff: StaffMemberDTO }) {
  const caseloadCurrent = 0;
  const caseloadMax = staff.maxCaseload ?? 7;
  const updatePortalStatus = useUpdateStaffPortalStatus();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isSelf = staff.userId === currentUserId;
  return (
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
      <FieldRow label="Personal email" value={staff.email ?? "N/A"} />
      <FieldRow label="Organization email" value={staff.orgEmail || "N/A"} />
      <FieldRow label="Phone" value={staff.phone ?? "N/A"} />
      <FieldRow label="Role" value={staff.role ?? "N/A"} />
      <FieldRow
        label="Team(s)"
        value={
          staff.teams.length > 0
            ? staff.teams.map((t) => t.name).join(", ")
            : "None"
        }
      />
      <FieldRow label="Start date" value={staff.startDate ?? "N/A"} />
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
            staff.practiceAreas.map((area) => {
              const colorMap: Record<string, { bg: string; color: string }> = {
                Immigration: { bg: "#E1F5EE", color: "#085041" },
                "Family law": { bg: "#E6F1FB", color: "#0C447C" },
              };
              const style = colorMap[area.name] || { bg: "#FAEEDA", color: "#633806" };
              return (
                <Box key={area.id} bg={style.bg} borderRadius="10px" px={1.5} py={0.5}>
                  <Text color={style.color} fontSize="10px" fontWeight="500" lineHeight="12px">
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
      <Text color="#1D9E75" fontSize="20px" fontWeight="500" lineHeight="24px">
        {caseloadCurrent} of {caseloadMax} cases
      </Text>
      <Progress.Root
        value={(caseloadCurrent / caseloadMax) * 100 || 0}
        size="xs"
        borderRadius="3px"
        mt={1.5}
        h="6px"
      >
        <Progress.Track bg="border.muted">
          <Progress.Range bg={getProgressColor(caseloadCurrent, caseloadMax)} />
        </Progress.Track>
      </Progress.Root>
      <Text color="fg.subtle" fontSize="11px" mt={1.5}>
        {caseloadMax - caseloadCurrent} slots available
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

      <SectionLabel>Portal access</SectionLabel>
      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="lg"
        p={3}
      >
        <HStack justify="space-between" align="center" mb={2}>
          <Text color="fg.muted" fontSize="12px" fontWeight="500">
            Status
          </Text>
          <StaffPortalAccessBadge status={staff.portalStatus} />
        </HStack>
        {isSelf &&
        (staff.portalStatus === "active" || staff.portalStatus === "pending") ? null : staff.portalStatus ===
            "active" ||
          staff.portalStatus === "pending" ? (
          <Button
            size="xs"
            variant="outline"
            w="full"
            color="fg.error"
            _hover={{ bg: "bg.error", color: "fg.error" }}
            onClick={() =>
              updatePortalStatus.mutate({
                staffId: staff.id,
                status: "disabled",
              })
            }
            loading={updatePortalStatus.isPending}
          >
            <ShieldOff size={12} />
            Disable access
          </Button>
        ) : (
          <Button
            size="xs"
            variant="outline"
            w="full"
            color="fg.success"
            _hover={{ bg: "bg.success", color: "fg.success" }}
            onClick={() =>
              updatePortalStatus.mutate({
                staffId: staff.id,
                status: "active",
              })
            }
            loading={updatePortalStatus.isPending}
          >
            <ShieldCheck size={12} />
            Enable access
          </Button>
        )}
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
        <EditStaffDialog staff={staff as unknown as StaffMember}>
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
  );
}
