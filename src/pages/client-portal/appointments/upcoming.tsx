import { Box, Flex, Text, Badge, Button, HStack, Avatar } from "@chakra-ui/react";
import {
  Calendar,
  MapPin,
  Clock,
  Bell,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

const UPCOMING_APPOINTMENTS = [
  {
    id: "1",
    category: "GOVERNMENT APPOINTMENT",
    title: "USCIS interview",
    date: { day: "22", month: "JUN", weekday: "Mon" },
    time: "10:00 AM",
    duration: "45 min",
    description:
      "Your I-485 Adjustment of Status interview at the USCIS field office. This is a critical step in your case.",
    location: {
      label: "USCIS New York Field Office, 26 Federal Plaza, New York, NY 10278",
    },
    attorney: { name: "Marcus Webb", initials: "MW" },
    status: "confirmed",
    format: "in_person",
    preparationGuide: true,
    note: "USCIS interviews cannot be rescheduled through this portal. Please contact Marcus Webb directly if you need to discuss your interview date.",
    todayBanner: {
      message: "This appointment is today",
      detail: "Jun 22 at 10:00 AM",
    },
  },
];

function DateBlock({ date }: { date: { day: string; month: string; weekday: string } }) {
  return (
    <Box
      w="56px"
      h="60px"
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
      <Text fontSize="9px" fontWeight="600" color="fg.muted" textTransform="uppercase" letterSpacing="0.05em">
        {date.month}
      </Text>
      <Text fontSize="9px" color="fg.subtle">
        {date.weekday}
      </Text>
    </Box>
  );
}

function UpcomingAppointmentCard({ appointment }: { appointment: (typeof UPCOMING_APPOINTMENTS)[0] }) {
  return (
    <Box>
      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="10px"
        bg="bg"
        overflow="hidden"
      >
        {/* Top Bar */}
        <Flex
          justify="space-between"
          align="center"
          px="16px"
          py="10px"
          borderBottom="1px solid"
          borderColor="border"
        >
          <HStack gap="2">
            <Calendar size={13} color="fg.muted" />
            <Text fontSize="11px" fontWeight="600" color="fg.muted" letterSpacing="0.05em">
              {appointment.category}
            </Text>
          </HStack>
          <Badge
            colorPalette="green"
            size="sm"
            variant="subtle"
            fontSize="10px"
            fontWeight="500"
          >
            Confirmed
          </Badge>
        </Flex>

        {/* Content */}
        <Flex p="16px" gap="16px">
          <DateBlock date={appointment.date} />

          <Box flex="1" minW={0}>
            <Text fontSize="16px" fontWeight="600" color="fg" mb="1">
              {appointment.title}
            </Text>
            <HStack gap="1.5" mb="2">
              <Clock size={12} color="fg.muted" />
              <Text fontSize="13px" color="fg.muted">
                {appointment.time} · {appointment.duration}
              </Text>
            </HStack>
            <Text fontSize="13px" color="fg.muted" lineHeight="1.5" mb="3">
              {appointment.description}
            </Text>

            <Flex gap="2" align="center" mb="3" flexWrap="wrap">
              <Badge
                size="sm"
                variant="outline"
                color="fg.muted"
                fontSize="10px"
                fontWeight="500"
                px="8px"
                py="2px"
                borderRadius="full"
              >
                In person
              </Badge>
              <HStack gap="1">
                <MapPin size={11} color="fg.subtle" />
                <Text fontSize="11px" color="fg.subtle">
                  {appointment.location.label}
                </Text>
              </HStack>
            </Flex>

            <Flex gap="2" align="center" mb="3">
              <Avatar.Root size="2xs" shape="rounded">
                <Avatar.Fallback name={appointment.attorney.name} />
              </Avatar.Root>
              <Text fontSize="12px" fontWeight="500" color="fg">
                {appointment.attorney.name}
              </Text>
              <Text fontSize="12px" color="fg.subtle">
                Your attorney
              </Text>
            </Flex>

            {appointment.preparationGuide && (
              <Button
                variant="ghost"
                size="xs"
                color="brand.solid"
                fontSize="12px"
                fontWeight="500"
                gap="1"
                px={0}
                _hover={{ bg: "bg.subtle" }}
              >
                <ExternalLink size={12} /> View your preparation guide
              </Button>
            )}
          </Box>

          {/* Right Side */}
          <Flex
            direction="column"
            align="flex-end"
            justify="space-between"
            flexShrink={0}
            minW="180px"
          >
            <Button
              size="sm"
              variant="outline"
              color="fg"
              fontSize="12px"
              h="32px"
              px="14px"
              gap="1.5"
            >
              Get directions
            </Button>
            <Text
              fontSize="11px"
              color="fg.subtle"
              textAlign="right"
              lineHeight="1.4"
              maxW="200px"
            >
              {appointment.note}
            </Text>
          </Flex>
        </Flex>

        {/* Today Banner */}
        {appointment.todayBanner && (
          <Flex
            justify="space-between"
            align="center"
            px="16px"
            py="10px"
            borderTop="1px solid"
            borderColor="border"
            bg="brand.500/8"
          >
            <HStack gap="2">
              <AlertCircle size={13} color="brand.solid" />
              <Text fontSize="12px" fontWeight="500" color="brand.solid">
                {appointment.todayBanner.message}
              </Text>
              <Text fontSize="12px" color="fg.muted">
                — {appointment.todayBanner.detail}
              </Text>
            </HStack>
            <Button
              size="xs"
              variant="outline"
              color="fg"
              fontSize="11px"
              h="28px"
              px="10px"
              gap="1"
            >
              <Bell size={11} /> Set reminder
            </Button>
          </Flex>
        )}
      </Box>
    </Box>
  );
}

export default function UpcomingAppointmentsPage() {
  return (
    <Box maxW="960px">
      <Box mb="6">
        <Text fontSize="22px" fontWeight="600" color="fg" mb="1">
          Appointments
        </Text>
        <Text fontSize="13px" color="fg.muted">
          Your scheduled meetings and events
        </Text>
      </Box>

      {UPCOMING_APPOINTMENTS.length === 0 ? (
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          p="40px"
          bg="bg"
          textAlign="center"
        >
          <Text fontSize="14px" color="fg.subtle">
            No upcoming appointments.
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap="4">
          {UPCOMING_APPOINTMENTS.map((apt) => (
            <UpcomingAppointmentCard key={apt.id} appointment={apt} />
          ))}
        </Flex>
      )}
    </Box>
  );
}
