import {
  getConsultationBooking,
  payConsultationFee,
  selectConsultationSlot,
  type ConsultationBooking,
  type ConsultationBookingMode,
} from "@/api/consultation-booking";
import { Box, Button, Container, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck2, CheckCircle2, Loader2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";

const dayFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "long",
  month: "long",
  day: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  hour: "numeric",
  minute: "2-digit",
});
const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "long",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const MODE_NOTE: Record<ConsultationBookingMode, string> = {
  video: "Video call — a Google Meet link will be emailed to you.",
  phone_call: "Phone call — your attorney will call you at the scheduled time.",
  in_person: "In person — the office address will be emailed to you.",
};

function errorMessage(err: unknown, fallback: string) {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? fallback
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <Box minH="100dvh" bg="bg.subtle" py={{ base: "24px", md: "56px" }}>
      <Container maxW="560px">
        <Box
          bg="bg"
          border="1px solid"
          borderColor="border"
          borderRadius="14px"
          p={{ base: "20px", md: "32px" }}
        >
          {children}
        </Box>
        <Text textAlign="center" fontSize="11px" color="fg.muted" mt="14px">
          Times shown in UTC
        </Text>
      </Container>
    </Box>
  );
}

function CenterState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <Stack align="center" textAlign="center" gap="3" py="20px">
      {icon}
      <Heading size="md" color="fg">
        {title}
      </Heading>
      {description && (
        <Text color="fg.muted" fontSize="14px" maxW="40ch">
          {description}
        </Text>
      )}
    </Stack>
  );
}

export function ConsultationBookingPage() {
  const { token } = useParams<{ token: string }>();
  const qc = useQueryClient();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [justBookedAt, setJustBookedAt] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["consultation-booking", token],
    queryFn: () => getConsultationBooking(token as string),
    enabled: Boolean(token),
    retry: false,
  });

  const pay = useMutation({
    mutationFn: () => payConsultationFee(token as string),
    onSuccess: () => {
      toast.success("Payment received");
      qc.invalidateQueries({ queryKey: ["consultation-booking", token] });
    },
    onError: (err) => toast.error(errorMessage(err, "Payment failed")),
  });

  const select = useMutation({
    mutationFn: (start: string) =>
      selectConsultationSlot(token as string, start),
    onSuccess: (res) => setJustBookedAt(res.scheduledAt),
    onError: (err) => {
      toast.error(errorMessage(err, "That time is no longer available"));
      setSelectedSlot(null);
      qc.invalidateQueries({ queryKey: ["consultation-booking", token] });
    },
  });

  const groupedSlots = useMemo(() => {
    const map = new Map<string, ConsultationBooking["slots"]>();
    for (const slot of data?.slots ?? []) {
      const key = slot.start.slice(0, 10);
      const bucket = map.get(key) ?? [];
      bucket.push(slot);
      map.set(key, bucket);
    }
    return [...map.entries()];
  }, [data?.slots]);

  if (isLoading) {
    return (
      <Shell>
        <CenterState
          icon={<Loader2 className="spin" />}
          title="Loading…"
          description="Fetching your consultation details."
        />
      </Shell>
    );
  }

  if (isError || !data) {
    return (
      <Shell>
        <CenterState
          title="Link not found or expired"
          description="This booking link is invalid, expired, or has already been used. Please contact your attorney's office for assistance."
        />
      </Shell>
    );
  }

  const headerName = data.firmName ?? "Your consultation";

  // Already confirmed (either just now or on a previous visit).
  const confirmedAt = justBookedAt ?? data.scheduledAt;
  if (confirmedAt && (justBookedAt || data.bookingStatus === "slot_selected")) {
    return (
      <Shell>
        <CenterState
          icon={
            <Box color="#1f9e75">
              <CheckCircle2 size={48} />
            </Box>
          }
          title="Your consultation is confirmed"
          description={`${dateTimeFmt.format(new Date(confirmedAt))} UTC. ${
            MODE_NOTE[data.mode]
          } You can close this window.`}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <Stack gap="1" mb="24px">
        <Text fontSize="12px" color="fg.muted" textTransform="uppercase" letterSpacing="0.04em">
          {headerName}
        </Text>
        <Heading size="lg" color="fg">
          {data.requiresPayment ? "Consultation fee" : "Pick a time"}
        </Heading>
        <Text fontSize="14px" color="fg.muted">
          {MODE_NOTE[data.mode]} ({data.durationMinutes} min)
        </Text>
      </Stack>

      {data.requiresPayment ? (
        <Stack gap="5">
          <Flex
            align="center"
            justify="space-between"
            bg="bg.subtle"
            border="1px solid"
            borderColor="border"
            borderRadius="10px"
            p="16px"
          >
            <Text fontSize="14px" color="fg.muted">
              Consultation fee
            </Text>
            <Text fontSize="20px" fontWeight="600" color="fg">
              ${data.fee.amount ?? 0}
            </Text>
          </Flex>
          <Button
            layerStyle="brand-button"
            h="44px"
            onClick={() => pay.mutate()}
            loading={pay.isPending}
          >
            Pay ${data.fee.amount ?? 0} now
          </Button>
          <Text fontSize="12px" color="fg.muted" textAlign="center">
            This is a demo payment — no card details are required. After paying
            you'll be able to choose a time.
          </Text>
        </Stack>
      ) : groupedSlots.length === 0 ? (
        <CenterState
          icon={
            <Box color="fg.muted">
              <CalendarCheck2 size={40} />
            </Box>
          }
          title="No times available right now"
          description="There are no open times at the moment. Please check back later or contact your attorney's office."
        />
      ) : (
        <Stack gap="6">
          {groupedSlots.map(([day, slots]) => (
            <Stack key={day} gap="3">
              <Text fontSize="13px" fontWeight="600" color="fg">
                {dayFmt.format(new Date(`${day}T00:00:00Z`))}
              </Text>
              <Flex wrap="wrap" gap="2">
                {slots.map((slot) => {
                  const isSelected = selectedSlot === slot.start;
                  return (
                    <Button
                      key={slot.start}
                      onClick={() => setSelectedSlot(slot.start)}
                      variant="outline"
                      h="38px"
                      px="14px"
                      fontSize="13px"
                      borderRadius="8px"
                      bg={isSelected ? "brand.subtle" : "bg"}
                      color={isSelected ? "brand.fg" : "fg"}
                      borderColor={isSelected ? "brand.solid" : "border"}
                    >
                      {timeFmt.format(new Date(slot.start))}
                    </Button>
                  );
                })}
              </Flex>
            </Stack>
          ))}

          <Button
            layerStyle="brand-button"
            h="44px"
            disabled={!selectedSlot}
            loading={select.isPending}
            onClick={() => selectedSlot && select.mutate(selectedSlot)}
          >
            {selectedSlot
              ? `Confirm ${timeFmt.format(new Date(selectedSlot))} UTC`
              : "Select a time to continue"}
          </Button>
        </Stack>
      )}
    </Shell>
  );
}
