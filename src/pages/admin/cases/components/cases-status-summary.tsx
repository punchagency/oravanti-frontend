import { Box, Flex, Text } from "@chakra-ui/react";
import { AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";
import { useCasesData } from "../cases-data-context";

const cards = [
  {
    key: "active",
    label: "Active",
    color: "#1D9E75",
    icon: FileText,
  },
  {
    key: "rfe",
    label: "RFE / Urgent",
    color: "#E8A635",
    icon: AlertTriangle,
  },
  {
    key: "pending",
    label: "Pending",
    color: "#534AB7",
    icon: Clock,
  },
  {
    key: "closed",
    label: "Closed",
    color: "#B4B2A9",
    icon: CheckCircle2,
  },
];

export function CasesStatusSummary() {
  const { counts } = useCasesData();

  return (
    <Flex wrap="wrap" gap={{ base: 3, md: 4 }} py={5}>
      {cards.map((card) => {
        const Icon = card.icon;
        const count = counts[card.key as keyof typeof counts];
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
              <Text
                fontWeight="bold"
                fontSize={{ base: "xl", md: "2xl" }}
                color="fg"
              >
                {count}
              </Text>
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
