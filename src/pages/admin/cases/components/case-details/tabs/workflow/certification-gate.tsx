import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Combobox,
  Dialog,
  Portal,
  Text,
  Textarea,
  VStack,
  createListCollection,
} from "@chakra-ui/react";
import { AlertTriangle } from "lucide-react";
import { useEligibleStaff, useAssignStep } from "./hooks";
import { useHasPermission } from "@/hooks/use-has-permission";
import type { CaseStepInstance } from "./types";

interface CertificationGateProps {
  /** The case ID, required for the assign mutation */
  caseId: string;
  /** The step instance being assigned */
  step: CaseStepInstance;
  /** The certification required by this step (from the template definition) */
  requiredCertification: string | null;
  /** Callback invoked after a successful assignment */
  onAssigned: () => void;
}

/**
 * Manages the assignment flow for a workflow step.
 *
 * Shows a searchable combobox of certified staff. If the step is already
 * assigned and not yet complete, the current assignee is pre-selected so
 * the user can reassign by picking someone else. Completed steps show a
 * read-only badge. When no certified staff are available, attorneys see
 * an override dialog.
 */
export function CertificationGate({
  caseId,
  step,
  requiredCertification,
  onAssigned,
}: CertificationGateProps) {
  const canOverride = useHasPermission("cases", "update");

  const { data: eligibleStaff } = useEligibleStaff(requiredCertification);
  const assignMutation = useAssignStep(caseId);

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [overrideRationale, setOverrideRationale] = useState("");
  const [assignSearch, setAssignSearch] = useState("");
  const [overrideSearch, setOverrideSearch] = useState("");

  /** Determine eligibility groups for display logic */
  const certifiedStaff = (eligibleStaff ?? []).filter((s) => {
    if (requiredCertification === null) return true;
    return s.certifications.includes(requiredCertification);
  });

  const hasCertifiedStaff = certifiedStaff.length > 0;

  /** Collection for the assignment combobox */
  const assignCollection = useMemo(
    () =>
      createListCollection({
        items: certifiedStaff.map((s) => ({
          value: s.id,
          label: `${s.name} (${s.role})`,
        })),
      }),
    [certifiedStaff],
  );

  const assignValue = step.assignedTo && step.status !== "complete" ? [step.assignedTo.id] : [];

  const filteredAssignItems = assignSearch
    ? assignCollection.items.filter((item) =>
        item.label.toLowerCase().includes(assignSearch.toLowerCase()),
      )
    : assignCollection.items;

  /** Collection for the override dialog staff selector */
  const overrideCollection = useMemo(
    () =>
      createListCollection({
        items: (eligibleStaff ?? [])
          .filter((s) => s.active)
          .map((s) => ({
            value: s.id,
            label: `${s.name} (${s.role})`,
          })),
      }),
    [eligibleStaff],
  );

  const filteredOverrideItems = overrideSearch
    ? overrideCollection.items.filter((item) =>
        item.label.toLowerCase().includes(overrideSearch.toLowerCase()),
      )
    : overrideCollection.items;

  /** Handle assignment to a specific staff member */
  const handleAssign = async (staffId: string) => {
    try {
      await assignMutation.mutateAsync({ stepId: step.stepId, staffId });
      setAssignSearch("");
      onAssigned();
    } catch {
      // Error toast is handled by the mutation
    }
  };

  /** Handle attorney override assignment */
  const handleOverrideAssign = async () => {
    if (!selectedStaffId || !overrideRationale.trim()) return;
    try {
      await assignMutation.mutateAsync({
        stepId: step.stepId,
        staffId: selectedStaffId,
        overrideRationale: overrideRationale.trim(),
      });
      setShowOverrideDialog(false);
      setOverrideRationale("");
      setSelectedStaffId(null);
      setOverrideSearch("");
      onAssigned();
    } catch {
      // Error toast is handled by the mutation
    }
  };

  // Completed steps — show a read-only badge
  if (step.status === "complete" && step.assignedTo) {
    return (
      <Box
        bg="green.50"
        color="green.700"
        borderRadius="full"
        px={2.5}
        py={0.5}
        fontSize="10px"
        fontWeight="500"
        lineHeight="12px"
      >
        {step.assignedTo.name} completed
      </Box>
    );
  }

  // Unassigned with no certified staff and not allowed to override
  if (!step.assignedTo && !hasCertifiedStaff && !canOverride) {
    return (
      <Box
        bg="orange.50"
        color="orange.700"
        borderRadius="full"
        px={2.5}
        py={0.5}
        fontSize="10px"
        fontWeight="500"
        lineHeight="12px"
      >
        No certified staff available
      </Box>
    );
  }

  return (
    <>
      {/* Assignment combobox — shown for unassigned or in-progress steps */}
      {hasCertifiedStaff && (
        <Combobox.Root
          collection={assignCollection}
          size="xs"
          maxW="240px"
          value={assignValue}
          inputValue={assignSearch}
          onInputValueChange={(e) => setAssignSearch(e.inputValue)}
          onValueChange={(e) => {
            const staffId = e.value[0];
            if (staffId && staffId !== (step.assignedTo?.id ?? "")) {
              handleAssign(staffId);
            }
          }}
          positioning={{ sameWidth: true }}
          openOnClick
        >
          <Combobox.Control>
            <Combobox.Input
              placeholder={step.assignedTo ? `Change (${step.assignedTo.name})` : "Assign..."}
              fontSize="11px"
              h="26px"
              px={2}
              borderRadius="md"
              borderColor="border"
              bg="bg"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              _placeholder={{ fontSize: "11px", color: "fg.muted" }}
            />
            <Combobox.IndicatorGroup>
              {step.assignedTo && <Combobox.ClearTrigger />}
              <Combobox.Trigger />
            </Combobox.IndicatorGroup>
          </Combobox.Control>
          <Portal>
            <Combobox.Positioner>
              <Combobox.Content>
                {filteredAssignItems.length === 0 ? (
                  <Text p={3} fontSize="sm" color="fg.muted">
                    No matches
                  </Text>
                ) : (
                  filteredAssignItems.map((item) => (
                    <Combobox.Item key={item.value} item={item} py={1.5}>
                      <Combobox.ItemText
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                      >
                        {item.label}
                      </Combobox.ItemText>
                      <Combobox.ItemIndicator />
                    </Combobox.Item>
                  ))
                )}
              </Combobox.Content>
            </Combobox.Positioner>
          </Portal>
        </Combobox.Root>
      )}

      {/* No certified staff — attorney can override */}
      {!step.assignedTo && !hasCertifiedStaff && canOverride && (
        <Button
          size="2xs"
          variant="outline"
          borderColor="orange.300"
          color="orange.700"
          fontSize="10px"
          h="20px"
          onClick={() => setShowOverrideDialog(true)}
        >
          <AlertTriangle size={10} />
          Override gate
        </Button>
      )}

      {/* Attorney override dialog */}
      <Dialog.Root
        open={showOverrideDialog}
        onOpenChange={(details) => setShowOverrideDialog(details.open)}
        size="sm"
      >
        <Portal>
          <Dialog.Backdrop backdropFilter="blur(1px)" />
          <Dialog.Positioner px="16px">
            <Dialog.Content
              w="full"
              maxW="420px"
              border="1px solid"
              borderColor="border"
              borderRadius="lg"
              bg="bg"
            >
              <Dialog.Header>
                <Dialog.Title fontSize="14px" fontWeight="600">
                  Override certification gate
                </Dialog.Title>
              </Dialog.Header>

              <Dialog.Body>
                <VStack gap={3} align="stretch">
                  <Text fontSize="12px" color="fg.muted">
                    This step requires{" "}
                    <Text as="span" fontWeight="500" color="fg">
                      {requiredCertification}
                    </Text>{" "}
                    certification. No certified staff are available. As an
                    attorney, you may override this requirement.
                  </Text>

                  <Box>
                    <Text
                      fontSize="10px"
                      fontWeight="500"
                      color="fg.subtle"
                      textTransform="uppercase"
                      letterSpacing="0.5px"
                      mb={1}
                    >
                      Select staff member
                    </Text>
                    <Combobox.Root
                      collection={overrideCollection}
                      size="sm"
                      w="full"
                      value={selectedStaffId ? [selectedStaffId] : []}
                      inputValue={overrideSearch}
                      onInputValueChange={(e) => setOverrideSearch(e.inputValue)}
                      onValueChange={(e) => {
                        setSelectedStaffId(e.value[0] ?? null);
                      }}
                      positioning={{ sameWidth: true }}
                      openOnClick
                    >
                      <Combobox.Control>
                        <Combobox.Input
                          placeholder="Search staff..."
                          fontSize="12px"
                          h="34px"
                          px={2}
                          borderRadius="md"
                          borderColor="border.input"
                          bg="bg.input"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                          _placeholder={{ fontSize: "12px" }}
                        />
                        <Combobox.IndicatorGroup>
                          <Combobox.Trigger />
                        </Combobox.IndicatorGroup>
                      </Combobox.Control>
                      <Portal>
                        <Combobox.Positioner>
                          <Combobox.Content>
                            {filteredOverrideItems.length === 0 ? (
                              <Text p={3} fontSize="sm" color="fg.muted">
                                No matches
                              </Text>
                            ) : (
                              filteredOverrideItems.map((item) => (
                                <Combobox.Item key={item.value} item={item} py={1.5}>
                                  <Combobox.ItemText
                                    overflow="hidden"
                                    textOverflow="ellipsis"
                                    whiteSpace="nowrap"
                                  >
                                    {item.label}
                                  </Combobox.ItemText>
                                  <Combobox.ItemIndicator />
                                </Combobox.Item>
                              ))
                            )}
                          </Combobox.Content>
                        </Combobox.Positioner>
                      </Portal>
                    </Combobox.Root>
                  </Box>

                  <Box>
                    <Text
                      fontSize="10px"
                      fontWeight="500"
                      color="fg.subtle"
                      textTransform="uppercase"
                      letterSpacing="0.5px"
                      mb={1}
                    >
                      Rationale for override (required)
                    </Text>
                    <Textarea
                      placeholder="Explain why this override is necessary..."
                      value={overrideRationale}
                      onChange={(e) => setOverrideRationale(e.target.value)}
                      minH="80px"
                      resize="vertical"
                      variant="outline"
                      _focus={{ borderColor: "brand.solid" }}
                    />
                  </Box>
                </VStack>
              </Dialog.Body>

              <Dialog.Footer gap={2}>
                <Dialog.ActionTrigger asChild>
                  <Button
                    variant="outline"
                    borderColor="border"
                    size="sm"
                    fontSize="12px"
                    h="32px"
                  >
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  layerStyle="brand-button"
                  size="sm"
                  fontSize="12px"
                  h="32px"
                  disabled={
                    !selectedStaffId || !overrideRationale.trim()
                  }
                  onClick={handleOverrideAssign}
                  loading={assignMutation.isPending}
                >
                  Override & assign
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
