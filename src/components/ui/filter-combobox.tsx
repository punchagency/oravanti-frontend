import {
  Combobox,
  Portal,
  Text,
  createListCollection,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";

export type FilterOption = { value: string; label: string };

/**
 * The searchable, clearable dropdown used by the app's filter bars. The cases,
 * staff and teams filters each spell this Combobox block out inline; this is
 * the same control with the same styling, wrapped so new filter bars don't
 * repeat it.
 *
 * An empty `value` means "no filter", which is what the placeholder shows.
 */
export function FilterCombobox({
  options,
  value,
  onChange,
  placeholder,
  /** Plural noun for the empty-results message, e.g. "cases". */
  noun,
  minW = "150px",
}: {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  noun: string;
  minW?: string;
}) {
  const [search, setSearch] = useState("");

  const collection = useMemo(
    () => createListCollection({ items: options }),
    [options],
  );

  const filtered = useMemo(
    () =>
      collection.items.filter(
        (item) =>
          !search || item.label.toLowerCase().includes(search.toLowerCase()),
      ),
    [collection, search],
  );

  return (
    <Combobox.Root
      collection={collection}
      size={{ base: "xs", md: "sm" }}
      w={{ base: "full", md: "auto" }}
      minW={{ md: minW }}
      value={value ? [value] : []}
      onValueChange={(e) => {
        const next = e.value[0] ?? "";
        onChange(next);
        if (!next) setSearch("");
      }}
      onInputValueChange={(e) => setSearch(e.inputValue)}
      positioning={{ sameWidth: true }}
      openOnClick
    >
      <Combobox.Control>
        <Combobox.Input
          placeholder={placeholder}
          bg="bg.input"
          borderColor="border.input"
          borderRadius="md"
        />
        <Combobox.IndicatorGroup>
          {!!value && <Combobox.ClearTrigger />}
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            {filtered.length === 0 ? (
              <Text p={3} fontSize="sm" color="fg.muted">
                No {noun} matching &ldquo;{search}&rdquo;
              </Text>
            ) : (
              filtered.map((item) => (
                <Combobox.Item key={item.value} item={item}>
                  <Combobox.ItemText>{item.label}</Combobox.ItemText>
                </Combobox.Item>
              ))
            )}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}
