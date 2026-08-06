import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "@/hooks/use-firm-settings";
import type { NotificationPreference } from "@/api/firm-settings";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import {
  Box,
  Button,
  Flex,
  HStack,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { Mail, MessageSquare, Bell } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const NOTIFICATION_EVENTS: { key: string; label: string }[] = [
  { key: "new_lead_submitted", label: "New lead submitted" },
  { key: "case_stage_changed", label: "Case stage changed" },
  { key: "deadline_approaching", label: "Deadline approaching" },
  { key: "rfe_noid_received", label: "RFE / NOID received" },
  { key: "invoice_due", label: "Invoice due" },
  { key: "payment_received", label: "Payment received" },
  { key: "staff_leave_request", label: "Staff leave request" },
  { key: "document_uploaded", label: "Document uploaded" },
  { key: "client_message_received", label: "Client message received" },
  { key: "certification_expiring", label: "Certification expiring" },
];

function buildDefaultPreferences(): NotificationPreference[] {
  return NOTIFICATION_EVENTS.map((e) => ({
    event: e.key as NotificationPreference["event"],
    label: e.label,
    email: true,
    sms: false,
    inApp: true,
  }));
}

function LoadingSkeleton() {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      overflow="hidden"
    >
      <Box p="20px" borderBottom="1px solid" borderColor="border.subtle">
        <ThemeSkeleton h="18px" w="200px" mb="8px" borderRadius="4px" />
        <ThemeSkeleton h="13px" w="320px" borderRadius="4px" />
      </Box>
      <Box p="20px">
        <HStack gap="6" mb="6">
          <ThemeSkeleton h="14px" w="60px" borderRadius="4px" />
          <ThemeSkeleton h="14px" w="100px" borderRadius="4px" />
          <ThemeSkeleton h="14px" w="60px" borderRadius="4px" />
        </HStack>
        <Stack gap="0">
          {Array.from({ length: 10 }).map((_, i) => (
            <Flex
              key={i}
              justify="space-between"
              align="center"
              py="12px"
              borderBottom={i < 9 ? "1px solid" : "none"}
              borderColor="border.subtle"
            >
              <ThemeSkeleton h="14px" w={`${120 + (i % 3) * 20}px`} borderRadius="4px" />
              <HStack gap={{ base: "16px", md: "48px" }}>
                <ThemeSkeleton h="20px" w="36px" borderRadius="10px" />
                <ThemeSkeleton h="20px" w="36px" borderRadius="10px" />
                <ThemeSkeleton h="20px" w="36px" borderRadius="10px" />
              </HStack>
            </Flex>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

function NotificationSwitch({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={(e) => onToggle(e.checked)}
      size="sm"
    >
      <Switch.HiddenInput />
      <Switch.Control
        bg={checked ? "brand.solid" : "bg.muted"}
        _hover={{ bg: checked ? "brand.solid" : "bg.muted" }}
      >
        <Switch.Thumb bg="white" />
      </Switch.Control>
    </Switch.Root>
  );
}

export default function NotificationsTab() {
  const { data: settings, isLoading } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();

  const [preferences, setPreferences] = useState<NotificationPreference[]>(() =>
    buildDefaultPreferences(),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (settings?.preferences && settings.preferences.length > 0 && !hydrated) {
      setPreferences(settings.preferences);
      setHydrated(true);
    }
  }, [settings, hydrated]);

  const togglePreference = useCallback(
    (eventKey: string, channel: "email" | "sms" | "inApp", checked: boolean) => {
      setPreferences((prev) => {
        const exists = prev.some((p) => p.event === eventKey);
        if (exists) {
          return prev.map((pref) =>
            pref.event === eventKey ? { ...pref, [channel]: checked } : pref,
          );
        }
        return prev;
      });
    },
    [],
  );

  const dirty =
    settings?.preferences != null &&
    JSON.stringify(preferences) !== JSON.stringify(settings.preferences);

  function handleSave() {
    updateSettings.mutate({ preferences });
  }

  if (isLoading) {
    return <LoadingSkeleton />;
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
      <Box p="20px" borderBottom="1px solid" borderColor="border.subtle">
        <Text fontSize="16px" fontWeight="600" color="fg">
          Notification preferences
        </Text>
        <Text fontSize="13px" color="fg.muted" mt="1">
          Control how and when staff receive alerts for key platform events
        </Text>
      </Box>

      {/* Content */}
      <Box p="20px">
        {/* Channel labels */}
        <HStack gap={{ base: "4", md: "6" }} mb="4" flexWrap="wrap">
          <HStack gap="2">
            <Box color="brand.solid">
              <Mail size={14} />
            </Box>
            <Text fontSize="13px" fontWeight="500" color="fg">
              Email
            </Text>
          </HStack>
          <HStack gap="2">
            <Box color="fg.muted">
              <MessageSquare size={14} />
            </Box>
            <Text fontSize="13px" fontWeight="500" color="fg.muted">
              SMS
            </Text>
            <Text fontSize="11px" color="fg.subtle">
              (requires Twilio integration)
            </Text>
          </HStack>
          <HStack gap="2">
            <Box color="fg.muted">
              <Bell size={14} />
            </Box>
            <Text fontSize="13px" fontWeight="500" color="fg">
              In-app
            </Text>
          </HStack>
        </HStack>

        {/* Desktop table */}
        <Box display={{ base: "none", md: "block" }}>
          {/* Table header */}
          <Flex
            bg="bg.subtle"
            px="16px"
            py="10px"
            borderRadius="8px 8px 0 0"
            borderBottom="1px solid"
            borderColor="border.subtle"
          >
            <Text
              flex="1"
              fontSize="11px"
              fontWeight="600"
              color="fg.muted"
              letterSpacing="0.05em"
              textTransform="uppercase"
            >
              Event
            </Text>
            <Text
              w="80px"
              textAlign="center"
              fontSize="11px"
              fontWeight="600"
              color="fg.muted"
              letterSpacing="0.05em"
              textTransform="uppercase"
            >
              Email
            </Text>
            <Text
              w="80px"
              textAlign="center"
              fontSize="11px"
              fontWeight="600"
              color="fg.muted"
              letterSpacing="0.05em"
              textTransform="uppercase"
            >
              SMS
            </Text>
            <Text
              w="80px"
              textAlign="center"
              fontSize="11px"
              fontWeight="600"
              color="fg.muted"
              letterSpacing="0.05em"
              textTransform="uppercase"
            >
              In-app
            </Text>
          </Flex>

          {/* Table rows */}
          {NOTIFICATION_EVENTS.map((event, idx) => {
            const pref = preferences.find((p) => p.event === event.key);
            return (
              <Flex
                key={event.key}
                align="center"
                px="16px"
                py="12px"
                borderBottom={
                  idx < NOTIFICATION_EVENTS.length - 1
                    ? "1px solid"
                    : "none"
                }
                borderColor="border.subtle"
                _hover={{ bg: "bg.hover" }}
                transition="background 0.15s"
              >
                <Text flex="1" fontSize="13px" color="fg">
                  {event.label}
                </Text>
                <Box w="80px" display="flex" justifyContent="center">
                  <NotificationSwitch
                    checked={pref?.email ?? false}
                    onToggle={(checked) =>
                      togglePreference(event.key, "email", checked)
                    }
                  />
                </Box>
                <Box w="80px" display="flex" justifyContent="center">
                  <NotificationSwitch
                    checked={pref?.sms ?? false}
                    onToggle={(checked) =>
                      togglePreference(event.key, "sms", checked)
                    }
                  />
                </Box>
                <Box w="80px" display="flex" justifyContent="center">
                  <NotificationSwitch
                    checked={pref?.inApp ?? false}
                    onToggle={(checked) =>
                      togglePreference(event.key, "inApp", checked)
                    }
                  />
                </Box>
              </Flex>
            );
          })}
        </Box>

        {/* Mobile layout */}
        <Stack gap="0" display={{ base: "block", md: "none" }}>
          {NOTIFICATION_EVENTS.map((event, idx) => {
            const pref = preferences.find((p) => p.event === event.key);
            return (
              <Box
                key={event.key}
                py="14px"
                borderBottom={
                  idx < NOTIFICATION_EVENTS.length - 1
                    ? "1px solid"
                    : "none"
                }
                borderColor="border.subtle"
              >
                <Text fontSize="13px" color="fg" mb="3">
                  {event.label}
                </Text>
                <Flex gap="4">
                  <HStack gap="2">
                    <Text fontSize="11px" color="fg.muted" minW="36px">
                      Email
                    </Text>
                    <NotificationSwitch
                      checked={pref?.email ?? false}
                      onToggle={(checked) =>
                        togglePreference(event.key, "email", checked)
                      }
                    />
                  </HStack>
                  <HStack gap="2">
                    <Text fontSize="11px" color="fg.muted" minW="28px">
                      SMS
                    </Text>
                    <NotificationSwitch
                      checked={pref?.sms ?? false}
                      onToggle={(checked) =>
                        togglePreference(event.key, "sms", checked)
                      }
                    />
                  </HStack>
                  <HStack gap="2">
                    <Text fontSize="11px" color="fg.muted" minW="40px">
                      In-app
                    </Text>
                    <NotificationSwitch
                      checked={pref?.inApp ?? false}
                      onToggle={(checked) =>
                        togglePreference(event.key, "inApp", checked)
                      }
                    />
                  </HStack>
                </Flex>
              </Box>
            );
          })}
        </Stack>

        {/* Footer note */}
        <Text fontSize="12px" color="fg.subtle" fontStyle="italic" mt="4">
          Changes to notification preferences take effect immediately after
          saving.
        </Text>
      </Box>

      {/* Footer */}
      <Flex
        align="center"
        justify="flex-end"
        gap="4"
        px="20px"
        py="16px"
        borderTop="1px solid"
        borderColor="border.subtle"
      >
        <Button
          onClick={handleSave}
          loading={updateSettings.isPending}
          disabled={!dirty}
          layerStyle="brand-button"
          h="36px"
          px="16px"
          fontSize="13px"
        >
          Save preferences
        </Button>
      </Flex>
    </Box>
  );
}
