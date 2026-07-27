import type { MatterRow } from "@/api/case-review";
import {
  IntakeListSkeleton,
  OutlineButton,
  StatusPill,
  SurfaceCard,
} from "@/components/ui/intake-ui";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useIssuesByCase } from "@/hooks/use-case-review";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { matterPath } from "./severity";

function MatterStatus({ matter }: { matter: MatterRow }) {
  if (matter.status === "clear") {
    return <StatusPill tone="success">Clear</StatusPill>;
  }
  return (
    <HStack gap="8px">
      {matter.critical > 0 && (
        // Critical reads as urgent plain text in the prototype, not a pill.
        <Text fontSize="12px" fontWeight="600" color="#b00020">
          {matter.critical} critical
        </Text>
      )}
      {matter.warnings > 0 && (
        <StatusPill tone="warning">
          {matter.warnings} warning{matter.warnings === 1 ? "" : "s"}
        </StatusPill>
      )}
    </HStack>
  );
}

export function AiReviewByCasePage() {
  useDocumentTitle("Issues by case");
  const navigate = useNavigate();
  const { currentPage, limit, setPagination } = usePaginationQueryStates();
  const query = useIssuesByCase({ page: currentPage, limit });

  return (
    <Box p="24px" maxW="1000px" mx="auto">
      <Text textStyle="heading">Issues by case</Text>
      <Text color="fg.muted" mt="2px" fontSize="14px">
        AI detection status per active matter
      </Text>

      <Box mt="20px">
        {query.isLoading ? (
          <IntakeListSkeleton rows={5} />
        ) : (
          <Flex direction="column" gap="12px">
            {query.data?.data.map((matter) => (
              <SurfaceCard key={`${matter.type}-${matter.id}`}>
                <Flex justifyContent="space-between" alignItems="center" gap="16px">
                  <HStack gap="12px">
                    <Flex
                      w="36px"
                      h="36px"
                      borderRadius="full"
                      bg="bg.muted"
                      color="fg.muted"
                      align="center"
                      justify="center"
                      fontSize="12px"
                      fontWeight="600"
                    >
                      {matter.initials || "—"}
                    </Flex>
                    <Box>
                      <Text fontWeight="600" color="fg" fontSize="14px">
                        {matter.name}
                      </Text>
                      <Text fontSize="12px" color="fg.muted" fontFamily="mono">
                        {matter.reference ?? "Lead"}
                      </Text>
                    </Box>
                  </HStack>
                  <HStack gap="16px">
                    <MatterStatus matter={matter} />
                    <OutlineButton
                      onClick={() => navigate(matterPath(matter.type, matter.id))}
                    >
                      <HStack gap="5px">
                        <ArrowRight size={13} />
                        <Text>View issues</Text>
                      </HStack>
                    </OutlineButton>
                  </HStack>
                </Flex>
              </SurfaceCard>
            ))}
          </Flex>
        )}
      </Box>

      {query.data && query.data.pagination.total > limit && (
        <Box mt="16px">
          <PaginationControls
            total={query.data.pagination.total}
            currentPage={currentPage}
            limit={limit}
            onPageChange={(page) => setPagination({ currentPage: page })}
            onLimitChange={(l) => setPagination({ limit: l, currentPage: 1 })}
          />
        </Box>
      )}
    </Box>
  );
}
