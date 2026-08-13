import { PaginationControls } from "@/components/ui/pagination-controls";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Portal,
  Select,
  Stack,
  Table,
  Text,
  VStack,
  createListCollection,
  Menu,
} from "@chakra-ui/react";
import {
  Eye,
  Mail,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { MutedText } from "@/components/ui/intake-ui";
import { PortalAccessBadge } from "@/pages/admin/converted-clients/components/portal-access-badge";
import { InviteClientDialog } from "@/pages/admin/converted-clients/components/invite-client-dialog";
import { ClientDetailDrawer } from "@/pages/admin/converted-clients/components/client-detail-drawer";
import { ConvertedClientsDataProvider, useConvertedClientsData } from "@/pages/admin/converted-clients/converted-clients-data-context";
import { leadSourceLabels } from "@/api/converted-clients";
import type { ConvertedClient } from "@/api/converted-clients";
import dayjs from "dayjs";

const PAGE_SIZE_OPTIONS = [10, 15, 20, 50] as const;

const portalStatusOptions = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "active" },
  { label: "Invited", value: "invited" },
  { label: "No access", value: "no_access" },
] as const;

function ClientsTabContent() {
  const {
    clients,
    isLoading,
    total,
    practiceAreas,
    searchQuery,
    setSearchQuery,
    practiceArea,
    setPracticeArea,
    portalStatus,
    setPortalStatus,
    currentPage,
    pageLimit,
    setPagination,
  } = useConvertedClientsData();

  const [inviteClient, setInviteClient] = useState<ConvertedClient | null>(null);
  const [drawerClientId, setDrawerClientId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
  }

  function handlePracticeAreaChange(value: string) {
    setPracticeArea(value === "" ? "" : value);
  }

  function handlePortalStatusChange(value: string) {
    setPortalStatus(value === "" ? "" : value);
  }

  function handleLimitChange(value: number) {
    setPagination({ limit: value, currentPage: 1 });
  }

  function openDrawer(clientId: string) {
    setDrawerClientId(clientId);
    setDrawerOpen(true);
  }

  const hasActiveFilters = searchQuery !== "" || practiceArea !== "" || portalStatus !== "";

  function clearFilters() {
    setSearchQuery("");
    setPracticeArea("");
    setPortalStatus("");
    setPagination({ currentPage: 1 });
  }

  const collection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "All practice areas", value: "" },
          ...practiceAreas.map((pa) => ({ label: pa.name, value: pa.id })),
        ],
      }),
    [practiceAreas],
  );

  const statusCollection = useMemo(
    () =>
      createListCollection({
        items: [...portalStatusOptions],
      }),
    [],
  );

  return (
    <>
      <Text m="16px 0 0" color="fg.muted" fontSize="13px">
        Manage clients converted from leads and their portal access
      </Text>

      {/* Filters */}
      <Flex
        as="section"
        align={{ base: "stretch", md: "center" }}
        justify="space-between"
        gap="12px"
        py={5}
        direction={{ base: "column", md: "row" }}
      >
        <Stack
          gap="12px"
          direction={{ base: "column", sm: "row" }}
          w={{ base: "full", md: "auto" }}
          flexWrap="wrap"
        >
          <HStack
            gap="8px"
            h="34px"
            w={{ base: "full", md: "220px" }}
            px="12px"
            border="1px solid"
            borderColor="border"
            borderRadius="7px"
            bg="bg"
            color="fg.muted"
          >
            <Search size={15} />
            <Input
              aria-label="Search clients"
              placeholder="Search clients..."
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              p="0"
              h="auto"
              border="0"
              bg="transparent"
              color="fg"
              _focus={{ boxShadow: "none", outline: "0" }}
            />
          </HStack>

          <Select.Root
            collection={collection}
            size="sm"
            w={{ base: "full", md: "160px" }}
            value={[practiceArea]}
            onValueChange={(e) => handlePracticeAreaChange(e.value[0] ?? "")}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger bg="bg" borderColor="border" rounded="7px">
                <Select.ValueText />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {collection.items.map((item) => (
                    <Select.Item item={item} key={item.value}>
                      <Select.ItemText>{item.label}</Select.ItemText>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>

          <Select.Root
            collection={statusCollection}
            size="sm"
            w={{ base: "full", md: "156px" }}
            value={[portalStatus]}
            onValueChange={(e) => handlePortalStatusChange(e.value[0] ?? "")}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger bg="bg" borderColor="border" rounded="7px">
                <Select.ValueText />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {statusCollection.items.map((item) => (
                    <Select.Item item={item} key={item.value}>
                      <Select.ItemText>{item.label}</Select.ItemText>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>

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
        </Stack>
        <MutedText fontSize="11px">
          {isLoading
            ? "Loading…"
            : `${total} ${total === 1 ? "client" : "clients"}`}
        </MutedText>
      </Flex>

      {/* Desktop table */}
      {isLoading ? (
        <Box
          display={{ base: "none", lg: "block" }}
          overflowX="auto"
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          bg="bg"
        >
          <Table.Root minW="1000px">
            <Table.Header>
              <Table.Row bg="bg.subtle">
                {[
                  "Client",
                  "Contact",
                  "Practice area",
                  "Source",
                  "Cases",
                  "Portal",
                  "Last login",
                  "",
                ].map((heading) => (
                  <Table.ColumnHeader
                    key={heading}
                    h="36px"
                    px="16px"
                    color="fg.muted"
                    fontSize="10px"
                    fontWeight="500"
                    textTransform="uppercase"
                  >
                    {heading}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {Array.from({ length: 6 }, (_, i) => (
                <Table.Row key={i}>
                  {Array.from({ length: 8 }, (_, j) => (
                    <Table.Cell
                      key={j}
                      px="16px"
                      py="9px"
                      borderBottom="1px solid"
                      borderColor="border.subtle"
                    >
                      <ThemeSkeleton
                        h="13px"
                        w={j === 0 ? "120px" : j === 1 ? "140px" : "80px"}
                        borderRadius="4px"
                      />
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      ) : clients.length === 0 ? (
        <VStack
          display={{ base: "none", lg: "flex" }}
          py={16}
          gap={2}
          textAlign="center"
        >
          <Text color="fg.muted" textStyle="lg" fontWeight="600">
            No clients found
          </Text>
          <Text color="fg.subtle" textStyle="body-sm">
            {hasActiveFilters
              ? "Try adjusting your filters or search terms."
              : "Leads that are converted to clients will appear here."}
          </Text>
        </VStack>
      ) : (
        <Box
          display={{ base: "none", lg: "block" }}
          overflowX="auto"
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          bg="bg"
        >
          <Table.Root minW="1000px">
            <Table.Header>
              <Table.Row bg="bg.subtle">
                {[
                  "Client",
                  "Contact",
                  "Practice area",
                  "Source",
                  "Cases",
                  "Portal",
                  "Last login",
                  "",
                ].map((heading) => (
                  <Table.ColumnHeader
                    key={heading}
                    h="36px"
                    px="16px"
                    color="fg.muted"
                    fontSize="10px"
                    fontWeight="500"
                    textTransform="uppercase"
                  >
                    {heading}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {clients.map((client) => (
                <Table.Row key={client.id}>
                  <Table.Cell px="16px" py="9px" borderBottom="1px solid" borderColor="border.subtle">
                    <Text
                      fontSize="13px"
                      fontWeight="500"
                      color="fg"
                      _hover={{ color: "brand.solid", cursor: "pointer" }}
                      onClick={() => openDrawer(client.id)}
                    >
                      {client.displayName}
                    </Text>
                    {client.convertedCaseId ? (
                      <Link
                        to={`/cases/${client.convertedCaseId}`}
                        style={{ textDecoration: "none" }}
                      >
                        <Text fontSize="11px" color="brand.solid">
                          View case
                        </Text>
                      </Link>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell px="16px" py="9px" borderBottom="1px solid" borderColor="border.subtle">
                    <Text fontSize="13px" color="fg.muted">
                      {client.email}
                    </Text>
                    {client.phone ? (
                      <Text fontSize="11px" color="fg.subtle">
                        {client.phone}
                      </Text>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell px="16px" py="9px" borderBottom="1px solid" borderColor="border.subtle">
                    {client.practiceAreaName ? (
                      <Text fontSize="13px" color="fg">
                        {client.practiceAreaName}
                      </Text>
                    ) : (
                      <MutedText>—</MutedText>
                    )}
                  </Table.Cell>
                  <Table.Cell px="16px" py="9px" borderBottom="1px solid" borderColor="border.subtle">
                    <Text fontSize="13px" color="fg.muted">
                      {leadSourceLabels[client.leadSource] ?? client.leadSource}
                    </Text>
                  </Table.Cell>
                  <Table.Cell px="16px" py="9px" borderBottom="1px solid" borderColor="border.subtle">
                    <Text fontSize="13px" color="fg.muted">
                      {client.cases.length}
                    </Text>
                  </Table.Cell>
                  <Table.Cell px="16px" py="9px" borderBottom="1px solid" borderColor="border.subtle">
                    <PortalAccessBadge status={client.hasPortalAccess ? (client.activeSessions > 0 ? "active" : "invited") : "invited"} hasAccount={client.hasPortalAccess} />
                  </Table.Cell>
                  <Table.Cell px="16px" py="9px" borderBottom="1px solid" borderColor="border.subtle">
                    <Text fontSize="13px" color="fg.muted">
                      {client.lastLoginAt
                        ? dayjs(client.lastLoginAt).format("MMM D, YYYY")
                        : "—"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell px="16px" py="9px" borderBottom="1px solid" borderColor="border.subtle">
                    <Menu.Root>
                      <Menu.Trigger asChild>
                        <IconButton
                          variant="ghost"
                          size="xs"
                          color="fg.muted"
                          aria-label="Client actions"
                        >
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="3" r="1.5" fill="currentColor"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/><circle cx="7.5" cy="12" r="1.5" fill="currentColor"/></svg>
                        </IconButton>
                      </Menu.Trigger>
                      <Portal>
                        <Menu.Positioner>
                          <Menu.Content minW="160px">
                            <Menu.Item
                              value="view"
                              onClick={() => openDrawer(client.id)}
                            >
                              <Eye size={13} />
                              <Box flex="1">View details</Box>
                            </Menu.Item>
                            {!client.hasPortalAccess ? (
                              <Menu.Item
                                value="invite"
                                onClick={() => setInviteClient(client)}
                              >
                                <Mail size={13} />
                                <Box flex="1">Send invitation</Box>
                              </Menu.Item>
                            ) : null}
                            {client.convertedCaseId ? (
                              <Menu.Item
                                value="case"
                                onClick={() => {}}
                              >
                                <Link
                                  to={`/cases/${client.convertedCaseId}`}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    width: "100%",
                                    textDecoration: "none",
                                    color: "inherit",
                                  }}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                  <Box flex="1">View case</Box>
                                </Link>
                              </Menu.Item>
                            ) : null}
                          </Menu.Content>
                        </Menu.Positioner>
                      </Portal>
                    </Menu.Root>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Mobile card list */}
      <Stack gap={3} display={{ base: "flex", lg: "none" }}>
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => (
            <Box
              key={i}
              border="1px solid"
              borderColor="border.muted"
              borderRadius="md"
              p={3}
              bg="bg"
            >
              <Flex align="flex-start" gap={3}>
                <Box flex={1}>
                  <ThemeSkeleton h="14px" w="140px" mb="6px" borderRadius="4px" />
                  <ThemeSkeleton h="11px" w="180px" borderRadius="4px" />
                </Box>
              </Flex>
            </Box>
          ))
        ) : clients.length === 0 ? (
          <Stack py={16} gap={2} textAlign="center" align="center">
            <Text color="fg.muted" fontSize="lg" fontWeight="600">
              No clients found
            </Text>
            <Text color="fg.subtle" textStyle="body-sm">
              Try adjusting your filters or search terms.
            </Text>
          </Stack>
        ) : (
          clients.map((client) => (
            <Box
              key={client.id}
              border="1px solid"
              borderColor="border.muted"
              borderRadius="md"
              p={3}
              bg="bg"
              _active={{ bg: "bg.subtle" }}
            >
              <Flex align="flex-start" gap={3}>
                <Box flex={1} minW={0}>
                  <Text
                    fontSize="13px"
                    fontWeight="500"
                    color="fg"
                    truncate
                    _hover={{ color: "brand.solid", cursor: "pointer" }}
                    onClick={() => openDrawer(client.id)}
                  >
                    {client.displayName}
                  </Text>
                  <Text fontSize="11px" color="fg.muted" mt={1} truncate>
                    {client.email}
                  </Text>
                  <HStack gap={2} mt={1.5} flexWrap="wrap">
                    {client.practiceAreaName ? (
                      <Text fontSize="10px" color="fg.subtle">
                        {client.practiceAreaName}
                      </Text>
                    ) : null}
                    <Text fontSize="10px" color="fg.subtle">
                      {leadSourceLabels[client.leadSource] ?? client.leadSource}
                    </Text>
                    <PortalAccessBadge status={client.hasPortalAccess ? (client.activeSessions > 0 ? "active" : "invited") : "invited"} hasAccount={client.hasPortalAccess} />
                  </HStack>
                </Box>
                <Menu.Root>
                  <Menu.Trigger asChild>
                    <IconButton
                      variant="ghost"
                      size="xs"
                      color="fg.muted"
                      aria-label="Client actions"
                    >
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="3" r="1.5" fill="currentColor"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/><circle cx="7.5" cy="12" r="1.5" fill="currentColor"/></svg>
                    </IconButton>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content minW="160px">
                        <Menu.Item
                          value="view"
                          onClick={() => openDrawer(client.id)}
                        >
                          <Eye size={13} />
                          <Box flex="1">View details</Box>
                        </Menu.Item>
                        {!client.hasPortalAccess ? (
                          <Menu.Item
                            value="invite"
                            onClick={() => setInviteClient(client)}
                          >
                            <Mail size={13} />
                            <Box flex="1">Send invitation</Box>
                          </Menu.Item>
                        ) : null}
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              </Flex>
            </Box>
          ))
        )}
      </Stack>

      {total > 0 && (
        <Box mt={4}>
          <PaginationControls
            total={total}
            currentPage={currentPage}
            limit={pageLimit}
            onPageChange={(p) => setPagination({ currentPage: p })}
            onLimitChange={handleLimitChange}
            pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
          />
        </Box>
      )}

      {/* Dialogs */}
      {inviteClient ? (
        <InviteClientDialog
          client={inviteClient}
          open={!!inviteClient}
          onOpenChange={(details) => {
            if (!details.open) setInviteClient(null);
          }}
        />
      ) : null}

      <ClientDetailDrawer
        clientId={drawerClientId}
        open={drawerOpen}
        onOpenChange={(details) => {
          setDrawerOpen(details.open);
          if (!details.open) setDrawerClientId(null);
        }}
      />
    </>
  );
}

export function ClientsTab() {
  return (
    <ConvertedClientsDataProvider>
      <ClientsTabContent />
    </ConvertedClientsDataProvider>
  );
}
