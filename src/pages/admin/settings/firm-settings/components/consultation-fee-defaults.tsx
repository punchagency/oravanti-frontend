import type {
  ConsultationFeeStructure,
  ConsultationSettings,
} from "@/api/consultation-settings";
import {
  useConsultationSettings,
  useUpdateConsultationSettings,
} from "@/hooks/use-consultation-settings";
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Spinner,
  Switch,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { toast } from "sonner";

const FEE_STRUCTURE_OPTIONS: {
  value: ConsultationFeeStructure;
  label: string;
}[] = [
  { value: "flat", label: "Flat fee" },
  { value: "waived_if_retainer", label: "Waived if client signs retainer" },
  { value: "custom_per_case_type", label: "Custom per case type" },
];

function formatLastSaved(updatedAt: string | null) {
  if (!updatedAt) return "Never";
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString();
}

export function ConsultationFeeDefaults() {
  const { data: settings, isLoading } = useConsultationSettings();
  const updateSettings = useUpdateConsultationSettings();

  const [chargesFee, setChargesFee] = useState(false);
  const [defaultAmount, setDefaultAmount] = useState("");
  const [feeStructure, setFeeStructure] =
    useState<ConsultationFeeStructure | null>(null);
  const [waiverWindowDays, setWaiverWindowDays] = useState("");

  // Hydrate local form state from the saved settings (re-syncs whenever a new
  // settings object arrives) — React's "adjust state during render" pattern.
  const [hydratedFrom, setHydratedFrom] = useState<ConsultationSettings | null>(
    null,
  );
  if (settings && settings !== hydratedFrom) {
    setHydratedFrom(settings);
    setChargesFee(settings.chargesFee);
    setDefaultAmount(
      settings.defaultAmount != null ? String(settings.defaultAmount) : "",
    );
    setFeeStructure(settings.feeStructure);
    setWaiverWindowDays(
      settings.waiverWindowDays != null
        ? String(settings.waiverWindowDays)
        : "",
    );
  }

  function handleSave() {
    const amount = defaultAmount.trim() === "" ? null : Number(defaultAmount);
    const waiver =
      waiverWindowDays.trim() === "" ? null : Number(waiverWindowDays);

    if (chargesFee) {
      if (amount == null || Number.isNaN(amount) || amount <= 0) {
        toast.error("Enter a valid default fee amount");
        return;
      }
      if (!feeStructure) {
        toast.error("Select a fee structure");
        return;
      }
      if (
        feeStructure === "waived_if_retainer" &&
        (waiver == null || Number.isNaN(waiver) || waiver <= 0)
      ) {
        toast.error("Enter a waiver window in days");
        return;
      }
    }

    updateSettings.mutate({
      chargesFee,
      defaultAmount: amount,
      feeStructure,
      waiverWindowDays: waiver,
    });
  }

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

        <Switch.Root
          checked={chargesFee}
          onCheckedChange={(e) => setChargesFee(e.checked)}
        >
          <Switch.HiddenInput />
          <HStack gap="3">
            <Switch.Label fontSize="13px" color="fg.muted">
              Charge consultation fees
            </Switch.Label>
            <Switch.Control bg={chargesFee ? "brand.solid" : "bg.muted"}>
              <Switch.Thumb />
            </Switch.Control>
          </HStack>
        </Switch.Root>
      </Flex>

      {/* Body */}
      {isLoading ? (
        <Flex justify="center" p="40px">
          <Spinner size="md" color="brand.solid" />
        </Flex>
      ) : (
        <Box p="20px" opacity={chargesFee ? 1 : 0.55}>
          <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
            Default fee amount
          </Text>
          <Flex maxW="220px" mb="6">
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
              value={defaultAmount}
              onChange={(e) => setDefaultAmount(e.target.value)}
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

          <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
            Fee structure
          </Text>
          <HStack gap="3" wrap="wrap">
            {FEE_STRUCTURE_OPTIONS.map((opt) => {
              const selected = feeStructure === opt.value;
              return (
                <Button
                  key={opt.value}
                  onClick={() => setFeeStructure(opt.value)}
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

          {chargesFee && feeStructure === "waived_if_retainer" && (
            <Box mt="6">
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                Waiver window (days)
              </Text>
              <Input
                value={waiverWindowDays}
                onChange={(e) => setWaiverWindowDays(e.target.value)}
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 14"
                maxW="160px"
                borderColor="border"
                h="40px"
                fontSize="14px"
              />
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
        <Text fontSize="12px" color="fg.muted">
          Last saved: {formatLastSaved(settings?.updatedAt ?? null)}
        </Text>
        <Button
          onClick={handleSave}
          loading={updateSettings.isPending}
          layerStyle="brand-button"
          h="36px"
          px="16px"
          fontSize="13px"
        >
          Save defaults
        </Button>
      </Flex>
    </Box>
  );
}
