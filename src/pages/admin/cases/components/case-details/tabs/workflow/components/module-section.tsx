import {
  Badge,
  Box,
  Button,
  Collapsible,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CheckCircle, ChevronRight, Lock, Play } from "lucide-react";
import { useTriggerModule } from "../hooks";
import type { CaseModuleInstance, WorkflowModule } from "../types";
import { StepRow } from "./step-row";

interface ModuleSectionProps {
  moduleDef: WorkflowModule;
  moduleInst: CaseModuleInstance;
  caseId: string;
  onRefresh: () => void;
}

/**
 * A collapsible section representing a single workflow module.
 *
 * States:
 * - locked (conditional) → shows dashed notice + "Activate module" button
 * - locked (sequential) → shows "Complete the previous module" message
 * - active → shows step rows with assign/complete actions
 * - completed → shows step rows with read-only status
 *
 * The collapsible trigger displays the module name alongside a status badge
 * (Locked / Active / Completed) and a chevron indicator.
 */
export function ModuleSection({
  moduleDef,
  moduleInst,
  caseId,
  onRefresh,
}: ModuleSectionProps) {
  const triggerModuleMutation = useTriggerModule(caseId);
  const isConditional = !!moduleDef.conditionalActivation;
  const isLocked = moduleInst.status === "locked";

  const handleTriggerModule = async () => {
    try {
      await triggerModuleMutation.mutateAsync(moduleDef.moduleId);
      onRefresh();
    } catch {
      // Toast handled by mutation
    }
  };

  const moduleBadge = (() => {
    if (moduleInst.status === "locked") {
      return (
        <Badge
          size="xs"
          borderRadius="full"
          px={2}
          py={0.5}
          bg="gray.100"
          color="gray.600"
          fontWeight="500"
          fontSize="10px"
          textTransform="none"
          whiteSpace="nowrap"
        >
          <Lock size={8} />
          Locked
        </Badge>
      );
    }
    if (moduleInst.status === "active") {
      return (
        <Badge
          size="xs"
          borderRadius="full"
          px={2}
          py={0.5}
          bg="blue.50"
          color="blue.700"
          fontWeight="500"
          fontSize="10px"
          textTransform="none"
          whiteSpace="nowrap"
        >
          Active
        </Badge>
      );
    }
    return (
      <Badge
        size="xs"
        borderRadius="full"
        px={2}
        py={0.5}
        bg="green.50"
        color="green.700"
        fontWeight="500"
        fontSize="10px"
        textTransform="none"
        whiteSpace="nowrap"
      >
        <CheckCircle size={8} />
        Completed
      </Badge>
    );
  })();

  return (
    <Box
      border="1px solid"
      borderColor="border.muted"
      borderRadius="md"
      bg={moduleInst.status === "completed" ? "bg.subtle" : "bg"}
      opacity={isLocked ? 0.55 : 1}
      transition="opacity 0.15s"
    >
      {/* Module header — always visible */}
      <Collapsible.Root>
        <Box as="div" role="heading">
          <Collapsible.Trigger
            display="flex"
            alignItems="center"
            gap={2}
            w="full"
            px={3}
            py={2.5}
            cursor="pointer"
            _hover={{ bg: "bg.subtle" }}
          >
            {/* Expand indicator */}
            <Collapsible.Indicator
              transition="transform 0.15s"
              _open={{ transform: "rotate(90deg)" }}
            >
              <ChevronRight size={12} />
            </Collapsible.Indicator>

            {/* Module name + status badge */}
            <HStack flex={1} gap={2} minW={0}>
              <Text fontSize="12px" fontWeight="500" color="fg" truncate>
                {moduleDef.name}
              </Text>
              {moduleBadge}
            </HStack>
          </Collapsible.Trigger>
        </Box>

        {/* Collapsible content */}
        <Collapsible.Content>
          {/* Conditional activation notice */}
          {isConditional && isLocked && (
            <Box px={3} pb={2}>
              <VStack
                align="center"
                py={3}
                gap={2}
                border="1px dashed"
                borderColor="border.muted"
                borderRadius="md"
                bg="bg.subtle"
              >
                <Box color="fg.subtle">
                  <Lock size={16} />
                </Box>
                <Text
                  fontSize="11px"
                  color="fg.subtle"
                  textAlign="center"
                  px={2}
                >
                  {moduleDef.conditionalActivation?.label ??
                    "Module requires manual activation"}
                </Text>
                <Button
                  size="xs"
                  variant="outline"
                  borderColor="brand.solid"
                  color="brand.solid"
                  h="26px"
                  fontSize="11px"
                  onClick={handleTriggerModule}
                  loading={triggerModuleMutation.isPending}
                >
                  <Play size={10} />
                  Activate module
                </Button>
              </VStack>
            </Box>
          )}

          {/* Locked but not conditional — show simple notice */}
          {isLocked && !isConditional && (
            <Box px={3} pb={2}>
              <Text fontSize="11px" color="fg.subtle" textAlign="center" py={2}>
                Complete the previous workflow to unlock this one.
              </Text>
            </Box>
          )}

          {/* Help text for active modules */}
          {moduleInst.status === "active" && (
            <Box px={3} pb={1}>
              <Text fontSize="10px" color="fg.muted" textAlign="center">
                Assign staff to each step and mark complete as you go
              </Text>
            </Box>
          )}

          {/* Active or completed — show steps */}
          {!isLocked && (
            <VStack gap={2} px={{ base: 1.5, md: 2 }} pb={2} pt={0.5}>
              {moduleDef.steps.map((stepDef) => {
                const stepInst = moduleInst.steps.find(
                  (s) => s.stepId === stepDef.stepId,
                );
                if (!stepInst) return null;
                return (
                  <StepRow
                    key={stepDef.stepId}
                    step={stepInst}
                    stepTitle={stepDef.title}
                    requiredCertification={stepDef.requiredCertification}
                    caseId={caseId}
                    onAssigned={onRefresh}
                    onCompleted={onRefresh}
                  />
                );
              })}
            </VStack>
          )}
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
}
