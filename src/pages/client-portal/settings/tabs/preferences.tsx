import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  Box,
  createListCollection,
  Flex,
  Portal,
  Select,
  Separator,
  SimpleGrid,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Mail, Phone, Laptop } from "lucide-react";
import { useState } from "react";

const NOTIFICATIONS = [
  {
    key: "caseStatus",
    label: "Case status updates",
    description: "When your case moves to a new stage",
  },
  {
    key: "appointmentReminders",
    label: "Appointment reminders",
    description: "24 hours before any scheduled appointment",
  },
  {
    key: "documentRequests",
    label: "Document requests",
    description: "When your legal team requests a new document",
  },
  {
    key: "paymentReminders",
    label: "Payment reminders",
    description: "Before an upcoming payment is due",
  },
  {
    key: "generalUpdates",
    label: "General updates",
    description: "News and updates from your firm",
  },
] as const;

const CONTACT_OPTIONS = [
  { key: "email", label: "Email", icon: Mail },
  { key: "phone", label: "Phone call", icon: Phone },
  { key: "portal", label: "Portal only", icon: Laptop },
] as const;

const timeCollection = createListCollection({
  items: [
    { label: "Any time", value: "any" },
    { label: "Morning (8am \u2013 12pm)", value: "morning" },
    { label: "Afternoon (12pm \u2013 5pm)", value: "afternoon" },
    { label: "Evening (5pm \u2013 8pm)", value: "evening" },
  ],
});

const languageCollection = createListCollection({
  items: [{ label: "English", value: "en" }],
});

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

export default function ClientPreferencesTab() {
  useDocumentTitle("Preferences - Oravanti");

  const [notifications, setNotifications] = useState({
    caseStatus: true,
    appointmentReminders: true,
    documentRequests: true,
    paymentReminders: true,
    generalUpdates: false,
  });

  const [contactPreference, setContactPreference] = useState("email");
  const [bestTime, setBestTime] = useState("any");

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="6">
        <Box>
          <Text fontSize="16px" fontWeight="600" color="fg" mb="1">
            Preferences
          </Text>
          <Text fontSize="13px" color="fg.muted">
            Manage your notifications, contact preferences, and language settings
          </Text>
        </Box>
      </Flex>

      <VStack gap="6" align="stretch">
        {/* Notifications */}
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          bg="bg"
          overflow="hidden"
        >
          <Box p="20px" borderBottom="1px solid" borderColor="border.subtle">
            <Text fontSize="16px" fontWeight="600" color="fg">
              Notifications
            </Text>
            <Text fontSize="13px" color="fg.muted" mt="1">
              Choose what updates you receive by email.
            </Text>
          </Box>
          <Box p="20px">
            <VStack gap="0" align="stretch">
              {NOTIFICATIONS.map((item, i) => (
                <Box key={item.key}>
                  {i > 0 && <Separator borderColor="border.subtle" />}
                  <Flex
                    justify="space-between"
                    align="center"
                    py={{ base: "3", md: "4" }}
                    gap="4"
                  >
                    <Box flex="1" minW="0">
                      <Text fontSize="14px" fontWeight="500" color="fg">
                        {item.label}
                      </Text>
                      <Text fontSize="12px" color="fg.muted" mt="0.5">
                        {item.description}
                      </Text>
                    </Box>
                    <NotificationSwitch
                      checked={notifications[item.key]}
                      onToggle={() => toggleNotification(item.key)}
                    />
                  </Flex>
                </Box>
              ))}
            </VStack>
          </Box>
        </Box>

        {/* How we reach you */}
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          bg="bg"
          overflow="hidden"
        >
          <Box p="20px" borderBottom="1px solid" borderColor="border.subtle">
            <Text fontSize="16px" fontWeight="600" color="fg">
              How we reach you
            </Text>
            <Text fontSize="13px" color="fg.muted" mt="1">
              Let your legal team know your preferred way to be contacted.
            </Text>
          </Box>
          <Box p="20px">
            <SimpleGrid columns={{ base: 1, sm: 3 }} gap="3" mb="5">
              {CONTACT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = contactPreference === option.key;
                return (
                  <Box
                    key={option.key}
                    borderWidth="1px"
                    borderColor={isActive ? "brand.solid" : "border.subtle"}
                    borderRadius="lg"
                    p={{ base: "4", md: "5" }}
                    textAlign="center"
                    cursor="pointer"
                    transition="border-color 0.15s"
                    _hover={{ borderColor: "brand.solid" }}
                    onClick={() => setContactPreference(option.key)}
                  >
                    <Icon
                      size={20}
                      color={isActive ? "brand.solid" : "fg.muted"}
                      style={{ margin: "0 auto 8px" }}
                    />
                    <Text
                      fontSize="14px"
                      fontWeight={isActive ? "600" : "400"}
                      color="fg"
                    >
                      {option.label}
                    </Text>
                  </Box>
                );
              })}
            </SimpleGrid>

            <Box borderTop="1px solid" borderColor="border.subtle" pt="4">
              <Flex
                justify="space-between"
                align={{ base: "stretch", sm: "center" }}
                gap="4"
              >
                <Box>
                  <Text
                    fontSize="12px"
                    fontWeight="600"
                    color="fg.muted"
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                  >
                    Best time to reach you
                  </Text>
                  <Text fontSize="13px" color="fg.muted" mt="0.5">
                    Your legal team will try to contact you during this window.
                  </Text>
                </Box>
                <Select.Root
                  collection={timeCollection}
                  value={[bestTime]}
                  onValueChange={(details) => setBestTime(details.value[0])}
                  size="sm"
                  width={{ base: "full", sm: "200px" }}
                  flexShrink={0}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText />
                    </Select.Trigger>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {timeCollection.items.map((item) => (
                          <Select.Item key={item.value} item={item}>
                            <Select.ItemText>{item.label}</Select.ItemText>
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Flex>
            </Box>
          </Box>
        </Box>

        {/* Language */}
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          bg="bg"
          overflow="hidden"
        >
          <Box p="20px" borderBottom="1px solid" borderColor="border.subtle">
            <Text fontSize="16px" fontWeight="600" color="fg">
              Language
            </Text>
            <Text fontSize="13px" color="fg.muted" mt="1">
              Your portal language preference.
            </Text>
          </Box>
          <Box p="20px">
            <Flex justify="space-between" align="center" gap="4">
              <Box>
                <Text fontSize="14px" fontWeight="500" color="fg">
                  Display language
                </Text>
                <Text fontSize="12px" color="fg.muted" mt="0.5">
                  English
                </Text>
              </Box>
              <Select.Root
                collection={languageCollection}
                value={["en"]}
                size="sm"
                width={{ base: "full", sm: "140px" }}
                disabled
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText />
                  </Select.Trigger>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {languageCollection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          <Select.ItemText>{item.label}</Select.ItemText>
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Flex>
            <Text fontSize="12px" color="fg.muted" mt="3">
              Full multilingual support is coming soon. Some content may remain
              in English in the meantime.
            </Text>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
}