import { Box, Dialog, Flex, Input, Portal, Spinner, Stack, Text, chakra } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Users, X, Check } from "lucide-react";
import { getEligibleTeams } from "@/api/leads";
import { BrandButton } from "@/components/ui/intake-ui";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useFeedbackDialog } from "@/hooks/useFeedbackDialog";

interface TeamSelectionModalProps {
  leadId: string;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  onSelect: (teamId: string | undefined) => void;
}

export function TeamSelectionModal({
  leadId,
  open,
  onOpenChange,
  onSelect,
}: TeamSelectionModalProps) {
  const { showError } = useFeedbackDialog();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: teams, isLoading, error } = useQuery({
    queryKey: ["eligible-teams", leadId],
    queryFn: () => getEligibleTeams(leadId),
    enabled: open && Boolean(leadId),
  });

  useEffect(() => {
    if (error) {
      showError({
        title: "Failed to load teams",
        description: getErrorMessage(error, "Please try again."),
      });
    }
  }, [error, showError]);

  useEffect(() => {
    if (open) {
      setSelectedTeamId(null);
      setSearch("");
    }
  }, [open]);

  const filteredTeams = useMemo(
    () =>
      (teams ?? []).filter(
        (t) => !search || t.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [teams, search],
  );

  const sortedTeams = useMemo(() => {
    const selected = filteredTeams.filter((t) => t.id === selectedTeamId);
    const unselected = filteredTeams.filter((t) => t.id !== selectedTeamId);
    return [...selected, ...unselected];
  }, [filteredTeams, selectedTeamId]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} placement="center">
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.46)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="440px"
            border="1px solid"
            borderColor="border"
            borderRadius="14px"
            bg="bg"
            boxShadow="0 24px 70px rgba(0, 0, 0, 0.26)"
          >
            <Flex direction="column">
              <Box p="24px 24px 12px">
                <Flex align="flex-start" justify="space-between" gap="16px">
                  <Box minW="0">
                    <Flex align="center" gap={2} mb="4px">
                      <Users size={16} />
                      <Dialog.Title
                        color="fg"
                        fontSize="17px"
                        fontWeight="600"
                        lineHeight="1.2"
                      >
                        Assign a team
                      </Dialog.Title>
                    </Flex>
                    <Dialog.Description
                      mt="4px"
                      color="fg.muted"
                      fontSize="13px"
                      lineHeight="1.45"
                    >
                      Choose which team this case should be assigned to.
                    </Dialog.Description>
                  </Box>
                  <Dialog.CloseTrigger asChild>
                    <chakra.button
                      type="button"
                      aria-label="Close"
                      display="grid"
                      placeItems="center"
                      flex="0 0 auto"
                      w="34px"
                      h="34px"
                      border="1px solid"
                      borderColor="border"
                      borderRadius="full"
                      bg="bg"
                      color="fg.muted"
                      _hover={{ bg: "bg.subtle" }}
                    >
                      <X size={16} />
                    </chakra.button>
                  </Dialog.CloseTrigger>
                </Flex>
              </Box>

              <Box px="24px" pb="20px">
                {isLoading ? (
                  <Box textAlign="center" py={10}>
                    <Spinner color="brand.solid" />
                  </Box>
                ) : !teams || teams.length === 0 ? (
                  <Stack
                    align="center"
                    py={10}
                    gap={3}
                    border="1px dashed"
                    borderColor="border.muted"
                    borderRadius="lg"
                  >
                    <Box color="fg.muted">
                      <Users size={24} />
                    </Box>
                    <Text color="fg.muted" fontSize="14px" fontWeight="500">
                      No eligible teams found
                    </Text>
                    <Text color="fg.subtle" fontSize="13px" textAlign="center">
                      No teams are configured for this case type.
                    </Text>
                  </Stack>
                ) : (
                  <Stack gap={3}>
                    <Input
                      placeholder="Search teams..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      h="36px"
                      px="12px"
                      border="1px solid"
                      borderColor="border"
                      borderRadius="7px"
                      bg="bg"
                      color="fg"
                      fontSize="13px"
                      _placeholder={{ color: "fg.muted" }}
                      _focus={{
                        borderColor: "brand.solid",
                        boxShadow: "0 0 0 1px var(--brand-cta)",
                      }}
                    />

                    <Box
                      maxH="220px"
                      overflowY="auto"
                      border="1px solid"
                      borderColor="border"
                      borderRadius="7px"
                      bg="bg"
                    >
                      {sortedTeams.length > 0 ? (
                        <Stack gap="0">
                          {sortedTeams.map((team) => {
                            const isSelected = selectedTeamId === team.id;
                            return (
                              <Flex
                                key={team.id}
                                align="center"
                                gap="8px"
                                px="10px"
                                py="7px"
                                cursor="pointer"
                                _hover={{ bg: "bg.muted" }}
                                borderBottom="1px solid"
                                borderColor="border"
                                _last={{ borderBottom: "none" }}
                                transition="background 0.1s"
                                bg={isSelected ? "bg.subtle" : undefined}
                                onClick={() =>
                                  setSelectedTeamId(
                                    isSelected ? null : team.id,
                                  )
                                }
                              >
                                <Box
                                  w="16px"
                                  h="16px"
                                  borderRadius="full"
                                  border="1.5px solid"
                                  borderColor={
                                    isSelected ? "brand.solid" : "border"
                                  }
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  flexShrink={0}
                                  bg={
                                    isSelected
                                      ? "brand.solid"
                                      : "transparent"
                                  }
                                  transition="all 0.1s"
                                >
                                  {isSelected && (
                                    <Box
                                      w="6px"
                                      h="6px"
                                      borderRadius="full"
                                      bg="white"
                                    />
                                  )}
                                </Box>
                                <Box flex={1}>
                                  <Text
                                    fontSize="13px"
                                    fontWeight="500"
                                    color="fg"
                                  >
                                    {team.name}
                                  </Text>
                                  {team.leadName && (
                                    <Text
                                      fontSize="11px"
                                      color="fg.muted"
                                    >
                                      Lead: {team.leadName}
                                    </Text>
                                  )}
                                </Box>
                                <Text
                                  fontSize="11px"
                                  color="fg.subtle"
                                  whiteSpace="nowrap"
                                >
                                  {team.memberCount} members
                                </Text>
                              </Flex>
                            );
                          })}
                        </Stack>
                      ) : (
                        <Text
                          p="10px"
                          fontSize="12px"
                          color="fg.muted"
                          textAlign="center"
                        >
                          {search
                            ? `No teams matching "${search}"`
                            : "No teams available"}
                        </Text>
                      )}
                    </Box>

                    <Flex justify="flex-end" gap="10px" mt="2px">
                      <chakra.button
                        type="button"
                        fontSize="13px"
                        color="fg.muted"
                        fontWeight="500"
                        _hover={{ color: "fg" }}
                        onClick={() => onSelect(undefined)}
                        bg="transparent"
                        border="none"
                        cursor="pointer"
                        px="8px"
                      >
                        Skip — assign later
                      </chakra.button>
                      <BrandButton
                        disabled={!selectedTeamId}
                        onClick={() => onSelect(selectedTeamId!)}
                        minW="100px"
                      >
                        <Check size={14} />
                        Assign
                      </BrandButton>
                    </Flex>
                  </Stack>
                )}
              </Box>
            </Flex>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
