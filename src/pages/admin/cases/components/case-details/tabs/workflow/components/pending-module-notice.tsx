import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { Lock, Play } from "lucide-react";
import type { WorkflowTemplateModule } from "@/api/workflows";
import { describeCondition } from "../describe";
import { stepsOf } from "../group-tasks";

interface PendingModuleNoticeProps {
  module: WorkflowTemplateModule;
  onActivate?: () => void;
  isActivating?: boolean;
}

/**
 * A module in the template whose steps haven't been created yet.
 *
 * Shown collapsed and greyed rather than hidden. A paralegal seeing "Government
 * Pre-Suit Notice — unlocks when defendant type is government entity" learns
 * what's coming and what would bring it about; a paralegal seeing nothing has
 * no way to tell a module that doesn't apply from one that's missing.
 *
 * `manual` modules get an activate button — someone decides. `conditional`
 * modules get an explanation and no button: they unlock by the case's facts
 * changing (recorded in the practice-area panel), not by being clicked.
 */
export function PendingModuleNotice({
  module,
  onActivate,
  isActivating = false,
}: PendingModuleNoticeProps) {
  const isManual = module.activationType === "manual";
  const stepCount = stepsOf(module).length;

  const explanation = isManual
    ? "Activated by a staff member when this stage begins"
    : module.activationCondition
      ? `Unlocks when ${describeCondition(module.activationCondition)}`
      : "Unlocks when this case's details meet its condition";

  return (
    <Box
      border="1px dashed"
      borderColor="border.muted"
      borderRadius="6px"
      px={3}
      py={2.5}
      bg="bg.subtle"
    >
      <HStack align="start" gap={2}>
        <Box color="fg.subtle" pt="2px">
          <Lock size={13} />
        </Box>

        <VStack align="stretch" gap={0.5} flex={1} minW={0}>
          <Text fontSize="12px" fontWeight="500" color="fg.muted">
            {module.name}
          </Text>
          <Text fontSize="10px" color="fg.subtle">
            {explanation} · {stepCount} {stepCount === 1 ? "step" : "steps"}
          </Text>
        </VStack>

        {isManual && onActivate && (
          <Button
            size="xs"
            variant="outline"
            borderColor="brand.solid"
            color="brand.solid"
            h="24px"
            fontSize="11px"
            onClick={onActivate}
            loading={isActivating}
          >
            <Play size={10} />
            Activate
          </Button>
        )}
      </HStack>
    </Box>
  );
}
