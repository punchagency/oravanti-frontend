import type { InvitationDTO } from "@/api/organization";
import { Stack, Text, VStack } from "@chakra-ui/react";
import { InvitationMobileCard } from "./invitation-mobile-card";

interface InvitationMobileListProps {
  invitations: InvitationDTO[];
  onResend: (email: string, role: string) => void;
  onCancel: (id: string) => void;
  isResending: boolean;
  isCanceling: boolean;
}

export function InvitationMobileList({
  invitations,
  onResend,
  onCancel,
  isResending,
  isCanceling,
}: InvitationMobileListProps) {
  if (invitations.length === 0) {
    return (
      <VStack
        py={16}
        gap={2}
        textAlign="center"
        display={{ base: "flex", lg: "none" }}
      >
        <Text color="fg.muted" textStyle="lg" fontWeight="600">
          No invitations found
        </Text>
        <Text color="fg.subtle" textStyle="body-sm">
          Try adjusting your filters or search terms.
        </Text>
      </VStack>
    );
  }

  return (
    <Stack gap={4} display={{ base: "flex", lg: "none" }}>
      {invitations.map((inv) => (
        <InvitationMobileCard
          key={inv.id}
          invitation={inv}
          onResend={onResend}
          onCancel={onCancel}
          isResending={isResending}
          isCanceling={isCanceling}
        />
      ))}
    </Stack>
  );
}
