import type { TeamDTO } from "@/api/organization";
import { Box, Stack, Text } from "@chakra-ui/react";

function ActivityTimelineItem({
  dotColor,
  title,
  date,
}: {
  dotColor: string;
  title: string;
  date: string;
}) {
  return (
    <Box position="relative">
      <Box
        position="absolute"
        left="-23px"
        top="5px"
        w="12px"
        h="12px"
        borderRadius="full"
        bg={dotColor}
        zIndex={1}
      />
      <Stack gap={0.5}>
        <Text fontWeight="500" fontSize="14px" color="fg">
          {title}
        </Text>
        <Text fontSize="12px" color="fg.subtle">
          {date}
        </Text>
      </Stack>
    </Box>
  );
}

export function StepActivity({ team }: { team: TeamDTO }) {
  return (
    <Box position="relative" pl={6} pt={2}>
      <Box
        position="absolute"
        left="7px"
        top="16px"
        bottom="16px"
        w="2px"
        bg="border.muted"
      />

      <Stack gap={6}>
        {team.description && (
          <ActivityTimelineItem
            dotColor="#1D9E75"
            title={team.description}
            date={new Date(team.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          />
        )}
        <ActivityTimelineItem
          dotColor="#534AB7"
          title="Team created"
          date={new Date(team.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        />
      </Stack>
    </Box>
  );
}
