import type { TeamListDTO } from "@/api/organization";
import {
  Box,
  chakra,
  Flex,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { inputStyles } from "./input-styles";

interface TeamMultiSelectProps {
  teams: TeamListDTO[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  disabled?: boolean;
}

export function TeamMultiSelect({
  teams,
  selectedIds,
  onToggle,
  disabled,
}: TeamMultiSelectProps) {
  const [search, setSearch] = useState("");

  const filteredTeams = useMemo(
    () =>
      teams.filter(
        (t) => !search || t.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [teams, search],
  );

  const sortedTeams = useMemo(() => {
    const selected = filteredTeams.filter((t) => selectedIds.includes(t.id));
    const unselected = filteredTeams.filter((t) => !selectedIds.includes(t.id));
    return [...selected, ...unselected];
  }, [filteredTeams, selectedIds]);

  return (
    <Box w="full">
      <Box position="relative">
        <Input
          placeholder="Search teams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          h="36px"
          px="12px"
          border="1px solid"
          borderColor="border"
          borderRadius="7px"
          bg="bg"
          color="fg"
          fontSize="13px"
          _placeholder={{ color: "fg.muted" }}
          _focus={{
            borderColor: "brand.solid",
            boxShadow: "0 0 0 1px var(--brand-cta)",
          }}
          disabled={disabled}
          opacity={disabled ? 0.5 : 1}
          cursor={disabled ? "not-allowed" : "text"}
        />
      </Box>

      <Box
        maxH="200px"
        overflowY="auto"
        mt={1}
        border="1px solid"
        borderColor="border"
        borderRadius="7px"
        bg="bg"
      >
        {sortedTeams.length > 0 ? (
          <Stack gap="0">
            {sortedTeams.map((team) => (
              <Flex
                key={team.id}
                as={disabled ? "div" : "label"}
                align="center"
                gap="8px"
                px="10px"
                py="7px"
                cursor={disabled ? "default" : "pointer"}
                _hover={disabled ? undefined : { bg: "bg.muted" }}
                borderBottom="1px solid"
                borderColor="border"
                _last={{ borderBottom: "none" }}
                transition="background 0.1s"
                bg={selectedIds.includes(team.id) ? "bg.subtle" : undefined}
              >
                <chakra.input
                  type="checkbox"
                  hidden
                  checked={selectedIds.includes(team.id)}
                  onChange={() => {
                    if (disabled) return;
                    onToggle(team.id);
                  }}
                />
                <Box
                  w="16px"
                  h="16px"
                  borderRadius="sm"
                  border="1.5px solid"
                  borderColor={
                    selectedIds.includes(team.id) ? "brand.solid" : "border"
                  }
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                  bg={
                    selectedIds.includes(team.id)
                      ? "brand.solid"
                      : "transparent"
                  }
                  transition="all 0.1s"
                >
                  {selectedIds.includes(team.id) && (
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
                <Box flex={1}>
                  <Text fontSize="13px" fontWeight="500" color="fg">
                    {team.name}
                  </Text>
                  {team.leadName && (
                    <Text fontSize="11px" color="fg.muted">
                      Lead: {team.leadName}
                    </Text>
                  )}
                </Box>
                <Text fontSize="11px" color="fg.subtle" whiteSpace="nowrap">
                  {team.memberCount} members
                </Text>
              </Flex>
            ))}
          </Stack>
        ) : (
          <Text p="10px" fontSize="12px" color="fg.muted" textAlign="center">
            {search ? `No teams matching "${search}"` : "No teams available"}
          </Text>
        )}
      </Box>
    </Box>
  );
}
