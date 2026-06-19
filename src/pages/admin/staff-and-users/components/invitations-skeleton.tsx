import {
  Box,
  Flex,
  HStack,
  ScrollArea,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { ThemeSkeleton } from "./theme-skeleton";

function InvitationTableSkeleton() {
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
                  {["INVITEE", "ROLE", "PRACTICE AREAS", "TEAM", "INVITED BY", "SENT", "STATUS", "ACTION"].map(
                    (h) => (
                      <Table.ColumnHeader
                        key={h}
                        textStyle="body-sm"
                        fontWeight="bold"
                        color="fg.subtle"
                        pb={3}
                        whiteSpace="nowrap"
                      >
                        {h}
                      </Table.ColumnHeader>
                    ),
                  )}
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Table.Row
                    key={i}
                    borderBottom="1px solid"
                    borderColor="border.muted"
                    _last={{ borderBottomWidth: 0 }}
                  >
                    <Table.Cell py={4} whiteSpace="nowrap">
                      <HStack gap={3}>
                        <ThemeSkeleton boxSize="32px" borderRadius="full" flexShrink={0} />
                        <Box>
                          <ThemeSkeleton height="14px" width="140px" mb={1.5} />
                          <ThemeSkeleton height="11px" width="100px" />
                        </Box>
                      </HStack>
                    </Table.Cell>
                    <Table.Cell py={4} whiteSpace="nowrap">
                      <ThemeSkeleton height="14px" width="70px" />
                    </Table.Cell>
                    <Table.Cell py={4} whiteSpace="nowrap">
                      <HStack gap={1.5}>
                        <ThemeSkeleton height="20px" width="80px" borderRadius="full" />
                        <ThemeSkeleton height="20px" width="60px" borderRadius="full" />
                      </HStack>
                    </Table.Cell>
                    <Table.Cell py={4} whiteSpace="nowrap">
                      <ThemeSkeleton height="14px" width="90px" />
                    </Table.Cell>
                    <Table.Cell py={4} whiteSpace="nowrap">
                      <ThemeSkeleton height="14px" width="100px" />
                    </Table.Cell>
                    <Table.Cell py={4} whiteSpace="nowrap">
                      <ThemeSkeleton height="14px" width="90px" />
                    </Table.Cell>
                    <Table.Cell py={4} whiteSpace="nowrap">
                      <ThemeSkeleton height="20px" width="70px" borderRadius="full" />
                    </Table.Cell>
                    <Table.Cell py={4} textAlign="right" whiteSpace="nowrap">
                      <HStack gap={2} justify="end">
                        <ThemeSkeleton height="28px" width="80px" borderRadius="md" />
                        <ThemeSkeleton height="28px" width="70px" borderRadius="md" />
                      </HStack>
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

function InvitationMobileSkeleton() {
  return (
    <Stack gap={4} display={{ base: "flex", lg: "none" }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Box
          key={i}
          p={4}
          border="1px solid"
          borderColor="border"
          borderRadius="lg"
          bg="bg"
        >
          <Flex justify="space-between" align="flex-start" mb={3}>
            <HStack gap={3} minW={0}>
              <ThemeSkeleton boxSize="32px" borderRadius="full" flexShrink={0} />
              <Box minW={0}>
                <ThemeSkeleton height="14px" width="140px" mb={1.5} />
                <ThemeSkeleton height="11px" width="100px" />
              </Box>
            </HStack>
            <ThemeSkeleton height="20px" width="70px" borderRadius="full" flexShrink={0} />
          </Flex>

          <Stack gap={3} pt={2} borderTop="1px solid" borderColor="border.muted">
            <Flex justify="space-between" align="center">
              <Text color="fg.subtle" textStyle="body-sm">Role:</Text>
              <ThemeSkeleton height="14px" width="70px" />
            </Flex>
            <Flex justify="space-between" align="center">
              <Text color="fg.subtle" textStyle="body-sm">Team:</Text>
              <ThemeSkeleton height="14px" width="90px" />
            </Flex>
            <Flex justify="space-between" align="center">
              <Text color="fg.subtle" textStyle="body-sm" flexShrink={0}>Practice Areas:</Text>
              <HStack gap={1} justify="flex-end">
                <ThemeSkeleton height="18px" width="80px" borderRadius="full" />
                <ThemeSkeleton height="18px" width="60px" borderRadius="full" />
              </HStack>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text color="fg.subtle" textStyle="body-sm">Invited By:</Text>
              <ThemeSkeleton height="14px" width="100px" />
            </Flex>
            <Flex justify="space-between" align="center">
              <Text color="fg.subtle" textStyle="body-sm">Sent:</Text>
              <ThemeSkeleton height="14px" width="90px" />
            </Flex>
          </Stack>

          <HStack gap={2} mt={4}>
            <ThemeSkeleton height="36px" width="50%" borderRadius="md" />
            <ThemeSkeleton height="36px" width="50%" borderRadius="md" />
          </HStack>
        </Box>
      ))}
    </Stack>
  );
}

export function InvitationsSkeleton() {
  return (
    <>
      <InvitationTableSkeleton />
      <InvitationMobileSkeleton />
    </>
  );
}
