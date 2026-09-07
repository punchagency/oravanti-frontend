import { Portal, Select, createListCollection } from "@chakra-ui/react";
import { memo, useMemo, useState } from "react";

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

  /*
    Options are built only while the menu is open.

    Chakra's Select has no `lazyMount`, so `Select.Content` and every
    `Select.Item` inside it mount with the trigger and simply sit hidden. That
    is invisible on a form with three dropdowns and ruinous on one with
    twenty-five: the Forms tab's field-sources view offers every question on
    the matter in every row, which was twenty-five closed menus holding several
    hundred items each, all mounted before anybody clicked anything.

    The collection still holds every item, so `ValueText` resolves the selected
    label with the menu shut. Only the rendering waits.
  */
  const [open, setOpen] = useState(false);

  return (
    <Select.Root
      collection={collection}
      size={size}
      width={width}
      minW={minW}
      open={open}
      onOpenChange={(event) => setOpen(event.open)}
      value={value ? [value] : []}
      onValueChange={(event) => onChange(event.value[0] ?? "")}
      disabled={disabled}
      invalid={invalid}
      aria-label={ariaLabel}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger bg="bg.input" borderColor="border" rounded="7px">
          <Select.ValueText placeholder={placeholder} />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {open &&
              collection.items.map((item) => (
                <Select.Item item={item} key={item.value}>
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator color="brand.solid" />
                </Select.Item>
              ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
});
