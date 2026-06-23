import type { TeamListDTO } from "@/api/organization";
import { BrandButton } from "@/components/ui/intake-ui";
import { useTeamDetails } from "@/hooks/use-team-details";
import { useUpdateTeam } from "@/hooks/use-update-team";
import {
  Box,
  chakra,
  Dialog,
  Flex,
  Portal,
  RadioGroup,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { useMemo, useState } from "react";

const LEAD_ELIGIBLE_ROLES = ["attorney", "admin", "owner"];

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

interface TransferLeadDialogProps {
  team: TeamListDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferLeadDialog({
  team,
  open,
  onOpenChange,
}: TransferLeadDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const updateTeam = useUpdateTeam();
  const { data: fullTeam, isLoading } = useTeamDetails(open ? team.id : null);

  const eligibleMembers = useMemo(
    () =>
      (fullTeam?.members ?? []).filter(
        (m) =>
          m.id !== fullTeam?.leadId &&
          m.role &&
          LEAD_ELIGIBLE_ROLES.includes(m.role),
      ),
    [fullTeam],
  );

  const currentLead = useMemo(
    () => (fullTeam?.members ?? []).find((m) => m.id === fullTeam?.leadId),
    [fullTeam],
  );

  const handleTransfer = async () => {
    if (!selectedId) return;
    await updateTeam.mutateAsync({
      teamId: team.id,
      data: { leadId: selectedId },
    });
    setSelectedId(null);
    onOpenChange(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) setSelectedId(null);
        onOpenChange(details.open);
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px={{ base: "12px", sm: "16px" }}>
          <Dialog.Content
            w="full"
            maxW="480px"
            border="1px solid"
            borderColor="border.muted"
            borderRadius="14px"
            bg="bg.panel"
            p="0"
            boxShadow="lg"
            position="relative"
          >
            <Dialog.CloseTrigger asChild>
              <chakra.button
                type="button"
                aria-label="Close dialog"
                position="absolute"
                top="22px"
                right="22px"
                display="grid"
                placeItems="center"
                w="32px"
                h="32px"
                border="1px solid"
                borderColor="border.muted"
                borderRadius="8px"
                bg="transparent"
                color="fg.muted"
                _hover={{ bg: "bg.hover", color: "fg.default" }}
                zIndex={10}
              >
                <X size={16} />
              </chakra.button>
            </Dialog.CloseTrigger>

            {isLoading ? (
              <Flex justify="center" align="center" py={16}>
                <Spinner />
              </Flex>
            ) : (
            <Box p={{ base: "24px 16px 20px", sm: "32px 24px 24px" }}>
              <Dialog.Title color="fg.default" fontSize="18px" fontWeight="600">
                Transfer lead
              </Dialog.Title>
              <Dialog.Description
                mt="6px"
                color="fg.muted"
                fontSize="13px"
                lineHeight="1.4"
              >
                Select a new team lead from eligible team members.
              </Dialog.Description>

              {currentLead && (
                <Box
                  mt={4}
                  mb={1}
                  px="10px"
                  py="7px"
                  borderRadius="md"
                  bg="bg.subtle"
                  border="1px solid"
                  borderColor="border"
                >
                  <Text
                    fontSize="11px"
                    fontWeight="500"
                    color="fg.subtle"
                    mb={1}
                  >
                    Current lead
                  </Text>
                  <Flex align="center" gap="8px">
                    <Flex
                      w="28px"
                      h="28px"
                      borderRadius="full"
                      bg="bg"
                      border="1px solid"
                      borderColor="border"
                      align="center"
                      justify="center"
                      fontWeight="600"
                      fontSize="10px"
                      flexShrink={0}
                    >
                      {getInitials(currentLead.firstName, currentLead.lastName)}
                    </Flex>
                    <Box>
                      <Text fontSize="13px" fontWeight="500" color="fg">
                        {currentLead.firstName} {currentLead.lastName}
                      </Text>
                      <Text fontSize="11px" color="fg.muted">
                        {currentLead.role ?? "—"}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              )}

              <Text
                fontSize="11px"
                fontWeight="700"
                color="fg.muted"
                mt={5}
                mb={2}
              >
                SELECT NEW LEAD
              </Text>

              <RadioGroup.Root
                value={selectedId ?? ""}
                onValueChange={(e) => setSelectedId(e.value)}
              >
                <Stack gap="6px" maxH="280px" overflowY="auto">
                  {eligibleMembers.length > 0 ? (
                    eligibleMembers.map((member) => (
                      <Box key={member.id} as="label" cursor="pointer">
                        <Flex
                          align="center"
                          gap="10px"
                          px="10px"
                          py="7px"
                          borderRadius="md"
                          border="1px solid"
                          borderColor={
                            selectedId === member.id ? "brand.solid" : "border"
                          }
                          bg={
                            selectedId === member.id ? "bg.muted" : "bg.input"
                          }
                          _hover={{ borderColor: "brand.solid" }}
                          transition="all 0.12s"
                        >
                          <RadioGroup.Item
                            id={`transfer-lead-${member.id}`}
                            value={member.id}
                          >
                            <RadioGroup.ItemHiddenInput />
                          </RadioGroup.Item>
                          <Flex
                            w="32px"
                            h="32px"
                            borderRadius="full"
                            bg="bg"
                            border="1px solid"
                            borderColor="border"
                            align="center"
                            justify="center"
                            fontWeight="600"
                            fontSize="11px"
                            flexShrink={0}
                          >
                            {getInitials(member.firstName, member.lastName)}
                          </Flex>
                          <Box flex={1}>
                            <Text fontSize="13px" fontWeight="500" color="fg">
                              {member.firstName} {member.lastName}
                            </Text>
                            <Text fontSize="11px" color="fg.muted">
                              {member.role ?? "—"}
                            </Text>
                          </Box>
                        </Flex>
                      </Box>
                    ))
                  ) : (
                    <Text
                      fontSize="13px"
                      color="fg.muted"
                      textAlign="center"
                      py={4}
                    >
                      No eligible members available
                    </Text>
                  )}
                </Stack>
              </RadioGroup.Root>

              <Flex
                justify="space-between"
                mt="24px"
                gap="12px"
                direction={{ base: "column-reverse", sm: "row" }}
              >
                <chakra.button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  height="44px"
                  w={{ base: "full", sm: "auto" }}
                  flex={{ base: undefined, sm: "1" }}
                  borderRadius="10px"
                  fontSize="14px"
                  fontWeight="600"
                  border="1px solid"
                  borderColor="border.muted"
                  bg="transparent"
                  color="fg.default"
                  _hover={{ bg: "bg.hover" }}
                >
                  Cancel
                </chakra.button>
                <BrandButton
                  type="button"
                  onClick={handleTransfer}
                  height="44px"
                  w={{ base: "full", sm: "auto" }}
                  flex={{ base: undefined, sm: "1" }}
                  disabled={!selectedId}
                  loading={updateTeam.isPending}
                  opacity={!selectedId ? 0.5 : 1}
                >
                  Transfer lead
                </BrandButton>
              </Flex>
            </Box>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
