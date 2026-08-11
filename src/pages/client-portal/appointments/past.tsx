import { Box, Flex, Text, Badge, HStack, Avatar } from "@chakra-ui/react";
import { FileText } from "lucide-react";

const PAST_APPOINTMENTS = [
  {
    id: "1",
    title: "Initial consultation",
    date: { day: "15", month: "JUN" },
    time: "2:00 PM",
    duration: "30 min",
    participant: { name: "Marcus Webb" },
    note: "Consultation completed. Fee agreement was prepared and sent following this meeting.",
    status: "completed",
  },
  {
    id: "2",
    title: "Document review call",
    date: { day: "8", month: "JUN" },
    time: "11:00 AM",
    duration: "20 min",
    participant: { name: "Sofia Reyes" },
    note: null,
    status: "completed",
  },
];

function DateBlock({ date }: { date: { day: string; month: string } }) {
  return (
    <Box
      w="56px"
      h="56px"
      borderRadius="8px"
      border="1px solid"
      borderColor="border"
      bg="bg"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Text fontSize="20px" fontWeight="700" color="fg" lineHeight="1">
        {date.day}
      </Text>
      <Text
        fontSize="9px"
        fontWeight="600"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="0.05em"
      >
        {date.month}
      </Text>
    </Box>
  );
}

function PastAppointmentCard({
  appointment,
}: {
  appointment: (typeof PAST_APPOINTMENTS)[0];
}) {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      p="16px"
      bg="bg"
    >
      <Flex gap="14px" align="flex-start">
        <DateBlock date={appointment.date} />

        <Box flex="1" minW={0}>
          <Flex justify="space-between" align="center" mb="1">
            <Text fontSize="14px" fontWeight="600" color="fg">
              {appointment.title}
            </Text>
            <Badge
              size="sm"
              variant="subtle"
              colorPalette="gray"
              fontSize="10px"
              fontWeight="500"
            >
              Completed
            </Badge>
          </Flex>

          <HStack gap="1.5" mb="1">
            <Avatar.Root size="2xs" shape="rounded">
              <Avatar.Fallback name={appointment.participant.name} />
            </Avatar.Root>
            <Text fontSize="12px" color="fg.muted">
              with {appointment.participant.name}
            </Text>
          </HStack>

          <Text fontSize="12px" color="fg.muted" mb={appointment.note ? "2" : "0"}>
            {appointment.time} · {appointment.duration}
          </Text>

          {appointment.note && (
            <Flex gap="1.5" align="flex-start" mt="2">
              <Box mt="2px" flexShrink={0}>
                <FileText size={12} color="fg.subtle" />
              </Box>
              <Text fontSize="12px" color="fg.muted" lineHeight="1.4">
                {appointment.note}
              </Text>
            </Flex>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

export default function PastAppointmentsPage() {
  return (
    <Box maxW="960px">
      <Box mb="6">
        <Text fontSize="22px" fontWeight="600" color="fg" mb="1">
          Past appointments
        </Text>
        <Text fontSize="13px" color="fg.muted">
          Your completed meetings and events
        </Text>
      </Box>

      <Text fontSize="13px" color="fg.muted" mb="4">
        A record of your completed meetings and consultations.
      </Text>

      {PAST_APPOINTMENTS.length === 0 ? (
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          p="40px"
          bg="bg"
          textAlign="center"
        >
          <Text fontSize="14px" color="fg.subtle">
            No past appointments.
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap="3">
          {PAST_APPOINTMENTS.map((apt) => (
            <PastAppointmentCard key={apt.id} appointment={apt} />
          ))}
        </Flex>
      )}
    </Box>
  );
}
