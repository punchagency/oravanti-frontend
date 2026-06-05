import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useDocumentTitle } from "@/hooks/use-document-title";

const metrics = [
  {
    label: "Lead inbox",
    value: "24",
    accent: "var(--accent-portal)",
    helper: "Five require conflict review",
  },
  {
    label: "Active cases",
    value: "118",
    accent: "var(--accent-attorney)",
    helper: "Twelve deadline alerts",
  },
  {
    label: "Staff utilization",
    value: "82%",
    accent: "var(--accent-admin)",
    helper: "Certification gates enabled",
  },
];

export function DashboardPage() {
  useDocumentTitle("Dashboard - Oravanti");

  return (
    <VStack align="stretch" gap="6">
      <Box className="page-header">
        <Box>
          <Heading
            as="h1"
            fontSize="22px"
            fontWeight="500"
            lineHeight="1.25"
          >
            Firm dashboard
          </Heading>
          <Text mt="1" color="var(--text-secondary)" fontSize="14px">
            Operating view for intake, cases, staff, and deadlines.
          </Text>
        </Box>
        <HStack gap="3">
          <Badge
            borderRadius="999px"
            bg="#fbe9b0"
            color="#3a2202"
            fontSize="11px"
            fontWeight="500"
            px="3"
            py="1"
          >
            Admin portal
          </Badge>
          <Button className="brand-button" size="sm" borderRadius="8px">
            New intake
          </Button>
        </HStack>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap="3">
        {metrics.map((metric) => (
          <Box key={metric.label} className="surface-card" p="5">
            <Text color="var(--text-secondary)" fontSize="13px">
              {metric.label}
            </Text>
            <HStack align="end" justify="space-between" mt="3">
              <Heading as="p" fontSize="22px" fontWeight="500">
                {metric.value}
              </Heading>
              <Box
                width="10px"
                height="10px"
                borderRadius="999px"
                bg={metric.accent}
              />
            </HStack>
            <Text mt="3" color="var(--text-muted)" fontSize="13px">
              {metric.helper}
            </Text>
          </Box>
        ))}
      </SimpleGrid>

      <Box className="surface-card" p={{ base: "4", md: "5" }}>
        <Heading as="h2" fontSize="18px" fontWeight="500">
          Build queue
        </Heading>
        <Text mt="2" color="var(--text-secondary)">
          The new frontend scaffold is ready for the redesigned module work:
          pages, components, hooks, services, and utilities are split into
          dedicated folders.
        </Text>
      </Box>
    </VStack>
  );
}
