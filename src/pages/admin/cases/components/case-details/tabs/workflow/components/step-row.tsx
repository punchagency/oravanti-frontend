import { useAuthStore } from "@/store/auth-store";
import { dayjs, guessTimezone } from "@/utils/date";
import { Badge, Box, Button, Flex, Separator, Text } from "@chakra-ui/react";
import { CheckCircle } from "lucide-react";
import { useState } from "react";
import { CertificationGate } from "../certification-gate";
import { useCompleteStep } from "../hooks";
import type { CaseStepInstance } from "../types";
import { CompleteStepDialog } from "./complete-step-dialog";
import { StepIcon } from "./step-icon";

interface StepRowProps {
  step: CaseStepInstance;
  stepTitle: string;
  requiredCertification: string | null;
  caseId: string;
  onAssigned: () => void;
  onCompleted: () => void;
}

function formatDueDate(iso: string | null): string | null {
  if (!iso) return null;
  // Viewer-local due date.
  return `Due ${dayjs.utc(iso).tz(guessTimezone()).format("MMM D")}`;
}

function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  // Compare against the real UTC instant.
  return dayjs.utc(iso).valueOf() < Date.now();
}

const badgeProps = {
  size: "xs" as const,
  borderRadius: "full",
  px: 2,
  py: 0.5,
  fontWeight: "500",
  fontSize: "10px",
  textTransform: "none" as const,
  whiteSpace: "nowrap" as const,
};

/**
 * A single workflow step row within a module.
 *
 * Steps are auto-assigned to eligible staff when they become active.
 * Admin/owner users see the certification gate (for reassign) and
 * complete button on every non-completed step so they can override
 * assignments or mark work done. Non-admin users only see the gate
 * on unassigned steps and the complete button on in-progress steps.
 *
 * The complete action opens a confirmation dialog (CompleteStepDialog)
 * that captures optional notes before calling the mutation.
 *
 * Layout: icon + title on the top row, controls stacked below aligned
 * with the title text.
 */
export function StepRow({
  step,
  stepTitle,
  requiredCertification,
  caseId,
  onAssigned,
  onCompleted,
}: StepRowProps) {
  const memberRole = useAuthStore((state) => state.memberRole);
  const isAdmin = memberRole === "owner" || memberRole === "admin";

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  const completeMutation = useCompleteStep(caseId);

  const handleConfirmComplete = async (notes: string) => {
    try {
      await completeMutation.mutateAsync({ stepId: step.stepId, notes });
      setShowCompleteDialog(false);
      onCompleted();
    } catch {
      // Toast handled by mutation
    }
  };

  const dueLabel = formatDueDate(step.dueDate);
  const overdue = isOverdue(step.dueDate);

  // ── Completed step ──────────────────────────────────────────────────
  if (step.status === "complete" && step.assignedTo) {
    return (
      <Box
        w="full"
        display="flex"
        alignItems="center"
        gap={2}
        py={{ base: 2, md: 1.5 }}
        px={{ base: 2.5, md: 3 }}
        borderRadius="md"
        border="1px solid"
        borderColor="border.muted"
        _hover={{ bg: "bg.subtle" }}
      >
        <StepIcon status={step.status} />
        <Text
          fontSize="11px"
          color="fg.muted"
          lineHeight="140%"
          flex={1}
          minW={0}
        >
          {stepTitle}
        </Text>
        <Badge {...badgeProps} bg="green.50" color="green.700">
          {step.assignedTo.name}
        </Badge>
      </Box>
    );
  }

  // ── In-review step ─────────────────────────────────────────────────
  if (step.status === "in_review") {
    return (
      <Box
        w="full"
        display="flex"
        alignItems="center"
        gap={2}
        py={{ base: 2, md: 1.5 }}
        px={{ base: 2.5, md: 3 }}
        borderRadius="md"
        border="1px solid"
        borderColor="orange.200"
        bg="orange.50/40"
      >
        <StepIcon status="in_review" />
        <Text fontSize="11px" color="fg" lineHeight="140%" flex={1} minW={0}>
          {stepTitle}
        </Text>
        <Flex gap={1.5} flexWrap="wrap">
          {step.assignedTo && (
            <Badge {...badgeProps} bg="blue.50" color="blue.700">
              {step.assignedTo.name}
            </Badge>
          )}
          <Badge {...badgeProps} bg="orange.50" color="orange.700">
            Review
          </Badge>
        </Flex>
      </Box>
    );
  }

  // ── Active step ─────────────────────────────────────────────────────
  const showGate = isAdmin || !step.assignedTo;
  const showComplete = step.assignedTo && step.status === "in_progress";

  return (
    <>
      <Box
        w="full"
        border="1px solid"
        borderColor="border.muted"
        borderRadius="md"
        _hover={{ bg: "bg.subtle" }}
      >
        {/* ── Top row: icon + title + badges ──────────────────────── */}
        <Flex
          align="center"
          gap={2}
          px={{ base: 2.5, md: 3 }}
          pt={{ base: 2, md: 1.5 }}
          pb={1}
          flexWrap="wrap"
        >
          <StepIcon status={step.status} />
          <Text fontSize="11px" color="fg" lineHeight="140%" flex={1} minW={0}>
            {stepTitle}
          </Text>
          <Flex gap={1.5} flexWrap="wrap">
            {step.assignedTo && (
              <Badge {...badgeProps} bg="blue.50" color="blue.700">
                {step.assignedTo.name}
              </Badge>
            )}
            {dueLabel && (
              <Badge
                {...badgeProps}
                bg={overdue ? "red.50" : "gray.50"}
                color={overdue ? "red.600" : "fg.subtle"}
              >
                {dueLabel}
              </Badge>
            )}
          </Flex>
        </Flex>

        {/* ── Divider before actions ──────────────────────────────── */}
        <Separator mx={{ base: 2.5, md: 3 }} borderColor="border.muted" />

        {/* ── Bottom row: assign + complete, side by side ────────── */}
        <Flex
          px={{ base: 2.5, md: 3 }}
          pb={{ base: 2, md: 1.5 }}
          pt={1.5}
          gap={2}
          align="center"
          flexWrap="wrap"
        >
          {showGate && (
            <Box flex={1} minW={{ base: "full", sm: 0 }}>
              <CertificationGate
                caseId={caseId}
                step={step}
                requiredCertification={requiredCertification}
                onAssigned={onAssigned}
              />
            </Box>
          )}
          {showComplete && (
            <Button
              size="2xs"
              colorPalette="green"
              fontSize="10px"
              h="22px"
              whiteSpace="nowrap"
              w={{ base: "full", sm: "auto" }}
              onClick={() => setShowCompleteDialog(true)}
            >
              <CheckCircle size={10} />
              Mark complete
            </Button>
          )}
        </Flex>
      </Box>

      {/* ── Complete confirmation dialog ──────────────────────────── */}
      <CompleteStepDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        stepTitle={stepTitle}
        onConfirm={handleConfirmComplete}
        isPending={completeMutation.isPending}
      />
    </>
  );
}
