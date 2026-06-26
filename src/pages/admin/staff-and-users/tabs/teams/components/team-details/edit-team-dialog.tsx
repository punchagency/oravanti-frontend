import type { TeamListDTO, UpdateTeamPayload } from "@/api/organization";
import { BrandButton } from "@/components/ui/intake-ui";
import { useTeamDetails } from "@/hooks/use-team-details";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
import { useStaffList } from "@/hooks/use-staff-list";
import { useUpdateTeam } from "@/hooks/use-update-team";
import {
  Avatar,
  Box,
  chakra,
  Combobox,
  createListCollection,
  Dialog,
  Field,
  Flex,
  Grid,
  HStack,
  Input,
  Portal,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";

interface EditTeamForm {
  name: string;
  description: string;
  maxCaseload: string;
  leadId: string;
  practiceAreaIds: string[];
}

interface EditTeamDialogProps {
  team: TeamListDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTeamDialog({ team, open, onOpenChange }: EditTeamDialogProps) {
  const updateTeam = useUpdateTeam();
  const { data: fullTeam, isLoading } = useTeamDetails(open ? team.id : null);
  const { data: practiceAreas } = usePublicPracticeAreas();
  const { data: allStaffData } = useStaffList({ limit: 200 });

  const practiceAreasList = useMemo(() => practiceAreas ?? [], [practiceAreas]);
  const attorneys = useMemo(
    () =>
      (allStaffData?.data ?? []).filter(
        (s) => s.role === "attorney" || s.role === "admin" || s.role === "owner",
      ),
    [allStaffData],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditTeamForm>({
    defaultValues: {
      name: "",
      description: "",
      maxCaseload: "",
      leadId: "",
      practiceAreaIds: [],
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (open && fullTeam) {
      reset({
        name: fullTeam.name,
        description: fullTeam.description ?? "",
        maxCaseload: String(fullTeam.maxCaseload),
        leadId: fullTeam.leadId ?? "",
        practiceAreaIds: fullTeam.practiceAreas.map((p) => p.id),
      });
    }
  }, [open, fullTeam, reset]);

  const onSubmit: SubmitHandler<EditTeamForm> = async (data) => {
    const payload: UpdateTeamPayload = {
      name: data.name.trim(),
      description: data.description.trim() || undefined,
      maxCaseload: data.maxCaseload
        ? parseInt(data.maxCaseload, 10)
        : undefined,
      leadId: data.leadId || null,
      practiceAreaIds: data.practiceAreaIds,
    };

    await updateTeam.mutateAsync({ teamId: team.id, data: payload });
    onOpenChange(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
      placement="center"
    >
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

            {isLoading ? (
              <Flex justify="center" align="center" py={16}>
                <Spinner />
              </Flex>
            ) : (
            <Box
              as="form"
              p={{ base: "24px 16px 20px", sm: "32px 24px 24px" }}
              onSubmit={handleSubmit(onSubmit)}
            >
              <Dialog.Title color="fg.default" fontSize="18px" fontWeight="600">
                Edit team
              </Dialog.Title>
              <Dialog.Description
                mt="6px"
                color="fg.muted"
                fontSize="13px"
                lineHeight="1.4"
              >
                Update team details, lead attorney, and practice areas.
              </Dialog.Description>

              <VStack align="stretch" gap="16px" mt={6}>
                <Field.Root invalid={!!errors.name}>
                  <Field.Label fontSize="11px" fontWeight="700" color="fg.muted">
                    TEAM NAME
                  </Field.Label>
                  <Input
                    placeholder="e.g. Immigration Team B"
                    {...register("name", {
                      required: "Team name is required",
                      validate: (v) => v.trim().length > 0 || "Team name is required",
                    })}
                    _focus={{ borderColor: "brand.solid", boxShadow: "0 0 0 1px brand.solid" }}
                  />
                  {errors.name && <Field.ErrorText>{errors.name.message}</Field.ErrorText>}
                </Field.Root>

                <Field.Root>
                  <Field.Label fontSize="11px" fontWeight="700" color="fg.muted">
                    DESCRIPTION
                  </Field.Label>
                  <Textarea
                    placeholder="Brief description of the team's focus..."
                    resize="vertical"
                    minH="80px"
                    {...register("description")}
                    _focus={{ borderColor: "brand.solid", boxShadow: "0 0 0 1px brand.solid" }}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label fontSize="11px" fontWeight="700" color="fg.muted">
                    PRACTICE AREAS
                  </Field.Label>
                  <Text fontSize="12px" color="fg.subtle" mb={2}>
                    Select the practice areas this team will handle.
                  </Text>
                  <Controller
                    name="practiceAreaIds"
                    control={control}
                    render={({ field }) => (
                      <Grid
                        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                        w="full"
                        gap="8px"
                        maxH="220px"
                        overflowY="auto"
                        pr={1}
                      >
                        {practiceAreasList.map((practiceArea) => {
                          const isSelected = field.value?.includes(practiceArea.id);
                          return (
                            <Flex
                              key={practiceArea.id}
                              align="center"
                              gap={3}
                              px={4}
                              py={3}
                              borderRadius="md"
                              border="1px solid"
                              borderColor={isSelected ? "brand.solid" : "border.muted"}
                              cursor="pointer"
                              _hover={{ borderColor: isSelected ? "brand.solid" : "border" }}
                              onClick={() => {
                                const next = isSelected
                                  ? field.value.filter((id) => id !== practiceArea.id)
                                  : [...(field.value || []), practiceArea.id];
                                field.onChange(next);
                              }}
                              transition="all 0.15s"
                            >
                              <Text fontSize="13px" fontWeight="600" color="fg.default">
                                {practiceArea.name}
                              </Text>
                            </Flex>
                          );
                        })}
                      </Grid>
                    )}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label fontSize="11px" fontWeight="700" color="fg.muted">
                    TEAM LEAD ATTORNEY
                  </Field.Label>
                  <Controller
                    name="leadId"
                    control={control}
                    render={({ field }) => (
                      <LeadStaffSearch
                        attorneys={attorneys}
                        selectedId={field.value || null}
                        onSelect={(id) => {
                          field.onChange(id ?? "");
                        }}
                      />
                    )}
                  />
                </Field.Root>

                <Field.Root invalid={!!errors.maxCaseload}>
                  <Field.Label fontSize="11px" fontWeight="700" color="fg.muted">
                    MAXIMUM TEAM CASELOAD
                  </Field.Label>
                  <Input
                    type="number"
                    {...register("maxCaseload", {
                      required: "Caseload cap is required",
                      min: { value: 1, message: "Caseload must be at least 1" },
                    })}
                    _focus={{ borderColor: "brand.solid", boxShadow: "0 0 0 1px brand.solid" }}
                  />
                  {errors.maxCaseload && <Field.ErrorText>{errors.maxCaseload.message}</Field.ErrorText>}
                </Field.Root>
              </VStack>

              <Flex
                justify="space-between"
                mt="28px"
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
                  type="submit"
                  height="44px"
                  w={{ base: "full", sm: "auto" }}
                  flex={{ base: undefined, sm: "1" }}
                  loading={updateTeam.isPending}
                >
                  Save changes
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

function LeadStaffSearch({
  attorneys,
  selectedId,
  onSelect,
}: {
  attorneys: { id: string; firstName: string; lastName: string; jobTitle: string | null; role: string | null; maxCaseload: number | null }[];
  selectedId: string | null;
  onSelect: (id: string | null, name?: string) => void;
}) {
  const [inputValue, setInputValue] = useState("");

  const filteredAttorneys = useMemo(
    () =>
      attorneys.filter((a) => {
        const match =
          !inputValue ||
          `${a.firstName} ${a.lastName}`.toLowerCase().includes(inputValue.toLowerCase()) ||
          (a.jobTitle ?? "").toLowerCase().includes(inputValue.toLowerCase());
        return match && a.id !== selectedId;
      }),
    [attorneys, inputValue, selectedId],
  );

  const hasNoResults = inputValue && filteredAttorneys.length === 0;
  const isEmpty = !inputValue && filteredAttorneys.length === 0;

  const displayItems = useMemo(
    () =>
      hasNoResults || isEmpty
        ? ([{ id: "__no_results__" }] as typeof attorneys)
        : filteredAttorneys,
    [filteredAttorneys, hasNoResults, isEmpty],
  );

  const collection = useMemo(
    () =>
      createListCollection({
        items: displayItems,
        itemToString: (item) =>
          item.id === "__no_results__" ? "" : `${item.firstName} ${item.lastName}`,
        itemToValue: (item) => item.id,
      }),
    [displayItems],
  );

  const selectedAttorney = useMemo(
    () => attorneys.find((a) => a.id === selectedId) ?? null,
    [attorneys, selectedId],
  );

  return (
    <Box w="full">
      {!selectedAttorney ? (
        <Combobox.Root
          key="empty"
          collection={collection}
          onInputValueChange={(e) => setInputValue(e.inputValue)}
          onValueChange={(e) => {
            if (e.value[0]) {
              const attorney = attorneys.find((a) => a.id === e.value[0]);
              const name = attorney ? `${attorney.firstName} ${attorney.lastName}` : undefined;
              onSelect(e.value[0], name);
            }
          }}
          positioning={{ sameWidth: true }}
          openOnClick
        >
          <Combobox.Control>
            <Combobox.Input
              placeholder="Search attorneys..."
              bg="bg.input"
              borderColor="border.input"
              borderRadius="md"
            />
            <Combobox.IndicatorGroup>
              <Combobox.ClearTrigger />
              <Combobox.Trigger />
            </Combobox.IndicatorGroup>
          </Combobox.Control>
          <Portal>
            <Combobox.Positioner>
              <Combobox.Content>
                {collection.items.map((attorney) =>
                  attorney.id === "__no_results__" ? (
                    <Text key="no-results" p="10px" fontSize="12px" color="fg.muted">
                      {inputValue
                        ? `No matching record for "${inputValue}"`
                        : "No attorneys available"}
                    </Text>
                  ) : (
                    <Combobox.Item key={attorney.id} item={attorney}>
                      <HStack gap="8px" flex="1">
                        <Avatar.Root size="xs">
                          <Avatar.Fallback name={`${attorney.firstName} ${attorney.lastName}`} />
                        </Avatar.Root>
                        <Box flex={1}>
                          <Text fontSize="12px" fontWeight="500" color="fg">
                            {attorney.firstName} {attorney.lastName}
                          </Text>
                          <Text fontSize="10px" color="fg.muted">
                            {attorney.jobTitle ?? attorney.role}
                          </Text>
                        </Box>
                        <Text fontSize="10px" color="fg.muted" whiteSpace="nowrap">
                          {attorney.maxCaseload ?? "-"} cases
                        </Text>
                      </HStack>
                    </Combobox.Item>
                  ),
                )}
              </Combobox.Content>
            </Combobox.Positioner>
          </Portal>
        </Combobox.Root>
      ) : (
        <Flex
          align="center"
          justify="space-between"
          w="full"
          px="10px"
          py="7px"
          border="1px solid"
          borderColor="brand.solid"
          borderRadius="md"
          bg="bg.input"
        >
          <Flex align="center" gap="8px">
            <Avatar.Root size="xs">
              <Avatar.Fallback name={`${selectedAttorney.firstName} ${selectedAttorney.lastName}`} />
            </Avatar.Root>
            <Box>
              <Text fontSize="13px" fontWeight="500" color="fg">
                {selectedAttorney.firstName} {selectedAttorney.lastName}
              </Text>
            </Box>
          </Flex>
          <chakra.button
            type="button"
            onClick={() => {
              onSelect(null);
              setInputValue("");
            }}
            cursor="pointer"
            color="fg.muted"
            _hover={{ color: "fg" }}
          >
            <X size="14px" />
          </chakra.button>
        </Flex>
      )}
    </Box>
  );
}
