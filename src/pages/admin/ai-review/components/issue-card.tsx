import type { CaseReviewIssue } from "@/api/case-review";
import { StatusPill } from "@/components/ui/intake-ui";
import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { AlertCircle, AlertTriangle, Briefcase } from "lucide-react";
import { memo } from "react";
import { badgeLabel, cardTint } from "../severity";
import { IssueActions } from "./issue-actions";

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
  const tint = cardTint(issue.badge);
  const SeverityIcon = issue.badge === "critical" ? AlertCircle : AlertTriangle;

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

      <IssueActions issue={issue} />
    </Box>
  );
}

/** Memoised so a parent re-render (e.g. stats loading) does not re-render every card. */
export const IssueCard = memo(IssueCardBase);
