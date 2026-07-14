import { API } from "./index";

export type OverrideType = "closed" | "custom_hours";
export type TimeOffType = "annual" | "sick" | "emergency" | "unpaid";
export type TimeOffStatus = "pending" | "approved" | "rejected";

// Postgres `time` columns serialize as "HH:MM:SS".
export interface AvailabilityWindowDTO {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface AvailabilityBreakDTO {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label: string | null;
}

export interface AvailabilityOverrideDTO {
  id: string;
  date: string;
  type: OverrideType;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export interface TimeOffDTO {
  id: string;
  type: TimeOffType;
  startDate: string;
  endDate: string;
  status: TimeOffStatus;
  reason: string | null;
}

export interface StaffScheduleDTO {
  windows: AvailabilityWindowDTO[];
  breaks: AvailabilityBreakDTO[];
  overrides: AvailabilityOverrideDTO[];
  timeOff: TimeOffDTO[];
}

export interface WindowPayload {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface BreakPayload extends WindowPayload {
  label?: string;
}

export interface OverridePayload {
  date: string;
  type: OverrideType;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface TimeOffPayload {
  type: TimeOffType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export async function getStaffSchedule(
  staffId: string,
): Promise<StaffScheduleDTO> {
  const response = await API.get(`/staff-availability/${staffId}`);
  return response.data.data;
}

export async function setWeeklyAvailability(
  staffId: string,
  windows: WindowPayload[],
): Promise<AvailabilityWindowDTO[]> {
  const response = await API.put(`/staff-availability/${staffId}`, { windows });
  return response.data.data;
}

export async function setBreaks(
  staffId: string,
  breaks: BreakPayload[],
): Promise<AvailabilityBreakDTO[]> {
  const response = await API.put(`/staff-availability/${staffId}/breaks`, {
    breaks,
  });
  return response.data.data;
}

export async function createOverride(
  staffId: string,
  payload: OverridePayload,
): Promise<AvailabilityOverrideDTO> {
  const response = await API.post(
    `/staff-availability/${staffId}/overrides`,
    payload,
  );
  return response.data.data;
}

export async function updateOverride(
  staffId: string,
  overrideId: string,
  payload: OverridePayload,
): Promise<AvailabilityOverrideDTO> {
  const response = await API.patch(
    `/staff-availability/${staffId}/overrides/${overrideId}`,
    payload,
  );
  return response.data.data;
}

export async function deleteOverride(
  staffId: string,
  overrideId: string,
): Promise<void> {
  await API.delete(`/staff-availability/${staffId}/overrides/${overrideId}`);
}

export async function createTimeOff(
  staffId: string,
  payload: TimeOffPayload,
): Promise<TimeOffDTO> {
  const response = await API.post(
    `/staff-availability/${staffId}/time-off`,
    payload,
  );
  return response.data.data;
}

export async function updateTimeOff(
  staffId: string,
  timeOffId: string,
  payload: TimeOffPayload,
): Promise<TimeOffDTO> {
  const response = await API.patch(
    `/staff-availability/${staffId}/time-off/${timeOffId}`,
    payload,
  );
  return response.data.data;
}

export async function deleteTimeOff(
  staffId: string,
  timeOffId: string,
): Promise<void> {
  await API.delete(`/staff-availability/${staffId}/time-off/${timeOffId}`);
}
