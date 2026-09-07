import { Box, Flex, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { SearchableSelect } from "@/components/ui/searchable-select";

export type PartOption = {
  /** The part's label, or `UNLABELLED_PART` — see `part-address.ts`. */
  value: string;
  label: string;
  /** How much of the part is done, in the terms of whichever view is open. */
  sublabel?: string;
};

/**
 * Which part of a form is on screen.
 *
 * ─── One part at a time, everywhere ─────────────────────────────────────────
 *
 * A form is not thirty fields — the I-485 is 512 across fourteen parts, the
 * I-130 352. Both tiers used to render every part as a collapsible section,
 * which meant the page still knew about all of them: the whole form was
 * fetched, and the accordion's job was to keep them from mounting.
 *
 * A part is what a screen shows now. The picker is the same control the Forms
 * tab has always used on a narrow screen — one searchable field, the count
 * riding along as the sublabel — because that control was already the answer to
 * "twelve entries and no room for a rail", and a form's parts are the same
 * problem seen from one level down.
 *
 * In the CRM a part is also what is *fetched*: `?part=` on each of the three
 * reads, because a catalogue read is 512 field definitions and their wiring.
 * The firm's tab still reads a matter's form whole — the values are what it
 * came for and they arrive with the form — so there the picker bounds what
 * mounts rather than what is asked for.
 *
 * The sublabel is what makes it a navigator rather than a jump menu: "18 of 96
 * sourced" across the list is how somebody finds the part still needing work
 * without opening each one. It is the view's own count, because the three views
 * ask three different questions of the same part.
 */
export function PartSelect({
  options,
  value,
  onChange,
  disabled = false,
  label = "Form Part",
  actions,
}: {
  options: PartOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** The word in front of the control. "Part" everywhere so far. */
  label?: string;
  /**
   * What acts on the parts themselves — Add, Rename.
   *
   * Only the CRM passes any: a firm reads a form's parts and does not name
   * them. They sit on the label row rather than beside the control so the
   * picker keeps its full width, which is what it needs on a phone.
   */
  actions?: ReactNode;
}) {
  if (options.length === 0 && !actions) return null;

  return (
    <Flex gap={2} mb={3}  direction={"column"}>
      <Flex align="center" justify="space-between" gap={2} flexWrap="wrap">
        <Text
          fontSize="11px"
          color="fg.subtle"
          textTransform="uppercase"
          letterSpacing="0.04em"
          flexShrink={0}
        >
          {label}
        </Text>
        {actions}
      </Flex>
      <Box flex="1" minW={0}>
        <SearchableSelect
          value={value}
          onChange={onChange}
          options={options}
          disabled={disabled}
          placeholder="Choose a part"
          searchPlaceholder="Search parts"
          emptyText="No part matches"
          ariaLabel="Part of the form"
          // There is always a part open, so there is nothing to clear to.
          clearable={false}
        />
      </Box>
    </Flex>
  );
}

