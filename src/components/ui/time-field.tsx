import { useMemo } from "react";
import { FormSelect, type FormSelectOption } from "@/components/ui/form-select";

interface TimeFieldProps {
  /** 24h "HH:MM" value. Empty string means no value. */
  value: string;
  onChange: (value: string) => void;
  /** Minutes between options. Default 15. */
  stepMinutes?: number;
  invalid?: boolean;
  ariaLabel?: string;
}

const MINUTES_IN_DAY = 24 * 60;

// "14:30" -> "2:30 PM"
function formatTimeLabel(time: string): string {
  const [hourStr, minStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  if (Number.isNaN(hour)) return time;
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minStr} ${period}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Chakra UI time picker — a Select of fixed time slots, styled to match the
 * other intake form controls. Stores a 24h "HH:MM" string.
 */
export function TimeField({
  value,
  onChange,
  stepMinutes = 15,
  invalid,
  ariaLabel,
}: TimeFieldProps) {
  const options = useMemo<FormSelectOption[]>(() => {
    const slots: FormSelectOption[] = [];
    for (let minutes = 0; minutes < MINUTES_IN_DAY; minutes += stepMinutes) {
      const slot = `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
      slots.push({ value: slot, label: formatTimeLabel(slot) });
    }
    // Keep an off-grid current value (e.g. an existing booking at :05)
    // selectable rather than silently blank.
    if (value && !slots.some((s) => s.value === value)) {
      slots.push({ value, label: formatTimeLabel(value) });
      slots.sort((a, b) => a.value.localeCompare(b.value));
    }
    return slots;
  }, [stepMinutes, value]);

  return (
    <FormSelect
      ariaLabel={ariaLabel}
      value={value}
      onChange={onChange}
      invalid={invalid}
      options={options}
    />
  );
}
