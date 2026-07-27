import { IntakeListSkeleton } from "@/components/ui/intake-ui";
import { useCaseReviewIssues } from "@/hooks/use-case-review";
import { Box, Flex, Text } from "@chakra-ui/react";
import { CheckCircle2 } from "lucide-react";
import { IssueCard } from "./issue-card";

/**
 * One matter's AI-review issues, rendered with the same card as the standalone
 * dashboard. Used by the case-detail and lead-drawer AI review tabs. Pass
 * exactly one of `caseId` / `leadId`.
 */
export function MatterIssues({
  caseId,
  leadId,
  enabled = true,
}: {
  caseId?: string;
  leadId?: string;
  enabled?: boolean;
}) {
  // Active issues for this matter (the backend defaults to open/under_review).
  // `enabled` lets a lazily-shown tab (the lead drawer) skip fetching until
  // it is opened.
  const query = useCaseReviewIssues({ caseId, leadId }, enabled);
  const issues = query.data?.data ?? [];

  if (!enabled) return null;
  if (query.isLoading) {
    return <IntakeListSkeleton rows={2} />;
  }

  if (issues.length === 0) {
    return (
      <Flex
        direction="column"
        align="center"
        gap="8px"
        border="1px dashed"
        borderColor="border"
        borderRadius="10px"
        py="32px"
        textAlign="center"
      >
        <Box color="green.500">
          <CheckCircle2 size={26} />
        </Box>
        <Text fontWeight="600" color="fg">
          No AI-flagged issues
        </Text>
        <Text fontSize="13px" color="fg.muted">
          The automated review found nothing outstanding on this matter.
        </Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="14px">
      {issues.map((issue) => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </Flex>
  );
}
