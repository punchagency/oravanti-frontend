import { httpClient } from "@/services/http-client";

export type ConsultationBookingMode = "video" | "in_person" | "phone_call";

export type ConsultationFeeStatus = "none" | "unpaid" | "paid" | "waived";

export type ConsultationSlot = {
  start: string; // ISO 8601 (UTC)
  end: string;
};

export type ConsultationBooking = {
  firmName: string | null;
  leadName: string | null;
  firmTimezone: string;
  leadTimezone: string | null;
  mode: ConsultationBookingMode;
  durationMinutes: number;
  requiresPayment: boolean;
  isUrgent: boolean;
  fee: { status: ConsultationFeeStatus; amount: number | null };
  scheduledAt: string | null;
  bookingStatus: string | null;
  slots: ConsultationSlot[];
};

export async function getConsultationBooking(token: string) {
  const res = await httpClient.get(`/consultation-booking/${token}`);
  return res.data.data as ConsultationBooking;
}

export async function payConsultationFee(token: string) {
  const res = await httpClient.post(`/consultation-booking/${token}/pay`);
  return res.data.data as { success: boolean };
}

export async function selectConsultationSlot(token: string, start: string) {
  const res = await httpClient.post(
    `/consultation-booking/${token}/select-slot`,
    { start },
  );
  return res.data.data as { success: boolean; scheduledAt: string };
}

// Reconcile the lead's stored timezone with their browser-detected one when the
// lead confirms the prompt on the booking page.
export async function updateBookingTimezone(token: string, timezone: string) {
  const res = await httpClient.patch(
    `/consultation-booking/${token}/timezone`,
    { timezone },
  );
  return res.data.data as { timezone: string };
}
