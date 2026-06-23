import { Box, HStack, ScrollArea, Table } from "@chakra-ui/react";
import { ThemeSkeleton } from "../../../components/theme-skeleton";

const ROWS = 5;

export function StaffTableSkeleton() {
  return (
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
                    STAFF MEMBER
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
                    TEAM
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
                    CASELOAD
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
                    ACTIONS
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {Array.from({ length: ROWS }).map((_, i) => (
                  <Table.Row
                    key={i}
                    borderBottom="1px solid"
                    borderColor="border.muted"
                    _last={{ borderBottomWidth: 0 }}
                  >
                    <Table.Cell py={4} whiteSpace="nowrap">
                      <HStack gap={3}>
                        <ThemeSkeleton
                          boxSize="32px"
                          borderRadius="full"
                          flexShrink={0}
                        />
                        <Box>
                          <ThemeSkeleton height="14px" width="140px" mb={1.5} />
                          <ThemeSkeleton height="11px" width="100px" />
                        </Box>
                      </HStack>
                    </Table.Cell>

                    <Table.Cell py={4} whiteSpace="nowrap">
                      <ThemeSkeleton height="14px" width="60px" />
                    </Table.Cell>

                    <Table.Cell py={4} whiteSpace="nowrap">
                      <ThemeSkeleton height="14px" width="80px" />
                    </Table.Cell>

                    <Table.Cell py={4} whiteSpace="nowrap">
                      <HStack gap={1.5}>
                        <ThemeSkeleton
                          height="20px"
                          width="80px"
                          borderRadius="full"
                        />
                        <ThemeSkeleton
                          height="20px"
                          width="70px"
                          borderRadius="full"
                        />
                      </HStack>
                    </Table.Cell>

                    <Table.Cell py={4} whiteSpace="nowrap">
                      <Box maxW="100px">
                        <ThemeSkeleton height="11px" width="50px" mb={1} />
                        <ThemeSkeleton
                          height="4px"
                          width="100%"
                          borderRadius="full"
                        />
                      </Box>
                    </Table.Cell>

                    <Table.Cell py={4} whiteSpace="nowrap">
                      <ThemeSkeleton
                        height="20px"
                        width="70px"
                        borderRadius="full"
                      />
                    </Table.Cell>

                    <Table.Cell py={4} textAlign="right" whiteSpace="nowrap">
                      <ThemeSkeleton
                        height="28px"
                        width="60px"
                        borderRadius="md"
                      />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="horizontal" />
        <ScrollArea.Corner />
      </ScrollArea.Root>
    </Box>
  );
}
