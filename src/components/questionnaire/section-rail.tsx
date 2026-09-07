import { stickyTop } from "@/components/layout/shared/chrome";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Badge,
  Box,
  Button,
  Flex,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Check, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useMemo, type ReactNode } from "react";

export type RailItem = {
  id: string;
  title: string;
  /**
   * Progress through the entry.
   *
   * Optional, with the required pair below: a rail over a *catalogue* — the
   * questionnaire as it is written, rather than as somebody answered it — has
   * nothing filled in, and "0/12" on every row would read as work nobody has
   * started. Those rails pass `note` instead.
   */
  answered?: number;
  total?: number;
  /**
   * How much of the entry is *required*, and how much of that is in.
   *
   * Separate from the pair above because they answer different questions.
   * "4 of 6" is progress and belongs on every row; "nothing required is
   * missing" is whether the section can be signed off, and it is the one worth
   * a mark. A section with no required questions falls back to the plain
   * count, so an all-optional section can still be finished.
   */
  requiredAnswered?: number;
  requiredTotal?: number;
  /** Shown where the counts would be, for an entry with no progress to report. */
  note?: string;
  /** An extra line under the title, e.g. a form's filing status. */
  meta?: ReactNode;
};

/** Everything required is in — see the note on `requiredTotal`. */
const isComplete = (item: RailItem) => {
  if (item.total === undefined) return false;
  return (item.requiredTotal ?? 0) > 0
    ? item.requiredAnswered === item.requiredTotal
    : item.total > 0 && item.answered === item.total;
};

/** The right-hand line: progress where there is any, the note where there isn't. */
const countText = (item: RailItem) =>
  item.total === undefined ? item.note : `${item.answered}/${item.total}`;

/**
 * The navigator for a questionnaire or a filing package.
 *
 * Shows each entry's filled count rather than a plain list, because the
 * question a person actually has in front of twelve sections or six forms is
 * "what is still missing?" — and a rail that answers it saves opening every one
 * to find out.
 *
 * Shared by the case questionnaire, the Forms tab and the client portal, so all
 * three are recognisably the same object seen from three sides. Rails that
 * drifted apart would make one matter look like three.
 */
export function SectionRail({
  items,
  activeId,
  onSelect,
  collapse,
}: {
  items: RailItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  /**
   * Let the rail be folded away, for a screen whose content wants the width.
   *
   * Only the Forms tab passes it, because only it puts a rendered government
   * page beside the rail — 236px is most of the margin a Letter page has to
   * spare in a split view, and reading the filing is what somebody opened it
   * for. Everywhere else the rail is the navigation and folding it away would
   * only be a control to put it back.
   *
   * The state lives with the caller rather than here: the Forms tab folds it
   * on its own when a document view opens, and a rail holding its own opinion
   * about that would fight it.
   */
  collapse?: { isCollapsed: boolean; onToggle: () => void };
}) {
  /*
    The same list, as one searchable field, for narrow screens.

    A twelve-entry rail stacked above the content pushed the first question off
    the screen, and every move between sections meant scrolling back up past
    the whole list. Collapsing it to one control keeps the work in view; making
    that control searchable is what keeps it usable once a package has more
    entries than anybody wants to scroll through with a thumb.

    The count rides along as the sublabel so the mobile control answers the
    same question the rail does — what is still missing — rather than becoming
    a bare jump menu.
  */
  const options = useMemo(
    () =>
      items.map((item) => ({
        value: item.id,
        label: item.title,
        sublabel: isComplete(item)
          ? `${countText(item)} · done`
          : countText(item),
      })),
    [items],
  );

  return (
    <>
      <Box display={{ base: "block", lg: "none" }} w="full" flexShrink={0}>
        <SearchableSelect
          value={activeId ?? ""}
          onChange={onSelect}
          options={options}
          placeholder="Jump to a section"
          searchPlaceholder="Search sections"
          emptyText="No section matches"
          ariaLabel="Section"
          // There is always a section open, so there is nothing to clear to.
          clearable={false}
        />
      </Box>

      {/* Folded away: one control, in the column the rail vacated, so the way
          back is where the thing that left was. Desktop only — below `lg` the
          rail is already one searchable field. */}
      {collapse?.isCollapsed && (
        <Box
          display={{ base: "none", lg: "block" }}
          flexShrink={0}
          position="sticky"
          top={stickyTop()}
        >
          <IconButton
            aria-label="Show the list"
            size="xs"
            variant="ghost"
            color="fg.muted"
            _hover={{ bg: "bg.emphasized/50", color: "fg" }}
            onClick={collapse.onToggle}
          >
            <PanelLeftOpen size={15} />
          </IconButton>
        </Box>
      )}

      <VStack
        display={{
          base: "none",
          lg: collapse?.isCollapsed ? "none" : "flex",
        }}
        gap={0.5}
        align="stretch"
        w="236px"
        flexShrink={0}
        position="sticky"
        // The shell's top bar is sticky and the page scrolls under it, so a
        // rail pinned at `top: 0` sat behind the bar and lost its first
        // entries. `stickyTop` resolves to the gap alone where there is no bar
        // — the client portal renders this rail with no chrome above it.
        top={stickyTop()}
      >
        {collapse && (
          <Flex justify="flex-end" mb={0.5}>
            <IconButton
              aria-label="Hide the list"
              size="xs"
              variant="ghost"
              color="fg.muted"
              _hover={{ bg: "bg.emphasized/50", color: "fg" }}
              onClick={collapse.onToggle}
            >
              <PanelLeftClose size={15} />
            </IconButton>
          </Flex>
        )}

        {items.map((item) => {
          const isDone = isComplete(item);
          const isActive = item.id === activeId;

          return (
            <Button
              key={item.id}
              variant="plain"
              h="auto"
              px={3}
              py={2.5}
              borderRadius="sm"
              // The rail sits directly on the page, and the page is `bg.subtle`
              // — so a `bg.subtle` hover was invisible. Stepping the emphasized
              // surface by alpha instead lands a real change on any surface, in
              // either mode, without the rail having to know what it is sitting
              // on.
              bg={isActive ? "bg.emphasized" : "transparent"}
              _hover={{ bg: isActive ? "bg.emphasized" : "bg.emphasized/50" }}
              // The surface alone is a few percent of luminance. The amber edge
              // is what makes the current entry findable at a glance, and it is
              // the one colour in the palette that reads the same in both modes,
              // so it carries the state rather than the fill.
              borderLeft="2px solid"
              borderColor={isActive ? "brand.solid" : "transparent"}
              onClick={() => onSelect(item.id)}
            >
              <VStack align="stretch" gap={0.5} w="full" minW={0}>
                <Flex justify="space-between" align="center" gap={2}>
                  <Text
                    fontSize="13px"
                    color={isActive ? "fg" : "fg.muted"}
                    fontWeight={isActive ? "500" : "400"}
                    lineHeight="17px"
                    truncate
                  >
                    {item.title}
                  </Text>
                  <Flex align="center" gap={1} flexShrink={0}>
                    <Text
                      fontSize="11px"
                      color={isDone ? "green.fg" : "fg.muted"}
                      fontVariantNumeric="tabular-nums"
                    >
                      {countText(item)}
                    </Text>
                    {/* The count alone reads as progress; the mark reads as
                        done. Both, because "18/24" on a form whose required
                        fields are all in is finished work that looks
                        unfinished. */}
                    {isDone && (
                      <Flex
                        color="green.fg"
                        aria-label="Nothing required is missing"
                        role="img"
                      >
                        <Check size={13} strokeWidth={2.5} />
                      </Flex>
                    )}
                  </Flex>
                </Flex>
                {item.meta && <Flex justify="flex-start">{item.meta}</Flex>}
              </VStack>
            </Button>
          );
        })}
      </VStack>
    </>
  );
}

/** A form's filing status, sized for the rail's second line. */
export function RailStatusBadge({
  status,
  colorPalette,
}: {
  status: string;
  colorPalette: string;
}) {
  return (
    <Badge size="sm" variant="subtle" colorPalette={colorPalette} fontSize="10px">
      {status}
    </Badge>
  );
}
