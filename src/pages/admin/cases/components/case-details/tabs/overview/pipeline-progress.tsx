import { Box, Timeline } from "@chakra-ui/react";
import { SectionLabel } from "../../shared";

const pipelineSteps = [
  { label: "Intake", stage: "Intake & Conflict Check", completed: true },
  { label: "Consult", stage: "Questionnaire & Consultation", completed: true },
  { label: "File", stage: "Document Prep & Filing", completed: true },
  { label: "Review", stage: "USCIS / Court Review", completed: true },
  { label: "Done", stage: "Case Resolution", completed: false },
];

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
