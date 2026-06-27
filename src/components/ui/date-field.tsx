import { DatePicker, Portal, chakra, parseDate } from "@chakra-ui/react";
import type { DateValue } from "@internationalized/date";
import { CalendarDays } from "lucide-react";

const invalidColor = "#ff2d55";

interface DateFieldProps {
  /** ISO date string, e.g. "2024-01-15". Empty string means no value. */
  value: string;
  onChange: (value: string) => void;
  /** Earliest selectable date as an ISO string. */
  min?: string;
  invalid?: boolean;
  ariaLabel?: string;
}

// parseDate throws on malformed input — guard so a bad stored value (or an
// empty string) just renders an empty picker instead of crashing.
function toDateValue(value: string): DateValue[] {
  if (!value) return [];
  try {
    return [parseDate(value)];
  } catch {
    return [];
  }
}

function toMinValue(value: string | undefined): DateValue | undefined {
  if (!value) return undefined;
  try {
    return parseDate(value);
  } catch {
    return undefined;
  }
}

/**
 * Chakra UI DatePicker styled to match the staff dialogs, exposing a plain
 * ISO-string value/onChange so it drops into string-based forms.
 */
export function DateField({
  value,
  onChange,
  min,
  invalid,
  ariaLabel,
}: DateFieldProps) {
  return (
    <DatePicker.Root
      value={toDateValue(value)}
      min={toMinValue(min)}
      onValueChange={(details) => onChange(details.value[0]?.toString() ?? "")}
    >
      <DatePicker.Control>
        <DatePicker.Input
          aria-label={ariaLabel}
          w="full"
          h="36px"
          px="12px"
          border="1px solid"
          borderColor={invalid ? invalidColor : "border"}
          borderRadius="7px"
          bg="bg"
          color="fg"
          fontSize="13px"
          _placeholder={{ color: "fg.muted" }}
          _focus={{
            borderColor: "brand.solid",
            boxShadow: "0 0 0 1px var(--brand-cta)",
          }}
        />
        <DatePicker.IndicatorGroup>
          <DatePicker.Trigger
            asChild
            border="none"
            bg="transparent"
            color="fg.muted"
            cursor="pointer"
          >
            <chakra.button type="button">
              <CalendarDays size={16} />
            </chakra.button>
          </DatePicker.Trigger>
        </DatePicker.IndicatorGroup>
      </DatePicker.Control>
      <Portal>
        <DatePicker.Positioner>
          <DatePicker.Content>
            <DatePicker.View view="day">
              <DatePicker.Header />
              <DatePicker.DayTable />
            </DatePicker.View>
            <DatePicker.View view="month">
              <DatePicker.Header />
              <DatePicker.MonthTable />
            </DatePicker.View>
            <DatePicker.View view="year">
              <DatePicker.Header />
              <DatePicker.YearTable />
            </DatePicker.View>
          </DatePicker.Content>
        </DatePicker.Positioner>
      </Portal>
    </DatePicker.Root>
  );
}
