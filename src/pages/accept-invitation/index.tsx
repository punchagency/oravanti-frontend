import { acceptInvitation, getMyPendingInvitation } from "@/api/organization";
import { useSignOut } from "@/hooks/useSignOut";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/utils/getErrorMessage";
import {
  Badge,
  Box,
  Button,
  Center,
  HStack,
  Image,
  Separator,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ShieldCheck, User } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AcceptInvitationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: signOut, isPending: isSigningOut } = useSignOut();
  const needsAcceptInvitation = useAuthStore((s) => s.needsAcceptInvitation);
  const needsPasswordChange = useAuthStore((s) => s.needsPasswordChange);

  useEffect(() => {
    if (!needsAcceptInvitation) {
      navigate(needsPasswordChange ? "/set-password" : "/", {
        replace: true,
      });
    }
  }, [needsAcceptInvitation, needsPasswordChange, navigate]);

  const { data: result, isLoading } = useQuery({
    queryKey: ["my-pending-invitation"],
    queryFn: getMyPendingInvitation,
    retry: false,
  });

  const invitation = result?.invitation;

  const acceptMutation = useMutation({
    mutationFn: () => acceptInvitation(invitation!.id),
    onSuccess: () => {
      useAuthStore.getState().setNeedsPasswordChange(true);
      useAuthStore.getState().setNeedsAcceptInvitation(false);
      const current = useAuthStore.getState();
      if (current.needsPasswordChange) {
        navigate("/set-password", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
      queryClient.invalidateQueries({ queryKey: ["my-pending-invitation"] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err) => {
      const msg = getErrorMessage(err, "Failed to accept invitation");
      alert(msg);
    },
  });

  if (isLoading) {
    return (
      <Center minH="100vh" bg="bg.subtle">
        <Spinner size="xl" color="brand.solid" />
      </Center>
    );
  }

  if (!invitation) {
    return (
      <Center minH="100vh" bg="bg.subtle">
        <Box
          layerStyle="surface-card"
          p={{ base: 8, md: 12 }}
          w="full"
          maxW="480px"
          textAlign="center"
        >
          <Text color="fg.muted" mb={4}>
            No pending invitations found.
          </Text>
          <Button
            onClick={() => navigate("/", { replace: true })}
            layerStyle="brand-button"
            size="lg"
            w="full"
            h="12"
          >
            Go to dashboard
          </Button>
        </Box>
      </Center>
    );
  }

  return (
    <Center minH="100vh" bg="bg.subtle" px={4}>
      <Box
        layerStyle="surface-card"
        p={{ base: 8, md: 12 }}
        w="full"
        maxW="520px"
        textAlign="center"
      >
        <Image
          src="/oravanti_logo.png"
          alt="Oravanti Logo"
          w={12}
          mx="auto"
          mb={6}
        />

        <Badge
          size="sm"
          borderRadius="full"
          px={3}
          py={1}
          bg="brand.solid"
          color="white"
          textTransform="none"
          fontWeight="500"
          mb={4}
        >
          Organization Invitation
        </Badge>

        <Text textStyle="heading" color="fg" mb={1}>
          You're invited to join
        </Text>
        <Text textStyle="heading" color="brand.solid" fontSize="22px" mb={6}>
          {invitation.organizationName}
        </Text>

        <Box
          bg="bg.muted"
          borderRadius="12px"
          p={4}
          textAlign="left"
          w="full"
          mb={6}
        >
          <VStack gap={3} align="stretch">
            <HStack gap={3}>
              <User size={16} color="var(--chakra-colors-fg-muted)" />
              <Box>
                <Text fontSize="11px" color="fg.subtle" fontWeight="500">
                  Invited by
                </Text>
                <Text fontSize="13px" color="fg" fontWeight="500">
                  {invitation.inviterName}
                </Text>
                <Text fontSize="12px" color="fg.muted">
                  {invitation.inviterEmail}
                </Text>
              </Box>
            </HStack>

            <Separator borderColor="border" />

            <HStack gap={3}>
              <ShieldCheck size={16} color="var(--chakra-colors-fg-muted)" />
              <Box>
                <Text fontSize="11px" color="fg.subtle" fontWeight="500">
                  Role
                </Text>
                <Text fontSize="13px" color="fg" textTransform="capitalize">
                  {invitation.role ?? "N/A"}
                </Text>
              </Box>
            </HStack>

            <Separator borderColor="border" />

            <HStack gap={3}>
              <CalendarDays size={16} color="var(--chakra-colors-fg-muted)" />
              <Box>
                <Text fontSize="11px" color="fg.subtle" fontWeight="500">
                  Invitation sent
                </Text>
                <Text fontSize="13px" color="fg">
                  {formatDate(invitation.createdAt)}
                </Text>
              </Box>
            </HStack>

            {invitation.expiresAt && (
              <>
                <Separator borderColor="border" />
                <HStack gap={3}>
                  <CalendarDays
                    size={16}
                    color="var(--chakra-colors-fg-muted)"
                  />
                  <Box>
                    <Text fontSize="11px" color="fg.subtle" fontWeight="500">
                      Expires
                    </Text>
                    <Text fontSize="13px" color="fg">
                      {formatDate(invitation.expiresAt)}
                    </Text>
                  </Box>
                </HStack>
              </>
            )}
          </VStack>
        </Box>

        <VStack gap={3} w="full">
          <Button
            onClick={() => acceptMutation.mutate()}
            loading={acceptMutation.isPending}
            layerStyle="brand-button"
            size="lg"
            w="full"
            h="12"
          >
            Accept Invitation
          </Button>

          <Button
            variant="outline"
            size="sm"
            w="full"
            borderColor="border"
            color="fg.muted"
            disabled={isSigningOut}
            onClick={() => {
              signOut();
            }}
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
            {isSigningOut && <Spinner size="xs" ml={2} />}
          </Button>
        </VStack>
      </Box>
    </Center>
  );
}
