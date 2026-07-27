import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCalendarEvents,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/api/calendar";
import type {
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
} from "./types";

export const calendarKeys = {
  all: ["calendar"] as const,
  list: (year: number, month: number) =>
    [...calendarKeys.all, "list", year, month] as const,
  detail: (id: string) => [...calendarKeys.all, "detail", id] as const,
};

export function useCalendarEvents(year: number, month: number) {
  return useQuery({
    queryKey: calendarKeys.list(year, month),
    queryFn: () => getCalendarEvents(year, month),
  });
}

export function useCalendarEventDetail(id: string | null) {
  return useQuery({
    queryKey: calendarKeys.detail(id ?? ""),
    queryFn: () => getCalendarEventById(id!),
    enabled: !!id,
  });
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCalendarEventRequest) =>
      createCalendarEvent(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

export function useUpdateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & UpdateCalendarEventRequest) =>
      updateCalendarEvent(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCalendarEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}
