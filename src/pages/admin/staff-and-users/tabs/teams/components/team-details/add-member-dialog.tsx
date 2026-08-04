import type { TeamListDTO } from "@/api/organization";
import { BrandButton } from "@/components/ui/intake-ui";
import { useTeamDetails } from "@/hooks/use-team-details";
import { useStaffsList } from "@/hooks/use-staff-list";
import { useAddTeamMembers } from "@/hooks/use-add-team-members";
import {
  Avatar,
  Box,
  chakra,
  Dialog,
  Flex,
  Input,
  Portal,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { useMemo, useState } from "react";

interface AddMemberDialogProps {
  team: TeamListDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberDialog({ team, open, onOpenChange }: AddMemberDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const addMembers = useAddTeamMembers();
  const { data: fullTeam, isLoading } = useTeamDetails(open ? team.id : null);

  const { data: allStaffData } = useStaffsList({ limit: 200 });
  const allStaff = useMemo(() => allStaffData?.data ?? [], [allStaffData]);

  const existingMemberIds = useMemo(
    () => new Set((fullTeam?.members ?? []).map((m) => m.id)),
    [fullTeam],
  );

  const availableStaff = useMemo(
    () => allStaff.filter((s) => !existingMemberIds.has(s.id)),
    [allStaff, existingMemberIds],
  );

  const filteredStaff = useMemo(
    () =>
      availableStaff.filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          (s.jobTitle ?? "").toLowerCase().includes(q)
        );
      }),
    [availableStaff, search],
  );

  const selectedStaff = useMemo(
    () => allStaff.filter((s) => selectedIds.includes(s.id)),
    [allStaff, selectedIds],
  );

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAdd = async () => {
    if (selectedIds.length === 0) return;
    await addMembers.mutateAsync({ teamId: team.id, staffIds: selectedIds });
    setSelectedIds([]);
    setSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) {
          setSelectedIds([]);
          setSearch("");
        }
        onOpenChange(details.open);
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px={{ base: "12px", sm: "16px" }}>
          <Dialog.Content
            w="full"
            maxW="480px"
            border="1px solid"
            borderColor="border.muted"
            borderRadius="14px"
            bg="bg.panel"
            p="0"
            boxShadow="lg"
            position="relative"
          >
            <Dialog.CloseTrigger asChild>
              <chakra.button
                type="button"
                aria-label="Close dialog"
                position="absolute"
                top="22px"
                right="22px"
                display="grid"
                placeItems="center"
                w="32px"
                h="32px"
                border="1px solid"
                borderColor="border.muted"
                borderRadius="8px"
                bg="transparent"
                color="fg.muted"
                _hover={{ bg: "bg.hover", color: "fg.default" }}
                zIndex={10}
              >
                <X size={16} />
              </chakra.button>
            </Dialog.CloseTrigger>

            {isLoading ? (
              <Flex justify="center" align="center" py={16}>
                <Spinner />
              </Flex>
            ) : (
            <Box p={{ base: "24px 16px 20px", sm: "32px 24px 24px" }}>
              <Dialog.Title color="fg.default" fontSize="18px" fontWeight="600">
                Add members
              </Dialog.Title>
              <Dialog.Description
                mt="6px"
                color="fg.muted"
                fontSize="13px"
                lineHeight="1.4"
              >
                Select staff members to add to {team.name}.
              </Dialog.Description>

              <Input
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                mt={5}
                mb={3}
                bg="bg.input"
                borderColor="border.input"
                borderRadius="md"
                _focus={{ borderColor: "brand.solid", boxShadow: "0 0 0 1px brand.solid" }}
              />

              <Box
                maxH="280px"
                overflowY="auto"
                border="1px solid"
                borderColor="border.muted"
                borderRadius="md"
                bg="bg.input"
              >
                {filteredStaff.length > 0 ? (
                  <Stack gap="0">
                    {filteredStaff.map((staffMember) => {
                      const isSelected = selectedIds.includes(staffMember.id);
                      return (
                        <Flex
                          key={staffMember.id}
                          as="label"
                          align="center"
                          gap="8px"
                          px="10px"
                          py="7px"
                          cursor="pointer"
                          _hover={{ bg: "bg.muted" }}
                          borderBottom="1px solid"
                          borderColor="border.muted"
                          _last={{ borderBottom: "none" }}
                          transition="background 0.1s"
                        >
                          <chakra.input
                            type="checkbox"
                            hidden
                            checked={isSelected}
                            onChange={() => handleToggle(staffMember.id)}
                          />
                          <Box
                            w="16px"
                            h="16px"
                            borderRadius="sm"
                            border="1.5px solid"
                            borderColor={isSelected ? "brand.solid" : "border"}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                            bg={isSelected ? "brand.solid" : "transparent"}
                            transition="all 0.1s"
                          >
                            {isSelected && (
                              <Text color="white" fontSize="11px" fontWeight="bold" lineHeight="1">
                                ✓
                              </Text>
                            )}
                          </Box>
                          <Avatar.Root size="xs">
                            <Avatar.Fallback
                              name={`${staffMember.firstName} ${staffMember.lastName}`}
                            />
                          </Avatar.Root>
                          <Box flex={1}>
                            <Text fontSize="13px" fontWeight="500" color="fg">
                              {staffMember.firstName} {staffMember.lastName}
                            </Text>
                            <Text fontSize="11px" color="fg.muted">
                              {staffMember.jobTitle ?? staffMember.role}
                            </Text>
                          </Box>
                          <Text fontSize="11px" color="fg.subtle" whiteSpace="nowrap">
                            {staffMember.maxCaseload ?? 0} cases
                          </Text>
                        </Flex>
                      );
                    })}
                  </Stack>
                ) : (
                  <Text p="10px" fontSize="12px" color="fg.muted" textAlign="center">
                    {search ? "No staff found" : "All staff are already team members"}
                  </Text>
                )}
              </Box>

              {selectedStaff.length > 0 && (
                <Stack gap="6px" mt="8px" w="full">
                  {selectedStaff.map((staff) => (
                    <Flex
                      key={staff.id}
                      align="center"
                      justify="space-between"
                      w="full"
                      px="10px"
                      py="7px"
                      border="1px solid"
                      borderColor="border"
                      borderRadius="md"
                      bg="bg.input"
                    >
                      <Flex align="center" gap="8px">
                        <Avatar.Root size="xs">
                          <Avatar.Fallback
                            name={`${staff.firstName} ${staff.lastName}`}
                          />
                        </Avatar.Root>
                        <Box>
                          <Text fontSize="13px" fontWeight="500" color="fg">
                            {staff.firstName} {staff.lastName}
                          </Text>
                          <Text fontSize="11px" color="fg.muted">
                            {staff.jobTitle ?? staff.role ?? "—"}
                          </Text>
                        </Box>
                      </Flex>
                      <chakra.button
                        type="button"
                        onClick={() => handleToggle(staff.id)}
                        cursor="pointer"
                        color="fg.muted"
                        _hover={{ color: "fg" }}
                      >
                        <X size="14px" />
                      </chakra.button>
                    </Flex>
                  ))}
                </Stack>
              )}

              <Flex
                justify="space-between"
                mt="20px"
                gap="12px"
                direction={{ base: "column-reverse", sm: "row" }}
              >
                <chakra.button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  height="44px"
                  w={{ base: "full", sm: "auto" }}
                  flex={{ base: undefined, sm: "1" }}
                  borderRadius="10px"
                  fontSize="14px"
                  fontWeight="600"
                  border="1px solid"
                  borderColor="border.muted"
                  bg="transparent"
                  color="fg.default"
                  _hover={{ bg: "bg.hover" }}
                >
                  Cancel
                </chakra.button>
                <BrandButton
                  type="button"
                  onClick={handleAdd}
                  height="44px"
                  w={{ base: "full", sm: "auto" }}
                  flex={{ base: undefined, sm: "1" }}
                  disabled={selectedIds.length === 0}
                  loading={addMembers.isPending}
                  opacity={selectedIds.length === 0 ? 0.5 : 1}
                >
                  Add {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
                </BrandButton>
              </Flex>
            </Box>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
