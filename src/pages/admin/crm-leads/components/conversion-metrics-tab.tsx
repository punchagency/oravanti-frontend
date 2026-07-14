import { Box, Flex, Grid, HStack, Stack, Text, chakra } from "@chakra-ui/react";
import { useState } from "react";
import {
  sourceLabels,
  type LeadMetrics,
  type Measurable,
  type MetricsPeriod,
} from "@/api/leads";
import {
  CardTitle,
  IntakeListSkeleton,
  MutedText,
  SurfaceCard,
} from "@/components/ui/intake-ui";
import { useLeadMetrics } from "@/hooks/use-leads";
import { stageLabel } from "../data";

const PERIODS: { label: string; value: MetricsPeriod }[] = [
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "12 months", value: "12mo" },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * Renders a metric the backend could not compute as unavailable, with its
 * reason — never as a zero. A "0d" here would read as a real measurement
 * ("leads clear this stage instantly") rather than "we have no data".
 */
function MeasurableValue({
  metric,
  format,
}: {
  metric: Measurable<number>;
  format: (value: number) => string;
}) {
  if (metric.status === "insufficient_data") {
    return (
      <Text
        as="span"
        color="fg.subtle"
        fontSize="15px"
        fontWeight="500"
        title={metric.reason}
      >
        Not enough data
      </Text>
    );
  }
  return <>{format(metric.value)}</>;
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      p="16px 18px"
    >
      <Text
        m="0 0 8px"
        color="fg.muted"
        fontSize="10px"
        fontWeight="500"
        textTransform="uppercase"
        letterSpacing="0.04em"
      >
        {label}
      </Text>
      <Box color="fg" fontSize="26px" fontWeight="600" lineHeight="1.1">
        {value}
      </Box>
      {hint && (
        <Text m="6px 0 0" color="fg.muted" fontSize="11px">
          {hint}
        </Text>
      )}
    </Box>
  );
}

function Funnel({ metrics }: { metrics: LeadMetrics }) {
  const top = metrics.funnel[0]?.reached ?? 0;

  return (
    <SurfaceCard>
      <CardTitle>Pipeline funnel</CardTitle>
      <Stack gap="12px" mt="14px">
        {metrics.funnel.map((entry) => {
          const width = top > 0 ? (entry.reached / top) * 100 : 0;
          const timeInStage = metrics.avgDaysInStage[entry.stage];

          return (
            <Box key={entry.stage}>
              <HStack justify="space-between" gap="8px" mb="4px" wrap="wrap">
                <Text m="0" color="fg" fontSize="12px" fontWeight="500">
                  {stageLabel[entry.stage]}
                </Text>
                <HStack gap="10px">
                  {entry.droppedOff > 0 && (
                    <Text m="0" color="#b00020" fontSize="11px">
                      −{entry.droppedOff} dropped
                    </Text>
                  )}
                  <Text m="0" color="fg.muted" fontSize="11px">
                    {entry.reached} reached
                  </Text>
                </HStack>
              </HStack>

              <Box h="8px" borderRadius="999px" bg="bg.muted" overflow="hidden">
                <Box
                  h="100%"
                  w={`${width}%`}
                  minW={entry.reached > 0 ? "2px" : "0"}
                  borderRadius="999px"
                  bg="brand.solid"
                />
              </Box>

              <Text m="4px 0 0" color="fg.subtle" fontSize="11px">
                {timeInStage.status === "ok"
                  ? `Avg ${timeInStage.value.toFixed(1)}d in stage`
                  : "Avg time in stage: not enough data yet"}
              </Text>
            </Box>
          );
        })}
      </Stack>

      <Text m="14px 0 0" color="fg.subtle" fontSize="11px">
        Time in stage is measured from stage transitions in the activity trail,
        so it only covers leads that have moved since tracking began.
      </Text>
    </SurfaceCard>
  );
}

function BreakdownList({
  title,
  rows,
  emptyMessage,
}: {
  title: string;
  rows: { key: string; label: string; total: number; conversionRate: number }[];
  emptyMessage: string;
}) {
  return (
    <SurfaceCard>
      <CardTitle>{title}</CardTitle>
      {rows.length === 0 ? (
        <Box mt="12px">
          <MutedText>{emptyMessage}</MutedText>
        </Box>
      ) : (
        <Stack gap="10px" mt="14px">
          {rows.map((row) => (
            <HStack key={row.key} justify="space-between" gap="12px">
              <Text m="0" color="fg" fontSize="13px">
                {row.label}
              </Text>
              <HStack gap="12px">
                <Text m="0" color="fg.muted" fontSize="12px">
                  {row.total} {row.total === 1 ? "lead" : "leads"}
                </Text>
                <Text
                  m="0"
                  minW="46px"
                  textAlign="right"
                  color="fg"
                  fontSize="12px"
                  fontWeight="500"
                >
                  {row.conversionRate.toFixed(0)}%
                </Text>
              </HStack>
            </HStack>
          ))}
        </Stack>
      )}
    </SurfaceCard>
  );
}

export function ConversionMetricsTab() {
  const [period, setPeriod] = useState<MetricsPeriod>("30d");
  const { data: metrics, isLoading } = useLeadMetrics(period);

  const excluded = metrics
    ? metrics.contractedValue.agreementsExcluded.hourly +
      metrics.contractedValue.agreementsExcluded.contingency
    : 0;

  return (
    <Box mt="20px">
      <Flex justify="flex-end" mb="18px">
        <HStack
          gap="0"
          border="1px solid"
          borderColor="border"
          borderRadius="7px"
          overflow="hidden"
        >
          {PERIODS.map((p) => {
            const active = p.value === period;
            return (
              <chakra.button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                px="12px"
                h="30px"
                bg={active ? "brand.solid" : "bg"}
                color={active ? "brand.fg" : "fg.muted"}
                fontSize="12px"
                fontWeight={active ? "500" : "400"}
                cursor="pointer"
              >
                {p.label}
              </chakra.button>
            );
          })}
        </HStack>
      </Flex>

      {isLoading || !metrics ? (
        <IntakeListSkeleton rows={4} />
      ) : (
        <Stack gap="18px">
          <Grid
            templateColumns={{ base: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
            gap="14px"
          >
            <StatCard label="Leads received" value={metrics.totalLeads} />
            <StatCard
              label="Conversion rate"
              value={`${metrics.conversionRate.toFixed(0)}%`}
              hint={`${metrics.convertedLeads} converted to cases`}
            />
            <StatCard
              label="Avg days to convert"
              value={
                <MeasurableValue
                  metric={metrics.avgDaysToConvert}
                  format={(v) => `${v.toFixed(1)}d`}
                />
              }
            />
            <StatCard
              label="Contracted value"
              value={currency.format(metrics.contractedValue.total)}
              hint={
                excluded > 0
                  ? // A partial total must read as partial: hourly and
                    // contingency agreements have no fixed value to sum.
                    `${metrics.contractedValue.agreementsCounted} signed · ${excluded} hourly/contingency not countable`
                  : `From ${metrics.contractedValue.agreementsCounted} signed agreements`
              }
            />
          </Grid>

          <Funnel metrics={metrics} />

          <Grid
            templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }}
            gap="14px"
          >
            <BreakdownList
              title="Conversion by practice area"
              emptyMessage="No leads with a practice area in this period."
              rows={metrics.conversionByPracticeArea.map((row) => ({
                key: row.practiceAreaId,
                label: row.practiceAreaName,
                total: row.total,
                conversionRate: row.conversionRate,
              }))}
            />

            <BreakdownList
              title="Leads by source"
              emptyMessage="No leads in this period."
              rows={metrics.leadsBySource.map((row) => ({
                key: row.source,
                label: sourceLabels[row.source] ?? row.source,
                total: row.total,
                conversionRate: row.conversionRate,
              }))}
            />
          </Grid>
        </Stack>
      )}
    </Box>
  );
}
