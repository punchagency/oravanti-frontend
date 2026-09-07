import { Box, type BoxProps, Splitter, VStack } from "@chakra-ui/react";
import { useMediaQuery } from "@uidotdev/usehooks";
import type { ReactNode } from "react";

/**
 * A rendered page beside the pane that acts on it.
 *
 * The CRM's mapper and the matter's Forms tab both want this: the document on
 * the left at whatever width is left over, and one pane on the right that says
 * what the thing under the cursor is. Three traps are the reason it is a
 * component rather than a `Splitter` written out twice.
 *
 * ─── Below `md` there is no splitter at all ─────────────────────────────────
 *
 * Not even a vertical one. A splitter divides a *fixed* extent between its
 * panels by giving them percentage flex-basis, so a vertical one inside an auto
 * height has nothing to divide and both panels resolve to zero — a blank
 * screen, which is how this was found. A drag handle is worth nothing on a
 * phone anyway: the page wants all the width there is and the pane under it
 * wants to be scrolled past.
 *
 * ─── The panel is not the scroller ──────────────────────────────────────────
 *
 * Zag writes `overflow: hidden` into each panel's own inline style, along with
 * `flex` and `min-width` from `minSize`, and an inline style beats a class. So
 * `overflow="auto"` on a `Splitter.Panel` reads as applied and silently clips
 * instead. The scrolling lives on a box inside the panel.
 *
 * ─── The gutter is what stops the page flickering ───────────────────────────
 *
 * The width these panes report is what the canvas renders at. If raising a
 * scrollbar narrowed them, a taller render would raise the bar, the narrower
 * width would shorten the render, and the bar would drop again — forever, since
 * each cycle costs a full rasterise. Reserving the gutter makes the width the
 * same with the bar and without.
 */
export function SplitPanes({
  page,
  detail,
  /** Left/right split as percentages. The page gets the larger share. */
  defaultSize = [62, 38],
  height = "78vh",
}: {
  page: ReactNode;
  detail: ReactNode;
  defaultSize?: number[];
  height?: string;
}) {
  /** Chakra's `md`. */
  const isWide = useMediaQuery("(min-width: 48em)");

  if (!isWide) {
    return (
      <VStack align="stretch" gap={4}>
        <Box>{page}</Box>
        <Box borderTop="1px solid" borderColor="border" pt={3}>
          {detail}
        </Box>
      </VStack>
    );
  }

  return (
    <Splitter.Root
      panels={[
        { id: "page", minSize: 30 },
        { id: "detail", minSize: 20 },
      ]}
      defaultSize={defaultSize}
      orientation="horizontal"
      h={height}
    >
      <Splitter.Panel id="page" minW="0">
        <Pane pr={3}>{page}</Pane>
      </Splitter.Panel>

      <Splitter.ResizeTrigger id="page:detail" />

      <Splitter.Panel id="detail" minW="0">
        <Pane pl={3}>{detail}</Pane>
      </Splitter.Panel>
    </Splitter.Root>
  );
}

/** One panel's scrollable interior. See the docblock for why it is not the panel. */
function Pane(props: BoxProps) {
  return (
    <Box
      h="full"
      minW="0"
      overflowY="auto"
      overflowX="hidden"
      scrollbarGutter="stable"
      {...props}
    />
  );
}
