import {
  Box,
  Button,
  HStack,
  Link,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { AlertTriangle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { Link as RouterLink } from "react-router";
import { alerts, chips, matters, metrics, pipeline, staff } from "../data";

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

export function OverviewView() {
  const [activeChip, setActiveChip] = useState<string>(chips[0][0]);

  return (
    <>
      <SimpleGrid
        as="section"
        columns={{ base: 1, lg: 2, xl: 4 }}
        gap="12px"
        mt="24px"
        aria-label="Dashboard metrics"
      >
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <SurfaceCard key={metric.label} minH="114px" p="18px 20px">
              <HStack gap="8px" color="fg.muted" fontSize="11px" fontWeight="500" textTransform="uppercase">
                <Icon size={14} strokeWidth={1.8} />
                <Box as="span">{metric.label}</Box>
              </HStack>
              <Text m="12px 0 0" color="fg" fontSize="28px" fontWeight="500" letterSpacing="0">
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
          <FooterLink to="/admin/intake/pipeline/conflict-check">
            View all alerts →
          </FooterLink>
        </SurfaceCard>

        <SurfaceCard gridColumn={{ base: "1", xl: "span 5" }} minH="100%">
          <SectionTitle>Intake pipeline</SectionTitle>
          <SectionSubtitle>Active leads by stage</SectionSubtitle>
          <Stack mt="18px" gap="0">
            {pipeline.map(([title, meta, count, tone]) => (
              <Link key={title} asChild textDecoration="none">
                <RouterLink to="/admin/intake/pipeline/lead-inbox">
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
                    <CountPill tone={tone as Tone}>{count}</CountPill>
                  </HStack>
                </RouterLink>
              </Link>
            ))}
          </Stack>
          <FooterLink to="/admin/intake/pipeline/lead-inbox">
            Go to intake pipeline →
          </FooterLink>
        </SurfaceCard>

        <SurfaceCard gridColumn={{ base: "1", xl: "span 6" }} minH="100%">
          <SectionTitle>Recent matters</SectionTitle>
          <SectionSubtitle>Last 5 opened or updated</SectionSubtitle>
          <Stack mt="18px" gap="0">
            {matters.map(([name, matter, status, owner, tone]) => (
              <Box
                key={name}
                display="grid"
                gridTemplateColumns={{ base: "1fr auto", md: "1fr .72fr .5fr .72fr" }}
                alignItems="start"
                gap="8px 18px"
                py="12px"
                borderBottom="1px solid"
                borderColor="border.subtle"
                _last={{ borderBottom: 0 }}
              >
                <RowTitle>{name}</RowTitle>
                <Text color="fg.muted" fontSize="12px" lineHeight="1.1">
                  {matter}
                </Text>
                <StatusPill tone={tone as Tone}>{status}</StatusPill>
                <RowMeta>{owner}</RowMeta>
              </Box>
            ))}
          </Stack>
          <FooterLink to="/admin/cases/all-matters">View all matters →</FooterLink>
        </SurfaceCard>

        <SurfaceCard gridColumn={{ base: "1", xl: "span 6" }} minH="100%">
          <SectionTitle>Staff snapshot</SectionTitle>
          <SectionSubtitle>Active staff and certification status</SectionSubtitle>
          <Stack mt="18px" gap="0">
            {staff.map(([name, role, initials, status, statusTone, avatarTone]) => (
              <HStack
                key={name}
                justify="space-between"
                gap="12px"
                minH="50px"
                py="10px"
                borderBottom="1px solid"
                borderColor="border.subtle"
                _last={{ borderBottom: 0 }}
              >
                <HStack gap="10px" minW="0">
                  <AvatarPill tone={avatarTone as Tone}>{initials}</AvatarPill>
                  <Box minW="0">
                    <RowTitle>{name}</RowTitle>
                    <RowMeta>{role}</RowMeta>
                  </Box>
                </HStack>
                <StatusPill tone={statusTone as Tone}>{status}</StatusPill>
              </HStack>
            ))}
          </Stack>
          <FooterLink to="/admin/staff/accounts">Manage staff →</FooterLink>
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

function CardHeader({ title, action }: { title: ReactNode; action: ReactNode }) {
  return (
    <HStack align="center" justify="space-between" gap="12px">
      <SectionTitle>{title}</SectionTitle>
      {action}
    </HStack>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text as="h2" m="0" color="fg" fontSize="16px" fontWeight="500" lineHeight="1.05">
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
