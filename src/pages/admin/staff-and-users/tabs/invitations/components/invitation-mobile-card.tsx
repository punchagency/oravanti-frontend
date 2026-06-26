import type { InvitationDTO } from "@/api/organization";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Portal,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { RefreshCw, X } from "lucide-react";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

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
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface InvitationMobileCardProps {
  invitation: InvitationDTO;
  onResend: (email: string, role: string) => void;
  onCancel: (id: string) => void;
  isResending: boolean;
  isCanceling: boolean;
}

export function InvitationMobileCard({
  invitation: inv,
  onResend,
  onCancel,
  isResending,
  isCanceling: _isCanceling,
}: InvitationMobileCardProps) {
  const { showConfirm } = useConfirmDialog();
  const displayName = [inv.firstName, inv.lastName]
    .filter(Boolean)
    .join(" ") || inv.email;

  return (
    <Box
      p={4}
      border="1px solid"
      borderColor="border"
      borderRadius="lg"
      bg="bg"
      _hover={{ borderColor: "brand.solid" }}
      transition="border-color 0.2s"
    >
      <Flex justify="space-between" align="flex-start" mb={3}>
        <HStack gap={3} minW={0}>
          <Avatar.Root size="sm" flexShrink={0} width="32px" height="32px">
            <Avatar.Fallback
              name={displayName}
              bg="bg.muted"
              color="fg"
              fontSize="xs"
            />
          </Avatar.Root>
          <Box minW={0}>
            <Text fontWeight="600" color="fg" truncate>
              {displayName}
            </Text>
            <Text textStyle="body-sm" color="fg.muted" truncate>
              {inv.email}
            </Text>
          </Box>
        </HStack>
        <Badge
          px={2.5}
          py={0.5}
          borderRadius="full"
          textTransform="none"
          fontWeight="500"
          style={getInvitationStatusStyles(inv.status)}
          flexShrink={0}
        >
          {getInvitationStatusLabel(inv.status)}
        </Badge>
      </Flex>

      <Stack
        gap={2}
        textStyle="body-sm"
        pt={2}
        borderTop="1px solid"
        borderColor="border.muted"
      >
        <Flex justify="space-between" align="center">
          <Text color="fg.subtle">Role:</Text>
          <Text color="fg" fontWeight="500" textTransform="capitalize">
            {inv.role}
          </Text>
        </Flex>
        <Flex justify="space-between" align="center">
          <Text color="fg.subtle">Team(s):</Text>
          {!inv.team ? (
            <Text color="fg.subtle">None</Text>
          ) : (() => {
            const teams = inv.team.split(", ");
            return (
              <HStack gap={1}>
                <Badge
                  size="sm"
                  borderRadius="full"
                  px={2}
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
                  <Tooltip.Root positioning={{ placement: "top" }}>
                    <Tooltip.Trigger asChild>
                      <Text textStyle="body-sm" color="fg.muted" cursor="pointer">
                        +{teams.length - 1}
                      </Text>
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
          })()}
        </Flex>
        <Flex justify="space-between" align="center">
          <Text color="fg.subtle" flexShrink={0}>
            Practice Areas:
          </Text>
          {inv.practiceAreas.length === 0 ? (
            <Text color="fg.subtle">—</Text>
          ) : (
            <HStack gap={1} wrap="wrap" justify="flex-end">
              {inv.practiceAreas.slice(0, 2).map((area, idx) => (
                <Badge
                  key={idx}
                  size="sm"
                  variant="subtle"
                  textTransform="none"
                  bg="rgba(186, 117, 23, 0.12)"
                  color="#BA7517"
                >
                  {area.name}
                </Badge>
              ))}
              {inv.practiceAreas.length > 2 && (
                <Tooltip.Root positioning={{ placement: "top" }}>
                  <Tooltip.Trigger asChild>
                    <Text textStyle="body-sm" color="fg.subtle" cursor="pointer">
                      +{inv.practiceAreas.length - 2}
                    </Text>
                  </Tooltip.Trigger>
                  <Portal>
                    <Tooltip.Positioner>
                      <Tooltip.Content>
                        {inv.practiceAreas.map((a) => a.name).join(", ")}
                      </Tooltip.Content>
                    </Tooltip.Positioner>
                  </Portal>
                </Tooltip.Root>
              )}
            </HStack>
          )}
        </Flex>
        <Flex justify="space-between" align="center">
          <Text color="fg.subtle">Invited By:</Text>
          <Text color="fg" textAlign="right">
            {inv.invitedBy || "—"}
          </Text>
        </Flex>
        <Flex justify="space-between" align="center">
          <Text color="fg.subtle">Sent:</Text>
          <Text color="fg.muted">{formatDate(inv.createdAt)}</Text>
        </Flex>
      </Stack>

      {inv.status === "pending" && (
        <HStack gap={2} mt={4}>
          <Button
            variant="outline"
            size="sm"
            flex={1}
            borderColor="border"
            _hover={{ bg: "bg.muted" }}
            loading={isResending}
            onClick={() => onResend(inv.email, inv.role)}
          >
            <RefreshCw size={13} />
            Resend
          </Button>
          <Button
            variant="outline"
            size="sm"
            flex={1}
            borderColor="red.500"
            color="red.500"
            _hover={{ bg: "rgba(224, 84, 84, 0.1)" }}
            onClick={() =>
              showConfirm({
                title: "Revoke invitation",
                description: `Are you sure you want to revoke the invitation for ${inv.email}? This will also remove their staff record and user account.`,
                confirmLabel: "Yes, revoke",
                cancelLabel: "Keep",
                onConfirm: () => onCancel(inv.id),
              })
            }
          >
            <X size={13} />
            Revoke
          </Button>
        </HStack>
      )}
    </Box>
  );
}
