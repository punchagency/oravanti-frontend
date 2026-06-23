import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { Download, UserPlus } from "lucide-react";
import { PaginationControls } from "../../components/pagination-controls";
import { CreateTeamDialog } from "./components/create-team/dialog";
import { TeamsDesktopList } from "./components/teams-desktop-list";
import { TeamsDesktopSkeleton } from "./components/teams-desktop-skeleton";
import { TeamsFilters } from "./components/teams-filters";
import { TeamsMobileList } from "./components/teams-mobile-list";
import { TeamsMobileSkeleton } from "./components/teams-mobile-skeleton";
import { TeamsStatusSummary } from "./components/teams-status-summary";
import { TeamsDataProvider, useTeamsData } from "./teams-data-context";

function TeamsContent() {
  const { isLoading, pagination, currentPage, pageLimit, setPagination } =
    useTeamsData();

  return (
    <>
      <Flex
        as="header"
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "flex-start" }}
        justify="space-between"
        gap="16px"
        pb="16px"
      >
        <Box>
          <Text
            as="h1"
            m="0"
            color="fg"
            fontSize="22px"
            fontWeight="500"
            lineHeight="1.2"
          >
            Teams
          </Text>
          <Text m="6px 0 0" color="fg.muted" fontSize="13px">
            Manage teams, view workload, and assign members
          </Text>
        </Box>
        <HStack gap="8px" w={{ base: "full", md: "auto" }}>
          <OutlineButton flex={{ base: 1, md: "initial" }}>
            <Download size={14} />
            Export
          </OutlineButton>
          <CreateTeamDialog>
            <BrandButton flex={{ base: 1, md: "initial" }}>
              <UserPlus size={15} />
              Create team
            </BrandButton>
          </CreateTeamDialog>
        </HStack>
      </Flex>

      {isLoading ? (
        <>
          <TeamsStatusSummary />
          <TeamsFilters />
          <TeamsDesktopSkeleton />
          <TeamsMobileSkeleton />
        </>
      ) : (
        <>
          <TeamsStatusSummary />
          <TeamsFilters />
          <TeamsDesktopList />
          <TeamsMobileList />
          {pagination.total > 0 && (
            <PaginationControls
              total={pagination.total}
              page={currentPage}
              limit={pageLimit}
              onPageChange={(page) =>
                setPagination({ currentPage: page, limit: pageLimit })
              }
              onLimitChange={(limit) =>
                setPagination({ currentPage: 1, limit })
              }
            />
          )}
        </>
      )}
    </>
  );
}

export default function Teams() {
  return (
    <TeamsDataProvider>
      <TeamsContent />
    </TeamsDataProvider>
  );
}
