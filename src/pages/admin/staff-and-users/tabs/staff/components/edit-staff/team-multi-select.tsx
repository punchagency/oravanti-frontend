import type { TeamListDTO } from "@/api/organization";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  Box,
  chakra,
  Flex,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

  // Callers rebuild `onToggle` on every render (it closes over the form field),
  // which would defeat the memoized rows — keep a stable wrapper instead.
  const onToggleRef = useRef(onToggle);
  useLayoutEffect(() => {
    onToggleRef.current = onToggle;
  });
  const handleToggle = useCallback((id: string) => onToggleRef.current(id), []);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // The input stays responsive; only the filter waits for a pause in typing.
  const query = useDebouncedValue(search.trim().toLowerCase(), 200);

  const filteredTeams = useMemo(() => {
    if (!query) return teams;
    return teams.filter((t) => t.name.toLowerCase().includes(query));
  }, [teams, query]);

  const sortedTeams = useMemo(() => {
    const selected = filteredTeams.filter((t) => selectedSet.has(t.id));
    const unselected = filteredTeams.filter((t) => !selectedSet.has(t.id));
    return [...selected, ...unselected];
  }, [filteredTeams, selectedSet]);

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
              <TeamRow
                key={team.id}
                team={team}
                checked={selectedSet.has(team.id)}
                disabled={disabled}
                onToggle={handleToggle}
              />
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

interface TeamRowProps {
  team: TeamListDTO;
  checked: boolean;
  disabled?: boolean;
  onToggle: (id: string) => void;
}

const TeamRow = memo(function TeamRow({
  team,
  checked,
  disabled,
  onToggle,
}: TeamRowProps) {
  return (
    <Flex
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
      bg={checked ? "bg.subtle" : undefined}
    >
      <chakra.input
        type="checkbox"
        hidden
        checked={checked}
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
        borderColor={checked ? "brand.solid" : "border"}
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        bg={checked ? "brand.solid" : "transparent"}
        transition="all 0.1s"
      >
        {checked && (
          <Text color="white" fontSize="11px" fontWeight="bold" lineHeight="1">
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
  );
});
