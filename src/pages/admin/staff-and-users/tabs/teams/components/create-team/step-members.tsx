import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { StaffMemberDTO } from "@/hooks/use-staff-list";
import {
  Avatar,
  Badge,
  Box,
  chakra,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { CreateTeamFormValues } from "./types";

export function StepMembers({
  control,
  allStaff,
  teamLeadId,
}: {
  control: Control<CreateTeamFormValues>;
  allStaff: StaffMemberDTO[];
  teamLeadId: string | null;
}) {
  return (
    <VStack align="stretch" gap="14px">
      <Box>
        <Heading size="sm" fontSize="15px" fontWeight="600" color="fg.default">
          Add team members
        </Heading>
        <Text fontSize="13px" color="fg.muted" mt={0.5}>
          Select staff members to add to this team.
        </Text>
      </Box>

      <Controller
        name="memberIds"
        control={control}
        render={({ field }) => (
          <MemberStaffMultiSelect
            staffList={allStaff}
            selectedIds={field.value}
            leadId={teamLeadId}
            onToggle={(id) => {
              const next = field.value.includes(id)
                ? field.value.filter((memberId) => memberId !== id)
                : [...field.value, id];
              field.onChange(next);
            }}
          />
        )}
      />
    </VStack>
  );
}

function MemberStaffMultiSelect({
  staffList,
  selectedIds,
  onToggle,
  leadId,
}: {
  staffList: StaffMemberDTO[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  leadId: string | null;
}) {
  const [search, setSearch] = useState("");

  // The input stays responsive; only the filter waits for a pause in typing.
  const query = useDebouncedValue(search.trim().toLowerCase(), 200);

  const filteredStaff = useMemo(
    () =>
      staffList.filter((s) => {
        const matchSearch =
          !query ||
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(query) ||
          (s.jobTitle ?? "").toLowerCase().includes(query);
        const notAlreadySelected = !selectedIds.includes(s.id);
        const notLead = s.id !== leadId;
        return matchSearch && notAlreadySelected && notLead;
      }),
    [staffList, query, selectedIds, leadId],
  );

  const selectedStaff = useMemo(
    () => staffList.filter((s) => selectedIds.includes(s.id)),
    [staffList, selectedIds],
  );

  return (
    <Box maxH="400px" overflowY="auto" pr="4px">
      <Box position="relative" mb="8px">
        <Input
          placeholder="Search staff..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          bg="bg.input"
          borderColor="border.input"
          outline={"none"}
          borderRadius="md"
          _focus={{
            borderColor: "brand.solid",
          }}
        />
      </Box>

      <Box
        maxH="220px"
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
                    onChange={() => onToggle(staffMember.id)}
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
                      <Text
                        color="white"
                        fontSize="11px"
                        fontWeight="bold"
                        lineHeight="1"
                      >
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
            {search ? "No staff found" : "No staff available"}
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
              borderColor={staff.id === leadId ? "brand.solid" : "border"}
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
                  <Flex align="center" gap="4px">
                    <Text fontSize="13px" fontWeight="500" color="fg">
                      {staff.firstName} {staff.lastName}
                    </Text>
                    {staff.id === leadId && (
                      <Badge colorPalette="brand" variant="subtle" size="xs">
                        Lead
                      </Badge>
                    )}
                  </Flex>
                  <Text fontSize="11px" color="fg.muted">
                    {staff.jobTitle ?? staff.role ?? "—"}
                  </Text>
                </Box>
              </Flex>
              <chakra.button
                type="button"
                onClick={() => onToggle(staff.id)}
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
    </Box>
  );
}
