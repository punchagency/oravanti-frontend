import type { CaseReviewIssue, IssueAction } from "@/api/case-review";
import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { useRunIssueAction } from "@/hooks/use-case-review";
import { Box, HStack, Text } from "@chakra-ui/react";
import { ArrowRight, Clock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { matterDocumentsPath, matterPath } from "../severity";
import { AssigneeDialog } from "./assignee-dialog";

/**
 * An issue's contextual action buttons.
 *
 * Shared so every surface offering these — the dashboard card, the questionnaire
 * documents tab — runs the same dispatch. The set comes from the server, so a
 * surface never has to know which actions an issue type supports.
 */
export function IssueActions({
  issue,
  compact = false,
}: {
  issue: Pick<CaseReviewIssue, "id" | "actions" | "scenario">;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const runAction = useRunIssueAction();
  const [assigning, setAssigning] = useState<IssueAction | null>(null);
  const busy = runAction.isPending;

  const onAction = (action: IssueAction) => {
    if (action.stub) return;
    if (action.kind === "navigate") {
      const { type, id } = issue.scenario;
      navigate(
        action.target === "document"
          ? matterDocumentsPath(type, id)
          : matterPath(type, id),
      );
      return;
    }
    if (action.requiresAssignee) {
      setAssigning(action);
      return;
    }
    runAction.mutate({ id: issue.id, actionKey: action.key });
  };

  return (
    <>
      <HStack mt={compact ? "10px" : "14px"} gap="8px" flexWrap="wrap">
        {issue.actions.map((action, i) => {
          const Btn =
            !compact && action.variant === "primary" && i === 0 && !action.stub
              ? BrandButton
              : OutlineButton;
          const isNav = action.kind === "navigate";
          return (
            <Btn
              key={action.key}
              disabled={action.stub || busy}
              title={action.stub ? "Not yet available" : undefined}
              onClick={() => onAction(action)}
              {...(compact ? { h: "28px", px: "10px" } : {})}
            >
              <HStack gap="5px">
                {isNav && <ArrowRight size={13} />}
                <Text>{action.label}</Text>
                {action.stub && (
                  <Box as="span" color="fg.subtle" display="inline-flex">
                    <Clock size={12} />
                  </Box>
                )}
              </HStack>
            </Btn>
          );
        })}
      </HStack>

      <AssigneeDialog
        issueId={issue.id}
        actionLabel={assigning?.label ?? ""}
        open={assigning !== null}
        onOpenChange={({ open }) => !open && setAssigning(null)}
        busy={busy}
        onConfirm={(assigneeStaffId) => {
          if (!assigning) return;
          runAction.mutate(
            { id: issue.id, actionKey: assigning.key, assigneeStaffId },
            { onSuccess: () => setAssigning(null) },
          );
        }}
      />
    </>
  );
}
