import { useDebounce } from "@uidotdev/usehooks";
import {
  Combobox,
  createListCollection,
  HStack,
  Portal,
  ScrollArea,
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
  /**
   * Optional heading this option sits under. Options carrying one are grouped
   * in the order the groups first appear, so the *caller's* ordering decides
   * the headings' order — the list is not re-sorted here.
   *
   * All-or-nothing per list: if no option has a group the rows render flat,
   * exactly as they did before this existed. Mixing is allowed and ungrouped
   * options keep their position, which is what lets a long tail sit under the
   * named groups without a heading of its own.
   */
  group?: string;
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
  clearable = true,
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
  /**
   * Whether the selection can be cleared back to nothing.
   *
   * On by default, and right wherever "none" is a real answer — an optional
   * filter, an unassigned field. Turn it off where it is not: a navigator that
   * always has somewhere to be has nothing to clear to, and offering the ×
   * offers a state the screen cannot render.
   */
  clearable?: boolean;
  /** Receives the debounced query. Only meaningful with `remote`. */
  onSearchChange?: (query: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  /*
    The typed text, and the term the list is actually filtered by.

    Two values on purpose. `input` is what the control shows and must follow
    every keystroke; `debounced` is what the filter runs on, and it settles
    200ms after typing stops. On the lists this is built for — every question
    that could feed a form field, every box on a blank — filtering per keystroke
    is a pass over a few hundred strings *plus* a rebuilt collection that Ark
    re-indexes, on every letter.

    `useDebounce` is the same hook the paged lists use for their search boxes,
    so a debounced search behaves identically wherever it appears.
  */
  const debounced = useDebounce(input, 200);

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

  /*
    The rows, built only when the visible set changes.

    Debouncing settles what is *filtered*, not what is *rendered*: every
    keystroke still sets `input`, which re-renders this component, and building
    the rows inline meant rebuilding a few hundred elements for React to
    reconcile on each letter — while the list itself had not changed. Held as
    elements instead, the same array comes back and React skips the subtree.

    Nothing here closes over a value that changes between renders, so the
    memo cannot go stale: a row is a function of its option alone, and the
    selected state comes from `Combobox.Root` through context.
  */
  const items = useMemo(() => {
    const row = (option: SearchableOption) => (
      <Combobox.Item key={option.value} item={option}>
        <Stack gap="0" minW="0">
          {/*
            `overflowWrap: anywhere` rather than plain wrapping, because half
            the labels these lists carry are identifiers — a field key like
            `beneficiary.address_history[1].street` has no spaces in it, so
            normal wrapping cannot break it anywhere. Without this its
            min-content width is the whole string: the row refuses to shrink,
            the panel overflows its own width, and the list grows a
            horizontal scrollbar (and drags the column it sits in wider with
            it). Breaking mid-token is not pretty; a list you have to scroll
            sideways to read is worse.
          */}
          <Combobox.ItemText fontSize="13px" overflowWrap="anywhere">
            {option.label}
          </Combobox.ItemText>
          {option.sublabel ? (
            <Span color="fg.muted" fontSize="11px" truncate>
              {option.sublabel}
            </Span>
          ) : null}
        </Stack>
        <Combobox.ItemIndicator flexShrink="0" />
      </Combobox.Item>
    );

    if (!visible.some((option) => option.group)) return visible.map(row);

    /*
      Runs of consecutive options sharing a group, not a bucketing by name: the
      caller has already ordered the list and re-grouping would silently
      reorder it. A group that appears twice therefore renders twice, which is
      the honest rendering of a list that was handed over that way.
    */
    const runs: { group?: string; options: SearchableOption[] }[] = [];
    for (const option of visible) {
      const last = runs[runs.length - 1];
      if (last && last.group === option.group) last.options.push(option);
      else runs.push({ group: option.group, options: [option] });
    }

    return runs.map((run, index) => (
      <Combobox.ItemGroup key={`${run.group ?? ""}-${index}`}>
        {run.group ? (
          <Combobox.ItemGroupLabel
            color="fg.muted"
            fontSize="11px"
            fontWeight="500"
            letterSpacing="0.02em"
            textTransform="uppercase"
          >
            {run.group}
          </Combobox.ItemGroupLabel>
        ) : null}
        {run.options.map(row)}
      </Combobox.ItemGroup>
    ));
  }, [visible]);

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
      // The panel is built when it is first opened and torn down when it
      // closes. A screen can hold hundreds of these — a form catalogued from
      // its blank has one per box — and an always-mounted list of several
      // hundred items each is what makes such a screen stop responding.
      lazyMount
      unmountOnExit
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
          {clearable && value ? <Combobox.ClearTrigger /> : null}
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>

      <Portal>
        <Combobox.Positioner>
          {/*
            The panel scrolls through Chakra's ScrollArea rather than the
            browser's own overflow.

            Some of these lists run to a couple of hundred entries — every
            question that could feed a form field, every box on a blank — so the
            panel is scrolled far more often than not. A native bar is the
            platform's: a different width, colour and behaviour on each one, no
            part in the theme, and on Windows a grey channel sitting inside the
            panel's rounded corner. The overlay bar is the same object
            everywhere and fades away when nothing is being scrolled.

            The padding moves off Content and onto the viewport so the bar runs
            the panel's full height rather than starting below its first row of
            padding. Ark scrolls the highlighted item into view with
            `scrollIntoView`, which walks up to the nearest scrollable ancestor
            — the viewport — so arrow-key navigation is unaffected.

            The height cap goes on the **viewport**, which is the element Ark
            gives `overflow: auto`. Capping the root instead looks identical
            until the list is long: the root's height is `100%` of a panel that
            sizes to its content, so the viewport grows to the full list and the
            root simply clips it — everything past the 260th pixel becomes
            unreachable rather than scrollable.
          */}
          <Combobox.Content p="0" overflow="hidden">
            <ScrollArea.Root size="xs">
              {/*
                Vertically only. The panel is already sized to the trigger
                (`sameWidth`), so anything wide enough to scroll sideways is a
                row that failed to wrap — which is a bug to fix in the row, not
                a direction to let the reader scroll in.
              */}
              <ScrollArea.Viewport maxH="260px" p="4px" overflowX="hidden">
                <ScrollArea.Content>
                  {loading ? (
                    <HStack gap="8px" px="10px" py="14px" justify="center">
                      <Spinner
                        size="xs"
                        borderWidth="1px"
                        colorPalette="brand"
                      />
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

                  {items}
                </ScrollArea.Content>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar>
                <ScrollArea.Thumb />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}
