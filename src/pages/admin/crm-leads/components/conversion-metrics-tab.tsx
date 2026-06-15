import { Box, Flex, Grid, HStack, Text, chakra } from "@chakra-ui/react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";

type Period = "30 days" | "90 days" | "12 months";

const funnelStages = [
  { label: "New leads", count: 62, pct: 100, color: "#9ca3af" },
  { label: "Conflict clear", count: 41, pct: 66, color: "#d18400" },
  { label: "Questionnaire", count: 28, pct: 45, color: "#6b7ff7" },
  { label: "Fee agreement", count: 19, pct: 31, color: "#9333ea" },
  { label: "Active client", count: 30, pct: 48, color: "#1D9E75" },
] as const;

const funnelDrops = [21, 13, 9, null] as const;

const practiceAreaConversions = [
  { label: "Immigration", pct: 54, color: "#1D9E75" },
];

const leadsBySources = [
  { label: "Client portal", count: 28, pct: 45 },
  { label: "Education flywheel", count: 18, pct: 29 },
  { label: "Referral", count: 10, pct: 16 },
  { label: "Phone enquiry", count: 4, pct: 6 },
  { label: "Walk-in", count: 2, pct: 3 },
];

export function ConversionMetricsTab() {
  const [period, setPeriod] = useState<Period>("30 days");

  return (
    <Box mt="28px">
      <Flex align="center" justify="space-between" gap="16px" mb="20px" wrap="wrap">
        <Text m="0" color="fg" fontSize="16px" fontWeight="500">
          Performance overview
        </Text>
        <HStack gap="4px">
          {(["30 days", "90 days", "12 months"] as Period[]).map((p) => (
            <chakra.button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              h="30px"
              px="12px"
              borderRadius="6px"
              border="1px solid"
              borderColor={period === p ? "brand.solid" : "border"}
              bg={period === p ? "brand.solid" : "bg"}
              color={period === p ? "brand.fg" : "fg.muted"}
              fontSize="12px"
              fontWeight={period === p ? "500" : "400"}
              cursor="pointer"
            >
              {p}
            </chakra.button>
          ))}
        </HStack>
      </Flex>

      <Grid
        templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }}
        gap="14px"
        mb="20px"
      >
        <StatCard
          label="Total leads received"
          value="62"
          change="↑ 14 from previous period"
          changeUp
        />
        <StatCard
          label="Lead to client rate"
          value="48%"
          change="↑ 6% from previous period"
          changeUp
        />
        <StatCard
          label="Avg days lead to case"
          value="11d"
          change="↓ 3 days improvement"
          changeUp
        />
        <StatCard
          label="Revenue from conversions"
          value="$84,400"
          note="This period"
        />
      </Grid>

      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="10px"
        bg="bg"
        p="20px"
        mb="20px"
      >
        <Text m="0 0 20px" color="fg" fontSize="14px" fontWeight="500">
          Pipeline funnel
        </Text>
        <Box>
          {funnelStages.map((stage, i) => (
            <Box key={stage.label}>
              <Flex align="center" gap="14px" mb="6px">
                <Text
                  m="0"
                  color="fg.muted"
                  fontSize="12px"
                  w="120px"
                  flexShrink={0}
                  textAlign="right"
                >
                  {stage.label}
                </Text>
                <Box flex="1" position="relative">
                  <Box
                    h="32px"
                    w={`${stage.pct}%`}
                    borderRadius="5px"
                    bg={stage.color}
                    display="flex"
                    alignItems="center"
                    px="12px"
                    minW="80px"
                  >
                    <Text m="0" color="white" fontSize="12px" fontWeight="500">
                      {stage.count} ({stage.pct}%)
                    </Text>
                  </Box>
                </Box>
              </Flex>
              {i < funnelStages.length - 1 ? (
                <Flex align="center" gap="14px" mb="6px">
                  <Box w="120px" flexShrink={0} />
                  <Text m="0" color="fg.muted" fontSize="11px" pl="4px">
                    {funnelDrops[i] !== null
                      ? i === funnelStages.length - 2
                        ? `↓ ${funnelDrops[i]} converted`
                        : `↓ ${funnelDrops[i]} dropped`
                      : null}
                  </Text>
                </Flex>
              ) : null}
            </Box>
          ))}
        </Box>
      </Box>

      <Grid
        templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
        gap="14px"
        mb="20px"
      >
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          bg="bg"
          p="20px"
        >
          <Text m="0 0 16px" color="fg" fontSize="14px" fontWeight="500">
            Conversion by practice area
          </Text>
          {practiceAreaConversions.map((area) => (
            <Box key={area.label} mb="12px">
              <Flex justify="space-between" mb="6px">
                <Text m="0" color="fg" fontSize="13px">
                  {area.label}
                </Text>
                <Text m="0" color="fg.muted" fontSize="13px">
                  {area.pct}%
                </Text>
              </Flex>
              <Box h="6px" borderRadius="999px" bg="bg.subtle">
                <Box
                  h="full"
                  borderRadius="999px"
                  bg={area.color}
                  w={`${area.pct}%`}
                />
              </Box>
            </Box>
          ))}
          <Text m="12px 0 0" color="fg.subtle" fontSize="11px">
            Only showing active practice areas
          </Text>
        </Box>

        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          bg="bg"
          p="20px"
        >
          <Text m="0 0 16px" color="fg" fontSize="14px" fontWeight="500">
            Leads by source
          </Text>
          {leadsBySources.map((src) => (
            <Flex key={src.label} align="center" gap="10px" mb="10px">
              <Text m="0" color="fg" fontSize="13px" w="140px" flexShrink={0}>
                {src.label}
              </Text>
              <Box flex="1" h="6px" borderRadius="999px" bg="bg.subtle">
                <Box
                  h="full"
                  borderRadius="999px"
                  bg="brand.solid"
                  w={`${src.pct}%`}
                />
              </Box>
              <Text m="0" color="fg.muted" fontSize="12px" w="60px" textAlign="right">
                {src.count} ({src.pct}%)
              </Text>
            </Flex>
          ))}
        </Box>
      </Grid>

      <Box
        border="1px solid"
        borderColor="brand.200"
        borderRadius="10px"
        bg="brand.50"
        p="18px 20px"
      >
        <Flex align="center" justify="space-between" gap="16px" wrap="wrap">
          <Text m="0" color="brand.800" fontSize="13px" lineHeight="1.5" flex="1">
            18 leads received from the education platform this period. 9 converted to
            active clients — a 50% conversion rate, significantly above the firm
            average of 48%.
          </Text>
          <Text
            m="0"
            color="#1D9E75"
            fontSize="22px"
            fontWeight="600"
            flexShrink={0}
          >
            50%{" "}
            <Text as="span" fontSize="12px" fontWeight="400" color="fg.muted">
              flywheel conversion
            </Text>
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}

function StatCard({
  label,
  value,
  change,
  changeUp,
  note,
}: {
  label: string;
  value: string;
  change?: string;
  changeUp?: boolean;
  note?: string;
}) {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      p="16px 18px"
    >
      <Text m="0 0 8px" color="fg.muted" fontSize="12px">
        {label}
      </Text>
      <Text m="0 0 6px" color="fg" fontSize="24px" fontWeight="600" lineHeight="1">
        {value}
      </Text>
      {change ? (
        <HStack gap="4px">
          {changeUp ? (
            <ArrowUp size={11} color="#1D9E75" />
          ) : (
            <ArrowDown size={11} color="#1D9E75" />
          )}
          <Text m="0" color="#1D9E75" fontSize="11px">
            {change}
          </Text>
        </HStack>
      ) : null}
      {note ? (
        <Text m="0" color="fg.muted" fontSize="11px">
          {note}
        </Text>
      ) : null}
    </Box>
  );
}
