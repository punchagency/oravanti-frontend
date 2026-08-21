import { type PracticeAreaTreeNode } from "@/api/auth";
import { type CreateTeamPayload } from "@/api/organization";
import { type CaseTypeSelectHandle } from "@/components/ui/case-type-select";
import { BrandButton } from "@/components/ui/intake-ui";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { useCreateTeam } from "@/hooks/use-create-team";
import { usePracticeAreaList } from "@/hooks/use-practice-area-tree-data";
import { useResetOnOpen } from "@/hooks/use-reset-on-open";
import { useStaffsList } from "@/hooks/use-staff-list";
import {
  Box,
  chakra,
  Dialog,
  Flex,
  Portal,
  Steps,
  VStack,
} from "@chakra-ui/react";
import { ArrowRight, Users, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { StepInfo } from "./step-info";
import { StepMembers } from "./step-members";
import { StepReview } from "./step-review";
import type { CreateTeamFormValues } from "./types";

type Step = "INFO" | "MEMBERS" | "REVIEW";

// Stable empty array: a fresh `[]` on every render would break the memo in
// every child that takes this list.
const NO_TREE_NODES: PracticeAreaTreeNode[] = [];

const TEAM_DEFAULTS: CreateTeamFormValues = {
  teamName: "",
  description: "",
  practiceAreas: [],
  teamLeadId: "",
  maxCaseload: "40",
  memberIds: [],
};

/**
 * Self-contained team dialog. By default it opens from its children
 * (wrapped in a Chakra Trigger) and owns its open state; pass `open` +
 * `onOpenChange` to control it instead (e.g. opened from a menu item,
 * per the Chakra "dialog from menu" docs pattern).
 *
 * Either way the form — and therefore its data queries — first mounts when
 * the dialog opens (`lazyMount`), so a never-opened dialog never hits the
 * API. It then stays mounted (hidden) so reopening is instant; the wizard
 * resets itself on each open via `useResetOnOpen`.
 */
export function CreateTeamDialog({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  children?: ReactNode;
  /** Pass `open` to control the dialog (e.g. opened from a menu item); omit it for a self-contained trigger. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const handleOpenChange = (next: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => handleOpenChange(details.open)}
      lazyMount
      placement="center"
    >
      {children && <Dialog.Trigger asChild>{children}</Dialog.Trigger>}
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px={{ base: "12px", sm: "16px" }}>
          <Dialog.Content
            w="full"
            maxW="560px"
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

            <CreateTeamForm
              open={open}
              close={() => handleOpenChange(false)}
            />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

/** Everything the wizard needs lives here so nothing runs before the first open. */
function CreateTeamForm({
  open,
  close,
}: {
  open: boolean;
  close: () => void;
}) {
  const [currentStep, setCurrentStep] = useState<Step>("INFO");

  const createTeamMutation = useCreateTeam();

  // Only the practice-area names are needed here; the case types for whichever
  // areas get picked are fetched by CaseTypeSelect itself. This used to pull
  // the whole ~750-node taxonomy up front to render a list of a few dozen.
  const practiceAreaQuery = usePracticeAreaList();
  const practiceAreaTreeNodes =
    practiceAreaQuery.data?.practiceAreaTreeNodes ?? NO_TREE_NODES;

  const { data: allStaffData, isLoading: staffListLoading } = useStaffsList({
    limit: 200,
  });

  const attorneys = useMemo(
    () =>
      (allStaffData?.data ?? []).filter(
        (s) => s.role === "attorney" || s.role === "admin" || s.role === "owner",
      ),
    [allStaffData],
  );
  const allStaff = useMemo(() => allStaffData?.data ?? [], [allStaffData]);

  // The INFO step needs practice areas + attorneys; MEMBERS/REVIEW need the
  // staff list. While either is in flight, show a skeleton wizard body.
  const isLoadingData = practiceAreaQuery.isLoading || staffListLoading;

  /*
    Case-type selection lives inside CaseTypeSelect and is read through this
    ref, so ticking a box never re-renders the wizard.

    `selectedIds` is the wizard's own copy, and it is deliberately NOT updated
    on every tick — only when the step changes. StepInfo unmounts when you move
    to MEMBERS, taking the picker's internal state with it, so the selection is
    pulled out of the ref at that moment and handed back as `defaultSelectedIds`
    if you navigate back. REVIEW reads the same copy.
  */
  const caseTypesRef = useRef<CaseTypeSelectHandle>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [leadName, setLeadName] = useState<string | null>(null);

  /** Pulls the picker's selection into wizard state before StepInfo unmounts. */
  const syncSelectedCaseTypes = () => {
    const current = caseTypesRef.current?.getSelectedIds();
    if (current) setSelectedIds(current);
    return current ?? selectedIds;
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    trigger,
    formState: { errors, isSubmitted },
  } = useForm<CreateTeamFormValues>({
    defaultValues: TEAM_DEFAULTS,
    mode: "onChange",
  });

  /*
    Stays mounted between opens — restore pristine defaults on each open.
    Besides the form fields, the wizard carries step-local state that an
    unmount used to clear for free.
  */
  const resetWizard = useCallback(() => {
    reset(TEAM_DEFAULTS);
    setCurrentStep("INFO");
    setSelectedIds([]);
    setLeadName(null);
  }, [reset]);
  useResetOnOpen(open, resetWizard);

  /*
    Narrow subscriptions only. A full-form `watch()` here re-rendered the whole
    wizard on every keystroke; each consumer now subscribes to exactly the
    fields it needs (StepReview watches via `control` internally).
  */
  const teamLeadId = useWatch({ control, name: "teamLeadId" });

  const STEP_LABELS: { key: Step; label: string }[] = [
    { key: "INFO", label: "INFO" },
    { key: "MEMBERS", label: "MEMBERS" },
    { key: "REVIEW", label: "REVIEW" },
  ];

  const stepIndex = STEP_LABELS.findIndex((step) => step.key == currentStep);

  const handleNextStep = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentStep == "INFO") {
      const isValid = await trigger([
        "teamName",
        "teamLeadId",
        "maxCaseload",
      ]);
      // Read the picker before it unmounts, and gate on what it actually holds
      // rather than on a copy that is only refreshed at step boundaries.
      const caseTypeIds = syncSelectedCaseTypes();
      if (isValid && caseTypeIds.length > 0) {
        setCurrentStep("MEMBERS");
      }
    } else if (currentStep == "MEMBERS") {
      setCurrentStep("REVIEW");
    }
  };

  const handleBackStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentStep == "REVIEW") setCurrentStep("MEMBERS");
    else if (currentStep == "MEMBERS") setCurrentStep("INFO");
  };

  const onSubmit = async (data: CreateTeamFormValues) => {
    const payload: CreateTeamPayload = {
      name: data.teamName.trim(),
      description: data.description.trim() || undefined,
      leadId: data.teamLeadId || undefined,
      maxCaseload: data.maxCaseload
        ? parseInt(data.maxCaseload, 10)
        : undefined,
      caseTypeIds: selectedIds.length > 0 ? selectedIds : undefined,
      memberStaffIds: data.memberIds.length > 0 ? data.memberIds : undefined,
    };

    await createTeamMutation.mutateAsync(payload);
    // Closing resets on next open (useResetOnOpen) — no unmount needed.
    close();
  };

  return (
    <Box
      as="form"
      p={{ base: "24px 16px 20px", sm: "32px 24px 24px" }}
      onSubmit={(e) => {
        if (currentStep != "REVIEW") {
          e.preventDefault();
          return;
        }
        handleSubmit(onSubmit)(e);
      }}
    >
      <Dialog.Title color="fg.default" fontSize="18px" fontWeight="600">
        Create team
      </Dialog.Title>
      <Dialog.Description
        mt="6px"
        color="fg.muted"
        fontSize="13px"
        lineHeight="1.4"
      >
        Create a team to group staff members, assign a lead attorney,
        and set a caseload cap.
      </Dialog.Description>

      <Steps.Root
        mt={6}
        mb={6}
        count={3}
        step={stepIndex + 1}
        colorPalette="brand"
        size="sm"
      >
        <Steps.List gap="4">
          {STEP_LABELS.map((step, i) => (
            <Steps.Item
              key={step.key}
              index={i}
              flex="1!"
              flexDir="column"
              alignItems="flex-start"
              gap="2"
            >
              <Steps.Separator
                h="3px"
                flex="unset"
                display="initial!"
                mx="0!"
              />
              <Steps.Trigger>
                <Steps.Title
                  fontSize="11px"
                  fontWeight="700"
                  letterSpacing="0.05em"
                >
                  {step.label}
                </Steps.Title>
              </Steps.Trigger>
            </Steps.Item>
          ))}
        </Steps.List>
      </Steps.Root>

      {isLoadingData ? (
        <VStack align="stretch" gap="14px" py="2">
          <ThemeSkeleton h="9px" w="80px" />
          <ThemeSkeleton h="34px" w="full" borderRadius="7px" />
          <ThemeSkeleton h="9px" w="110px" />
          <ThemeSkeleton h="34px" w="full" borderRadius="7px" />
          <ThemeSkeleton h="140px" w="full" borderRadius="8px" />
        </VStack>
      ) : (
        <>
          {currentStep == "INFO" && (
            <StepInfo
              register={register}
              control={control}
              errors={errors}
              practiceAreaTreeNodes={practiceAreaTreeNodes}
              attorneys={attorneys}
              setLeadName={setLeadName}
              caseTypesRef={caseTypesRef}
              defaultCaseTypeIds={selectedIds}
              showCaseTypeValidation={isSubmitted}
            />
          )}

          {currentStep == "MEMBERS" && (
            <StepMembers
              control={control}
              allStaff={allStaff}
              teamLeadId={teamLeadId || null}
            />
          )}

          {currentStep == "REVIEW" && (
            <StepReview
              control={control}
              allStaff={allStaff}
              leadName={leadName}
              selectedIds={selectedIds}
            />
          )}
        </>
      )}

      <Flex
        justify="space-between"
        mt="28px"
        gap="12px"
        direction={{ base: "column-reverse", sm: "row" }}
      >
        <chakra.button
          type="button"
          onClick={
            currentStep == "INFO" ? close : handleBackStep
          }
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
          {currentStep == "INFO" ? "Cancel" : "Back"}
        </chakra.button>

        <Box flex={{ base: undefined, sm: "1" }}>
          {currentStep != "REVIEW" ? (
            <BrandButton
              type="button"
              onClick={handleNextStep}
              height="44px"
              w="full"
              borderRadius="10px"
              fontSize="14px"
              fontWeight="600"
            >
              Continue
              <ArrowRight size={14} style={{ marginLeft: "6px" }} />
            </BrandButton>
          ) : (
            <BrandButton
              type="submit"
              height="44px"
              w="full"
              borderRadius="10px"
              fontSize="14px"
              fontWeight="600"
              loading={createTeamMutation.isPending}
            >
              <Users size={14} style={{ marginRight: "6px" }} />
              Create team
            </BrandButton>
          )}
        </Box>
      </Flex>
    </Box>
  );
}
