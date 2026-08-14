import { type CreateTeamPayload } from "@/api/organization";
import { BrandButton } from "@/components/ui/intake-ui";
import { useCreateTeam } from "@/hooks/use-create-team";
import {
  buildNameLookup,
  usePracticeAreaTreeData,
} from "@/hooks/use-practice-area-tree-data";
import { useStaffsList } from "@/hooks/use-staff-list";
import {
  Box,
  chakra,
  Dialog,
  Flex,
  Portal,
  Steps,
} from "@chakra-ui/react";
import { ArrowRight, Users, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { StepInfo } from "./step-info";
import { StepMembers } from "./step-members";
import { StepReview } from "./step-review";
import type { CreateTeamFormValues } from "./types";

type Step = "INFO" | "MEMBERS" | "REVIEW";

export function CreateTeamDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const onOpenChange = controlledOnOpenChange ?? setInternalOpen;
  const [currentStep, setCurrentStep] = useState<Step>("INFO");

  const createTeamMutation = useCreateTeam();
  const treeDataQuery = usePracticeAreaTreeData();
  const treeData = treeDataQuery.data;
  const practiceAreaTreeNodes = treeData?.practiceAreaTreeNodes ?? [];
  // Derived here rather than shipped by the API, which used to duplicate every
  // name in the tree a second time just to provide this map.
  const practiceAreaNameLookup = useMemo(
    () => buildNameLookup(treeData?.practiceAreaTreeNodes ?? []),
    [treeData],
  );
  const { data: allStaffData } = useStaffsList({ limit: 200 });

  const attorneys = useMemo(
    () =>
      (allStaffData?.data ?? []).filter(
        (s) => s.role === "attorney" || s.role === "admin" || s.role === "owner",
      ),
    [allStaffData],
  );
  const allStaff = useMemo(() => allStaffData?.data ?? [], [allStaffData]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [leadName, setLeadName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    trigger,
    formState: { errors },
  } = useForm<CreateTeamFormValues>({
    defaultValues: {
      teamName: "",
      description: "",
      practiceAreas: [],
      teamLeadId: "",
      maxCaseload: "40",
      memberIds: [],
    },
    mode: "onChange",
  });

  const formValues = watch();

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
      if (isValid && selectedIds.length > 0) {
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
    onOpenChange(false);
    reset();
    setSelectedIds([]);
    setCurrentStep("INFO");
    setLeadName(null);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        onOpenChange(details.open);
        if (!details.open) {
          reset();
          setSelectedIds([]);
          setCurrentStep("INFO");
          setLeadName(null);
        }
      }}
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

              {currentStep == "INFO" && (
                <StepInfo
                  register={register}
                  control={control}
                  errors={errors}
                  practiceAreaTreeNodes={practiceAreaTreeNodes}
                  attorneys={attorneys}
                  setLeadName={setLeadName}
                  selectedIds={selectedIds}
                  onSelectedIdsChange={setSelectedIds}
                />
              )}

              {currentStep == "MEMBERS" && (
                <StepMembers
                  control={control}
                  allStaff={allStaff}
                  teamLeadId={formValues.teamLeadId || null}
                />
              )}

              {currentStep == "REVIEW" && (
                <StepReview
                  formValues={formValues}
                  practiceAreaNameLookup={practiceAreaNameLookup}
                  practiceAreaTreeNodes={practiceAreaTreeNodes}
                  allStaff={allStaff}
                  leadName={leadName}
                  selectedIds={selectedIds}
                />
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
                    currentStep == "INFO"
                      ? () => onOpenChange(false)
                      : handleBackStep
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
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
