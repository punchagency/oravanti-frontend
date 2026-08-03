import type { CaseReviewIssue } from "@/api/case-review";
import { useCaseReviewIssues } from "@/hooks/use-case-review";
import { IssueActions } from "@/pages/admin/ai-review/components/issue-actions";
import { badgeLabel } from "@/pages/admin/ai-review/severity";
import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react";
import { AlertTriangle } from "lucide-react";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";

/**
 * The matter's open AI-review findings, shown above its documents because most
 * of them are resolved by getting a file in or out. The full picture — history,
 * resolution notes — lives on the AI Review tab; this is the working subset.
 */
export function AlertSection({ caseId }: { caseId: string }) {
  const { data, isLoading } = useCaseReviewIssues({ caseId });
  const issues = data?.data ?? [];

  if (isLoading) {
    return (
      <Box
        bg="bg"
        border="1px solid"
        borderColor="border.muted"
        borderRadius="lg"
        p={5}
        mb={4}
      >
        <ThemeSkeleton h="10px" w="120px" borderRadius="4px" mb={4} />
        <ThemeSkeleton h="72px" w="full" borderRadius="8px" />
      </Box>
    );
  }

  // Nothing flagged is not worth a card — the tab is about the documents.
  if (issues.length === 0) return null;

  const criticalCount = issues.filter((i) => i.badge === "critical").length;

  return (
    <Box
      bg="bg"
      border="1px solid"
      borderColor="brand.emphasized"
      borderRadius="lg"
      p={5}
      mb={4}
    >
      <HStack gap={2} mb={3}>
        <Box color="brand.emphasized">
          <AlertTriangle size={12} />
        </Box>
        <Text
          fontSize="11px"
          fontWeight="500"
          color="fg"
          letterSpacing="0.44px"
          textTransform="uppercase"
        >
          AI Case Review
        </Text>
        <Badge
          size="xs"
          borderRadius="full"
          px={2}
          py={0.5}
          bg={criticalCount > 0 ? "red.subtle" : "brand.subtle"}
          color={criticalCount > 0 ? "red.fg" : "brand.fg"}
          fontWeight="500"
          fontSize="10px"
          textTransform="none"
          ml="auto"
        >
          {criticalCount > 0
            ? `${criticalCount} critical`
            : `${issues.length} issue${issues.length === 1 ? "" : "s"} found`}
        </Badge>
      </HStack>

      <VStack gap={3}>
        {issues.map((issue) => (
          <IssueRow key={issue.id} issue={issue} />
        ))}
      </VStack>
    </Box>
  );
}

function IssueRow({ issue }: { issue: CaseReviewIssue }) {
  const isCritical = issue.badge === "critical";

  return (
    <Box
      border="1px solid"
      borderColor="border.muted"
      borderRadius="md"
      bg="bg"
      p={4}
      w="full"
    >
      <HStack gap={2} mb={2}>
        <Box
          w="8px"
          h="8px"
          borderRadius="sm"
          bg={isCritical ? "red.500" : "brand.solid"}
        />
        <Text fontSize="13px" fontWeight="500" color="fg" flex={1}>
          {issue.title}
        </Text>
        <Badge
          size="xs"
          borderRadius="full"
          px={2}
          py={0.5}
          bg={isCritical ? "red.subtle" : "brand.subtle"}
          color={isCritical ? "red.fg" : "brand.fg"}
          fontWeight="500"
          fontSize="10px"
          textTransform="none"
        >
          {badgeLabel(issue.badge)}
        </Badge>
      </HStack>

      <Text fontSize="12px" color="fg.muted" lineHeight="160%">
        {issue.description}
      </Text>
      {issue.howToResolve && (
        <Text fontSize="12px" color="fg" lineHeight="160%" mt={2}>
          {issue.howToResolve}
        </Text>
      )}

      <IssueActions issue={issue} compact />
    </Box>
  );
}
