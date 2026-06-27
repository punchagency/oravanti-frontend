import { Box, HStack, Input, Stack, Text, chakra } from "@chakra-ui/react";
import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export type SearchableOption = {
  value: string;
  label: string;
  sublabel?: string;
};

/**
 * Single-select combobox: the trigger opens a panel with a debounced search
 * input that filters options by label/sublabel. Closes on select or outside
 * click.
 */
export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No matches",
  invalid = false,
  disabled = false,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  invalid?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 200);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const q = debounced.trim().toLowerCase();
  const filtered = q
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          (o.sublabel?.toLowerCase().includes(q) ?? false),
      )
    : options;

  return (
    <Box position="relative" ref={containerRef}>
      <chakra.button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() =>
          setOpen((v) => {
            if (!v) {
              setQuery("");
            }
            return !v;
          })
        }
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap="8px"
        w="full"
        minH="36px"
        px="12px"
        border="1px solid"
        borderColor={invalid ? "#ff2d55" : open ? "brand.solid" : "border"}
        borderRadius="7px"
        bg="bg"
        color={selected ? "fg" : "fg.muted"}
        fontSize="13px"
        textAlign="left"
        cursor="pointer"
        _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
      >
        <Box as="span" truncate>
          {selected ? selected.label : placeholder}
        </Box>
        <ChevronDown size={15} />
      </chakra.button>

      {open ? (
        <Box
          position="absolute"
          zIndex={50}
          mt="4px"
          w="full"
          maxH="260px"
          display="flex"
          flexDirection="column"
          border="1px solid"
          borderColor="border"
          borderRadius="8px"
          bg="bg"
          boxShadow="0 12px 32px rgba(0, 0, 0, 0.18)"
          overflow="hidden"
        >
          <HStack
            gap="8px"
            px="10px"
            py="8px"
            borderBottom="1px solid"
            borderColor="border.subtle"
          >
            <Search size={14} color="var(--chakra-colors-fg-muted)" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder={searchPlaceholder}
              h="24px"
              px="0"
              border="none"
              borderRadius="0"
              bg="transparent"
              fontSize="13px"
              _focus={{ boxShadow: "none", outline: "none" }}
              _focusVisible={{ boxShadow: "none", outline: "none" }}
            />
          </HStack>
          <Stack gap="2px" overflowY="auto" p="4px">
            {filtered.length === 0 ? (
              <Box px="10px" py="10px" color="fg.muted" fontSize="12px">
                {emptyText}
              </Box>
            ) : (
              filtered.map((o) => {
                const active = o.value === value;
                return (
                  <chakra.button
                    key={o.value}
                    type="button"
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    gap="8px"
                    w="full"
                    px="10px"
                    py="8px"
                    borderRadius="6px"
                    bg={active ? "bg.subtle" : "transparent"}
                    textAlign="left"
                    _hover={{ bg: "bg.subtle" }}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      setQuery("")
                    }}
                  >
                    <Box minW="0">
                      <Text m="0" fontSize="13px" color="fg" truncate>
                        {o.label}
                      </Text>
                      {o.sublabel ? (
                        <Text m="0" fontSize="11px" color="fg.muted" truncate>
                          {o.sublabel}
                        </Text>
                      ) : null}
                    </Box>
                    {active ? <Check size={14} /> : null}
                  </chakra.button>
                );
              })
            )}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
}
