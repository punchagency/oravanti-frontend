import { chakra, DatePicker, Portal } from "@chakra-ui/react";
import type { DateValue } from "@internationalized/date";
import { CalendarDays } from "lucide-react";

interface DateFieldProps {
  value: DateValue | undefined;
  onChange: (value: DateValue | undefined) => void;
}

/** Single-date picker styled like the edit-staff start date field. */
export function DateField({ value, onChange }: DateFieldProps) {
  return (
    <DatePicker.Root
      value={value ? [value] : []}
      onValueChange={(e) => onChange(e.value[0] ?? undefined)}
    >
      <DatePicker.Control>
        <DatePicker.Input
          h="36px"
          px="12px"
          border="1px solid"
          borderColor="border"
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
