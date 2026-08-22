import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { useRoleGroup } from "@/hooks/use-role-groups";
import { useStaffsList } from "@/hooks/use-staff-list";
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  IconButton,
  Portal,
  ScrollArea,
  Text,
  VStack,
} from "@chakra-ui/react";
import { UserMinus, UserPlus, X, Search } from "lucide-react";
import { useMemo, useState } from "react";

type StaffRow = {
  id: string;
  memberId?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  role?: string | null;
};

function staffName(s: StaffRow): string {
  const parts = [s.firstName, s.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Unknown";
}

/**
 * Loads everything it renders (the group detail and the full staff list)
 * itself, so it opens instantly and shows a skeleton while its queries
 * resolve — the parent only tells it *which* group to manage.
 */
export function MemberManagementDialog({
  open,
  onOpenChange,
  groupId,
  onAdd,
  onRemove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string | null;
  onAdd: (memberId: string) => void;
  onRemove: (memberId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const groupQuery = useRoleGroup(open ? groupId : null);
  const staffQuery = useStaffsList({ limit: 500 });

  const group = groupQuery.data ?? null;
  const allStaff: StaffRow[] = useMemo(
    () => staffQuery.data?.data ?? [],
    [staffQuery.data],
  );
  const isLoading = groupQuery.isLoading || staffQuery.isLoading;

  const groupMemberIds = useMemo(
    () => new Set(group?.members.map((m) => m.memberId) ?? []),
    [group],
  );

  const membersInGroup = useMemo(
    () => allStaff.filter((s) => s.memberId && groupMemberIds.has(s.memberId)),
    [allStaff, groupMemberIds],
  );

  const nonMembers = useMemo(
    () =>
      allStaff.filter(
        (s) =>
          s.memberId &&
          !groupMemberIds.has(s.memberId) &&
          (staffName(s).toLowerCase().includes(search.toLowerCase()) ||
            (s.email ?? "").toLowerCase().includes(search.toLowerCase())),
      ),
    [allStaff, groupMemberIds, search],
  );

  const displayMembers = search
    ? membersInGroup.filter(
        (s) =>
          staffName(s).toLowerCase().includes(search.toLowerCase()) ||
          (s.email ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : membersInGroup;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        onOpenChange(details.open);
        if (!details.open) setSearch("");
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="500px"
            maxH="80vh"
            border="1px solid"
            borderColor="border"
            borderRadius="14px"
            bg="bg"
            p="0"
            boxShadow="0 24px 70px rgba(0, 0, 0, 0.26)"
            display="flex"
            flexDirection="column"
          >
            <Dialog.CloseTrigger asChild>
              <IconButton
                aria-label="Close"
                position="absolute"
                top="22px"
                right="22px"
                size="xs"
                variant="outline"
                borderRadius="8px"
              >
                <X size={14} />
              </IconButton>
            </Dialog.CloseTrigger>

            <Box p="24px 24px 16px" borderBottom="1px solid" borderColor="border.muted">
              <Dialog.Title fontSize="16px" fontWeight="600" color="fg">
                {group ? (
                  <>
                    Members of &ldquo;{group.name}&rdquo;
                  </>
                ) : (
                  "Manage members"
                )}
              </Dialog.Title>
              <Dialog.Description mt="6px" fontSize="12px" color="fg.muted">
                Staff in this group inherit all its assigned roles.
              </Dialog.Description>
            </Box>

            {isLoading ? (
              <VStack align="stretch" gap="8px" p="16px 24px 24px" flex="1">
                <ThemeSkeleton h="10px" w="140px" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <Flex key={i} align="center" gap="8px">
                    <ThemeSkeleton boxSize="28px" borderRadius="full" flexShrink={0} />
                    <Box flex="1">
                      <ThemeSkeleton h="11px" w={`${110 + (i % 3) * 30}px`} mb="4px" />
                      <ThemeSkeleton h="9px" w={`${150 + ((i + 1) % 3) * 24}px`} />
                    </Box>
                    <ThemeSkeleton h="22px" w="22px" borderRadius="6px" flexShrink={0} />
                  </Flex>
                ))}
              </VStack>
            ) : (
            <ScrollArea.Root flex="1" minH={0}>
              <ScrollArea.Viewport>
                <ScrollArea.Content>
                  <VStack align="stretch" gap="0" p="12px 24px 24px">
                    {/* Search */}
                    <Flex align="center" gap="2" mb="12px">
                      <Search size={14} color="var(--chakra-colors-fg-muted)" />
                      <input
                        type="text"
                        placeholder="Search staff..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                          flex: 1,
                          fontSize: "12px",
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          color: "var(--chakra-colors-fg)",
                        }}
                      />
                      {search && (
                        <Button
                          size="xs"
                          variant="ghost"
                          color="fg.muted"
                          onClick={() => setSearch("")}
                          p="0"
                          minW="auto"
                        >
                          <X size={12} />
                        </Button>
                      )}
                    </Flex>

                    {/* Current members */}
                    <Box mb="12px">
                      <Text fontSize="11px" fontWeight="600" color="fg.muted" textTransform="uppercase" mb="6px">
                        Current members ({displayMembers.length})
                      </Text>
                      {displayMembers.length === 0 ? (
                        <Text fontSize="12px" color="fg.muted" p="8px">
                          {search ? "No members match your search" : "No members in this group yet"}
                        </Text>
                      ) : (
                        <VStack align="stretch" gap="2">
                          {displayMembers.map((staff) => (
                            <Flex
                              key={staff.id}
                              align="center"
                              gap="8px"
                              p="6px 8px"
                              borderRadius="6px"
                              _hover={{ bg: "bg.muted" }}
                            >
                              <Box flex="1" minW={0}>
                                <Text fontSize="12px" color="fg" fontWeight="500" truncate>
                                  {staffName(staff)}
                                </Text>
                                <Text fontSize="10px" color="fg.muted" truncate>
                                  {staff.email}
                                </Text>
                              </Box>
                              <Badge size="sm" variant="outline" colorPalette="gray" fontSize="9px" flexShrink={0}>
                                {(staff.role?.split(",").map((r: string) => r.trim()).filter(Boolean).length ?? 0)} direct
                              </Badge>
                              <Button
                                size="xs"
                                variant="ghost"
                                color="red.fg"
                                _hover={{ bg: "red.subtle" }}
                                onClick={() => staff.memberId && onRemove(staff.memberId)}
                                flexShrink={0}
                              >
                                <UserMinus size={12} />
                              </Button>
                            </Flex>
                          ))}
                        </VStack>
                      )}
                    </Box>

                    {/* Add members */}
                    <Box>
                      <Text fontSize="11px" fontWeight="600" color="fg.muted" textTransform="uppercase" mb="6px">
                        Add staff to group
                      </Text>
                      {nonMembers.length === 0 ? (
                        <Text fontSize="12px" color="fg.muted" p="8px">
                          {search ? "No staff match your search" : "All staff are already in this group"}
                        </Text>
                      ) : (
                        <VStack align="stretch" gap="2" maxH="200px" overflowY="auto">
                          {nonMembers.map((staff) => (
                            <Flex
                              key={staff.id}
                              align="center"
                              gap="8px"
                              p="6px 8px"
                              borderRadius="6px"
                              _hover={{ bg: "bg.muted" }}
                            >
                              <Box flex="1" minW={0}>
                                <Text fontSize="12px" color="fg" fontWeight="500" truncate>
                                  {staffName(staff)}
                                </Text>
                                <Text fontSize="10px" color="fg.muted" truncate>
                                  {staff.email}
                                </Text>
                              </Box>
                              <Button
                                size="xs"
                                variant="ghost"
                                color="brand.fg"
                                onClick={() => staff.memberId && onAdd(staff.memberId)}
                                flexShrink={0}
                              >
                                <UserPlus size={12} />
                              </Button>
                            </Flex>
                          ))}
                        </VStack>
                      )}
                    </Box>
                  </VStack>
                </ScrollArea.Content>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar orientation="vertical" />
              <ScrollArea.Corner />
            </ScrollArea.Root>
            )}

            <Box p="14px 24px 20px" borderTop="1px solid" borderColor="border">
              <Button
                w="full"
                size="sm"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
