import { Box, Flex, Grid, HStack, Stack, Table } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";

const CARD_GRID = {
  templateColumns: { base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
  gap: { base: "10px", md: "12px" },
} as const;

function BadgePill({ width }: { width: string }) {
  return <ThemeSkeleton h="18px" w={width} borderRadius="full" flexShrink={0} />;
}

function KebabSkeleton() {
  return <ThemeSkeleton boxSize="20px" borderRadius="6px" flexShrink={0} />;
}

/** The search + filter row shared by the members/roles/groups tabs. */
function FilterBarSkeleton({ controls }: { controls: number }) {
  return (
    <Flex direction={{ base: "column", lg: "row" }} gap={3} mb={4} align={{ lg: "center" }}>
      <HStack gap={3} w="full">
        <ThemeSkeleton h="32px" w={{ base: "full", md: "240px" }} borderRadius="md" flexShrink={0} />
        {Array.from({ length: controls }).map((_, i) => (
          <ThemeSkeleton
            key={i}
            h="32px"
            w={{ base: "full", md: "160px" }}
            borderRadius="md"
            flexShrink={0}
          />
        ))}
      </HStack>
    </Flex>
  );
}

function CardShell({ children }: { children: ReactNode }) {
  return (
    <Box border="1px solid" borderColor="border" borderRadius="10px" p="16px" bg="bg" minW={0}>
      {children}
    </Box>
  );
}

export function StaffTableSkeleton() {
  return (
    <Box aria-busy="true" aria-label="Loading members">
      <FilterBarSkeleton controls={2} />
      <Box w="full" border="1px solid" borderColor="border" borderRadius="10px">
        <Table.Root size="sm" variant="line">
          <Table.Header>
            <Table.Row>
              {["STAFF MEMBER", "ROLES", "GROUPS", "EFFECTIVE ACCESS"].map((h) => (
                <Table.ColumnHeader key={h} fontSize="10px" color="fg.muted">
                  {h}
                </Table.ColumnHeader>
              ))}
              <Table.ColumnHeader fontSize="10px" color="fg.muted" textAlign="right">
                ACTIONS
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {Array.from({ length: 6 }).map((_, i) => (
              <Table.Row key={i}>
                <Table.Cell>
                  <ThemeSkeleton h="12px" w={`${96 + (i % 3) * 22}px`} mb="5px" />
                  <ThemeSkeleton h="10px" w={`${128 + ((i + 1) % 3) * 26}px`} />
                </Table.Cell>
                <Table.Cell>
                  <HStack gap="4px">
                    <BadgePill width={`${64 + (i % 2) * 14}px`} />
                    <BadgePill width={`${52 - (i % 2) * 10}px`} />
                  </HStack>
                </Table.Cell>
                <Table.Cell>
                  <HStack gap="4px">
                    <BadgePill width={`${58 + ((i + 1) % 2) * 12}px`} />
                    <BadgePill width="44px" />
                  </HStack>
                </Table.Cell>
                <Table.Cell>
                  <ThemeSkeleton h="10px" w="82px" />
                </Table.Cell>
                <Table.Cell textAlign="right">
                  <KebabSkeleton />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}

export function RolesGridSkeleton() {
  return (
    <Box aria-busy="true" aria-label="Loading roles">
      <FilterBarSkeleton controls={1} />
      <Grid {...CARD_GRID}>
        {Array.from({ length: 6 }).map((_, i) => (
          <CardShell key={i}>
            <Flex justify="space-between" align="start" gap={2}>
              <Flex align="center" gap={2} minW={0}>
                <ThemeSkeleton boxSize="10px" borderRadius="full" flexShrink={0} />
                <ThemeSkeleton h="13px" w={`${88 + (i % 3) * 26}px`} />
                <BadgePill width="52px" />
              </Flex>
              <Flex align="center" gap={2} flexShrink={0}>
                <ThemeSkeleton h="11px" w="42px" />
                <KebabSkeleton />
              </Flex>
            </Flex>
            <Stack gap="6px" mt="14px">
              <ThemeSkeleton h="11px" w={`${180 + (i % 3) * 40}px`} maxW="full" />
              <ThemeSkeleton h="11px" w="60%" />
            </Stack>
          </CardShell>
        ))}
      </Grid>
    </Box>
  );
}

export function GroupsGridSkeleton() {
  return (
    <Box aria-busy="true" aria-label="Loading role groups">
      <FilterBarSkeleton controls={0} />
      <Grid {...CARD_GRID}>
        {Array.from({ length: 6 }).map((_, i) => (
          <CardShell key={i}>
            <Flex justify="space-between" align="start" gap={2}>
              <Flex align="center" gap={2} minW={0}>
                <ThemeSkeleton boxSize="10px" borderRadius="6px" flexShrink={0} />
                <ThemeSkeleton h="13px" w={`${92 + (i % 3) * 24}px`} />
                <BadgePill width="38px" />
              </Flex>
              <KebabSkeleton />
            </Flex>
            <ThemeSkeleton h="11px" w={`${150 + ((i + 1) % 3) * 36}px`} mt="12px" />
            <HStack gap="4px" mt="12px" wrap="wrap">
              <ThemeSkeleton h="20px" w={`${58 + (i % 2) * 14}px`} borderRadius="4px" />
              <ThemeSkeleton h="20px" w={`${66 - (i % 2) * 10}px`} borderRadius="4px" />
              <ThemeSkeleton h="20px" w="50px" borderRadius="4px" />
            </HStack>
          </CardShell>
        ))}
      </Grid>
    </Box>
  );
}

function MatrixGroupTrigger({ isLast = false }: { isLast?: boolean }) {
  return (
    <Flex
      align="center"
      gap="8px"
      px="14px"
      py="10px"
      borderBottomWidth={isLast ? 0 : 1}
      borderBottomStyle="solid"
      borderColor="border"
    >
      <ThemeSkeleton flex="1" h="12px" maxW="140px" />
      <ThemeSkeleton h="9px" w="64px" mr="6px" flexShrink={0} />
      <ThemeSkeleton boxSize="15px" borderRadius="4px" flexShrink={0} />
    </Flex>
  );
}

export function PermissionsMatrixSkeleton() {
  return (
    <Box aria-busy="true" aria-label="Loading permissions matrix">
      <Flex gap={2} mb="12px" wrap="wrap">
        <ThemeSkeleton h="32px" w="240px" borderRadius="8px" />
      </Flex>
      <Box border="1px solid" borderColor="border" borderRadius="10px" overflow="hidden">
        <MatrixGroupTrigger />
        <Box px="14px" pb="12px">
          <Table.Root size="sm" variant="line">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader fontSize="10px" color="fg.muted">PERMISSION</Table.ColumnHeader>
                {Array.from({ length: 4 }).map((_, c) => (
                  <Table.ColumnHeader key={c} textAlign="center">
                    <Flex direction="column" align="center" gap="3px">
                      <Flex align="center" gap="5px">
                        <ThemeSkeleton boxSize="7px" borderRadius="full" flexShrink={0} />
                        <ThemeSkeleton h="9px" w={`${52 + c * 10}px`} />
                      </Flex>
                      <ThemeSkeleton h="8px" w="40px" />
                    </Flex>
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {Array.from({ length: 4 }).map((_, r) => (
                <Table.Row key={r}>
                  <Table.Cell>
                    <ThemeSkeleton h="11px" w={`${150 + (r % 3) * 34}px`} />
                  </Table.Cell>
                  {Array.from({ length: 4 }).map((_, c) => (
                    <Table.Cell key={c} textAlign="center">
                      <ThemeSkeleton boxSize="12px" borderRadius="full" mx="auto" />
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
        <MatrixGroupTrigger />
        <MatrixGroupTrigger />
        <MatrixGroupTrigger />
        <MatrixGroupTrigger isLast />
      </Box>
    </Box>
  );
}
