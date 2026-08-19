import type { EligibleAssignee } from "@/api/case-review";
import { BrandButton, MutedText } from "@/components/ui/intake-ui";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useEligibleAssignees } from "@/hooks/use-case-review";
import {
  Box,
  Dialog,
  Flex,
  Input,
  Portal,
  Spinner,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import { Check, UserCheck, X } from "lucide-react";
import { useMemo, useState } from "react";

const fullName = (a: EligibleAssignee) =>
  [a.firstName, a.lastName].filter(Boolean).join(" ") || a.email || "Unnamed";

/**
 * Pick the attorney an issue's work should go to.
 *
 * The server resolves the eligible set either way — a firm with one attorney
 * never sees this, and a submitted id is re-checked on the way in — so this is
 * only about giving the reviewer the choice, never about enforcing it.
 */
export function AssigneeDialog({
  issueId,
  actionLabel,
  open,
  onOpenChange,
  onConfirm,
  busy = false,
}: {
  issueId: string;
  actionLabel: string;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  onConfirm: (assigneeStaffId: string) => void;
  busy?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { data: assignees, isLoading } = useEligibleAssignees(issueId, open);

  // Reset on open rather than unmounting the dialog, which would break the focus
  // trap. Adjusted during render instead of in an effect — setState in an effect
  // costs an extra render pass, and React recommends this for prop-driven resets.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSelectedId(null);
      setSearch("");
    }
  }

  // The input stays responsive; only the filter waits for a pause in typing.
  const query = useDebouncedValue(search.trim().toLowerCase(), 200);

  const filtered = useMemo(
    () =>
      (assignees ?? []).filter(
        (a) => !query || fullName(a).toLowerCase().includes(query),
      ),
    [assignees, query],
  );

  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
      placement="center"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.46)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="420px"
            border="1px solid"
            borderColor="border"
            borderRadius="14px"
            bg="bg"
            boxShadow="0 24px 70px rgba(0, 0, 0, 0.26)"
          >
            <Box p="24px 24px 12px">
              <Flex align="flex-start" justify="space-between" gap="16px">
                <Box minW="0">
                  <Flex align="center" gap={2} mb="4px">
                    <UserCheck size={16} />
                    <Dialog.Title
                      color="fg"
                      fontSize="17px"
                      fontWeight="600"
                      lineHeight="1.2"
                    >
                      {actionLabel}
                    </Dialog.Title>
                  </Flex>
                  <Dialog.Description
                    mt="4px"
                    color="fg.muted"
                    fontSize="13px"
                    lineHeight="1.45"
                  >
                    Choose the attorney this should go to.
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
              ) : !assignees || assignees.length === 0 ? (
                <Stack
                  align="center"
                  py={10}
                  gap={3}
                  border="1px dashed"
                  borderColor="border.muted"
                  borderRadius="lg"
                >
                  <Box color="fg.muted">
                    <UserCheck size={24} />
                  </Box>
                  <Text color="fg.muted" fontSize="14px" fontWeight="500">
                    No attorneys available
                  </Text>
                  <Text color="fg.subtle" fontSize="13px" textAlign="center">
                    Add an attorney to the firm before assigning this.
                  </Text>
                </Stack>
              ) : (
                <Stack gap={3}>
                  <Input
                    placeholder="Search attorneys..."
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
                    {filtered.length > 0 ? (
                      <Stack gap="0">
                        {filtered.map((assignee) => {
                          const isSelected = selectedId === assignee.id;
                          return (
                            <Flex
                              key={assignee.id}
                              align="center"
                              gap="8px"
                              px="10px"
                              py="8px"
                              cursor="pointer"
                              _hover={{ bg: "bg.muted" }}
                              borderBottom="1px solid"
                              borderColor="border"
                              _last={{ borderBottom: "none" }}
                              transition="background 0.1s"
                              bg={isSelected ? "bg.subtle" : undefined}
                              onClick={() =>
                                setSelectedId(isSelected ? null : assignee.id)
                              }
                            >
                              <Box
                                w="16px"
                                h="16px"
                                borderRadius="full"
                                border="1.5px solid"
                                borderColor={isSelected ? "brand.solid" : "border"}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                flexShrink={0}
                                bg={isSelected ? "brand.solid" : "transparent"}
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
                              <Box flex={1} minW="0">
                                <Text fontSize="13px" fontWeight="500" color="fg">
                                  {fullName(assignee)}
                                </Text>
                                {assignee.email && (
                                  <MutedText fontSize="11px">
                                    {assignee.email}
                                  </MutedText>
                                )}
                              </Box>
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
                        No attorneys matching "{search}"
                      </Text>
                    )}
                  </Box>

                  <Flex justify="flex-end" gap="10px" mt="2px">
                    <BrandButton
                      disabled={!selectedId || busy}
                      onClick={() => onConfirm(selectedId!)}
                      minW="100px"
                    >
                      <Check size={14} />
                      Assign
                    </BrandButton>
                  </Flex>
                </Stack>
              )}
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
