import type { CaseReviewIssue, IssueAction } from "@/api/case-review";
import { BrandButton, OutlineButton, StatusPill } from "@/components/ui/intake-ui";
import { useRunIssueAction } from "@/hooks/use-case-review";
import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Clock,
} from "lucide-react";
import { memo, useState } from "react";
import { useNavigate } from "react-router";
import {
  badgeLabel,
  cardTint,
  matterDocumentsPath,
  matterPath,
} from "../severity";
import { AssigneeDialog } from "./assignee-dialog";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/**
 * One expanded issue card: severity, category, prose, meta, resolution
 * guidance, then the contextual action buttons. Shared by the dashboard and
 * (later) the per-matter tabs, so all surfaces render an issue identically.
 */
function IssueCardBase({ issue }: { issue: CaseReviewIssue }) {
  const navigate = useNavigate();
  const runAction = useRunIssueAction();
  const tint = cardTint(issue.badge);
  const SeverityIcon = issue.badge === "critical" ? AlertCircle : AlertTriangle;

  const [assigning, setAssigning] = useState<IssueAction | null>(null);

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

  const busy = runAction.isPending;

  return (
    <Box
      bg={tint.bg}
      border="1px solid"
      borderColor={tint.borderColor}
      borderRadius="10px"
      p="18px"
    >
      <Flex justifyContent="space-between" alignItems="flex-start" gap="16px">
        <HStack gap="8px" alignItems="center">
          <Box color={issue.badge === "critical" ? "red.500" : "orange.500"}>
            <SeverityIcon size={16} />
          </Box>
          <Text fontSize="12px" fontWeight="600" color="fg">
            {badgeLabel(issue.badge)}
          </Text>
          <Text
            fontSize="11px"
            fontWeight="600"
            letterSpacing="0.06em"
            color="fg.muted"
          >
            {issue.category}
          </Text>
        </HStack>
        <Text fontSize="11px" color="fg.muted" whiteSpace="nowrap">
          {formatDateTime(issue.detectedAt)}
        </Text>
      </Flex>

      <Text mt="10px" fontSize="15px" fontWeight="600" color="fg">
        {issue.title}
      </Text>
      <Text mt="4px" fontSize="13px" color="fg.muted" lineHeight="1.5">
        {issue.description}
      </Text>

      <HStack mt="10px" gap="10px" fontSize="12px" color="fg.muted" flexWrap="wrap">
        {issue.client && (
          <HStack gap="4px">
            <Briefcase size={12} />
            <Text fontWeight="500" color="fg">
              {issue.client.name}
            </Text>
          </HStack>
        )}
        {issue.scenario.reference && (
          <Text fontFamily="mono">{issue.scenario.reference}</Text>
        )}
        {issue.caseTypeName && (
          <StatusPill tone="info">{issue.caseTypeName}</StatusPill>
        )}
      </HStack>

      {issue.howToResolve && (
        <Box mt="14px" borderTop="1px solid" borderColor="border.muted" pt="12px">
          <Text fontSize="12px" fontWeight="600" color="fg.muted">
            How to resolve:
          </Text>
          <Text mt="2px" fontSize="13px" color="fg" lineHeight="1.5">
            {issue.howToResolve}
          </Text>
        </Box>
      )}

      <HStack mt="14px" gap="8px" flexWrap="wrap">
        {issue.actions.map((action, i) => {
          const Btn =
            action.variant === "primary" && i === 0 && !action.stub
              ? BrandButton
              : OutlineButton;
          const isNav = action.kind === "navigate";
          return (
            <Btn
              key={action.key}
              disabled={action.stub || busy}
              title={action.stub ? "Not yet available" : undefined}
              onClick={() => onAction(action)}
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
    </Box>
  );
}

/** Memoised so a parent re-render (e.g. stats loading) does not re-render every card. */
export const IssueCard = memo(IssueCardBase);
