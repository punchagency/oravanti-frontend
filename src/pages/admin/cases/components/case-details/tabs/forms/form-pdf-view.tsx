import type {
  CaseFormField,
  CorrectionColor,
  FormBoxPlacement,
  FormCorrection,
} from "@/api/case-details";
import { getCaseFormPdf } from "@/api/case-details";
import { PdfPageCanvas } from "@/components/pdf/page-canvas";
import { PageNav } from "@/components/pdf/page-nav";
import { SplitPanes } from "@/components/pdf/split-panes";
import { caseDetailKeys, useCaseFormBoxes } from "@/hooks/use-case-details";
import { Alert, Box, Flex, Spinner, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";

import { useObjectUrl } from "@/hooks/use-object-url";
import { MarkPane, MarkedBox } from "./review/mark-pane";

/**
 * The matter's copy of a form, in the two shapes it gets looked at in.
 *
 * ─── Two views, because there are two jobs ──────────────────────────────────
 *
 * **Preview PDF** is for reading. It hands the whole file to the browser's own
 * viewer, which is genuinely the best PDF reader any of us will ship: it
 * scrolls, searches, zooms, prints, and behaves the way the reader already
 * expects. That is what somebody checking a filing against the paper wants.
 *
 * **Review on the form** is for marking. The browser's viewer is a closed
 * surface — nothing outside it knows where it has scrolled or where a box sits
 * on the page — so a mark cannot be drawn on it or clicked in it. That view
 * therefore renders the pages itself, on a canvas, with the marks on top.
 *
 * Neither replaces the other and the tab offers both, for the same reason it
 * offers Edit beside the row's pencil: one is how the thing is read, the other
 * is how one part of it is acted on.
 *
 * ─── Bytes are cached; the object URL is not ────────────────────────────────
 *
 * Filling this document is expensive — the server decrypts the official blank,
 * writes several hundred boxes and re-saves it — so the query holds the *bytes*
 * and is refetched only when something that changes the document is saved. Both
 * views read the same query, so switching between them costs nothing.
 *
 * The object URL cannot be cached with the bytes: it is a live handle into this
 * tab's memory that must be revoked when the viewer goes away, or every form
 * opened leaks a megabyte for the life of the tab — and a revoked URL in the
 * cache would hand the next reader a blank frame. So it is made and revoked by
 * the view that needs one, which is the iframe.
 *
 * ─── Why the fallback lives here ────────────────────────────────────────────
 *
 * Because "no PDF" is a normal state rather than a failure: a blank may not be
 * on file, or its boxes may not be mapped. Each view decides between the
 * document and the fallback from *the current query alone*, which is what keeps
 * it honest when someone switches forms. An earlier version reported the reason
 * upward and let the parent hold it in state — and that state outlived the form
 * it described, so one form's explanation was shown over another, and a form
 * that did have a PDF never got the chance to render it.
 */
function useFormPdf(caseId: string, formCode: string) {
  return useQuery({
    queryKey: caseDetailKeys.formPdf(caseId, formCode),
    queryFn: () => getCaseFormPdf(caseId, formCode),
    // Held until something that changes the document is saved, which the
    // mutations that do so invalidate. See the note above on what that buys.
    staleTime: Infinity,
    // Most forms legitimately have no PDF. Retrying three times to be told so
    // again only delays the fallback.
    retry: false,
  });
}

function Preparing({ formCode }: { formCode: string }) {
  return (
    <Flex justify="center" align="center" py={10} gap={2}>
      <Spinner size="sm" />
      <Text fontSize="13px" color="fg.muted">
        Preparing {formCode}…
      </Text>
    </Flex>
  );
}

function NoPdf({ error, fallback }: { error: unknown; fallback: ReactNode }) {
  return (
    <>
      <Alert.Root status="info" size="sm" mb={4}>
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Description fontSize="12px">
            {error instanceof Error
              ? error.message
              : "This form has no filled PDF yet."}{" "}
            Showing the form's answers instead.
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>
      {fallback}
    </>
  );
}

/**
 * The document as it prints, in the browser's own viewer.
 *
 * An `iframe` over a blob URL rather than a `src` on the endpoint: the request
 * needs the app's cookies and tenant headers, so it goes through the same axios
 * instance as everything else and the bytes are handed to the viewer.
 */
export function FormPdfPreview({
  caseId,
  formCode,
  fallback,
}: {
  caseId: string;
  formCode: string;
  /** What to show instead when this form has no filled PDF. */
  fallback: ReactNode;
}) {
  const { data, isPending, isError, error } = useFormPdf(caseId, formCode);
  const url = useObjectUrl(data?.blob);

  if (isPending) return <Preparing formCode={formCode} />;
  if (isError || !url || !data) {
    return <NoPdf error={error} fallback={fallback} />;
  }

  return (
    <Box>
      <Box
        as="iframe"
        // @ts-expect-error — Chakra's Box passes unknown props through to the
        // element, but its prop types do not include iframe attributes.
        src={url}
        title={`${formCode} as filed`}
        w="full"
        h={{ base: "60vh", lg: "78vh" }}
        border="1px solid"
        borderColor="border"
        borderRadius="md"
        bg="bg.subtle"
      />

      {/* What actually reached the page. A form can render beautifully and
          still be missing half its answers, and that is worth knowing before
          anybody signs it. */}
      <Text fontSize="11px" color="fg.subtle" mt={1.5}>
        {data.written} of {data.mapped} mapped{" "}
        {data.mapped === 1 ? "box" : "boxes"} filled from this matter's answers
      </Text>
    </Box>
  );
}

/**
 * The same document, page by page, with the attorney's marks on the boxes.
 *
 * ─── Only marked boxes are outlined ─────────────────────────────────────────
 *
 * Every mapped box *could* be outlined, and on the I-485 that is 400 rectangles
 * over a document somebody is proofreading against the paper. The page is the
 * thing being read; the marks are the annotation. So a box shows an outline
 * when it carries a mark, and otherwise only under the cursor — which is enough
 * to find one, because the person hunting for a box already knows where on the
 * page they are looking.
 */
export function FormReviewView({
  caseId,
  formCode,
  fields,
  corrections = [],
  canMark = false,
  isMarking = false,
  onMarkField,
  onComment,
  fallback,
}: {
  caseId: string;
  formCode: string;
  /** Every field on the form, for the label a box is named by. */
  fields: CaseFormField[];
  /** Every mark on *this* form. The tab filters the package's list down. */
  corrections?: FormCorrection[];
  /** Whether the viewer may raise a mark. Attorneys only, answered by the server. */
  canMark?: boolean;
  isMarking?: boolean;
  /**
   * Raise a mark on one box, from the page.
   *
   * The only way a mark is raised anywhere in the app: a review is reading the
   * filing as it prints and saying what is wrong with what you are looking at,
   * and the field list is where somebody *fixes* it afterwards.
   */
  onMarkField?: (
    field: CaseFormField,
    input: { color: CorrectionColor; note: string },
  ) => void;
  onComment?: (correction: FormCorrection, body: string) => void;
  /** What to show instead when this form has no filled PDF. */
  fallback: ReactNode;
}) {
  const { data, isPending, isError, error } = useFormPdf(caseId, formCode);
  const boxes = useCaseFormBoxes(caseId, formCode);

  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  const fieldByKey = useMemo(
    () => new Map(fields.map((field) => [field.fieldKey, field])),
    [fields],
  );

  /**
   * Every rectangle on the page being shown, with the field it belongs to.
   *
   * Flattened rather than grouped: a datum printing into two boxes is two
   * targets on the paper and one field in the pane, which is what a reader
   * wants either way round.
   */
  const onThisPage = useMemo(() => {
    const placed: { fieldKey: string; placement: FormBoxPlacement }[] = [];
    for (const field of boxes.data ?? []) {
      // A mapping whose datum is not on this form's field list has nothing to
      // name it with, so it cannot be marked and is not drawn.
      if (!fieldByKey.has(field.fieldKey)) continue;
      for (const placement of field.placements) {
        if (placement.page === page) {
          placed.push({ fieldKey: field.fieldKey, placement });
        }
      }
    }
    return placed;
  }, [boxes.data, page, fieldByKey]);

  /** Field key → the marks on it, open ones first. */
  const marksByField = useMemo(() => {
    const byField = new Map<string, FormCorrection[]>();
    for (const correction of corrections) {
      if (!correction.fieldKey) continue;
      byField.set(correction.fieldKey, [
        ...(byField.get(correction.fieldKey) ?? []),
        correction,
      ]);
    }
    for (const list of byField.values()) {
      list.sort(
        (a, b) => Number(b.status === "open") - Number(a.status === "open"),
      );
    }
    return byField;
  }, [corrections]);

  if (isPending) return <Preparing formCode={formCode} />;
  if (isError || !data) return <NoPdf error={error} fallback={fallback} />;

  const pagePane = (
    <>
      <PageNav
        page={page}
        pageCount={pageCount}
        onPage={setPage}
        status={
          <Text
            fontSize="12px"
            color="fg.muted"
            fontVariantNumeric="tabular-nums"
          >
            {data.written} of {data.mapped} filled from this matter
          </Text>
        }
      />

      <PdfPageCanvas
        blank={data.blob}
        page={page}
        onPageCount={setPageCount}
        overlay={onThisPage.map(({ fieldKey, placement }, index) => (
          <MarkedBox
            // A datum can print into the same page twice, so the key needs the
            // rectangle as well as the field.
            key={`${fieldKey}:${index}`}
            placement={placement}
            marks={marksByField.get(fieldKey) ?? []}
            isSelected={selected === fieldKey}
            label={fieldByKey.get(fieldKey)?.label ?? fieldKey}
            onSelect={() => setSelected(fieldKey)}
          />
        ))}
      />
    </>
  );

  const detailPane = (
    <MarkPane
      field={selected ? (fieldByKey.get(selected) ?? null) : null}
      marks={selected ? (marksByField.get(selected) ?? []) : []}
      allMarks={corrections}
      canMark={canMark}
      isMarking={isMarking}
      hasGeometry={(boxes.data?.length ?? 0) > 0}
      onMark={(input) => {
        const field = selected ? fieldByKey.get(selected) : null;
        if (field) onMarkField?.(field, input);
      }}
      onComment={onComment}
      onSelect={(fieldKey) => {
        setSelected(fieldKey);
        const first = (boxes.data ?? []).find((f) => f.fieldKey === fieldKey)
          ?.placements[0];
        if (first) setPage(first.page);
      }}
    />
  );

  return <SplitPanes page={pagePane} detail={detailPane} />;
}
