import type { StaffMemberDTO } from "@/hooks/use-staff-list";
import type { PublicPracticeArea } from "@/pages/contractor-sign-up/types";
import {
  Avatar,
  Box,
  chakra,
  Combobox,
  createListCollection,
  Field,
  Flex,
  Grid,
  HStack,
  Input,
  Portal,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { CreateTeamFormValues } from "./types";

function LeadStaffSearch({
  attorneys,
  selectedId,
  onSelect,
  invalid,
}: {
  attorneys: StaffMemberDTO[];
  selectedId: string | null;
  onSelect: (id: string | null, name?: string) => void;
  invalid?: boolean;
}) {
  const [inputValue, setInputValue] = useState("");

  const filteredAttorneys = useMemo(
    () =>
      attorneys.filter((a) => {
        const match =
          !inputValue ||
          `${a.firstName} ${a.lastName}`
            .toLowerCase()
            .includes(inputValue.toLowerCase()) ||
          (a.jobTitle ?? "").toLowerCase().includes(inputValue.toLowerCase());
        return match && a.id !== selectedId;
      }),
    [attorneys, inputValue, selectedId],
  );

  const hasNoResults = inputValue && filteredAttorneys.length == 0;
  const isEmpty = !inputValue && filteredAttorneys.length == 0;

  const displayItems = useMemo(
    () =>
      hasNoResults || isEmpty
        ? ([{ id: "__no_results__" }] as StaffMemberDTO[])
        : filteredAttorneys,
    [filteredAttorneys, hasNoResults, isEmpty],
  );

  const collection = useMemo(
    () =>
      createListCollection({
        items: displayItems,
        itemToString: (item) =>
          item.id == "__no_results__"
            ? ""
            : `${item.firstName} ${item.lastName}`,
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
              const attorney = attorneys.find(
                (staffMember) => staffMember.id === e.value[0],
              );
              const name = attorney
                ? `${attorney.firstName} ${attorney.lastName}`
                : undefined;
              onSelect(e.value[0], name);
            }
          }}
          positioning={{ sameWidth: true }}
          openOnClick
          invalid={invalid}
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
                  attorney.id == "__no_results__" ? (
                    <Text
                      key="no-results"
                      p="10px"
                      fontSize="12px"
                      color="fg.muted"
                    >
                      {inputValue
                        ? `No matching record for "${inputValue}"`
                        : "No attorneys available"}
                    </Text>
                  ) : (
                    <Combobox.Item key={attorney.id} item={attorney}>
                      <HStack gap="8px" flex="1">
                        <Avatar.Root size="xs">
                          <Avatar.Fallback
                            name={`${attorney.firstName} ${attorney.lastName}`}
                          />
                        </Avatar.Root>
                        <Box flex={1}>
                          <Text fontSize="12px" fontWeight="500" color="fg">
                            {attorney.firstName} {attorney.lastName}
                          </Text>
                          <Text fontSize="10px" color="fg.muted">
                            {attorney.jobTitle ?? attorney.role}
                          </Text>
                        </Box>
                        <Text
                          fontSize="10px"
                          color="fg.muted"
                          whiteSpace="nowrap"
                        >
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
              <Avatar.Fallback
                name={`${selectedAttorney.firstName} ${selectedAttorney.lastName}`}
              />
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

export function StepInfo({
  register,
  control,
  errors,
  practiceAreasList,
  attorneys,
  leadName,
  setLeadName,
}: {
  register: UseFormRegister<CreateTeamFormValues>;
  control: Control<CreateTeamFormValues>;
  errors: FieldErrors<CreateTeamFormValues>;
  practiceAreasList: PublicPracticeArea[];
  attorneys: StaffMemberDTO[];
  leadName: string | null;
  setLeadName: (name: string | null) => void;
}) {
  return (
    <VStack align="stretch" gap="16px">
      <Field.Root invalid={!!errors.teamName}>
        <Field.Label fontSize="11px" fontWeight="700" color="fg.muted">
          TEAM NAME
        </Field.Label>
        <Input
          placeholder="e.g. Immigration Team B"
          {...register("teamName", {
            required: "Team name is required",
            validate: (v) => v.trim().length > 0 || "Team name is required",
          })}
          _focus={{
            borderColor: "brand.solid",
            boxShadow: "0 0 0 1px brand.solid",
          }}
        />
        {errors.teamName && (
          <Field.ErrorText>{errors.teamName.message}</Field.ErrorText>
        )}
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
          _focus={{
            borderColor: "brand.solid",
            boxShadow: "0 0 0 1px brand.solid",
          }}
        />
      </Field.Root>

      <Field.Root invalid={!!errors.practiceAreas}>
        <Field.Label fontSize="11px" fontWeight="700" color="fg.muted">
          PRACTICE AREAS
        </Field.Label>
        <Text fontSize="12px" color="fg.subtle" mb={2}>
          Select the practice areas this team will handle.
        </Text>
        <Controller
          name="practiceAreas"
          control={control}
          rules={{
            validate: (v) => v.length > 0 || "Select at least one area",
          }}
          render={({ field }) => (
            <Grid
              templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
              }}
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
                    _hover={{
                      borderColor: isSelected ? "brand.solid" : "border",
                    }}
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
        {errors.practiceAreas && (
          <Field.ErrorText>{errors.practiceAreas.message}</Field.ErrorText>
        )}
      </Field.Root>

      <Field.Root invalid={!!errors.teamLeadId}>
        <Field.Label fontSize="11px" fontWeight="700" color="fg.muted">
          TEAM LEAD ATTORNEY
        </Field.Label>
        <Controller
          name="teamLeadId"
          control={control}
          rules={{
            required: "Lead attorney selection is required",
          }}
          render={({ field }) => (
            <LeadStaffSearch
              attorneys={attorneys}
              selectedId={field.value || null}
              onSelect={(id, name) => {
                field.onChange(id ?? "");
                setLeadName(name ?? null);
              }}
              invalid={!!errors.teamLeadId}
            />
          )}
        />
        {errors.teamLeadId && (
          <Field.ErrorText>{errors.teamLeadId.message}</Field.ErrorText>
        )}
      </Field.Root>

      <Field.Root invalid={!!errors.maxCaseload}>
        <Field.Label fontSize="11px" fontWeight="700" color="fg.muted">
          MAXIMUM TEAM CASELOAD
        </Field.Label>
        <Input
          type="number"
          {...register("maxCaseload", {
            required: "Caseload cap is required",
            min: {
              value: 1,
              message: "Caseload must be at least 1",
            },
          })}
          _focus={{
            borderColor: "brand.solid",
            boxShadow: "0 0 0 1px brand.solid",
          }}
        />
        {errors.maxCaseload && (
          <Field.ErrorText>{errors.maxCaseload.message}</Field.ErrorText>
        )}
      </Field.Root>
    </VStack>
  );
}
