import { Box, Flex, Grid, HStack, Stack, Text, chakra } from "@chakra-ui/react";
import {
  ArrowDown,
  ArrowUp,
  GraduationCap,
  Monitor,
  Phone,
  Store,
  UserRound,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  sourceLabels,
  type LeadMetrics,
  type LeadSource,
  type Measurable,
  type MetricsPeriod,
  type PipelineStage,
} from "@/api/leads";
import { IntakeListSkeleton, MutedText } from "@/components/ui/intake-ui";
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

const POSITIVE = "#1D9E75";
const NEGATIVE = "#c0392b";

/** Funnel ramp: cool/neutral at the top of the pipeline, green at conversion. */
const STAGE_COLORS: Record<PipelineStage, [string, string]> = {
  lead_inbox: ["#8f9099", "#b9bac1"],
  conflict_check: ["#d18400", "#e8b567"],
  questionnaire: ["#5b74e8", "#96a9f2"],
  consultation: ["#7c5cd6", "#a98fe6"],
  fee_agreement: ["#9333ea", "#bd82f0"],
  case_opening: ["#12876a", "#4bbd9b"],
};

const CONVERTED_COLORS: [string, string] = ["#1D9E75", "#63cba9"];

const SOURCE_ICONS: Record<LeadSource, ReactNode> = {
  client_portal: <Monitor size={13} />,
  education_flywheel: <GraduationCap size={13} />,
  referral: <Users size={13} />,
  phone_enquiry: <Phone size={13} />,
  walk_in: <Store size={13} />,
  direct: <UserRound size={13} />,
};

const PRACTICE_AREA_TONES = [
  { bg: "#d9f8ed", fg: "#00785a", bar: "#1D9E75" },
  { bg: "#e7f0ff", fg: "#2f63c7", bar: "#3f6fdb" },
  { bg: "#f3e8ff", fg: "#7226bd", bar: "#9333ea" },
  { bg: "#fbefd8", fg: "#8a641d", bar: "#d18400" },
  { bg: "#ffe2e4", fg: "#b00020", bar: "#d4485c" },
];

function Panel({ children }: { children: ReactNode }) {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="12px"
      bg="bg"
      p="20px 22px"
    >
      {children}
    </Box>
  );
}

function PanelTitle({ children }: { children: ReactNode }) {
  return (
    <Text m="0 0 18px" color="fg" fontSize="14px" fontWeight="500">
      {children}
    </Text>
  );
}

/**
 * The green/red "vs previous period" line under a stat.
 *
 * Renders nothing when there was no previous period to compare against — a
 * firm's first month must not claim a triumphant +100%. `betterWhenLower` flips
 * the colour for metrics like days-to-convert, where a fall is an improvement.
 */
function DeltaLine({
  delta,
  comparable,
  format,
  betterWhenLower = false,
  neutralLabel,
}: {
  delta: number;
  comparable: boolean;
  format: (abs: number) => string;
  betterWhenLower?: boolean;
  neutralLabel?: string;
}) {
  if (!comparable) {
    return (
      <Text m="8px 0 0" color="fg.subtle" fontSize="11px">
        {neutralLabel ?? "No previous period to compare"}
      </Text>
    );
  }

  if (Math.round(Math.abs(delta) * 10) === 0) {
    return (
      <Text m="8px 0 0" color="fg.subtle" fontSize="11px">
        No change from previous period
      </Text>
    );
  }

  const rose = delta > 0;
  const good = betterWhenLower ? !rose : rose;

  return (
    <HStack
      m="8px 0 0"
      gap="3px"
      color={good ? POSITIVE : NEGATIVE}
      fontSize="11px"
    >
      {rose ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      <Text m="0">{format(Math.abs(delta))}</Text>
    </HStack>
  );
}

function StatCard({
  label,
  value,
  children,
}: {
  label: string;
  value: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="12px"
      bg="bg"
      p="16px 18px"
    >
      <Text m="0 0 8px" color="fg.muted" fontSize="12px">
        {label}
      </Text>
      <Box color="fg" fontSize="28px" fontWeight="600" lineHeight="1.1">
        {value}
      </Box>
      {children}
    </Box>
  );
}

/** A metric the server could not compute reads as unavailable, never as zero. */
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
        fontSize="17px"
        fontWeight="500"
        title={metric.reason}
      >
        Not enough data
      </Text>
    );
  }
  return <>{format(metric.value)}</>;
}

function FunnelBar({
  label,
  count,
  pct,
  colors,
  timeInStage,
}: {
  label: string;
  count: number;
  pct: number;
  colors: [string, string];
  timeInStage?: Measurable<number>;
}) {
  return (
    <HStack gap="14px" align="center">
      <Text
        m="0"
        w="112px"
        flexShrink={0}
        textAlign="right"
        color="fg.muted"
        fontSize="12px"
      >
        {label}
      </Text>

      <Box flex="1" minW="0">
        <Box
          h="30px"
          borderRadius="6px"
          bg="bg.muted"
          overflow="hidden"
          position="relative"
        >
          <Flex
            align="center"
            h="100%"
            // A zero-count stage still needs a readable label, so keep a floor.
            w={`${Math.max(pct, count > 0 ? 12 : 9)}%`}
            px="10px"
            borderRadius="6px"
            bgGradient="to-r"
            gradientFrom={colors[0]}
            gradientTo={colors[1]}
          >
            <Text
              m="0"
              color="white"
              fontSize="12px"
              fontWeight="500"
              whiteSpace="nowrap"
            >
              {count} ({pct.toFixed(0)}%)
            </Text>
          </Flex>
        </Box>

        {timeInStage && (
          <Text m="3px 0 0" color="fg.subtle" fontSize="10px">
            {timeInStage.status === "ok"
              ? `avg ${timeInStage.value.toFixed(1)}d in stage`
              : "avg time in stage: not enough data yet"}
          </Text>
        )}
      </Box>
    </HStack>
  );
}

function DropMarker({ count, converted }: { count: number; converted?: boolean }) {
  if (count <= 0) return null;
  return (
    <HStack gap="3px" pl="126px" color={converted ? POSITIVE : "fg.subtle"}>
      <ArrowDown size={10} />
      <Text m="0" fontSize="10px">
        {count} {converted ? "converted" : "dropped"}
      </Text>
    </HStack>
  );
}

function Funnel({ metrics }: { metrics: LeadMetrics }) {
  const top = metrics.funnel[0]?.reached ?? 0;
  const pct = (n: number) => (top > 0 ? (n / top) * 100 : 0);

  const lastStage = metrics.funnel[metrics.funnel.length - 1];

  return (
    <Panel>
      <PanelTitle>Pipeline funnel</PanelTitle>

      <Stack gap="6px">
        {metrics.funnel.map((entry, i) => (
          <Stack key={entry.stage} gap="6px">
            {i > 0 && <DropMarker count={entry.droppedOff} />}
            <FunnelBar
              label={stageLabel[entry.stage]}
              count={entry.reached}
              pct={pct(entry.reached)}
              colors={STAGE_COLORS[entry.stage]}
              timeInStage={metrics.avgDaysInStage[entry.stage]}
            />
          </Stack>
        ))}

        {/* Conversion is the outcome of the pipeline, not a stage within it —
            a lead sitting in case_opening has not necessarily become a client. */}
        <DropMarker
          count={(lastStage?.reached ?? 0) - metrics.convertedLeads}
          converted={false}
        />
        <FunnelBar
          label="Active client"
          count={metrics.convertedLeads}
          pct={pct(metrics.convertedLeads)}
          colors={CONVERTED_COLORS}
        />
      </Stack>
    </Panel>
  );
}

function BarRow({
  leading,
  value,
  suffix,
  pct,
  barColor,
}: {
  leading: ReactNode;
  value: ReactNode;
  suffix?: ReactNode;
  pct: number;
  barColor: string;
}) {
  return (
    <HStack gap="12px" align="center">
      <Box w="130px" flexShrink={0}>
        {leading}
      </Box>

      <Box flex="1" minW="0" h="8px" borderRadius="999px" bg="bg.muted">
        <Box
          h="100%"
          w={`${Math.min(pct, 100)}%`}
          borderRadius="999px"
          bg={barColor}
        />
      </Box>

      <HStack gap="4px" w="66px" flexShrink={0} justify="flex-end">
        <Text m="0" color="fg" fontSize="12px" fontWeight="500">
          {value}
        </Text>
        {suffix}
      </HStack>
    </HStack>
  );
}

export function ConversionMetricsTab() {
  const [period, setPeriod] = useState<MetricsPeriod>("30d");
  const { data: metrics, isLoading } = useLeadMetrics(period);

  const excluded = metrics
    ? metrics.contractedValue.agreementsExcluded.hourly +
      metrics.contractedValue.agreementsExcluded.contingency
    : 0;

  // With no leads in the prior window there is nothing to compare against.
  const comparable = (metrics?.previous.totalLeads ?? 0) > 0;

  const daysDelta =
    metrics?.avgDaysToConvert.status === "ok" &&
    metrics.previous.avgDaysToConvert.status === "ok"
      ? metrics.avgDaysToConvert.value -
        metrics.previous.avgDaysToConvert.value
      : null;

  const maxSource = Math.max(
    1,
    ...(metrics?.leadsBySource.map((s) => s.total) ?? [1]),
  );

  return (
    <Box mt="24px">
      <Flex align="center" justify="space-between" gap="16px" mb="18px" wrap="wrap">
        <Text as="h2" m="0" color="fg" fontSize="16px" fontWeight="500">
          Performance overview
        </Text>

        <HStack
          gap="0"
          border="1px solid"
          borderColor="border"
          borderRadius="8px"
          overflow="hidden"
        >
          {PERIODS.map((p) => {
            const active = p.value === period;
            return (
              <chakra.button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                px="14px"
                h="30px"
                bg={active ? "brand.solid" : "bg"}
                color={active ? "brand.contrast" : "fg.muted"}
                fontSize="12px"
                fontWeight={active ? "500" : "400"}
                cursor="pointer"
                _hover={{ bg: active ? "brand.solid" : "bg.subtle" }}
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
        <Stack gap="16px">
          <Grid
            templateColumns={{ base: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
            gap="16px"
          >
            <StatCard label="Total leads received" value={metrics.totalLeads}>
              <DeltaLine
                delta={metrics.totalLeads - metrics.previous.totalLeads}
                comparable={comparable}
                format={(n) => `${Math.round(n)} from previous period`}
              />
            </StatCard>

            <StatCard
              label="Lead to client rate"
              value={`${metrics.conversionRate.toFixed(0)}%`}
            >
              <DeltaLine
                delta={metrics.conversionRate - metrics.previous.conversionRate}
                comparable={comparable}
                format={(n) => `${n.toFixed(0)}% from previous period`}
              />
            </StatCard>

            <StatCard
              label="Avg days lead to case"
              value={
                <MeasurableValue
                  metric={metrics.avgDaysToConvert}
                  format={(v) => `${v.toFixed(0)}d`}
                />
              }
            >
              <DeltaLine
                delta={daysDelta ?? 0}
                comparable={daysDelta !== null}
                betterWhenLower
                format={(n) =>
                  `${n.toFixed(0)} day${n < 1.5 ? "" : "s"} ${
                    (daysDelta ?? 0) < 0 ? "improvement" : "slower"
                  }`
                }
                neutralLabel="No conversions to compare"
              />
            </StatCard>

            <StatCard
              label="Revenue from conversions"
              value={currency.format(metrics.contractedValue.total)}
            >
              <Text m="8px 0 0" color="fg.subtle" fontSize="11px">
                {excluded > 0
                  ? // A partial total must read as partial: hourly and
                    // contingency agreements fix no value to sum.
                    `${metrics.contractedValue.agreementsCounted} signed · ${excluded} hourly/contingency not countable`
                  : "This period"}
              </Text>
            </StatCard>
          </Grid>

          <Funnel metrics={metrics} />

          <Grid
            templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }}
            gap="16px"
          >
            <Panel>
              <PanelTitle>Conversion by practice area</PanelTitle>

              {metrics.conversionByPracticeArea.length === 0 ? (
                <MutedText>
                  No leads with a practice area in this period.
                </MutedText>
              ) : (
                <>
                  <Stack gap="12px">
                    {metrics.conversionByPracticeArea.map((row, i) => {
                      const tone =
                        PRACTICE_AREA_TONES[i % PRACTICE_AREA_TONES.length];
                      return (
                        <BarRow
                          key={row.practiceAreaId}
                          pct={row.conversionRate}
                          barColor={tone.bar}
                          value={`${row.conversionRate.toFixed(0)}%`}
                          leading={
                            <Box
                              display="inline-flex"
                              alignItems="center"
                              maxW="100%"
                              px="10px"
                              py="3px"
                              borderRadius="999px"
                              bg={tone.bg}
                              color={tone.fg}
                              fontSize="11px"
                              fontWeight="500"
                            >
                              <Text m="0" truncate>
                                {row.practiceAreaName}
                              </Text>
                            </Box>
                          }
                        />
                      );
                    })}
                  </Stack>

                  <Text m="16px 0 0" color="fg.subtle" fontSize="11px">
                    Only showing practice areas with leads this period
                  </Text>
                </>
              )}
            </Panel>

            <Panel>
              <PanelTitle>Leads by source</PanelTitle>

              {metrics.leadsBySource.length === 0 ? (
                <MutedText>No leads in this period.</MutedText>
              ) : (
                <Stack gap="12px">
                  {metrics.leadsBySource.map((row) => {
                    const share =
                      metrics.totalLeads > 0
                        ? (row.total / metrics.totalLeads) * 100
                        : 0;
                    return (
                      <BarRow
                        key={row.source}
                        // Bars are scaled against the largest source so the
                        // smallest one stays visible.
                        pct={(row.total / maxSource) * 100}
                        barColor="brand.solid"
                        value={row.total}
                        suffix={
                          <Text m="0" color="fg.muted" fontSize="11px">
                            ({share.toFixed(0)}%)
                          </Text>
                        }
                        leading={
                          <HStack gap="7px" color="fg.muted">
                            {SOURCE_ICONS[row.source]}
                            <Text m="0" color="fg" fontSize="12px" truncate>
                              {sourceLabels[row.source] ?? row.source}
                            </Text>
                          </HStack>
                        }
                      />
                    );
                  })}
                </Stack>
              )}
            </Panel>
          </Grid>
        </Stack>
      )}
    </Box>
  );
}
