declare module "react-big-calendar" {
  import type { ComponentType } from "react";

  export type View = "month" | "week" | "day" | "agenda";

  export interface Event {
    id?: string | number;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    [key: string]: unknown;
  }

  export interface SlotInfo {
    start: Date;
    end: Date;
    slots: Date[];
    action: string;
  }

  export interface ToolbarProps {
    view: View;
    views: View[];
    label: string;
    onNavigate: (action: string | Date) => void;
    onView: (view: View) => void;
  }

  export interface EventProps {
    event: Event;
  }

  export interface DateHeaderProps {
    date: Date;
    label: string;
  }

  export interface HeaderProps {
    date: Date;
    label: string;
  }

  export interface Components {
    toolbar?: ComponentType<ToolbarProps>;
    event?: ComponentType<EventProps>;
    month?: { dateHeader?: ComponentType<DateHeaderProps> };
    week?: { header?: ComponentType<HeaderProps> };
    day?: { header?: ComponentType<HeaderProps> };
  }

  export interface Localizer {
    format: (date: Date, format: string) => string;
  }

  export function dayjsLocalizer(moment: typeof import("dayjs")): Localizer;

  export interface CalendarProps {
    localizer: Localizer;
    events?: Event[];
    view?: View;
    views?: View[];
    date?: Date;
    onNavigate?: (date: Date) => void;
    onView?: (view: string) => void;
    onSelectEvent?: (event: Event) => void;
    onSelectSlot?: (slotInfo: SlotInfo) => void;
    selectable?: boolean;
    components?: Components;
    min?: Date;
    max?: Date;
    step?: number;
    timeslots?: number;
    style?: React.CSSProperties;
    eventPropGetter?: (event: Event) => { style: Record<string, unknown> };
  }

  export function Calendar(props: CalendarProps): React.JSX.Element;
}
