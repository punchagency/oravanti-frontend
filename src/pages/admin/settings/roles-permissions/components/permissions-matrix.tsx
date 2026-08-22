import type { PermissionsMatrix as PermissionsMatrixData, RoleSummary } from "@/api/roles-permissions";
import { roleColorValue } from "@/lib/role-colors";
import { Accordion, Box, Flex, Input, Span, Table, Text } from "@chakra-ui/react";
import { useDebounce } from "@uidotdev/usehooks";
import { Check, ChevronDown, Lock, Search } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { RESOURCE_GROUPS } from "./resource-groups";

/**
 * One group's table, memoized on its own `rows`/`roles` props (both
 * referentially stable across an accordion open/close — `rows` comes from
 * `groupedRows`, memoized on `[matrix, search]`, neither of which changes
 * when a group expands). Without this, expanding or collapsing any one
 * group re-rendered every group's full permission×role table, since
 * `openGroups` state lives in the parent `PermissionsMatrixView`.
 */
const PermissionGroupTable = memo(function PermissionGroupTable({
  rows,
  roles,
}: {
  rows: { resource: string; action: string }[];
  roles: RoleSummary[];
}) {
  return (
    <Box overflowX="auto">
      <Table.Root size="sm" variant="line">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader fontSize="10px" color="fg.muted" whiteSpace="nowrap">
              PERMISSION
            </Table.ColumnHeader>
            {roles.map((role) => (
              <Table.ColumnHeader
                key={role.name}
                fontSize="10px"
                color="fg.muted"
                textAlign="center"
                whiteSpace="nowrap"
              >
                <Flex align="center" justify="center" gap="5px">
                  <Box
                    w="7px"
                    h="7px"
                    borderRadius="full"
                    bg={roleColorValue(role.color)}
                    flexShrink={0}
                  />
                  {role.label.toUpperCase()}
                </Flex>
                <Text fontSize="9px" fontWeight="400">
                  {role.staffCount} staff
                </Text>
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map(({ resource, action }) => (
            <Table.Row key={`${resource}:${action}`}>
              <Table.Cell fontSize="12px" color="fg" whiteSpace="nowrap">
                {resource.replace(/_/g, " ")} — {action.replace(/_/g, " ")}
              </Table.Cell>
              {roles.map((role) => {
                const granted = role.grants?.[resource]?.includes(action);
                return (
                  <Table.Cell key={role.name} textAlign="center">
                    {role.locked ? (
                      <Lock size={12} style={{ margin: "0 auto", opacity: 0.5 }} />
                    ) : granted ? (
                      <Check
                        size={14}
                        color="var(--chakra-colors-green-solid)"
                        style={{ margin: "0 auto" }}
                      />
                    ) : (
                      <Text color="fg.subtle">—</Text>
                    )}
                  </Table.Cell>
                );
              })}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
});

/**
 * Memoized: `matrix` is the only prop and comes straight from TanStack
 * Query's cache (referentially stable until the query actually refetches),
 * so without this the whole accordion/table re-rendered every time any
 * dialog on the roles & permissions page opened or closed, since they all
 * share one parent component's state.
 */
export const PermissionsMatrixView = memo(function PermissionsMatrixView({ matrix }: { matrix: PermissionsMatrixData | undefined }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const groupedRows = useMemo(() => {
    const groups: { group: string; rows: { resource: string; action: string }[] }[] = [];
    if (!matrix) return groups;

    for (const [group, resources] of Object.entries(RESOURCE_GROUPS)) {
      const rows: { resource: string; action: string }[] = [];
      for (const resource of resources) {
        const actions = matrix.resources[resource];
        if (!actions) continue;
        for (const action of actions) {
          const label = `${resource.replace(/_/g, " ")} — ${action.replace(/_/g, " ")}`;
          if (debouncedSearch && !label.toLowerCase().includes(debouncedSearch.toLowerCase())) continue;
          rows.push({ resource, action });
        }
      }
      if (rows.length > 0) groups.push({ group, rows });
    }
    return groups;
  }, [matrix, debouncedSearch]);

  const roles = matrix?.roles ?? [];
  const isSearching = debouncedSearch.trim().length > 0;
  const accordionValue = isSearching ? groupedRows.map((g) => g.group) : openGroups;

  return (
    <Box>
      <Flex gap={2} mb="12px" wrap="wrap">
        <Box flex="1" minW="200px" position="relative">
          <Search
            size={13}
            style={{ position: "absolute", left: 10, top: 10, opacity: 0.5 }}
          />
          <Input
            size="sm"
            pl="30px"
            placeholder="Search permissions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
      </Flex>

      {groupedRows.length === 0 ? (
        <Box border="1px solid" borderColor="border" borderRadius="10px" py={8} textAlign="center">
          <Text fontSize="12px" color="fg.muted">
            No permissions match this search.
          </Text>
        </Box>
      ) : (
        <Accordion.Root
          multiple
          value={accordionValue}
          onValueChange={(e) => {
            if (!isSearching) setOpenGroups(e.value);
          }}
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          overflow="hidden"
        >
          {groupedRows.map(({ group, rows }) => (
            <Accordion.Item key={group} value={group} borderColor="border">
              <Accordion.ItemTrigger px="14px" py="10px" _hover={{ bg: "bg.subtle" }}>
                <Span flex="1" fontSize="12.5px" fontWeight="600" color="fg" textAlign="start">
                  {group}
                </Span>
                <Text fontSize="10.5px" color="fg.muted" mr="6px">
                  {rows.length} permission{rows.length === 1 ? "" : "s"}
                </Text>
                <Accordion.ItemIndicator>
                  <ChevronDown size={15} />
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody p="0">
                  <PermissionGroupTable rows={rows} roles={roles} />
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      )}
    </Box>
  );
});
