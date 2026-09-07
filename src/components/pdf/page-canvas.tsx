import { Box, Spinner } from "@chakra-ui/react";
import { useDebounce } from "@uidotdev/usehooks";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * One page of a PDF, rendered so things can be drawn on top of it.
 *
 * ─── Why not the iframe the Blank view uses ─────────────────────────────────
 *
 * `FormPdfPreview` hands the whole file to the browser's own viewer, which is
 * the right answer for reading a 24-page form and the wrong one here: nothing
 * inside that viewer can be positioned against, so there is no way to put a
 * rectangle over box 41. This renders a single page to a canvas we own, which
 * is the entire reason pdf.js is a dependency.
 *
 * ─── Legibility is the whole job, so it is oversampled ──────────────────────
 *
 * A US Letter page is 612pt, which is 816 CSS pixels at 1:1. The left pane of
 * the mapper is rarely that wide, so rendering to fit is rendering at *less*
 * than full size — and the small print on a USCIS form is where the item
 * numbers live. Two things follow, and both matter:
 *
 * - the backing store is scaled by at least `OVERSAMPLE`, never merely by
 *   `devicePixelRatio`. On a 1x display a page drawn at 1x is soft; drawn at 2x
 *   and shown at 1x it is sharp, because the downsample is the browser's and it
 *   is good at it.
 * - the page is laid out at the pane's own width and no wider. There is no
 *   zoom control: the page is read at the size the pane gives it, and the pane
 *   is what a splitter or a browser window makes wide.
 *
 * ─── The document is opened once, not once per page ─────────────────────────
 *
 * Loading is separate from rendering. Paging and resizing re-render; only a new
 * blank re-opens. The first version re-parsed the whole PDF on every page turn
 * and on every tick of a splitter drag, which is most of what made it slow.
 *
 * ─── Renders are cancelled, not awaited ─────────────────────────────────────
 *
 * A click can arrive while the previous page is still painting, and pdf.js
 * throws if a second `render` starts on a canvas mid-render. The outstanding
 * task is cancelled first and its rejection swallowed — that particular failure
 * is the thing working correctly.
 */

/**
 * How many device pixels to draw per CSS pixel, at minimum.
 *
 * 2 is the point where the item numbers on the I-485 are readable at fit-width
 * on an ordinary display. Higher costs memory quadratically for no visible
 * gain: a Letter page at 800 CSS px is already 1600×2070 here.
 */
const OVERSAMPLE = 2;

/**
 * How long the pane has to hold still before the page is re-rasterised.
 *
 * Long enough that a splitter drag costs one render rather than one per frame,
 * short enough that letting go feels like it sharpened immediately. See the
 * width comment below for what the page does in the meantime.
 */
const RESIZE_SETTLE_MS = 180;

type PdfDocument = Awaited<
  ReturnType<typeof import("pdfjs-dist").getDocument>["promise"]
>;

export function PdfPageCanvas({
  /** The blank's bytes. A fresh copy is taken per load — see below. */
  blank,
  /** Zero-based, matching `FormPdfBoxPlacement.page`. */
  page,
  /** How tall the scrolling frame may get. */
  maxH = "68vh",
  /** Told how many pages there turned out to be, once the file is open. */
  onPageCount,
  /** Absolutely-positioned children, in percentages of the rendered page. */
  overlay,
}: {
  blank: Blob;
  page: number;
  maxH?: string;
  onPageCount: (count: number) => void;
  overlay?: ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PdfDocument | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  /**
   * Which page of which document is currently *on* the canvas.
   *
   * Not "is a render running", and the difference is the whole point. A new
   * page has nothing of its own on the canvas — what is there is the last page,
   * and leaving it up would show the wrong page under the right page's overlay
   * — so it wants the spinner. A re-render at a new width has the correct
   * raster still sitting there, stretched, and covering *that* with a loading
   * panel is a flash of blank on every settle of the divider, which is the
   * flicker arriving a second way.
   *
   * Recorded rather than reset, so it is derived from what was drawn instead of
   * from an effect racing the thing that draws. Identity on the document
   * object, so opening a different blank does not read as painted merely
   * because the page number happens to match.
   */
  const [paintedFor, setPaintedFor] = useState<{
    doc: PdfDocument;
    page: number;
  } | null>(null);

  /*
    ─── Measured continuously, re-rendered only when it settles ──────────────

    Width is state rather than a ref because the canvas has to be re-rendered
    at the new size, not merely restretched — a stretched canvas is exactly the
    softness this component exists to avoid. `ResizeObserver` rather than a
    window listener: the splitter moves this pane without the window changing
    at all.

    But the observer fires on every frame of a drag, and a re-render is
    re-rasterising a whole page of a government form. So the render reads a
    *debounced* width. During the drag the canvas keeps its old backing store
    and the browser scales it to the new box, because the element is
    `width: 100%` — the page follows the divider smoothly and goes momentarily
    soft, then one render sharpens it when the divider stops. Nobody is reading
    mid-drag, so that is a good trade.

    ─── The measured element must not be the scrolling one ───────────────────

    Debouncing damps a fast input. It cannot fix a *loop*, and this had one:
    the frame scrolled vertically, so a narrower render made the page taller,
    which raised a scrollbar, which took ~15px off the width, which triggered
    another render, which made it shorter, which dropped the scrollbar. Each
    cycle costs a full rasterise — slower than the debounce window — so nothing
    was ever suppressed and it flickered indefinitely.

    So the measured element (`frameRef`) does not scroll at all. The scrolling
    is one box inside it (`scrollRef`), which is also what `maxH` bounds: its
    scrollbars are drawn inside a width its parent already had, so
    a taller page cannot narrow the thing being measured. That box carries a
    stable scrollbar gutter as well, so the *page* does not shift sideways when
    the page grows a bar.
  */
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const width = useDebounce(measuredWidth, RESIZE_SETTLE_MS);

  const painted = paintedFor?.doc === doc && paintedFor.page === page;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const observer = new ResizeObserver(([entry]) => {
      setMeasuredWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  // ─── Open the file ────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    /*
      Held rather than the document, because teardown belongs to the loading
      task: `destroy()` aborts the request and tears down the worker, which the
      document proxy has no way to do.
    */
    let loading: { destroy: () => Promise<void> } | null = null;

    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        /*
          `getDocument` transfers the buffer it is given, which detaches it — so
          a second open of the same blob would read an empty array. `slice()`
          hands it a copy, which is the cost of keeping the bytes cached in
          TanStack Query rather than re-fetching them.
        */
        const bytes = new Uint8Array(await blank.slice().arrayBuffer());
        const task = pdfjs.getDocument({ data: bytes });
        loading = task;

        const opened = await task.promise;
        if (cancelled) return;

        onPageCount(opened.numPages);
        setDoc(opened);
      } catch (error) {
        if (cancelled) return;
        setFailed(
          error instanceof Error ? error.message : "This form did not open.",
        );
      }
    })();

    return () => {
      cancelled = true;
      void loading?.destroy();
      setDoc(null);
    };
  }, [blank, onPageCount]);

  // ─── Draw one page of it ──────────────────────────────────────────────────

  useEffect(() => {
    if (!doc || width === 0) return;

    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;

    (async () => {
      setFailed(null);
      try {
        const pdfPage = await doc.getPage(
          Math.min(Math.max(page + 1, 1), doc.numPages),
        );
        if (cancelled) return;

        const unscaled = pdfPage.getViewport({ scale: 1 });
        const density = Math.max(window.devicePixelRatio || 1, OVERSAMPLE);
        // `width` is the page's laid-out size; the backing store is that again
        // times the density.
        const viewport = pdfPage.getViewport({
          scale: (width / unscaled.width) * density,
        });

        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        task = pdfPage.render({
          canvas,
          canvasContext: context,
          viewport,
        }) as unknown as typeof task;
        await task!.promise;
        if (!cancelled) setPaintedFor({ doc, page });
      } catch (error) {
        // A cancelled render is this working, not failing.
        if (cancelled || isCancellation(error)) return;
        setFailed(
          error instanceof Error ? error.message : "This page did not render.",
        );

      }
    })();

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, page, width]);

  return (
    /*
      Two boxes, and the split is load-bearing: the outer one is **measured**
      and never scrolls, the inner one **scrolls** and is never measured.

      That is what keeps the render width stable. A scrollbar inside the
      scroller changes the scroller's content width, not this element's, so a
      taller render can no longer narrow the thing that decides how tall to
      render — which is the feedback loop the width comment above describes.
    */
    <Box ref={frameRef} w="full" minW="0" minH="200px">
      <Box
        ref={scrollRef}
        overflow="auto"
        maxH={maxH}
        scrollbarGutter="stable"
      >
        {/*
          The page box. Sized in percent of the scroller so the canvas and the
          overlay are always exactly the same rectangle — the overlay positions
          in percentages and never learns the scale or the density.
        */}
        <Box position="relative" w="full" minH="200px">
          <canvas
            ref={canvasRef}
            style={{ display: "block", width: "100%", height: "auto" }}
          />

          <Box position="absolute" inset="0">
            {overlay}
          </Box>

          {(!painted || failed) && (
            <Box
              position="absolute"
              inset="0"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="bg"
              opacity={failed ? 1 : 0.7}
              fontSize="12px"
              color="fg.muted"
              px={4}
              textAlign="center"
            >
              {failed ?? <Spinner size="sm" />}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

/**
 * pdf.js, loaded the first time a mapper is opened and not before.
 *
 * The library and its worker are together the largest thing this app would
 * ship, and every other route — every firm's whole app — has no use for them.
 * `lazyPage()` already keeps the *page* out of other bundles; this keeps it out
 * of the CRM's other four form views too, and the production build confirms it:
 * pdf.js is its own chunk beside a separate worker asset.
 *
 * The worker is addressed with Vite's `?url`, which emits it as its own file
 * rather than trying to inline a web worker into the module graph.
 */
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

const loadPdfjs = () => {
  pdfjsPromise ??= (async () => {
    const [pdfjs, worker] = await Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return pdfjs;
  })();

  return pdfjsPromise;
};

const isCancellation = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  error.name === "RenderingCancelledException";
