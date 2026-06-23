import { Box, Flex, Text } from "@chakra-ui/react";
import { AlertTriangle, CalendarOff, UserCheck, UserPlus } from "lucide-react";
import { useStaffData } from "../staff-data-context";
import { ThemeSkeleton } from "../../../components/theme-skeleton";

const cards = [
  {
    key: "active",
    label: "Active staff",
    color: "#1D9E75",
    icon: UserCheck,
    count: (c: { active: number }) => c.active,
  },
  {
    key: "onLeave",
    label: "On leave",
    color: "#B4B2A9",
    icon: CalendarOff,
    count: (c: { onLeave: number }) => c.onLeave,
  },
  {
    key: "recertify",
    label: "Recertify required",
    color: "#E8A635",
    icon: AlertTriangle,
    count: (c: { recertifyRequired: number }) => c.recertifyRequired,
  },
  {
    key: "pending",
    label: "Pending invitation",
    color: "#534AB7",
    icon: UserPlus,
    count: (c: { pendingInvitation: number }) => c.pendingInvitation,
  },
];

export function StaffStatusSummary() {
  const { counts, isLoading } = useStaffData();

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
            borderRadius="lg"
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
