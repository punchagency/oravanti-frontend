import {
  getNotificationCapabilities,
  getNotifications,
  type NotificationFilters,
} from "@/api/notifications";
import { useQuery } from "@tanstack/react-query";

export function useNotifications(
  filters: NotificationFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: ["notifications", filters],
    queryFn: () => getNotifications(filters),
    // Only fetch when there is something to scope by. An unfiltered query would
    // return the whole firm's delivery history into a panel about one lead.
    enabled:
      enabled &&
      Boolean(
        filters.leadId ?? filters.clientId ?? filters.invoiceId ?? filters.caseId,
      ),
  });
}

export function useNotificationCapabilities() {
  return useQuery({
    queryKey: ["notificationCapabilities"],
    queryFn: getNotificationCapabilities,
    staleTime: Infinity,
  });
}
