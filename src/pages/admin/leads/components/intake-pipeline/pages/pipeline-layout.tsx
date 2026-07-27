import { Box, Breadcrumb, HStack, Stack, Text } from "@chakra-ui/react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import type { LeadLayout, PipelineStage } from "@/api/leads";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";

const STAGE_ORDER: Record<PipelineStage, number> = {
  lead_inbox: 0,
  conflict_check: 1,
  questionnaire: 2,
  consultation: 3,
  fee_agreement: 4,
  case_opening: 5,
};

const STEP_REQUIRED_STAGE: Record<string, PipelineStage> = {
  conflict_check: "conflict_check",
  questionnaire: "questionnaire",
  consultation: "consultation",
  case_opening: "fee_agreement",
};

const STEP_TITLES: Record<string, string> = {
  conflict_check: "Conflict check",
  questionnaire: "Questionnaire",
  consultation: "Consultation & notes",
  case_opening: "Case opening",
};

// ─── Skeletons ───────────────────────────────────────────────────────────────

function BreadcrumbSkeleton() {
  return (
    <HStack gap={2}>
      <ThemeSkeleton h="10px" w="32px" borderRadius="4px" />
      <ThemeSkeleton h="10px" w="6px" borderRadius="4px" />
      <ThemeSkeleton h="10px" w="60px" borderRadius="4px" />
      <ThemeSkeleton h="10px" w="6px" borderRadius="4px" />
      <ThemeSkeleton h="10px" w="80px" borderRadius="4px" />
    </HStack>
  );
}

function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      p={4}
    >
      <HStack justify="space-between" align="flex-start" mb={3}>
        <Box flex={1}>
          <ThemeSkeleton h="14px" w="55%" borderRadius="4px" mb={2} />
          <HStack gap={2}>
            <ThemeSkeleton h="16px" w="32px" borderRadius="full" />
            <ThemeSkeleton h="10px" w="90px" borderRadius="4px" />
          </HStack>
        </Box>
        <ThemeSkeleton h="18px" w="70px" borderRadius="full" />
      </HStack>
      <ThemeSkeleton h="10px" w="80%" borderRadius="4px" mb={2} />
      <ThemeSkeleton h="10px" w="60%" borderRadius="4px" mb={3} />
      <Box borderTop="1px solid" borderColor="border.subtle" pt={3} mt={2}>
        {Array.from({ length: rows }, (_, i) => (
          <ThemeSkeleton
            key={i}
            h="10px"
            w={i === rows - 1 ? "45%" : `${80 - i * 10}%`}
            borderRadius="4px"
            mb={i < rows - 1 ? 2 : 0}
          />
        ))}
      </Box>
    </Box>
  );
}

export function ConflictCheckSkeleton() {
  return (
    <Stack gap={4} pt={4}>
      <BreadcrumbSkeleton />
      <Box
        p={3}
        border="1px solid"
        borderColor="brand.500"
        borderRadius="7px"
        bg="#fff8e8"
      >
        <HStack gap={2}>
          <ThemeSkeleton h="15px" w="15px" borderRadius="full" />
          <ThemeSkeleton h="10px" w="70%" borderRadius="4px" />
        </HStack>
      </Box>
      <CardSkeleton rows={4} />
    </Stack>
  );
}

export function QuestionnaireSkeleton() {
  return (
    <Stack gap={4} pt={4}>
      <BreadcrumbSkeleton />
      <HStack justify="space-between">
        <ThemeSkeleton h="12px" w="140px" borderRadius="4px" />
        <ThemeSkeleton h="28px" w="130px" borderRadius="6px" />
      </HStack>
      <CardSkeleton rows={3} />
    </Stack>
  );
}

export function ConsultationPageSkeleton() {
  return (
    <Stack gap={4} pt={4}>
      <BreadcrumbSkeleton />
      <HStack justify="space-between">
        <ThemeSkeleton h="12px" w="100px" borderRadius="4px" />
        <HStack gap={2}>
          <ThemeSkeleton h="28px" w="100px" borderRadius="6px" />
          <ThemeSkeleton h="28px" w="90px" borderRadius="6px" />
        </HStack>
      </HStack>
      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="10px"
        bg="bg"
        p={4}
      >
        <HStack gap={3} mb={4}>
          <ThemeSkeleton h="40px" w="40px" borderRadius="full" />
          <Box flex={1}>
            <ThemeSkeleton h="14px" w="45%" borderRadius="4px" mb={2} />
            <ThemeSkeleton h="10px" w="30%" borderRadius="4px" />
          </Box>
          <ThemeSkeleton h="18px" w="70px" borderRadius="full" />
        </HStack>
        <ThemeSkeleton h="10px" w="60%" borderRadius="4px" mb={2} />
        <ThemeSkeleton h="10px" w="45%" borderRadius="4px" mb={3} />
        <Box borderTop="1px solid" borderColor="border.subtle" pt={3}>
          <ThemeSkeleton h="10px" w="35%" borderRadius="4px" mb={2} />
          <ThemeSkeleton h="60px" w="100%" borderRadius="6px" mb={3} />
          <HStack gap={2}>
            <ThemeSkeleton h="28px" w="110px" borderRadius="6px" />
            <ThemeSkeleton h="28px" w="90px" borderRadius="6px" />
          </HStack>
        </Box>
      </Box>
    </Stack>
  );
}

export function CaseOpeningSkeleton() {
  return (
    <Stack gap={4} pt={4}>
      <BreadcrumbSkeleton />
      <HStack justify="space-between">
        <ThemeSkeleton h="12px" w="90px" borderRadius="4px" />
        <ThemeSkeleton h="18px" w="100px" borderRadius="full" />
      </HStack>
      <CardSkeleton rows={2} />
    </Stack>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────

interface PipelineLayoutProps {
  lead: LeadLayout;
  activeStep: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function PipelineLayout({
  lead,
  activeStep,
  isLoading,
  children,
}: PipelineLayoutProps) {
  const title = STEP_TITLES[activeStep] ?? "Pipeline";
  useDocumentTitle(`${title} – Lead – Oravanti`);

  if (isLoading) {
    return <ConflictCheckSkeleton />;
  }

  const requiredStage = STEP_REQUIRED_STAGE[activeStep];
  const currentStageIndex = STAGE_ORDER[lead.pipelineStage];
  const requiredStageIndex = STAGE_ORDER[requiredStage];

  if (currentStageIndex < requiredStageIndex) {
    return (
      <Stack gap="16px" pt="24px">
        <Box
          p="16px"
          border="1px solid"
          borderColor="#fde68a"
          borderRadius="8px"
          bg="#fffbeb"
          color="#92400e"
          fontSize="13px"
        >
          <Text fontWeight="600" mb="4px">
            Previous step not yet completed
          </Text>
          <Text m="0" color="fg.muted" fontSize="12px">
            {lead.name} is currently in the{" "}
            <strong>{lead.pipelineStage.replace(/_/g, " ")}</strong> stage.
            Please complete the previous steps before accessing{" "}
            {activeStep === "case_opening"
              ? "case opening"
              : activeStep.replace(/_/g, " ")}
            .
          </Text>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack gap="16px" pt="24px">
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link asChild>
              <Link
                to="/leads"
                style={{
                  color: "fg.muted",
                  fontSize: "12px",
                  textDecoration: "none",
                }}
              >
                Leads
              </Link>
            </Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator>
            <ChevronRight size={12} />
          </Breadcrumb.Separator>
          <Breadcrumb.Item>
            <Breadcrumb.Link asChild>
              <Link
                to={`/leads/${lead.id}`}
                style={{
                  color: "fg.muted",
                  fontSize: "12px",
                  textDecoration: "none",
                }}
              >
                {lead.name}
              </Link>
            </Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator>
            <ChevronRight size={12} />
          </Breadcrumb.Separator>
          <Breadcrumb.Item>
            <Breadcrumb.CurrentLink color="fg" fontSize="12px" fontWeight="500">
              {title}
            </Breadcrumb.CurrentLink>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>

      {children}
    </Stack>
  );
}
