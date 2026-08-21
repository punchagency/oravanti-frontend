import { Combobox, Portal, Text, createListCollection } from "@chakra-ui/react";
import { useMemo, useState } from "react";

type FacetItem = { value: string; label: string };

/** One searchable single-select filter combobox, shared by the audit
 * trail's domain/category/action filters — they were three near-identical
 * blocks (each with its own search state and inline filter) before. */
export function FacetCombobox({
  items,
  value,
  onChange,
  placeholder,
  noMatchLabel,
  minW,
}: {
  items: FacetItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  noMatchLabel: (search: string) => string;
  minW?: { md?: string };
}) {
  const [search, setSearch] = useState("");
  const collection = useMemo(() => createListCollection({ items }), [items]);
  const filtered = useMemo(
    () =>
      search
        ? collection.items.filter((item) =>
            item.label.toLowerCase().includes(search.toLowerCase()),
          )
        : collection.items,
    [collection, search],
  );

  return (
    <Combobox.Root
      collection={collection}
      size={{ base: "xs", md: "sm" }}
      w={{ base: "full", md: "auto" }}
      minW={minW}
      value={[value]}
      onValueChange={(e) => {
        const val = e.value[0] ?? "";
        onChange(val);
        if (!val) setSearch("");
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
                {noMatchLabel(search)}
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
