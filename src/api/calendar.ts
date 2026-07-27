import { API } from "./index";
import type {
  CalendarEventResponse,
  CalendarEventDetailResponse,
  CalendarStripDay,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
  CreateServiceRequestEventRequest,
} from "@/pages/admin/calendar/types";

export async function getCalendarEvents(
  year: number,
  month: number,
): Promise<CalendarEventResponse[]> {
  const { data: res } = await API.get<{ data: CalendarEventResponse[] }>(
    "/calendar",
    { params: { year, month } },
  );
  return res.data;
}

export async function getCalendarEventById(
  id: string,
): Promise<CalendarEventDetailResponse> {
  const { data: res } = await API.get<{ data: CalendarEventDetailResponse }>(
    `/calendar/${id}`,
  );
  return res.data;
}

export async function createCalendarEvent(
  payload: CreateCalendarEventRequest,
): Promise<CalendarEventResponse> {
  const { data: res } = await API.post<{ data: CalendarEventResponse }>(
    "/calendar",
    payload,
  );
  return res.data;
}

export async function updateCalendarEvent(
  id: string,
  payload: UpdateCalendarEventRequest,
): Promise<CalendarEventResponse> {
  const { data: res } = await API.patch<{ data: CalendarEventResponse }>(
    `/calendar/${id}`,
    payload,
  );
  return res.data;
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await API.delete(`/calendar/${id}`);
}

export async function getCalendarStrip(
  teamId?: string,
): Promise<CalendarStripDay[]> {
  const { data: res } = await API.get<{ data: CalendarStripDay[] }>(
    "/calendar/strip",
    { params: teamId ? { teamId } : undefined },
  );
  return res.data;
}

export async function createServiceRequestEvent(
  payload: CreateServiceRequestEventRequest,
): Promise<CalendarEventResponse> {
  const { data: res } = await API.post<{ data: CalendarEventResponse }>(
    "/calendar/service-requests",
    payload,
  );
  return res.data;
}

export async function resolveServiceRequestEvents(
  caseId: string,
): Promise<void> {
  await API.delete(`/calendar/service-requests/${caseId}`);
}

export async function scheduleNextServiceRequest(
  payload: CreateServiceRequestEventRequest,
): Promise<CalendarEventResponse> {
  const { data: res } = await API.post<{ data: CalendarEventResponse }>(
    "/calendar/service-requests/next",
    payload,
  );
  return res.data;
}
