import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  Combobox,
  createListCollection,
  HStack,
  Portal,
  Span,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { SearchX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type SearchableOption = {
  value: string;
  label: string;
  sublabel?: string;
};

/**
 * Single-select combobox over `options`, with a debounced query.
 *
 * Built on Chakra's Combobox: it owns the input, popover placement, keyboard
 * navigation and focus management, so this component only decides *which*
 * options are visible.
 *
 * Pass `remote` when the options come from a server query instead: filtering is
 * then left to the backend, the debounced query is reported through
 * `onSearchChange`, and `onOpenChange` lets the caller defer the fetch until
 * the combobox is opened for the first time.
 */
export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder,
  emptyText = "No matches",
  invalid = false,
  disabled = false,
  ariaLabel,
  remote = false,
  loading = false,
  loadingText = "Searching…",
  selectedLabel,
  onSearchChange,
  onOpenChange,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  /** Placeholder while the panel is open; falls back to `placeholder`. */
  searchPlaceholder?: string;
  emptyText?: string;
  invalid?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  /** Options are already filtered by the server — don't filter them again here. */
  remote?: boolean;
  loading?: boolean;
  loadingText?: string;
  /**
   * Display text for the current `value` when it isn't in `options` — a remote
   * search narrows the list, and the selection must survive falling out of it.
   */
  selectedLabel?: string;
  /** Receives the debounced query. Only meaningful with `remote`. */
  onSearchChange?: (query: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const debounced = useDebouncedValue(input, 200);

  const selectedText =
    options.find((o) => o.value === value)?.label ?? selectedLabel ?? "";

  // Chakra restores the selected item's label into the input on select and on
  // reopen. Treating that as a search term would narrow the list to the one
  // thing already chosen, so an input that still reads exactly the selection
  // counts as "no query".
  const query =
    debounced.trim() === selectedText.trim() ? "" : debounced.trim();
  const q = query.toLowerCase();

  const onSearchChangeRef = useRef(onSearchChange);
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
    onOpenChangeRef.current = onOpenChange;
  });

  useEffect(() => {
    onSearchChangeRef.current?.(query);
  }, [query]);

  const visible = useMemo(
    () =>
      remote || !q
        ? options
        : options.filter(
            (o) =>
              o.label.toLowerCase().includes(q) ||
              (o.sublabel?.toLowerCase().includes(q) ?? false),
          ),
    [options, remote, q],
  );

  // Rebuilt only when the visible set changes — Chakra re-indexes the whole
  // list on a fresh collection identity.
  const collection = useMemo(
    () =>
      createListCollection({
        items: visible,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
      }),
    [visible],
  );

  const showEmpty = !loading && visible.length === 0;

  return (
    <Combobox.Root
      collection={collection}
      value={value ? [value] : []}
      onValueChange={(details) => onChange(details.value[0] ?? "")}
      onInputValueChange={(details) => setInput(details.inputValue)}
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open);
        // Seed the query with the current selection on open so an abandoned
        // search from last time can't silently narrow the list, and so the
        // panel opens showing everything.
        if (details.open) setInput(selectedText);
        onOpenChangeRef.current?.(details.open);
      }}
      inputValue={open ? input : selectedText}
      openOnClick
      // "replace" writes the chosen item's label into the input, so the trigger
      // reads back who is selected. The `query` guard above stops that label
      // from being re-used as a search term on the next open.
      selectionBehavior="replace"
      invalid={invalid}
      disabled={disabled}
      positioning={{ sameWidth: true }}
      width="full"
    >
      <Combobox.Control>
        <Combobox.Input
          aria-label={ariaLabel}
          placeholder={open ? (searchPlaceholder ?? placeholder) : placeholder}
          fontSize="13px"
        />
        <Combobox.IndicatorGroup>
          {value ? <Combobox.ClearTrigger /> : null}
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>

      <Portal>
        <Combobox.Positioner>
          <Combobox.Content maxH="260px" overflowY="auto">
            {loading ? (
              <HStack gap="8px" px="10px" py="14px" justify="center">
                <Spinner size="xs" borderWidth="1px" colorPalette="brand" />
                <Span color="fg.muted" fontSize="12px">
                  {loadingText}
                </Span>
              </HStack>
            ) : null}

            {showEmpty ? (
              <Combobox.Empty>
                <Stack align="center" gap="4px" px="10px" py="18px">
                  <Span color="fg.subtle">
                    <SearchX size={18} />
                  </Span>
                  <Text
                    m="0"
                    color="fg.muted"
                    fontSize="12px"
                    textAlign="center"
                  >
                    {query ? `No matches for "${query}"` : emptyText}
                  </Text>
                </Stack>
              </Combobox.Empty>
            ) : null}

            {visible.map((option) => (
              <Combobox.Item key={option.value} item={option}>
                <Stack gap="0" minW="0">
                  <Combobox.ItemText fontSize="13px">
                    {option.label}
                  </Combobox.ItemText>
                  {option.sublabel ? (
                    <Span color="fg.muted" fontSize="11px" truncate>
                      {option.sublabel}
                    </Span>
                  ) : null}
                </Stack>
                <Combobox.ItemIndicator />
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}
