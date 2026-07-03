import type { PipelineStage } from "@/api/leads";
import { useCases } from "@/hooks/use-cases";
import { useLeads } from "@/hooks/use-leads";
import { useStaff } from "@/hooks/use-staff";
import {
  Box,
  Button,
  HStack,
  Link,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  Clock,
  FileText,
  UserRound,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { Link as RouterLink } from "react-router";
import { alerts, chips } from "../data";

const toneColors = {
  success: { bg: "#d9f8ed", color: "#00785a" },
  neutral: { bg: "#f1eee6", color: "#817867" },
  warning: { bg: "#fff1d7", color: "#9c650b" },
  gold: { bg: "#fff0c9", color: "#795000" },
  info: { bg: "#e7f0ff", color: "#2f63c7" },
  purple: { bg: "#eedfff", color: "#6519c2" },
  red: { bg: "#ffe2e4", color: "#b00020" },
  rose: { bg: "#ffe7df", color: "#a33d22" },
  mint: { bg: "#d3f6ea", color: "#00785a" },
} as const;

type Tone = keyof typeof toneColors;

const AVATAR_TONES: Tone[] = ["mint", "gold", "rose", "info", "purple"];

const staffRoleLabel: Record<string, string> = {
  admin: "Admin",
  attorney: "Attorney",
  senior_paralegal: "Sr. paralegal",
  paralegal: "Paralegal",
  junior_paralegal: "Jr. paralegal",
};

const staffStatusDisplay: Record<string, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "neutral" },
  on_leave: { label: "On leave", tone: "neutral" },
};

const caseStatusDisplay: Record<string, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "success" },
  completed: { label: "Closed", tone: "neutral" },
  on_hold: { label: "On hold", tone: "warning" },
  pending_review: { label: "Pending", tone: "gold" },
  cancelled: { label: "Cancelled", tone: "red" },
};

const pipelineDefs: Array<{
  title: string;
  meta: string;
  stage: PipelineStage;
  tone: Tone;
}> = [
  {
    title: "Lead inbox",
    meta: "Awaiting review",
    stage: "lead_inbox",
    tone: "neutral",
  },
  {
    title: "Conflict check",
    meta: "Attorney review pending",
    stage: "conflict_check",
    tone: "warning",
  },
  {
    title: "Questionnaire",
    meta: "Sent, awaiting completion",
    stage: "questionnaire",
    tone: "info",
  },
  {
    title: "Fee agreement",
    meta: "Sent for eSignature",
    stage: "fee_agreement",
    tone: "gold",
  },
  {
    title: "Case opening",
    meta: "Ready to open",
    stage: "case_opening",
    tone: "success",
  },
];

export function OverviewView() {
  const [activeChip, setActiveChip] = useState<string>(chips[0][0]);

  const { data: allLeadsData } = useLeads({ all: true });
  const allLeads = Array.isArray(allLeadsData)
    ? allLeadsData
    : (allLeadsData?.leads ?? []);

  const { data: casesData } = useCases();
  const allCases = casesData ?? [];

  const { data: staffData } = useStaff();
  const allStaff = staffData ?? [];

  const activeCaseCount = allCases.filter((c) => c.status === "active").length;
  const pendingActionCount = allLeads.filter(
    (l) => l.convertedCaseId === null,
  ).length;
  const processingIssuesCount = allCases.filter(
    (c) => c.status === "on_hold" || c.status === "pending_review",
  ).length;

  const metricCards = [
    {
      label: "Active cases",
      value: String(activeCaseCount),
      helper: "Currently active",
      icon: BriefcaseBusiness,
    },
    {
      label: "Pending actions",
      value: String(pendingActionCount),
      helper: "Leads awaiting review",
      icon: Clock,
    },
    {
      label: "Processing / issues",
      value: String(processingIssuesCount),
      helper: "Cases on hold or in review",
      icon: UserRound,
    },
    {
      label: "Estimated revenue",
      value: "$—",
      helper: "Based on case volumes",
      icon: FileText,
    },
  ];

  const pipelineItems = pipelineDefs.map((def) => ({
    ...def,
    count: allLeads.filter((l) => l.pipelineStage === def.stage).length,
  }));

  const recentMatters = allCases.slice(0, 5).map((c) => ({
    name: c.client?.name || "—",
    matter: c.caseType?.name ?? c.caseType?.code ?? "—",
    status: caseStatusDisplay[c.status]?.label ?? c.status,
    owner: c.assignee?.name ?? "Unassigned",
    tone: (caseStatusDisplay[c.status]?.tone ?? "neutral") as Tone,
  }));

  const staffItems = allStaff.slice(0, 5).map((s, i) => ({
    name: `${s.firstName} ${s.lastName}`,
    role: staffRoleLabel[s.role] ?? s.role,
    initials: `${s.firstName[0] ?? ""}${s.lastName[0] ?? ""}`.toUpperCase(),
    status: staffStatusDisplay[s.status]?.label ?? s.status,
    statusTone: (staffStatusDisplay[s.status]?.tone ?? "neutral") as Tone,
    avatarTone: AVATAR_TONES[i % AVATAR_TONES.length],
  }));

  return (
    <>
      <SimpleGrid
        as="section"
        columns={{ base: 1, lg: 2, xl: 4 }}
        gap="12px"
        mt="24px"
        aria-label="Dashboard metrics"
      >
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <SurfaceCard key={metric.label} minH="114px" p="18px 20px">
              <HStack
                gap="8px"
                color="fg.muted"
                fontSize="11px"
                fontWeight="500"
                textTransform="uppercase"
              >
                <Icon size={14} strokeWidth={1.8} />
                <Box as="span">{metric.label}</Box>
              </HStack>
              <Text
                m="12px 0 0"
                color="fg"
                fontSize="28px"
                fontWeight="500"
                letterSpacing="0"
              >
                {metric.value}
              </Text>
              <Text m="6px 0 0" color="accent.attorney" fontSize="12px">
                {metric.helper}
              </Text>
            </SurfaceCard>
          );
        })}
      </SimpleGrid>

      <HStack my="20px" mb="22px" gap="8px" wrap="wrap">
        {chips.map(([label, color]) => {
          const active = activeChip === label;
          return (
            <Button
              key={label}
              h="28px"
              minH="28px"
              px="12px"
              border="1px solid"
              borderColor={active ? "brand.solid" : "border"}
              borderRadius="999px"
              bg="bg"
              color={active ? "fg" : "fg.muted"}
              fontSize="12px"
              fontWeight="400"
              variant="outline"
              onClick={() => setActiveChip(label)}
            >
              <Dot color={color} />
              {label}
            </Button>
          );
        })}
      </HStack>

      <Box
        as="section"
        display="grid"
        gridTemplateColumns={{ base: "1fr", xl: "repeat(12, minmax(0, 1fr))" }}
        gap="16px"
      >
        <SurfaceCard gridColumn={{ base: "1", xl: "span 7" }} minH="100%">
          <CardHeader
            title={
              <HStack gap="4px">
                <AlertTriangle size={16} color="var(--brand-cta)" />
                <Box as="span">Priority alerts</Box>
              </HStack>
            }
            action={<CountPill>{alerts.length}</CountPill>}
          />
          <Stack mt="18px" gap="0">
            {alerts.map(([color, title, meta, time]) => (
              <HStack
                key={title}
                align="flex-start"
                gap="10px"
                py="12px"
                borderBottom="1px solid"
                borderColor="border.subtle"
                _last={{ borderBottom: 0 }}
              >
                <Dot color={color} mt="4px" />
                <Box flex="1" minW="0">
                  <RowTitle>{title}</RowTitle>
                  <RowMeta color="fg.muted">{meta}</RowMeta>
                </Box>
                <Text color="fg.muted" fontSize="11px" whiteSpace="nowrap">
                  {time}
                </Text>
              </HStack>
            ))}
          </Stack>
          <FooterLink to="/intake/pipeline/conflict-check">
            View all alerts →
          </FooterLink>
        </SurfaceCard>

        <SurfaceCard gridColumn={{ base: "1", xl: "span 5" }} minH="100%">
          <SectionTitle>Intake pipeline</SectionTitle>
          <SectionSubtitle>Active leads by stage</SectionSubtitle>
          <Stack mt="18px" gap="0">
            {pipelineItems.map(({ title, meta, stage, tone, count }) => (
              <Link key={title} asChild textDecoration="none">
                <RouterLink
                  to={`/intake/pipeline/${stage.replace(/_/g, "-")}`}
                >
                  <HStack
                    justify="space-between"
                    gap="12px"
                    py="12px"
                    borderBottom="1px solid"
                    borderColor="border.subtle"
                    _last={{ borderBottom: 0 }}
                  >
                    <Box>
                      <RowTitle>{title}</RowTitle>
                      <RowMeta>{meta}</RowMeta>
                    </Box>
                    <CountPill tone={tone}>{count}</CountPill>
                  </HStack>
                </RouterLink>
              </Link>
            ))}
          </Stack>
          <FooterLink to="/intake/pipeline/lead-inbox">
            Go to intake pipeline →
          </FooterLink>
        </SurfaceCard>

        <SurfaceCard gridColumn={{ base: "1", xl: "span 6" }} minH="100%">
          <SectionTitle>Recent matters</SectionTitle>
          <SectionSubtitle>Last 5 opened or updated</SectionSubtitle>
          <Stack mt="18px" gap="0">
            {recentMatters.length === 0 ? (
              <Text m="0" color="fg.muted" fontSize="13px" py="12px">
                No cases yet.
              </Text>
            ) : (
              recentMatters.map((row, i) => (
                <Box
                  key={i}
                  display="grid"
                  gridTemplateColumns={{
                    base: "1fr auto",
                    md: "1fr .72fr .5fr .72fr",
                  }}
                  alignItems="start"
                  gap="8px 18px"
                  py="12px"
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                  _last={{ borderBottom: 0 }}
                >
                  <RowTitle>{row.name}</RowTitle>
                  <Text color="fg.muted" fontSize="12px" lineHeight="1.1">
                    {row.matter}
                  </Text>
                  <StatusPill tone={row.tone}>{row.status}</StatusPill>
                  <RowMeta>{row.owner}</RowMeta>
                </Box>
              ))
            )}
          </Stack>
          <FooterLink to="/cases">View all matters →</FooterLink>
        </SurfaceCard>

        <SurfaceCard gridColumn={{ base: "1", xl: "span 6" }} minH="100%">
          <SectionTitle>Staff snapshot</SectionTitle>
          <SectionSubtitle>
            Active staff and certification status
          </SectionSubtitle>
          <Stack mt="18px" gap="0">
            {staffItems.length === 0 ? (
              <Text m="0" color="fg.muted" fontSize="13px" py="12px">
                No staff members yet.
              </Text>
            ) : (
              staffItems.map((s) => (
                <HStack
                  key={s.name}
                  justify="space-between"
                  gap="12px"
                  minH="50px"
                  py="10px"
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                  _last={{ borderBottom: 0 }}
                >
                  <HStack gap="10px" minW="0">
                    <AvatarPill tone={s.avatarTone}>{s.initials}</AvatarPill>
                    <Box minW="0">
                      <RowTitle>{s.name}</RowTitle>
                      <RowMeta>{s.role}</RowMeta>
                    </Box>
                  </HStack>
                  <StatusPill tone={s.statusTone}>{s.status}</StatusPill>
                </HStack>
              ))
            )}
          </Stack>
          <FooterLink to="/staff-management">Manage staff →</FooterLink>
        </SurfaceCard>
      </Box>
    </>
  );
}

function SurfaceCard({
  children,
  ...props
}: {
  children: ReactNode;
} & ComponentProps<typeof Box>) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      p="20px"
      {...props}
    >
      {children}
    </Box>
  );
}

function CardHeader({
  title,
  action,
}: {
  title: ReactNode;
  action: ReactNode;
}) {
  return (
    <HStack align="center" justify="space-between" gap="12px">
      <SectionTitle>{title}</SectionTitle>
      {action}
    </HStack>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text
      as="h2"
      m="0"
      color="fg"
      fontSize="16px"
      fontWeight="500"
      lineHeight="1.05"
    >
      {children}
    </Text>
  );
}

function SectionSubtitle({ children }: { children: ReactNode }) {
  return (
    <Text m="5px 0 0" color="fg.muted" fontSize="13px" lineHeight="1.1">
      {children}
    </Text>
  );
}

function RowTitle({ children }: { children: ReactNode }) {
  return (
    <Text m="0" color="fg" fontSize="13px" fontWeight="500" lineHeight="1.08">
      {children}
    </Text>
  );
}

function RowMeta({
  children,
  color = "fg.muted",
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <Text m="2px 0 0" color={color} fontSize="12px" lineHeight="1.05">
      {children}
    </Text>
  );
}

function Dot({ color, mt }: { color: string; mt?: string }) {
  return (
    <Box
      as="span"
      flex="0 0 auto"
      w="8px"
      h="8px"
      mt={mt}
      borderRadius="full"
      bg={color}
    />
  );
}

function CountPill({
  children,
  tone = "warning",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  const colors = toneColors[tone] ?? toneColors.neutral;

  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      minW="20px"
      minH="18px"
      px="7px"
      borderRadius="999px"
      bg={colors.bg}
      color={colors.color}
      fontSize="10px"
      fontWeight="500"
      lineHeight="1"
      whiteSpace="nowrap"
    >
      {children}
    </Box>
  );
}

function StatusPill({ children, tone }: { children: ReactNode; tone: Tone }) {
  const colors = toneColors[tone] ?? toneColors.neutral;

  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      w="fit-content"
      minH="18px"
      px="8px"
      py="2px"
      borderRadius="999px"
      bg={colors.bg}
      color={colors.color}
      fontSize="10px"
      fontWeight="500"
      lineHeight="1"
      whiteSpace="nowrap"
    >
      {children}
    </Box>
  );
}

function AvatarPill({ children, tone }: { children: ReactNode; tone: Tone }) {
  const colors = toneColors[tone] ?? toneColors.neutral;

  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      flex="0 0 auto"
      w="28px"
      h="28px"
      borderRadius="full"
      bg={colors.bg}
      color={colors.color}
      fontSize="10px"
      fontWeight="500"
      lineHeight="1"
    >
      {children}
    </Box>
  );
}

function FooterLink({ children, to }: { children: ReactNode; to: string }) {
  return (
    <Link
      asChild
      alignSelf="flex-end"
      mt="auto"
      pt="16px"
      color="brand.500"
      fontSize="13px"
      fontWeight="500"
      lineHeight="1.2"
      textDecoration="none"
      _hover={{ color: "brand.600" }}
    >
      <RouterLink to={to}>{children}</RouterLink>
    </Link>
  );
}
