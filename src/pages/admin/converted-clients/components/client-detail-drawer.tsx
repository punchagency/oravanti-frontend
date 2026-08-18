import {
  useConvertedClientDetail,
  useSendClientPortalInvite,
  useClientPortalSessions,
  useRevokeClientSession,
  useClientPortalStatus,
  useUpdateClientPortalStatus,
} from "@/hooks/use-converted-clients";
import { leadSourceLabels } from "@/api/converted-clients";
import { PortalAccessBadge } from "./portal-access-badge";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import {
  Box,
  Button,
  Drawer,
  Flex,
  HStack,
  Portal,
  Separator,
  Stack,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  ExternalLink,
  LogOut,
  Mail,
  Monitor,
  ShieldOff,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface ClientDetailDrawerProps {
  clientId: string | null;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
}

export function ClientDetailDrawer({
  clientId,
  open,
  onOpenChange,
}: ClientDetailDrawerProps) {
  const { data: client, isLoading } = useConvertedClientDetail(clientId);
  const { data: portalStatus } = useClientPortalStatus(clientId);
  const { data: sessions = [] } = useClientPortalSessions(clientId);
  const inviteMutation = useSendClientPortalInvite();
  const revokeMutation = useRevokeClientSession();
  const portalStatusMutation = useUpdateClientPortalStatus();

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      placement="end"
      size="lg"
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            {isLoading ? (
              <Drawer.Body py={6}>
                <VStack align="stretch" gap={4}>
                  <ThemeSkeleton h="24px" w="200px" />
                  <ThemeSkeleton h="16px" w="160px" />
                  <Separator />
                  <ThemeSkeleton h="80px" />
                  <ThemeSkeleton h="120px" />
                </VStack>
              </Drawer.Body>
            ) : client ? (
              <>
                <Drawer.Header>
                  <Drawer.Title>{client.displayName}</Drawer.Title>
                  <Drawer.CloseTrigger />
                </Drawer.Header>
                <Drawer.Body>
                  <VStack align="stretch" gap={5}>
                    {/* Contact info */}
                    <Box>
                      <Text textStyle="label" color="fg.muted" mb={2}>
                        Contact
                      </Text>
                      <Text fontSize="13px" color="fg">
                        {client.email}
                      </Text>
                      {client.phone ? (
                        <Text fontSize="13px" color="fg.muted">
                          {client.phone}
                        </Text>
                      ) : null}
                    </Box>

                    {/* Portal access */}
                    <Box
                      p={3}
                      border="1px solid"
                      borderColor="border"
                      borderRadius="lg"
                    >
                      <Flex justify="space-between" align="center" mb={2}>
                        <Text textStyle="label" color="fg.muted">
                          Portal Access
                        </Text>
                        {portalStatus ? (
                          <PortalAccessBadge
                            status={portalStatus.accountStatus}
                            hasAccount={portalStatus.hasAccount}
                          />
                        ) : null}
                      </Flex>
                      {portalStatus?.hasAccount ? (
                        <VStack align="stretch" gap={1}>
                          {portalStatus.lastLoginAt ? (
                            <Text fontSize="12px" color="fg.subtle">
                              Last login:{" "}
                              {dayjs(portalStatus.lastLoginAt).fromNow()}
                            </Text>
                          ) : (
                            <Text fontSize="12px" color="fg.subtle">
                              Never logged in
                            </Text>
                          )}
                          <Text fontSize="12px" color="fg.subtle">
                            Active sessions: {portalStatus.activeSessionCount}
                          </Text>
                        </VStack>
                      ) : null}
                      <HStack gap={2} mt={3}>
                        {!portalStatus?.hasAccount ? (
                          <Button
                            size="xs"
                            bg="brand.solid"
                            color="brand.contrast"
                            _hover={{ bg: "brand.500" }}
                            onClick={() => inviteMutation.mutate(client.id)}
                            loading={inviteMutation.isPending}
                          >
                            <Mail size={12} />
                            Send invitation
                          </Button>
                        ) : (
                          <>
                            {portalStatus?.accountStatus === "active" ? (
                              <Button
                                size="xs"
                                variant="outline"
                                color="fg.error"
                                _hover={{ bg: "bg.error", color: "fg.error" }}
                                onClick={() =>
                                  portalStatusMutation.mutate({
                                    clientId: client.id,
                                    status: "disabled",
                                  })
                                }
                                loading={portalStatusMutation.isPending}
                              >
                                <ShieldOff size={12} />
                                Disable access
                              </Button>
                            ) : portalStatus?.accountStatus === "disabled" ? (
                              <Button
                                size="xs"
                                variant="outline"
                                color="fg.success"
                                _hover={{ bg: "bg.success", color: "fg.success" }}
                                onClick={() =>
                                  portalStatusMutation.mutate({
                                    clientId: client.id,
                                    status: "active",
                                  })
                                }
                                loading={portalStatusMutation.isPending}
                              >
                                <ShieldCheck size={12} />
                                Enable access
                              </Button>
                            ) : null}
                          </>
                        )}
                      </HStack>
                    </Box>

                    {/* Lead origin */}
                    <Box>
                      <Text textStyle="label" color="fg.muted" mb={2}>
                        Lead Origin
                      </Text>
                      <VStack align="stretch" gap={1}>
                        <Flex justify="space-between">
                          <Text fontSize="13px" color="fg.muted">Source</Text>
                          <Text fontSize="13px" color="fg">
                            {leadSourceLabels[client.leadSource] ?? client.leadSource}
                          </Text>
                        </Flex>
                        {client.practiceAreaName ? (
                          <Flex justify="space-between">
                            <Text fontSize="13px" color="fg.muted">
                              Practice area
                            </Text>
                            <Text fontSize="13px" color="fg">
                              {client.practiceAreaName}
                            </Text>
                          </Flex>
                        ) : null}
                        {client.attorneyFirstName ? (
                          <Flex justify="space-between">
                            <Text fontSize="13px" color="fg.muted">
                              Assigned attorney
                            </Text>
                            <Text fontSize="13px" color="fg">
                              {client.attorneyFirstName}{" "}
                              {client.attorneyLastName}
                            </Text>
                          </Flex>
                        ) : null}
                        <Flex justify="space-between">
                          <Text fontSize="13px" color="fg.muted">
                            Converted
                          </Text>
                          <Text fontSize="13px" color="fg">
                            {client.convertedAt
                              ? dayjs(client.convertedAt).format("MMM D, YYYY")
                              : "—"}
                          </Text>
                        </Flex>
                      </VStack>
                    </Box>

                    {/* Cases */}
                    <Box>
                      <Flex justify="space-between" align="center" mb={2}>
                        <Text textStyle="label" color="fg.muted">
                          Cases ({client.cases.length})
                        </Text>
                        {client.convertedCaseId ? (
                          <Link
                            to={`/cases/${client.convertedCaseId}`}
                            style={{ textDecoration: "none" }}
                          >
                            <Text
                              fontSize="12px"
                              color="brand.solid"
                              _hover={{ textDecoration: "underline" }}
                            >
                              View original case
                            </Text>
                          </Link>
                        ) : null}
                      </Flex>
                      {client.cases.length > 0 ? (
                        <Stack gap={2}>
                          {client.cases.map((c) => (
                            <Link
                              key={c.id}
                              to={`/cases/${c.id}`}
                              style={{ textDecoration: "none" }}
                            >
                              <Flex
                                p={2}
                                border="1px solid"
                                borderColor="border"
                                borderRadius="md"
                                justify="space-between"
                                align="center"
                                _hover={{ bg: "bg.subtle" }}
                              >
                                <VStack align="start" gap={0}>
                                  <Text fontSize="13px" fontWeight="500" color="fg">
                                    {c.caseNumber}
                                  </Text>
                                  <Text fontSize="11px" color="fg.muted">
                                    {c.status}
                                  </Text>
                                </VStack>
                                <ExternalLink size={14} color="fg.muted" />
                              </Flex>
                            </Link>
                          ))}
                        </Stack>
                      ) : (
                        <Text fontSize="13px" color="fg.subtle">
                          No cases yet
                        </Text>
                      )}
                    </Box>

                    {/* Active sessions */}
                    {portalStatus?.hasAccount && sessions.length > 0 ? (
                      <Box>
                        <Text textStyle="label" color="fg.muted" mb={2}>
                          Active Sessions
                        </Text>
                        <Box
                          border="1px solid"
                          borderColor="border"
                          borderRadius="lg"
                          overflow="hidden"
                        >
                          <Table.Root size="sm">
                            <Table.Header>
                              <Table.Row bg="bg.subtle">
                                <Table.ColumnHeader fontSize="10px" h="32px">
                                  Device
                                </Table.ColumnHeader>
                                <Table.ColumnHeader fontSize="10px" h="32px">
                                  IP
                                </Table.ColumnHeader>
                                <Table.ColumnHeader fontSize="10px" h="32px">
                                  Expires
                                </Table.ColumnHeader>
                                <Table.ColumnHeader fontSize="10px" h="32px" w="40px" />
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              {sessions.map((s) => (
                                <Table.Row key={s.id}>
                                  <Table.Cell fontSize="12px" py={2}>
                                    <HStack gap={1}>
                                      <Monitor size={12} />
                                      <Text truncate maxW="120px">
                                        {s.userAgent?.split(" ").slice(-1)[0] ?? "Unknown"}
                                      </Text>
                                    </HStack>
                                  </Table.Cell>
                                  <Table.Cell fontSize="12px" py={2}>
                                    {s.ipAddress ?? "—"}
                                  </Table.Cell>
                                  <Table.Cell fontSize="12px" py={2}>
                                    {dayjs(s.expiresAt).fromNow()}
                                  </Table.Cell>
                                  <Table.Cell py={2}>
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      color="fg.error"
                                      onClick={() =>
                                        revokeMutation.mutate({
                                          clientId: client.id,
                                          token: s.token,
                                        })
                                      }
                                    >
                                      <LogOut size={12} />
                                    </Button>
                                  </Table.Cell>
                                </Table.Row>
                              ))}
                            </Table.Body>
                          </Table.Root>
                        </Box>
                      </Box>
                    ) : null}
                  </VStack>
                </Drawer.Body>
              </>
            ) : (
              <Drawer.Body>
                <Text color="fg.muted">Client not found</Text>
              </Drawer.Body>
            )}
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
