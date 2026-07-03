import { Box, Timeline } from "@chakra-ui/react";
import { pipelineSteps, SectionLabel } from "../../shared";

export function PipelineProgress() {
  return (
    <>
      <SectionLabel>Pipeline progress</SectionLabel>
      <Timeline.Root
        size="sm"
        variant="plain"
        colorPalette="green"
        mb={3}
      >
        {pipelineSteps.map((step) => (
          <Timeline.Item key={step.label}>
            <Timeline.Connector>
              <Timeline.Separator />
              <Timeline.Indicator>
                <Box w="5px" h="5px" borderRadius="full" bg="currentColor" />
              </Timeline.Indicator>
            </Timeline.Connector>
            <Timeline.Content>
              <Timeline.Title
                color={step.completed ? "fg" : "fg.subtle"}
              >
                {step.stage}
              </Timeline.Title>
            </Timeline.Content>
          </Timeline.Item>
        ))}
      </Timeline.Root>
    </>
  );
}
