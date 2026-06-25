import { Box, Stack, Text } from "@chakra-ui/react";
import { useTeamsData } from "../teams-data-context";
import { TeamsMobileCard } from "./teams-mobile-card";

export function TeamsMobileList() {
  const { teams } = useTeamsData();

  if (teams.length === 0) {
    return (
      <Box
        textAlign="center"
        py={12}
        border="1px dashed"
        borderColor="border"
        borderRadius="lg"
        bg="bg"
        display={{ base: "block", lg: "none" }}
      >
        <Text color="fg.muted" textStyle="label" mb={2}>
          No teams found
        </Text>
        <Text textStyle="body-sm" color="fg.subtle">
          Try adjusting your filters or search terms.
        </Text>
      </Box>
    );
  }

  return (
    <Stack gap={4} display={{ base: "flex", lg: "none" }}>
      {teams.map((team) => (
        <TeamsMobileCard key={team.id} team={team} />
      ))}
    </Stack>
  );
}
