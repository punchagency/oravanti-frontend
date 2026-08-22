import { dayjs, guessTimezone } from "@/utils/date";
import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageTitle } from "@/components/layout/shared/nav-context";
import { useInvitationsList } from "@/hooks/use-invitations-list";
import { useTeamsList } from "@/hooks/use-teams-list";
import { useCancelInvitation } from "@/hooks/useCancelInvitation";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useCanCreateStaff } from "@/hooks/use-can-create-staff";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { useResendInvitation } from "@/hooks/useResendInvitation";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Combobox,
  createListCollection,
  Flex,
  HStack,
  Input,
  Portal,
  ScrollArea,
  Spinner,
  Table,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useDebounce } from "@uidotdev/usehooks";
import { Download, RefreshCw, Search, UserPlus, X } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { InviteStaffDialog } from "../../invite-staff/dialog";
import { InvitationMobileList } from "./components/invitation-mobile-list";
import { InvitationStatusSummary } from "./components/invitation-status-summary";
import { InvitationsSkeleton } from "./components/invitations-skeleton";

const roleItems = [
  { value: "attorney", label: "Attorney" },
  { value: "paralegal", label: "Paralegal" },
  { value: "admin", label: "Admin" },
];

const statusItems = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "canceled", label: "Canceled" },
];

function getInvitationStatusStyles(status: string) {
  switch (status) {
    case "pending":
      return { bg: "rgba(83, 74, 183, 0.15)", color: "#8B83EC" };
    case "accepted":
      return { bg: "rgba(29, 158, 117, 0.15)", color: "#1D9E75" };
    case "rejected":
      return { bg: "rgba(224, 84, 84, 0.15)", color: "#E05454" };
    case "canceled":
      return { bg: "rgba(180, 178, 169, 0.2)", color: "fg.muted" };
    default:
      return { bg: "bg.muted", color: "fg" };
  }
}

function getInvitationStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    case "canceled":
      return "Canceled";
    default:
      return status;
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  // Viewer-local date (stored value is UTC).
  return dayjs.utc(dateStr).tz(guessTimezone()).format("MMM D, YYYY");
}

export default function Invitations() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [roleFilter, setRoleFilter] = useQueryState(
    "role",
    parseAsString.withDefault(""),
  );
  const [teamFilter, setTeamFilter] = useQueryState(
    "team",
    parseAsString.withDefault(""),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault(""),
  );
  const {
    currentPage,
    limit: pageLimit,
    setPagination,
  } = usePaginationQueryStates();
  const { showConfirm } = useConfirmDialog();
  const canCreateStaff = useCanCreateStaff();

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      role: roleFilter || undefined,
      team: teamFilter || undefined,
      status: statusFilter || undefined,
      page: currentPage,
      limit: pageLimit,
    }),
    [
      debouncedSearch,
      roleFilter,
      teamFilter,
      statusFilter,
      currentPage,
      pageLimit,
    ],
  );

  const { data: teamsData } = useTeamsList({ limit: 100 });
  const teams = teamsData?.data ?? [];
  const [teamSearch, setTeamSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [statusSearch, setStatusSearch] = useState("");

  const teamCollection = useMemo(
    () =>
      createListCollection({
        items: [...teams.map((t) => ({ label: t.name, value: t.name }))],
      }),
    [teams],
  );

  const roleCollection = useMemo(
    () => createListCollection({ items: roleItems }),
    [],
  );

  const statusCollection = useMemo(
    () => createListCollection({ items: statusItems }),
    [],
  );

  const {
    data: invitations,
    counts,
    pagination,
    isLoading,
  } = useInvitationsList(params);
  const cancelMutation = useCancelInvitation();
  const resendMutation = useResendInvitation();

  const hasActiveFilters =
    searchQuery !== "" || !!roleFilter || !!teamFilter || !!statusFilter;

  function clearFilters() {
    setSearchQuery("");
    setRoleFilter("");
    setTeamFilter("");
    setStatusFilter("");
    setPagination({ currentPage: 1, limit: pageLimit });
  }

  if (isLoading) {
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
            <PageTitle>
              <Text
                as="h1"
                m="0"
                color="fg"
                fontSize="22px"
                fontWeight="500"
                lineHeight="1.2"
              >
                Invitations
              </Text>
            </PageTitle>
            <Text m="6px 0 0" color="fg.muted" fontSize="13px">
              Review and manage staff invitations
            </Text>
          </Box>
          <HStack gap="8px" w={{ base: "full", md: "auto" }}>
            <OutlineButton flex={{ base: 1, md: "initial" }}>
              <Download size={14} />
              Export
            </OutlineButton>
            {canCreateStaff && (
              <InviteStaffDialog>
                <BrandButton flex={{ base: 1, md: "initial" }}>
                  <UserPlus size={15} />
                  Invite staff
                </BrandButton>
              </InviteStaffDialog>
            )}
          </HStack>
        </Flex>
        <InvitationStatusSummary counts={counts} isLoading={isLoading} />
        <InvitationsSkeleton />
      </>
    );
  }

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
          <PageTitle>
            <Text
              as="h1"
              m="0"
              color="fg"
              fontSize="22px"
              fontWeight="500"
              lineHeight="1.2"
            >
              Invitations
            </Text>
          </PageTitle>
          <Text m="6px 0 0" color="fg.muted" fontSize="13px">
            Review and manage staff invitations
          </Text>
        </Box>
        <HStack gap="8px" w={{ base: "full", md: "auto" }}>
          <OutlineButton flex={{ base: 1, md: "initial" }}>
            <Download size={14} />
            Export
          </OutlineButton>
          {canCreateStaff && (
            <InviteStaffDialog>
              <BrandButton flex={{ base: 1, md: "initial" }}>
                <UserPlus size={15} />
                Invite staff
              </BrandButton>
            </InviteStaffDialog>
          )}
        </HStack>
      </Flex>
      <InvitationStatusSummary counts={counts} isLoading={isLoading} />

      <Flex
        direction={{ base: "column", lg: "row" }}
        gap={3}
        mb={{ base: 4, md: 6 }}
        justify="space-between"
        align={{ lg: "center" }}
      >
        <HStack gap={3} w="full" wrap="wrap">
          <Box position="relative" w="full" maxW={{ md: "200px" }}>
            <Box
              position="absolute"
              left={3}
              top="50%"
              transform="translateY(-50%)"
              zIndex={1}
              color="fg.subtle"
              pointerEvents="none"
            >
              <Search size={16} />
            </Box>
            <Input
              placeholder="Search by email or name..."
              pl={9}
              size={{ base: "xs", md: "sm" }}
              bg="bg.input"
              borderColor="border.input"
              borderRadius="md"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination({ currentPage: 1, limit: pageLimit });
              }}
            />
          </Box>

          <Combobox.Root
            collection={roleCollection}
            size={{ base: "xs", md: "sm" }}
            w={{ base: "full", md: "auto" }}
            minW={{ md: "130px" }}
            value={[roleFilter]}
            onValueChange={(e) => {
              const val = e.value[0] ?? "";
              setRoleFilter(val);
              if (!val) setRoleSearch("");
              setPagination({ currentPage: 1, limit: pageLimit });
            }}
            onInputValueChange={(e) => setRoleSearch(e.inputValue)}
            positioning={{ sameWidth: true }}
            openOnClick
          >
            <Combobox.Control>
              <Combobox.Input
                placeholder="All roles"
                bg="bg.input"
                borderColor="border.input"
                borderRadius="md"
              />
              <Combobox.IndicatorGroup>
                {!!roleFilter && <Combobox.ClearTrigger />}
                <Combobox.Trigger />
              </Combobox.IndicatorGroup>
            </Combobox.Control>
            <Portal>
              <Combobox.Positioner>
                <Combobox.Content>
                  {(() => {
                    const filtered = roleCollection.items.filter(
                      (item) =>
                        !roleSearch ||
                        item.label
                          .toLowerCase()
                          .includes(roleSearch.toLowerCase()),
                    );
                    return filtered.length === 0 ? (
                      <Text p={3} fontSize="sm" color="fg.muted">
                        No roles matching &ldquo;{roleSearch}&rdquo;
                      </Text>
                    ) : (
                      filtered.map((item) => (
                        <Combobox.Item key={item.value} item={item}>
                          <Combobox.ItemText>{item.label}</Combobox.ItemText>
                        </Combobox.Item>
                      ))
                    );
                  })()}
                </Combobox.Content>
              </Combobox.Positioner>
            </Portal>
          </Combobox.Root>

          <Combobox.Root
            collection={teamCollection}
            size={{ base: "xs", md: "sm" }}
            w={{ base: "full", md: "auto" }}
            minW={{ md: "180px" }}
            value={[teamFilter]}
            onValueChange={(e) => {
              const val = e.value[0] ?? "";
              setTeamFilter(val);
              if (!val) setTeamSearch("");
              setPagination({ currentPage: 1, limit: pageLimit });
            }}
            onInputValueChange={(e) => setTeamSearch(e.inputValue)}
            positioning={{ sameWidth: true }}
            openOnClick
          >
            <Combobox.Control>
              <Combobox.Input
                placeholder="All teams"
                bg="bg.input"
                borderColor="border.input"
                borderRadius="md"
              />
              <Combobox.IndicatorGroup>
                {!!teamFilter && <Combobox.ClearTrigger />}
                <Combobox.Trigger />
              </Combobox.IndicatorGroup>
            </Combobox.Control>
            <Portal>
              <Combobox.Positioner>
                <Combobox.Content>
                  {teams.length === 0 ? (
                    <Flex p={3} gap={2} align="center" justify="center">
                      <Spinner size="xs" />
                      <Text fontSize="sm" color="fg.muted">
                        Loading...
                      </Text>
                    </Flex>
                  ) : (
                    (() => {
                      const filtered = teamCollection.items.filter(
                        (item) =>
                          !teamSearch ||
                          item.label
                            .toLowerCase()
                            .includes(teamSearch.toLowerCase()),
                      );
                      return filtered.length === 0 ? (
                        <Text p={3} fontSize="sm" color="fg.muted">
                          No teams matching &ldquo;{teamSearch}&rdquo;
                        </Text>
                      ) : (
                        filtered.map((item) => (
                          <Combobox.Item key={item.value} item={item}>
                            <Combobox.ItemText>{item.label}</Combobox.ItemText>
                          </Combobox.Item>
                        ))
                      );
                    })()
                  )}
                </Combobox.Content>
              </Combobox.Positioner>
            </Portal>
          </Combobox.Root>

          <Combobox.Root
            collection={statusCollection}
            size={{ base: "xs", md: "sm" }}
            w={{ base: "full", md: "auto" }}
            minW={{ md: "130px" }}
            value={[statusFilter]}
            onValueChange={(e) => {
              const val = e.value[0] ?? "";
              setStatusFilter(val);
              if (!val) setStatusSearch("");
              setPagination({ currentPage: 1, limit: pageLimit });
            }}
            onInputValueChange={(e) => setStatusSearch(e.inputValue)}
            positioning={{ sameWidth: true }}
            openOnClick
          >
            <Combobox.Control>
              <Combobox.Input
                placeholder="All statuses"
                bg="bg.input"
                borderColor="border.input"
                borderRadius="md"
              />
              <Combobox.IndicatorGroup>
                {!!statusFilter && <Combobox.ClearTrigger />}
                <Combobox.Trigger />
              </Combobox.IndicatorGroup>
            </Combobox.Control>
            <Portal>
              <Combobox.Positioner>
                <Combobox.Content>
                  {(() => {
                    const filtered = statusCollection.items.filter(
                      (item) =>
                        !statusSearch ||
                        item.label
                          .toLowerCase()
                          .includes(statusSearch.toLowerCase()),
                    );
                    return filtered.length === 0 ? (
                      <Text p={3} fontSize="sm" color="fg.muted">
                        No statuses matching &ldquo;{statusSearch}&rdquo;
                      </Text>
                    ) : (
                      filtered.map((item) => (
                        <Combobox.Item key={item.value} item={item}>
                          <Combobox.ItemText>{item.label}</Combobox.ItemText>
                        </Combobox.Item>
                      ))
                    );
                  })()}
                </Combobox.Content>
              </Combobox.Positioner>
            </Portal>
          </Combobox.Root>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size={{ base: "xs", md: "sm" }}
              color="fg.muted"
              onClick={clearFilters}
              flexShrink={0}
            >
              <X size={14} />
              <Text display={{ base: "inline", md: "none" }} ml={1}>
                Clear
              </Text>
              <Text display={{ base: "none", md: "inline" }}>
                Clear filters
              </Text>
            </Button>
          )}
        </HStack>
      </Flex>

      {invitations.length === 0 ? (
        <Box
          textAlign="center"
          py={12}
          border="1px dashed"
          borderColor="border"
          borderRadius="lg"
          bg="bg"
        >
          <Text color="fg.muted" textStyle="label" mb={2}>
            No invitations found
          </Text>
          <Text textStyle="body-sm" color="fg.subtle">
            Try adjusting your filters or search terms.
          </Text>
        </Box>
      ) : (
        <>
          <Box
            display={{ base: "none", lg: "block" }}
            w="full"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            overflow="hidden"
            bg="bg"
          >
            <ScrollArea.Root w="full" size="xs">
              <ScrollArea.Viewport>
                <ScrollArea.Content>
                  <Table.Root size="md">
                    <Table.Header borderBottom="1px solid" borderColor="border">
                      <Table.Row bg="bg.subtle">
                        <Table.ColumnHeader
                          textStyle="body-sm"
                          fontWeight="bold"
                          color="fg.subtle"
                          pb={3}
                          whiteSpace="nowrap"
                        >
                          INVITEE
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                          textStyle="body-sm"
                          fontWeight="bold"
                          color="fg.subtle"
                          pb={3}
                          whiteSpace="nowrap"
                        >
                          ROLE
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                          textStyle="body-sm"
                          fontWeight="bold"
                          color="fg.subtle"
                          pb={3}
                          whiteSpace="nowrap"
                        >
                          PRACTICE AREAS
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                          textStyle="body-sm"
                          fontWeight="bold"
                          color="fg.subtle"
                          pb={3}
                          whiteSpace="nowrap"
                        >
                          TEAM(S)
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                          textStyle="body-sm"
                          fontWeight="bold"
                          color="fg.subtle"
                          pb={3}
                          whiteSpace="nowrap"
                        >
                          INVITED BY
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                          textStyle="body-sm"
                          fontWeight="bold"
                          color="fg.subtle"
                          pb={3}
                          whiteSpace="nowrap"
                        >
                          SENT
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                          textStyle="body-sm"
                          fontWeight="bold"
                          color="fg.subtle"
                          pb={3}
                          whiteSpace="nowrap"
                        >
                          STATUS
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                          textStyle="body-sm"
                          fontWeight="bold"
                          color="fg.subtle"
                          pb={3}
                          textAlign="right"
                          whiteSpace="nowrap"
                        >
                          ACTION
                        </Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>

                    <Table.Body>
                      {invitations.map((inv) => {
                        const displayName =
                          [inv.firstName, inv.lastName]
                            .filter(Boolean)
                            .join(" ") || inv.email;
                        return (
                          <Table.Row
                            key={inv.id}
                            _last={{ borderBottomWidth: 0 }}
                            borderBottom="1px solid"
                            borderColor="border.muted"
                            _hover={{ bg: "bg.muted" }}
                          >
                            <Table.Cell py={4} whiteSpace="nowrap">
                              <HStack gap={3}>
                                <Avatar.Root
                                  size="sm"
                                  width="32px"
                                  height="32px"
                                >
                                  <Avatar.Fallback
                                    name={displayName}
                                    bg="bg.muted"
                                    color="fg"
                                    fontSize="xs"
                                  />
                                </Avatar.Root>
                                <Box>
                                  <Text fontWeight="600" color="fg">
                                    {displayName}
                                  </Text>
                                  <Text textStyle="body-sm" color="fg.muted">
                                    {inv.email}
                                  </Text>
                                </Box>
                              </HStack>
                            </Table.Cell>

                            <Table.Cell py={4} whiteSpace="nowrap">
                              <Text color="fg" textTransform="capitalize">
                                {inv.role}
                              </Text>
                            </Table.Cell>

                            <Table.Cell py={4} whiteSpace="nowrap">
                              {inv.practiceAreas.length === 0 ? (
                                <Text color="fg.subtle">—</Text>
                              ) : (
                                <HStack gap={1.5} wrap="wrap">
                                  {inv.practiceAreas
                                    .slice(0, 2)
                                    .map((area, idx) => (
                                      <Badge
                                        key={idx}
                                        size="sm"
                                        borderRadius="full"
                                        px={2.5}
                                        py={0.5}
                                        variant="subtle"
                                        textTransform="none"
                                        fontWeight="400"
                                        bg="rgba(186, 117, 23, 0.12)"
                                        color="#BA7517"
                                      >
                                        {area.name}
                                      </Badge>
                                    ))}
                                  {inv.practiceAreas.length > 2 && (
                                    <Tooltip.Root
                                      positioning={{ placement: "top" }}
                                    >
                                      <Tooltip.Trigger asChild>
                                        <Badge
                                          size="sm"
                                          borderRadius="full"
                                          px={2.5}
                                          py={0.5}
                                          variant="subtle"
                                          textTransform="none"
                                          fontWeight="500"
                                          bg="bg.muted"
                                          color="fg.muted"
                                          cursor="pointer"
                                        >
                                          +{inv.practiceAreas.length - 2}
                                        </Badge>
                                      </Tooltip.Trigger>
                                      <Portal>
                                        <Tooltip.Positioner>
                                          <Tooltip.Content>
                                            {inv.practiceAreas
                                              .map((a) => a.name)
                                              .join(", ")}
                                          </Tooltip.Content>
                                        </Tooltip.Positioner>
                                      </Portal>
                                    </Tooltip.Root>
                                  )}
                                </HStack>
                              )}
                            </Table.Cell>

                            <Table.Cell py={4} whiteSpace="nowrap">
                              {!inv.team ? (
                                <Text color="fg.subtle">None</Text>
                              ) : (
                                (() => {
                                  const teams = inv.team.split(", ");
                                  return (
                                    <HStack gap={1.5} wrap="wrap">
                                      <Badge
                                        size="sm"
                                        borderRadius="full"
                                        px={2.5}
                                        py={0.5}
                                        variant="subtle"
                                        textTransform="none"
                                        fontWeight="400"
                                        bg="rgba(29, 158, 117, 0.12)"
                                        color="#1D9E75"
                                      >
                                        {teams[0]}
                                      </Badge>
                                      {teams.length > 1 && (
                                        <Tooltip.Root
                                          positioning={{ placement: "top" }}
                                        >
                                          <Tooltip.Trigger asChild>
                                            <Badge
                                              size="sm"
                                              variant="subtle"
                                              textTransform="none"
                                              fontWeight="500"
                                              borderRadius="full"
                                              px={2.5}
                                              py={0.5}
                                              bg="rgba(180, 178, 169, 0.2)"
                                              color="fg.muted"
                                              cursor="pointer"
                                            >
                                              +{teams.length - 1}
                                            </Badge>
                                          </Tooltip.Trigger>
                                          <Portal>
                                            <Tooltip.Positioner>
                                              <Tooltip.Content>
                                                {teams.slice(1).join(", ")}
                                              </Tooltip.Content>
                                            </Tooltip.Positioner>
                                          </Portal>
                                        </Tooltip.Root>
                                      )}
                                    </HStack>
                                  );
                                })()
                              )}
                            </Table.Cell>

                            <Table.Cell py={4} whiteSpace="nowrap">
                              <Text color="fg">{inv.invitedBy || "—"}</Text>
                            </Table.Cell>

                            <Table.Cell py={4} whiteSpace="nowrap">
                              <Text color="fg.muted">
                                {formatDate(inv.createdAt)}
                              </Text>
                            </Table.Cell>

                            <Table.Cell py={4} whiteSpace="nowrap">
                              <Badge
                                px={2.5}
                                py={1}
                                borderRadius="full"
                                textTransform="none"
                                fontWeight="500"
                                style={getInvitationStatusStyles(inv.status)}
                              >
                                {getInvitationStatusLabel(inv.status)}
                              </Badge>
                            </Table.Cell>

                            <Table.Cell
                              py={4}
                              textAlign="right"
                              whiteSpace="nowrap"
                            >
                              {inv.status === "pending" && (
                                <HStack gap={2} justify="end">
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    borderColor="border"
                                    color="fg"
                                    px={4}
                                    _hover={{ bg: "bg.muted" }}
                                    loading={resendMutation.isPending}
                                    onClick={() =>
                                      resendMutation.mutate({
                                        email: inv.email,
                                        role: inv.role,
                                      })
                                    }
                                  >
                                    <RefreshCw size={13} />
                                    Resend
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    borderColor="red.500"
                                    color="red.500"
                                    px={4}
                                    _hover={{ bg: "rgba(224, 84, 84, 0.1)" }}
                                    onClick={() =>
                                      showConfirm({
                                        title: "Revoke invitation",
                                        description: `Are you sure you want to revoke the invitation for ${inv.email}? This will also remove their staff record and user account.`,
                                        confirmLabel: "Yes, revoke",
                                        cancelLabel: "Keep",
                                        onConfirm: () =>
                                          cancelMutation.mutateAsync(inv.id),
                                      })
                                    }
                                  >
                                    <X size={13} />
                                    Revoke
                                  </Button>
                                </HStack>
                              )}
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Root>
                </ScrollArea.Content>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar orientation="horizontal" />
              <ScrollArea.Corner />
            </ScrollArea.Root>
          </Box>

          <InvitationMobileList
            invitations={invitations}
            onResend={(email, role) => resendMutation.mutate({ email, role })}
            onCancel={(id) => cancelMutation.mutateAsync(id)}
            isResending={resendMutation.isPending}
            isCanceling={cancelMutation.isPending}
          />
        </>
      )}

      {pagination.total > 0 && (
        <PaginationControls
          total={pagination.total}
          currentPage={currentPage}
          limit={pageLimit}
          onPageChange={(page) =>
            setPagination({ currentPage: page, limit: pageLimit })
          }
          onLimitChange={(limit) => setPagination({ currentPage: 1, limit })}
        />
      )}
    </>
  );
}
