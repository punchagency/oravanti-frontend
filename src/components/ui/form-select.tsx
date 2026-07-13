import { Portal, Select, createListCollection } from "@chakra-ui/react";
import { memo, useMemo } from "react";

export interface FormSelectOption {
  label: string;
  value: string;
}

interface FormSelectProps {
  options: FormSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  size?: "xs" | "sm" | "md" | "lg";
  width?: string;
  minW?: string;
}

/**
 * Chakra UI Select styled to match the intake/staff form controls. Wraps the
 * composed `Select.Root` API so forms don't repeat the trigger/positioner
 * markup for every dropdown.
 *
 * Memoized: rebuilding the collection and re-rendering every Select.Item is the
 * expensive part of a dropdown, and these sit in forms that re-render on each
 * keystroke. Callers get the benefit only by passing a stable `options` array
 * (useMemo) and a stable `onChange` (useCallback).
 */
export const FormSelect = memo(function FormSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  invalid,
  ariaLabel,
  size = "sm",
  width = "full",
  minW,
}: FormSelectProps) {
  const collection = useMemo(
    () => createListCollection({ items: options }),
    [options],
  );

  return (
    <Select.Root
      collection={collection}
      size={size}
      width={width}
      minW={minW}
      value={value ? [value] : []}
      onValueChange={(event) => onChange(event.value[0] ?? "")}
      disabled={disabled}
      invalid={invalid}
      aria-label={ariaLabel}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger bg="bg" borderColor="border" rounded="7px">
          <Select.ValueText placeholder={placeholder} />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {collection.items.map((item) => (
              <Select.Item item={item} key={item.value}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
});
