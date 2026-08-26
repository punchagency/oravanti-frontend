import { API } from ".";

export type NotificationChannel = "email" | "sms" | "in_app";

export type NotificationStatus =
  | "pending"
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "failed"
  | "skipped"
  | "cancelled";

export type NotificationRow = {
  id: string;
  /** Internal event key, e.g. "questionnaire_sent". */
  event: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  recipientName: string | null;
  /** Email address, or a phone number already normalised to E.164. */
  recipientAddress: string | null;
  subject: string | null;
  /** Why we chose not to send — the answer to "why didn't they get it". */
  skipReason: string | null;
  failureReason: string | null;
  attemptCount: number;
  sendAt: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  data: NotificationRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type NotificationFilters = {
  leadId?: string;
  clientId?: string;
  invoiceId?: string;
  caseId?: string;
  page?: number;
  limit?: number;
};

export async function getNotifications(filters: NotificationFilters) {
  const { data } = await API.get<{ data: NotificationListResponse }>(
    "/notifications",
    { params: filters },
  );
  return data.data;
}

export type NotificationCapabilities = {
  deliveryTracking: { email: boolean };
};

/**
 * What this deployment can confirm about delivery.
 *
 * Email rows legitimately stop at "sent" when no provider webhook is
 * configured — which is every development environment, where the transport is
 * SMTP with no callbacks. Without this the UI cannot tell that apart from a
 * genuinely stuck row.
 */
export async function getNotificationCapabilities() {
  const { data } = await API.get<{ data: NotificationCapabilities }>(
    "/notifications/capabilities",
  );
  return data.data;
}
