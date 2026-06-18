import { Box, Flex, Text } from "@chakra-ui/react";
import { Check, Clock, ThumbsDown, XCircle } from "lucide-react";
import type { InvitationCounts } from "@/api/organization";
import { ThemeSkeleton } from "./theme-skeleton";

const cards = [
  {
    key: "pending",
    label: "Pending",
    color: "#534AB7",
    icon: Clock,
    count: (c: InvitationCounts) => c.pending,
  },
  {
    key: "accepted",
    label: "Accepted",
    color: "#1D9E75",
    icon: Check,
    count: (c: InvitationCounts) => c.accepted,
  },
  {
    key: "rejected",
    label: "Rejected",
    color: "#E05454",
    icon: ThumbsDown,
    count: (c: InvitationCounts) => c.rejected,
  },
  {
    key: "canceled",
    label: "Canceled",
    color: "#B4B2A9",
    icon: XCircle,
    count: (c: InvitationCounts) => c.canceled,
  },
];

interface InvitationStatusSummaryProps {
  counts: InvitationCounts;
  isLoading: boolean;
}

export function InvitationStatusSummary({
  counts,
  isLoading,
}: InvitationStatusSummaryProps) {
  return (
    <Flex wrap="wrap" gap={{ base: 3, md: 4 }} mb={{ base: 4, md: 6 }}>
      <Box
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
          {isLoading ? (
            <ThemeSkeleton height={{ base: "24px", md: "32px" }} width="40px" borderRadius="md" />
          ) : (
            <Text fontWeight="bold" fontSize={{ base: "xl", md: "2xl" }} color="fg">
              {counts.pending + counts.accepted + counts.rejected + counts.canceled}
            </Text>
          )}
        </Flex>
        <Text mt={1} textStyle="body-sm" color="fg.subtle" whiteSpace="nowrap">
          All invitations
        </Text>
      </Box>

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
                <ThemeSkeleton height={{ base: "24px", md: "32px" }} width="40px" borderRadius="md" />
              ) : (
                <Text fontWeight="bold" fontSize={{ base: "xl", md: "2xl" }} color="fg">
                  {card.count(counts)}
                </Text>
              )}
            </Flex>
            <Text mt={1} textStyle="body-sm" color="fg.subtle" whiteSpace="nowrap">
              {card.label}
            </Text>
          </Box>
        );
      })}
    </Flex>
  );
}
