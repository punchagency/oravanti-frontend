import { Box, Flex, Text } from "@chakra-ui/react";
import { AlertTriangle, Group, LayoutGrid, Users } from "lucide-react";
import { ThemeSkeleton } from "../../../components/theme-skeleton";
import { useTeamsData } from "../teams-data-context";

const cards = [
  {
    key: "totalTeams",
    label: "Total teams",
    color: "#1D9E75",
    icon: Group,
    count: (c: { totalTeams: number }) => c.totalTeams,
  },
  {
    key: "activeMembers",
    label: "Active members",
    color: "#378ADD",
    icon: Users,
    count: (c: { activeMembers: number }) => c.activeMembers,
  },
  {
    key: "atCapacity",
    label: "At capacity (>80%)",
    color: "#BA7517",
    icon: AlertTriangle,
    count: (c: { atCapacity: number }) => c.atCapacity,
  },
  {
    key: "practiceAreasCovered",
    label: "Practice areas covered",
    color: "#534AB7",
    icon: LayoutGrid,
    count: (c: { practiceAreasCovered: number }) => c.practiceAreasCovered,
  },
];

export function TeamsStatusSummary() {
  const { counts, isLoading } = useTeamsData();

  return (
    <Flex wrap="wrap" gap={{ base: 3, md: 4 }} mb={{ base: 4, md: 6 }}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Box
            key={card.key}
            flex={{
              base: "1 1 100%",
              sm: "1 1 calc(50% - 12px)",
              md: "1 1 calc(25% - 12px)",
            }}
            minW={{ base: 0, sm: "120px" }}
            bg="bg"
            border="1px solid"
            borderColor="border"
            borderRadius="md"
            px={{ base: 3, md: 4 }}
            py={{ base: 3, md: 4 }}
          >
            <Flex align="center" gap={2.5}>
              <Box color={card.color}>
                <Icon size={18} />
              </Box>
              {isLoading ? (
                <ThemeSkeleton
                  height={{ base: "24px", md: "32px" }}
                  width="32px"
                  borderRadius="md"
                />
              ) : (
                <Text
                  fontWeight="bold"
                  fontSize={{ base: "xl", md: "2xl" }}
                  color="fg"
                >
                  {card.count(counts)}
                </Text>
              )}
            </Flex>
            <Text
              mt={1}
              textStyle="body-sm"
              color="fg.subtle"
              whiteSpace="nowrap"
            >
              {card.label}
            </Text>
          </Box>
        );
      })}
    </Flex>
  );
}
