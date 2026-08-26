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
  status:
    | "pending_payment"
    | "awaiting_slot_selection"
    | "scheduled"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show";
  fee: {
    status: ConsultationFeeStatus;
    /** The whole consultation fee. */
    amount: number | null;
    /**
     * What is being asked for right now. Differs from `amount` only on a
     * deposit schedule, where the lead owes the full fee but is being asked for
     * the deposit — quoting `amount` beside a payment form charging the deposit
     * showed the client two contradictory numbers.
     */
    dueNow?: number | null;
    invoiceNumber?: string | null;
  };
  scheduledAt: string | null;
  bookingStatus: string | null;
  slots: ConsultationSlot[];
};

export async function getConsultationBooking(token: string) {
  const res = await httpClient.get(`/consultation-booking/${token}`);
  return res.data.data as ConsultationBooking;
}

/**
 * Get the hosted payment URL for this consultation's fee.
 *
 * Was a one-click "mark it paid" that moved no money. It now returns a Confido
 * link, and the consultation only advances once the payment is actually
 * recorded — so the page waits for that rather than assuming it.
 */
export async function startConsultationPayment(token: string) {
  const res = await httpClient.post(`/consultation-booking/${token}/pay`);
  return res.data.data as { url: string };
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
