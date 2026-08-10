import type {
  ConsultationFeeStructure,
  ConsultationSettings,
} from "@/api/consultation-settings";
import {
  useConsultationSettings,
  useUpdateConsultationSettings,
} from "@/hooks/use-consultation-settings";
import useUnsavedChangesPrompt from "@/hooks/useUnsavedChangesPrompt";
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Switch,
  Text,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { dayjs, formatDateTime } from "@/utils/date";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";

const FEE_STRUCTURE_OPTIONS: {
  value: ConsultationFeeStructure;
  label: string;
}[] = [
  { value: "flat", label: "Flat fee" },
  { value: "waived_if_retainer", label: "Waived if client signs retainer" },
  { value: "custom_per_case_type", label: "Custom per case type" },
];

const consultationFeeSchema = z
  .object({
    chargesFee: z.boolean(),
    defaultAmount: z.string(),
    feeStructure: z
      .enum([
        "flat",
        "custom_per_case_type",
        "waived_if_retainer",
      ] satisfies ConsultationFeeStructure[])
      .or(z.literal("")),
    waiverWindowDays: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.chargesFee) return;

    const amount = Number(data.defaultAmount);
    if (
      data.defaultAmount.trim() === "" ||
      Number.isNaN(amount) ||
      amount <= 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["defaultAmount"],
        message: "Enter a valid default fee amount",
      });
    }

    if (!data.feeStructure) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["feeStructure"],
        message: "Select a fee structure",
      });
    }

    if (data.feeStructure === "waived_if_retainer") {
      const waiver = Number(data.waiverWindowDays);
      if (
        data.waiverWindowDays.trim() === "" ||
        Number.isNaN(waiver) ||
        !Number.isInteger(waiver) ||
        waiver <= 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["waiverWindowDays"],
          message: "Enter a waiver window in days",
        });
      }
    }
  });

type ConsultationFeeForm = z.infer<typeof consultationFeeSchema>;

const DEFAULT_FORM: ConsultationFeeForm = {
  chargesFee: false,
  defaultAmount: "",
  feeStructure: "",
  waiverWindowDays: "",
};

function toForm(settings: ConsultationSettings): ConsultationFeeForm {
  return {
    chargesFee: settings.chargesFee,
    defaultAmount:
      settings.defaultAmount != null ? String(settings.defaultAmount) : "",
    feeStructure: settings.feeStructure ?? "",
    waiverWindowDays:
      settings.waiverWindowDays != null
        ? String(settings.waiverWindowDays)
        : "",
  };
}

function formatLastSaved(updatedAt: string | null) {
  if (!updatedAt || !dayjs(updatedAt).isValid()) return "Never";
  return formatDateTime(updatedAt);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text fontSize="12px" color="red.400" mt="1">
      {message}
    </Text>
  );
}

export function ConsultationFeeDefaults() {
  const { data: settings, isLoading } = useConsultationSettings();
  const updateSettings = useUpdateConsultationSettings();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ConsultationFeeForm>({
    resolver: zodResolver(consultationFeeSchema),
    mode: "onChange",
    defaultValues: DEFAULT_FORM,
  });

  useEffect(() => {
    if (settings) reset(toForm(settings));
  }, [settings, reset]);

  useUnsavedChangesPrompt({ when: isDirty });

  const chargesFee = watch("chargesFee");

  const onSubmit: SubmitHandler<ConsultationFeeForm> = (data) => {
    updateSettings.mutate(
      {
        chargesFee: data.chargesFee,
        defaultAmount:
          data.defaultAmount.trim() === "" ? null : Number(data.defaultAmount),
        feeStructure: data.feeStructure || null,
        waiverWindowDays:
          data.waiverWindowDays.trim() === "" ? null : Number(data.waiverWindowDays),
      },
      { onSuccess: () => reset(data) },
    );
  };

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      overflow="hidden"
    >
      {/* Header */}
      <Flex
        align="flex-start"
        justify="space-between"
        gap="4"
        p="20px"
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Box>
          <Text fontSize="16px" fontWeight="600" color="fg">
            Consultation fee defaults
          </Text>
          <Text fontSize="13px" color="fg.muted" mt="1">
            Set firm-wide defaults for fees charged at consultations
          </Text>
        </Box>

        <Controller
          control={control}
          name="chargesFee"
          render={({ field }) => (
            <Switch.Root
              checked={field.value}
              onCheckedChange={(e) => field.onChange(e.checked)}
            >
              <Switch.HiddenInput />
              <HStack gap="3">
                <Switch.Label fontSize="13px" color="fg.muted">
                  Charge consultation fees
                </Switch.Label>
                <Switch.Control bg={field.value ? "brand.solid" : "bg.muted"}>
                  <Switch.Thumb />
                </Switch.Control>
              </HStack>
            </Switch.Root>
          )}
        />
      </Flex>

      {/* Body */}
      {isLoading ? (
        <Box
          p="20px"
          aria-label="Loading consultation fee defaults"
          aria-busy="true"
        >
          <ThemeSkeleton h="13px" w="140px" borderRadius="4px" mb="8px" />
          <Flex maxW="220px">
            <ThemeSkeleton w="42px" h="40px" borderLeftRadius="7px" />
            <ThemeSkeleton flex="1" h="40px" borderRightRadius="7px" />
          </Flex>
          <ThemeSkeleton
            h="13px"
            w="100px"
            borderRadius="4px"
            mt="16px"
            mb="8px"
          />
          <HStack gap="12px" wrap="wrap">
            {["80px", "220px", "170px"].map((w, i) => (
              <ThemeSkeleton key={i} h="34px" w={w} borderRadius="full" />
            ))}
          </HStack>
        </Box>
      ) : (
        <Box as="form" p="20px" onSubmit={handleSubmit(onSubmit)} opacity={chargesFee ? 1 : 0.55}>
          <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
            Default fee amount
          </Text>
          <Flex maxW="220px">
            <Flex
              align="center"
              justify="center"
              px="3"
              bg="bg.muted"
              border="1px solid"
              borderColor="border"
              borderRightWidth="0"
              borderLeftRadius="7px"
              color="fg.muted"
              fontSize="14px"
            >
              $
            </Flex>
            <Input
              {...register("defaultAmount")}
              disabled={!chargesFee}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              borderLeftRadius="0"
              borderColor="border"
              h="40px"
              fontSize="14px"
            />
          </Flex>
          <FieldError message={errors.defaultAmount?.message} />

          <Text fontSize="13px" fontWeight="600" color="fg" mb="2" mt="4">
            Fee structure
          </Text>
          <Controller
            control={control}
            name="feeStructure"
            render={({ field }) => (
              <HStack gap="3" wrap="wrap">
                {FEE_STRUCTURE_OPTIONS.map((opt) => {
                  const selected = field.value === opt.value;
                  return (
                    <Button
                      key={opt.value}
                      onClick={() => field.onChange(opt.value)}
                      disabled={!chargesFee}
                      variant="outline"
                      h="34px"
                      px="14px"
                      borderRadius="full"
                      fontSize="13px"
                      fontWeight="500"
                      bg={selected ? "brand.subtle" : "bg"}
                      color={selected ? "brand.fg" : "fg.muted"}
                      borderColor={selected ? "brand.solid" : "border"}
                    >
                      {opt.label}
                    </Button>
                  );
                })}
              </HStack>
            )}
          />
          <FieldError message={errors.feeStructure?.message} />

          {chargesFee && watch("feeStructure") === "waived_if_retainer" && (
            <Box mt="6">
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                Waiver window (days)
              </Text>
              <Input
                {...register("waiverWindowDays")}
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 14"
                maxW="160px"
                borderColor="border"
                h="40px"
                fontSize="14px"
              />
              <FieldError message={errors.waiverWindowDays?.message} />
              <Text fontSize="12px" color="fg.muted" mt="2">
                Fee is waived if the client signs a retainer within this many
                days.
              </Text>
            </Box>
          )}
        </Box>
      )}

      {/* Footer */}
      <Flex
        align="center"
        justify="space-between"
        gap="4"
        px="20px"
        py="16px"
        borderTop="1px solid"
        borderColor="border.subtle"
      >
        {isLoading ? (
          <ThemeSkeleton h="12px" w="200px" borderRadius="4px" />
        ) : (
          <Text fontSize="12px" color="fg.muted">
            Last saved: {formatLastSaved(settings?.updatedAt ?? null)}
          </Text>
        )}
        {isLoading ? (
          <ThemeSkeleton h="36px" w="120px" borderRadius="7px" />
        ) : (
          <Button
            onClick={handleSubmit(onSubmit)}
            loading={updateSettings.isPending}
            disabled={!isDirty}
            layerStyle="brand-button"
            h="36px"
            px="16px"
            fontSize="13px"
          >
            Save defaults
          </Button>
        )}
      </Flex>
    </Box>
  );
}
