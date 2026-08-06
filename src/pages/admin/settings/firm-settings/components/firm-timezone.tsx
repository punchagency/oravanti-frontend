import type { ConsultationSettings } from "@/api/consultation-settings";
import { FormSelect } from "@/components/ui/form-select";
import {
  useConsultationSettings,
  useUpdateConsultationSettings,
} from "@/hooks/use-consultation-settings";
import { useAuthStore } from "@/store/auth-store";
import { listTimezones } from "@/utils/timezones";
import { Box, Button, Flex, Spinner, Text } from "@chakra-ui/react";
import { useState } from "react";

const TIMEZONES = listTimezones();

export function FirmTimezone() {
  const { data: settings, isLoading } = useConsultationSettings();
  const updateSettings = useUpdateConsultationSettings();
  const refetchSession = useAuthStore((s) => s.refetch);

  const [timezone, setTimezone] = useState("UTC");

  // Hydrate local state from saved settings (re-syncs on new settings object).
  const [hydratedFrom, setHydratedFrom] = useState<ConsultationSettings | null>(
    null,
  );
  if (settings && settings !== hydratedFrom) {
    setHydratedFrom(settings);
    setTimezone(settings.timezone ?? "UTC");
  }

  function handleSave() {
    if (!settings) return;
    // Preserve existing fee fields; the settings endpoint is an upsert that
    // requires the full shape.
    updateSettings.mutate(
      {
        chargesFee: settings.chargesFee,
        defaultAmount: settings.defaultAmount,
        feeStructure: settings.feeStructure,
        waiverWindowDays: settings.waiverWindowDays,
        timezone,
      },
      // Refetch the session so the hydrated firm timezone updates everywhere.
      { onSuccess: () => refetchSession() },
    );
  }

  const dirty = settings != null && timezone !== (settings.timezone ?? "UTC");

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      overflow="hidden"
    >
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
            Firm timezone
          </Text>
          <Text fontSize="13px" color="fg.muted" mt="1">
            Used for scheduling, availability, deadlines and reporting. Times are
            stored in UTC and shown to each user in their own timezone.
          </Text>
        </Box>
      </Flex>

      <Box p="20px">
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <Flex gap="3" align="center" wrap="wrap">
            <Box maxW="320px" flex="1">
              <FormSelect
                options={TIMEZONES.map((tz) => ({ label: tz, value: tz }))}
                value={timezone}
                onChange={setTimezone}
                size="sm"
              />
            </Box>

            <Button
              onClick={handleSave}
              loading={updateSettings.isPending}
              disabled={!dirty}
              bg="brand.solid"
              color="brand.fg"
              size="sm"
            >
              Save
            </Button>
          </Flex>
        )}
      </Box>
    </Box>
  );
}
