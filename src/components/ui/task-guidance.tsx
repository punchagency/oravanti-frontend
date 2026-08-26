import { Box, Button, Collapsible, HStack, List, Text, VStack } from "@chakra-ui/react";
import { AlertTriangle, BookOpen, CheckCheck, ChevronDown, ListChecks, Target } from "lucide-react";
import type { ReactNode } from "react";
import { guidanceOf, hasGuidance, type TaskGuidanceFields } from "@/utils/task-guidance";

/**
 * The staff-facing guidance carried on a task, behind a disclosure.
 *
 * The five fields are snapshotted onto the task from its template step when the
 * workflow materializes, so this renders the instructions written for the work
 * as it was handed out — not the current template's wording, which may have
 * moved on since.
 *
 * Every section is independently optional and renders only when it has content.
 * A task with none of them (`ad_hoc` work, a pipeline step, a workflow step
 * whose author had nothing to add) renders nothing at all — not even the
 * trigger — rather than a control that opens onto empty headings.
 *
 * The section order is deliberate and fixed: why → how → done → what goes
 * wrong → where it comes from. A reader learns the shape once on their first
 * task and then knows where to look on every task after it.
 *
 * Shown on finished work too. A completed step's guidance is what a reviewer
 * checks the work against, what a reopened step needs again, and how someone
 * new learns the process from matters already run.
 */

interface SectionProps {
  icon: ReactNode;
  label: string;
  /** Set on the one section that carries a consequence, so it reads as a warning. */
  tone?: "warning";
  children: ReactNode;
}

function Section({ icon, label, tone, children }: SectionProps) {
  return (
    <Box>
      <HStack gap={1.5} mb={1} color={tone === "warning" ? "orange.600" : "fg.subtle"}>
        {icon}
        <Text fontSize="9px" fontWeight="600" textTransform="uppercase" letterSpacing="0.7px">
          {label}
        </Text>
      </HStack>
      {children}
    </Box>
  );
}

interface TaskGuidanceProps {
  task: TaskGuidanceFields;
  /** Trigger type size, so the card and the compact board row can differ. */
  size?: "sm" | "xs";
  /**
   * Rendered beside this component's trigger, sharing its row.
   *
   * Exists because `Collapsible.Root` has to enclose both the trigger and the
   * panel: a sibling control placed next to the Root instead would squeeze the
   * expanded panel into a narrow flex item. Passing that control through here
   * keeps the triggers on one line and lets the panel span the full width
   * beneath them. The queue card uses it for the review-thread toggle.
   */
  trailing?: ReactNode;
}

export function TaskGuidance({ task, size = "sm", trailing }: TaskGuidanceProps) {
  // No guidance and nothing to sit beside it means no row at all. When there is
  // a trailing control it still has to render, or the card loses its thread
  // toggle on every ad-hoc task.
  if (!hasGuidance(task)) return trailing ? <>{trailing}</> : null;

  const bullets = guidanceOf(task);
  const fontSize = size === "xs" ? "10px" : "11px";

  return (
    <Collapsible.Root>
      <HStack gap={5} flexWrap="wrap" align="center">
        <Collapsible.Trigger asChild>
        <Button
          variant="plain"
          h="auto"
          minH="auto"
          minW={0}
          p={0}
          fontSize={fontSize}
          fontWeight="400"
          color="fg.muted"
          _hover={{ color: "fg" }}
        >
          <Collapsible.Indicator
            transition="transform 0.15s"
            _open={{ transform: "rotate(180deg)" }}
            display="inline-flex"
          >
            <ChevronDown size={size === "xs" ? 10 : 12} />
          </Collapsible.Indicator>
          How to do this
        </Button>
        </Collapsible.Trigger>
        {trailing}
      </HStack>

      <Collapsible.Content>
        <VStack align="stretch" gap={3} mt={2.5} pt={2.5} borderTop="1px solid" borderColor="border.subtle">
          {task.purpose && (
            <Section icon={<Target size={11} />} label="Why this matters">
              <Text fontSize="11px" color="fg.muted" lineHeight="1.55">
                {task.purpose}
              </Text>
            </Section>
          )}

          {bullets.length > 0 && (
            <Section icon={<ListChecks size={11} />} label="How to carry it out">
              <List.Root gap={1} pl={0} listStyle="none">
                {bullets.map((item, i) => (
                  <List.Item key={i} display="flex" gap={2} alignItems="start">
                    <Text fontSize="11px" color="fg.subtle" lineHeight="1.55" flexShrink={0}>
                      {i + 1}.
                    </Text>
                    <Text fontSize="11px" color="fg.muted" lineHeight="1.55">
                      {item}
                    </Text>
                  </List.Item>
                ))}
              </List.Root>
            </Section>
          )}

          {task.doneWhen && (
            <Section icon={<CheckCheck size={11} />} label="Done when">
              <Text fontSize="11px" color="fg.muted" lineHeight="1.55">
                {task.doneWhen}
              </Text>
            </Section>
          )}

          {task.pitfalls && (
            <Section icon={<AlertTriangle size={11} />} label="Common pitfall" tone="warning">
              <Text fontSize="11px" color="fg.muted" lineHeight="1.55">
                {task.pitfalls}
              </Text>
            </Section>
          )}

          {task.authority && (
            <Section icon={<BookOpen size={11} />} label="Authority">
              <Text fontSize="11px" color="fg.subtle" lineHeight="1.55" fontFamily="mono">
                {task.authority}
              </Text>
            </Section>
          )}
        </VStack>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
