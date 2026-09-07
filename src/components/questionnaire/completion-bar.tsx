import { Box, Flex, Progress, Text } from "@chakra-ui/react";

/**
 * How much of the thing on screen is filled in.
 *
 * Sits under the title of a form or a questionnaire section and answers the
 * two questions someone has when they open one: how far along is this, and is
 * anything *required* still missing. The second is why the bar changes colour
 * rather than only moving — a form at 90% with three empty required fields is
 * not nearly done, and a bar alone would say it was.
 *
 * Shared by the Forms tab and the questionnaire tab. The rail already tells
 * both of them the same story from the outside; this is that story from the
 * inside, and two implementations of it would have drifted.
 */
export function CompletionBar({
  filled,
  total,
  requiredMissing,
  noun,
}: {
  filled: number;
  total: number;
  /** How many required entries are still empty. */
  requiredMissing: number;
  /** Plural name for what is being counted, e.g. "fields", "questions". */
  noun: string;
}) {
  // An empty section is complete rather than 0% — nothing is missing from it.
  const percentage = total === 0 ? 100 : Math.round((filled / total) * 100);

  return (
    <Box mb={4}>
      <Flex justify="space-between" align="baseline" gap={3} mb={1.5}>
        <Text fontSize="12px" color="fg.muted">
          {filled} of {total} {noun} filled
        </Text>
        {requiredMissing > 0 && (
          <Text fontSize="12px" color="fg.error" textAlign="right">
            {requiredMissing} required still empty
          </Text>
        )}
      </Flex>
      <Progress.Root
        value={percentage}
        size="xs"
        colorPalette={requiredMissing > 0 ? "orange" : "green"}
      >
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
    </Box>
  );
}
