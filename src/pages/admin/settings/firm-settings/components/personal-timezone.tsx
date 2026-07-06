import { getProfile, updateProfile } from "@/api/profile";
import { useAuthStore } from "@/store/auth-store";
import { guessTimezone } from "@/utils/date";
import { listTimezones } from "@/utils/timezones";
import { Box, Button, Flex, NativeSelect, Spinner, Text } from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import type { APIError } from "@/hooks/types";

const TIMEZONES = listTimezones();

export function PersonalTimezone() {
  const refetchSession = useAuthStore((s) => s.refetch);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  const [timezone, setTimezone] = useState(guessTimezone());
  const [hydrated, setHydrated] = useState(false);
  if (profile && !hydrated) {
    setHydrated(true);
    setTimezone(profile.timezone ?? guessTimezone());
  }

  const mutation = useMutation({
    mutationFn: () => updateProfile({ timezone }),
    onSuccess: () => {
      toast.success("Timezone saved");
      // Refetch the session so the hydrated user timezone updates display.
      refetchSession();
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to save timezone");
    },
  });

  const dirty = timezone !== (profile?.timezone ?? guessTimezone());

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
        gap="4"
        p="20px"
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Box>
          <Text fontSize="16px" fontWeight="600" color="fg">
            Your timezone
          </Text>
          <Text fontSize="13px" color="fg.muted" mt="1">
            A personal preference — controls how times are shown to you only.
            Leave it to auto-detect from your browser.
          </Text>
        </Box>
      </Flex>

      <Box p="20px">
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <Flex gap="3" align="center" wrap="wrap">
            <NativeSelect.Root maxW="320px">
              <NativeSelect.Field
                value={timezone}
                onChange={(e) => setTimezone(e.currentTarget.value)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>

            <Button
              onClick={() => mutation.mutate()}
              loading={mutation.isPending}
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
