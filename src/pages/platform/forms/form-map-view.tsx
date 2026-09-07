import type { CatalogueField, FormPdfBox } from "@/api/platform";
import {
  compareDomains,
  datumDomain,
  domainLabel,
} from "@/utils/field-domains";
import { useFormMapper, useSetFormPdfMappings } from "@/hooks/use-platform";
import {
  Alert,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Input,
  ScrollArea,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useDebounce } from "@uidotdev/usehooks";
import { useCallback, useMemo, useState } from "react";

import {
  mappingKey,
  mappingTargets,
  parseMappingKey,
  rankFieldKeys,
} from "./pdf-box-matching";
// The component that pulls in pdf.js. The library itself is behind a dynamic
// import inside it, so this static import costs nothing until a page renders.
import { PdfPageCanvas } from "@/components/pdf/page-canvas";
import { PageNav } from "@/components/pdf/page-nav";
import { SplitPanes } from "@/components/pdf/split-panes";

/**
 * Wiring a form by pointing at it.
 *
 * ─── Why this view exists beside PDF boxes ─────────────────────────────────
 *
 * PDF boxes is a list of names — `Pt1Line1_FamilyName`, `Pt1Line2_FamilyName`
 * — and two adjacent boxes on a USCIS form differ by one character. Nothing on
 * that list says what a box asks or where it sits, so an operator wiring one
 * reads the blank in another view and does the join in their head. This is
 * that join, done on screen: the real page with its boxes drawn on it, and the
 * datum picker beside whichever one is clicked.
 *
 * It does not replace the list. The list answers *what is still unwired on
 * this form?*, which is the question that finishes a form; this answers *what
 * is this box?*, which is the question that starts one. Same data, two views.
 *
 * ─── Nothing is suggested into place ───────────────────────────────────────
 *
 * The picker is *ordered* by how much the datum's name looks like the box's,
 * and never pre-filled. `rankFieldKeys` carries the measurement behind that:
 * an auto-mapper was tried against the mappings already made by hand and was
 * wrong more often than right, because a box name gives the shape of a datum
 * and never its owner. A wrong mapping here prints a plausible wrong answer in
 * a right-looking box on every firm's filing, and the first reader who can
 * tell is USCIS.
 *
 * ─── The draft is the whole form, and paging is free ───────────────────────
 *
 * Elsewhere in this tier a draft belongs to the part it was typed in, because
 * the reads are per-part. Here they are not: a page holds boxes from whatever
 * parts print on it, so the draft spans the form and turning a page discards
 * nothing. Saving is still batched — each write invalidates the form, which
 * would refetch and repaint the blank under the cursor on every click.
 */
export function FormMapView({ formCode }: { formCode: string }) {
  const { boxes, blank, fields, mappings, isPending, error } =
    useFormMapper(formCode);
  const save = useSetFormPdfMappings(formCode);

  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  /**
   * What has been changed and not yet saved, keyed by box name.
   *
   * The value is a mapping key — a field key, or `fieldKey::answer` for one
   * option of a choice — or null for a box being emptied. Keyed by box because
   * that is the thing being clicked; the writes go out the other way round.
   */
  const [draft, setDraft] = useState<Record<string, string | null>>({});

  // ─── What is wired now, before the draft is applied ───────────────────────

  /** Box name → the mapping key that claims it. */
  const storedByBox = useMemo(() => {
    const byBox = new Map<string, string>();
    for (const mapping of mappings ?? []) {
      byBox.set(
        mapping.pdfFieldName,
        mappingKey(mapping.fieldKey, mapping.fieldValue),
      );
    }
    return byBox;
  }, [mappings]);

  /**
   * The data printing into more than one box.
   *
   * `setMapping` addresses the *datum*: it clears every row for that field key
   * and answer, then writes the one box it was given. So choosing one of these
   * here would silently delete its siblings — the I-130 asks the date of
   * marriage in Part 2 and again in Part 4, and Part 4 would stop printing
   * with nothing on screen having said so. Those data are shown on their boxes
   * and withheld from the picker; the pairing is made in the form's
   * `field-sources.json`, which is where it can be seen whole.
   */
  const sharedBoxes = useMemo(() => {
    const byKey = new Map<string, string[]>();
    for (const mapping of mappings ?? []) {
      const key = mappingKey(mapping.fieldKey, mapping.fieldValue);
      byKey.set(key, [...(byKey.get(key) ?? []), mapping.pdfFieldName]);
    }
    return new Map([...byKey].filter(([, names]) => names.length > 1));
  }, [mappings]);

  /** Box name → what claims it once the draft is taken into account. */
  const claimedBy = useCallback(
    (boxName: string) =>
      boxName in draft ? draft[boxName] : (storedByBox.get(boxName) ?? null),
    [draft, storedByBox],
  );

  // ─── Every datum this form can offer, once ────────────────────────────────

  /**
   * Everything on the form, so a box's *current* mapping can always be named.
   *
   * Includes the form-local keys, which the picker deliberately does not — a
   * box already pointed at one must still read as what it is rather than as
   * unmapped. See `offerable` for the list a person chooses from.
   */
  const targets = useMemo(() => {
    const byKey = new Map<
      string,
      { field: CatalogueField; value: string | null }
    >();
    for (const field of fields ?? []) {
      for (const target of mappingTargets(field)) {
        byKey.set(mappingKey(field.fieldKey, target.value), target);
      }
    }
    return byKey;
  }, [fields]);

  /**
   * Which field keys carry a shared datum — read off the foreign key, not
   * inferred from the shape of the key.
   *
   * This was `isSharedDatum(fieldKey, formCode)`: a key whose first segment is
   * not the form own code names a datum. That rule was right and lived in two
   * repos, and it is now a column — `form_field_definitions.schema_node_id` is
   * null exactly when the box carries no shared datum. The overlay, the CRM
   * coverage bar and population therefore read one source instead of three
   * copies of one rule.
   */
  const sharedKeys = useMemo(
    () =>
      new Set(
        (fields ?? [])
          .filter((field) => field.schemaNodeId !== null)
          .map((field) => field.fieldKey),
      ),
    [fields],
  );

  /**
   * What a box can be pointed at: the shared data, grouped by domain.
   *
   * Data already printing into several boxes are left out too — see
   * `sharedBoxes` for what choosing one of those would do.
   */
  const offerable = useMemo(
    () =>
      [...targets.entries()]
        .filter(
          ([key]) =>
            sharedKeys.has(parseMappingKey(key).fieldKey) &&
            !sharedBoxes.has(key),
        )
        .map(([key, target]) => ({
          key,
          domain: datumDomain(target.field.fieldKey),
          label: target.value
            ? `${target.field.label} — ${target.value}`
            : target.field.label,
          fieldKey: target.field.fieldKey,
        })),
    [targets, sharedBoxes, sharedKeys],
  );

  /**
   * What a box's colour means, and it is three things rather than two.
   *
   * Extraction gives *every* field a box, so almost every box on a fresh form
   * is "mapped" — and mostly to a key nothing asks, which prints blank. Two
   * states would show such a form as done. So:
   *
   *   wired  — carries a shared datum; prints from the client's answers
   *   blank  — mapped, but only to this form's own name for the box
   *   empty  — no mapping at all
   *
   * Only the first is finished work, and it is the one the counts report.
   */
  const stateOf = useCallback(
    (boxName: string): "wired" | "blank" | "empty" => {
      const claimed = claimedBy(boxName);
      if (claimed === null) return "empty";
      return sharedKeys.has(parseMappingKey(claimed).fieldKey)
        ? "wired"
        : "blank";
    },
    [claimedBy, sharedKeys],
  );

  const boxesByName = useMemo(
    () => new Map((boxes ?? []).map((box) => [box.name, box])),
    [boxes],
  );

  const onThisPage = useMemo(
    () =>
      (boxes ?? [])
        .flatMap((box) =>
          box.placements
            .filter((placement) => placement.page === page)
            .map((placement) => ({ box, placement })),
        )
        // Reading order, which is what "the next one" has to mean: down the
        // page, then across. Widget order on a USCIS blank is not it — the
        // extraction's own docblocks record where the two disagree.
        .sort(
          (a, b) =>
            a.placement.top - b.placement.top ||
            a.placement.left - b.placement.left,
        ),
    [boxes, page],
  );

  const wiredHere = onThisPage.filter(
    ({ box }) => stateOf(box.name) === "wired",
  ).length;

  /**
   * Confirming a datum for the selected box.
   *
   * The selection stays where it is, so the box just turned green can be read
   * against the paper before moving on. Advancing automatically to the next
   * box needing a datum is planned rather than absent — see
   * `.claude/MAPPER-AUTO-ADVANCE-PLAN.md` for why it is not a two-line change.
   */
  const confirm = (key: string | null) => {
    if (!selected) return;
    setDraft((current) => ({ ...current, [selected]: key }));
  };

  const pending = Object.keys(draft).length;

  const commit = async () => {
    /*
      One write per changed box, in the order they were touched. The hook sends
      them sequentially on purpose — two writes reclaiming the same box in
      parallel would race and the loser would look saved.
    */
    type Change = {
      fieldKey: string;
      fieldValue: string | null;
      pdfFieldName: string | null;
    };

    const changes = Object.entries(draft).flatMap<Change>(([boxName, key]) => {
      if (key === null) {
        // Emptying a box is expressed as clearing the datum that held it, so
        // a box that was never wired has nothing to say and writes nothing.
        const was = storedByBox.get(boxName);
        if (!was) return [];
        const { fieldKey, fieldValue } = parseMappingKey(was);
        return [{ fieldKey, fieldValue, pdfFieldName: null }];
      }
      const { fieldKey, fieldValue } = parseMappingKey(key);
      return [{ fieldKey, fieldValue, pdfFieldName: boxName }];
    });

    await save.mutateAsync(changes);
    setDraft({});
  };

  if (isPending) {
    return (
      <Flex justify="center" align="center" py={10} gap={2}>
        <Spinner size="sm" />
        <Text fontSize="13px" color="fg.muted">
          Opening {formCode}…
        </Text>
      </Flex>
    );
  }

  if (error || !blank || !boxes) {
    return (
      <Alert.Root status="info" size="sm">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Description fontSize="12px">
            {error instanceof Error
              ? error.message
              : `${formCode} has no blank on file, so there is nothing to map.`}
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>
    );
  }

  const pagePane = (
    <>
      <PageNav
        page={page}
        pageCount={pageCount}
        onPage={(next) => {
          setPage(next);
          setSelected(null);
        }}
        status={<WiredCount wired={wiredHere} total={onThisPage.length} />}
      />
      <PdfPage
        blank={blank}
        page={page}
        onPageCount={setPageCount}
        boxes={onThisPage}
        selected={selected}
        stateOf={stateOf}
        onSelect={setSelected}
      />
    </>
  );

  const detailPane = (
    <BoxDetail
      formCode={formCode}
      box={selected ? (boxesByName.get(selected) ?? null) : null}
      claimed={selected ? claimedBy(selected) : null}
      targets={targets}
      offerable={offerable}
      sharedBoxes={sharedBoxes}
      onConfirm={confirm}
    />
  );

  return (
    <VStack align="stretch" gap={3}>
      <SplitPanes page={pagePane} detail={detailPane} />

      {pending > 0 && (
        <Flex
          position="sticky"
          bottom="0"
          bg="bg"
          borderTop="1px solid"
          borderColor="border"
          py={3}
          gap={2}
          align="center"
          justify="flex-end"
          flexWrap="wrap"
        >
          <Text fontSize="12px" color="fg.muted" mr="auto">
            {pending} box{pending === 1 ? "" : "es"} changed on {formCode}. This
            changes what every firm prints.
          </Text>
          <Button
            variant="outline"
            borderColor="border"
            size="sm"
            fontSize="12px"
            h="32px"
            onClick={() => setDraft({})}
            disabled={save.isPending}
          >
            Discard
          </Button>
          <Button
            layerStyle="brand-button"
            size="sm"
            fontSize="12px"
            h="32px"
            onClick={commit}
            loading={save.isPending}
          >
            Save {pending} change{pending === 1 ? "" : "s"}
          </Button>
        </Flex>
      )}
    </VStack>
  );
}

// ─── The page, and the boxes drawn over it ──────────────────────────────────

type PlacedBox = {
  box: FormPdfBox;
  placement: { page: number; left: number; top: number; width: number; height: number };
};

/**
 * Three states and no legend: unwired, wired, and the one being looked at.
 *
 * Semantic tokens rather than literals, because this renders in both colour
 * modes and a box that reads as wired in one and unwired in the other is a
 * filing-error generator.
 */
function PdfPage({
  blank,
  page,
  onPageCount,
  boxes,
  selected,
  stateOf,
  onSelect,
}: {
  blank: Blob;
  page: number;
  onPageCount: (count: number) => void;
  boxes: PlacedBox[];
  selected: string | null;
  stateOf: (boxName: string) => BoxState;
  onSelect: (boxName: string) => void;
}) {
  return (
    <PdfPageCanvas
      blank={blank}
      page={page}
      onPageCount={onPageCount}
      overlay={boxes.map(({ box, placement }, index) => {
        const isSelected = box.name === selected;
        const paint = isSelected ? SELECTED_PAINT : PAINT[stateOf(box.name)];

        return (
          <Box
            key={`${box.name}-${index}`}
            as="button"
            aria-label={box.tooltip ?? box.name}
            aria-pressed={isSelected}
            onClick={() => onSelect(box.name)}
            position="absolute"
            left={`${placement.left}%`}
            top={`${placement.top}%`}
            width={`${placement.width}%`}
            height={`${placement.height}%`}
            border="1.5px solid"
            borderColor={paint.border}
            bg={paint.bg}
            borderRadius="2px"
            cursor="pointer"
            transition="background 120ms"
            _hover={{ bg: "blue.solid/25" }}
            _focusVisible={{ outline: "2px solid", outlineColor: "blue.solid" }}
          />
        );
      })}
    />
  );
}

type BoxState = "wired" | "blank" | "empty";

/**
 * The three states, in semantic tokens so both colour modes read the same way.
 *
 * Amber is the one that matters and the one that did not exist before: a box
 * mapped to this form's own name for itself is mapped, and prints nothing. On
 * a freshly extracted I-130 that is 304 boxes of 352, so a two-colour overlay
 * showed the form as almost entirely done.
 */
const PAINT: Record<BoxState, { border: string; bg: string }> = {
  wired: { border: "green.solid", bg: "green.solid/12" },
  blank: { border: "orange.solid", bg: "orange.solid/12" },
  empty: { border: "fg.subtle", bg: "fg.subtle/8" },
};

const SELECTED_PAINT = { border: "blue.solid", bg: "blue.solid/30" };

/**
 * How much of this page will actually print.
 *
 * Counts what carries a datum, not what is mapped: nearly every box on a
 * fresh form is mapped, to a key nothing answers — see `stateOf`. Reported
 * per page rather than per form because it is what the operator is about to
 * work on, and a whole-form number never moves enough to be encouraging.
 */
function WiredCount({ wired, total }: { wired: number; total: number }) {
  return (
    <Text
      fontSize="12px"
      color={total > 0 && wired === total ? "green.fg" : "fg.muted"}
      fontVariantNumeric="tabular-nums"
    >
      {total === 0
        ? "No boxes on this page"
        : wired === total
          ? `All ${total} boxes will print an answer`
          : `${wired} of ${total} boxes will print an answer`}
    </Text>
  );
}

// ─── The pane that says what one box is ─────────────────────────────────────

/** One thing a box can be pointed at. */
type Offerable = {
  key: string;
  domain: string;
  label: string;
  fieldKey: string;
};

/** How many ranked data are offered as one-click buttons above the search. */
const TOP_MATCHES = 3;

/**
 * What this box is, what fills it, and the fastest way to say which datum.
 *
 * ─── Read down, act at the top ─────────────────────────────────────────────
 *
 * The pane is ordered by how often each part is used, not by how the data is
 * shaped. First what USCIS asks in this box — read once, then not again.
 * Then the three best-matching data as buttons, which is the answer most of
 * the time and costs one click. The full list is underneath for the rest.
 *
 * The box's own metadata is a static card rather than something crowding the
 * picker: `form1[0].#subform[0].Pt2Line4a_FamilyName[0]` is worth having and
 * worth having *out of the way* while somebody hunts for a datum.
 *
 * ─── The list holds shared data only ───────────────────────────────────────
 *
 * A form's fields are two populations: the 252 across six forms that name a
 * shared datum, and the 1,530 that keep the name extraction gave them.
 * Population matches on the key, so pointing a box at one of the second kind
 * accomplishes nothing — the box prints blank however complete the client's
 * answers are. They are not offered. A box already pointed at one still says
 * so, under "Prints nothing yet", because that is the state to fix rather than
 * a state to hide.
 *
 * ─── The buttons carry no score ────────────────────────────────────────────
 *
 * They are the top of an ordering, not a confidence. `rankFieldKeys` records
 * the measurement: a box name gives the shape of a datum and never its owner,
 * so a percentage beside these would be a certainty the data does not support.
 * The click count is the same either way.
 */
function BoxDetail({
  formCode,
  box,
  claimed,
  targets,
  offerable,
  sharedBoxes,
  onConfirm,
}: {
  formCode: string;
  box: FormPdfBox | null;
  claimed: string | null;
  targets: Map<string, { field: CatalogueField; value: string | null }>;
  offerable: Offerable[];
  sharedBoxes: Map<string, string[]>;
  onConfirm: (key: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const search = useDebounce(query, 150);

  const tail = box ? leafOf(box.name) : "";

  /** The ordering, computed once per box rather than per group. */
  const ranked = useMemo(() => {
    if (!box) return new Map<string, number>();
    const hint = `${tail} ${box.tooltip ?? ""}`;
    return new Map(
      rankFieldKeys(
        hint,
        offerable.map((option) => option.key),
      ).map((entry, index) => [entry.fieldKey, index]),
    );
  }, [box, tail, offerable]);

  const topMatches = useMemo(
    () =>
      [...ranked.entries()]
        .sort((a, b) => a[1] - b[1])
        .slice(0, TOP_MATCHES)
        .map(([key]) => offerable.find((option) => option.key === key))
        .filter((option): option is Offerable => option !== undefined),
    [ranked, offerable],
  );

  /**
   * The full list, by domain, with the ranked ones first inside each.
   *
   * Ranking *within* a group rather than across it, because the group is the
   * thing being scanned: a person looking under Petitioner wants that domain's
   * best guesses at its top, not the list reshuffled around a match in some
   * other domain.
   */
  const groups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const matching = needle
      ? offerable.filter(
          (option) =>
            option.label.toLowerCase().includes(needle) ||
            option.fieldKey.toLowerCase().includes(needle),
        )
      : offerable;

    const byDomain = new Map<string, Offerable[]>();
    for (const option of matching) {
      byDomain.set(option.domain, [...(byDomain.get(option.domain) ?? []), option]);
    }

    return [...byDomain.entries()]
      .sort(([a], [b]) => compareDomains(a, b))
      .map(([domain, options]) => ({
        domain,
        options: options.sort(
          (a, b) =>
            (ranked.get(a.key) ?? Number.MAX_SAFE_INTEGER) -
              (ranked.get(b.key) ?? Number.MAX_SAFE_INTEGER) ||
            a.label.localeCompare(b.label),
        ),
      }));
  }, [offerable, search, ranked]);

  if (!box) {
    return (
      <VStack align="stretch" gap={2} py={6} px={2}>
        <Text fontSize="13px" fontWeight="500">
          Pick a box on the page
        </Text>
        <Text fontSize="12px" color="fg.muted" lineHeight="18px">
          Every box you can type into on {formCode} is outlined. Green will print
          an answer the client gives. Orange is linked only to this form's own
          name for the box, so it prints blank. Grey is not linked to anything.
        </Text>
      </VStack>
    );
  }

  const shared = claimed ? sharedBoxes.get(claimed) : undefined;
  const current = claimed ? targets.get(claimed) : undefined;
  // Read off the box own field rather than the shape of its key; see
  // `sharedKeys` in the parent for why that rule became a column.
  const isCurrentShared =
    claimed !== null && (targets.get(claimed)?.field.schemaNodeId ?? null) !== null;

  return (
    <VStack align="stretch" gap={4} py={2} px={2}>
      {/* ─── 1. What this box is ─────────────────────────────────────────── */}
      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="md"
        bg="bg.subtle"
        p={3}
      >
        <Text
          fontSize="10px"
          fontWeight="600"
          color="fg.subtle"
          textTransform="uppercase"
          letterSpacing="0.04em"
          mb={1}
        >
          Box on the blank
        </Text>
        <HStack gap={2} flexWrap="wrap" mb={1}>
          <Text fontSize="13px" fontWeight="600">
            {tail}
          </Text>
          {box.kind !== "text" && (
            <Badge size="sm" variant="subtle">
              {box.kind}
            </Badge>
          )}
        </HStack>

        {box.tooltip && (
          <Text fontSize="12px" color="fg.muted" lineHeight="17px" mb={2}>
            {box.tooltip}
          </Text>
        )}

        <Text
          fontSize="10px"
          color="fg.subtle"
          fontFamily="mono"
          overflowWrap="anywhere"
        >
          {box.name}
        </Text>

        {box.kind === "dropdown" && box.options.length > 0 && (
          /*
            Printed verbatim because they are compared verbatim: an answer has
            to match the box's own string, give or take case and whitespace.
            The I-485's "Legally Separated" and the I-130's "Separated" are
            different answers, and half-matching ticks some options and
            silently misses others.
          */
          <Text fontSize="10px" color="fg.subtle" mt={2} lineHeight="15px">
            Accepts only: {box.options.join(" · ")}
          </Text>
        )}
      </Box>

      {/* ─── 2. What fills it now ────────────────────────────────────────── */}
      {shared ? (
        <VStack
          align="stretch"
          gap={1.5}
          border="1px solid"
          borderColor="border"
          borderRadius="md"
          p={3}
        >
          <Text fontSize="12px" fontWeight="600">
            {current?.field.label ?? claimed}
          </Text>
          <Text fontSize="12px" color="fg.muted" lineHeight="17px">
            This answer prints into {shared.length} boxes on {formCode}, so it
            cannot be changed from here — picking one box would clear the
            others. Two fields printing one answer is set on the{" "}
            <Text as="span" fontWeight="500">
              Fields
            </Text>
            , where it can be seen whole.
          </Text>
          <VStack align="stretch" gap={0.5} pt={1}>
            {shared.map((name) => (
              <Text
                key={name}
                fontSize="11px"
                color="fg.subtle"
                overflowWrap="anywhere"
              >
                {leafOf(name)}
              </Text>
            ))}
          </VStack>
        </VStack>
      ) : (
        <>
          <CurrentMapping
            formCode={formCode}
            label={current?.field.label}
            fieldKey={claimed ? parseMappingKey(claimed).fieldKey : null}
            isShared={isCurrentShared}
            onClear={() => onConfirm(null)}
          />

          {/* ─── 3. The top of the ordering, one click each ──────────────── */}
          {topMatches.length > 0 && (
            <VStack align="stretch" gap={1.5}>
              <Text
                fontSize="10px"
                fontWeight="600"
                color="fg.subtle"
                textTransform="uppercase"
                letterSpacing="0.04em"
              >
                Closest by name
              </Text>
              {topMatches.map((option) => (
                <MatchButton
                  key={option.key}
                  option={option}
                  isCurrent={option.key === claimed}
                  onClick={() => onConfirm(option.key)}
                />
              ))}
              <Text fontSize="10px" color="fg.subtle" lineHeight="14px">
                Ordered by how much each name resembles this box. An ordering,
                not a suggestion — check it against the page.
              </Text>
            </VStack>
          )}

          {/* ─── 4. Everything else, by domain ──────────────────────────── */}
          <VStack align="stretch" gap={2}>
            <Text
              fontSize="10px"
              fontWeight="600"
              color="fg.subtle"
              textTransform="uppercase"
              letterSpacing="0.04em"
            >
              All data on {formCode}
            </Text>
            <Input
              size="sm"
              fontSize="12px"
              h="32px"
              placeholder="Filter by name or key…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />

            {groups.length === 0 ? (
              <Text fontSize="12px" color="fg.muted" py={2}>
                {search
                  ? `Nothing on ${formCode} matches "${search}".`
                  : `No box on ${formCode} prints a shared answer yet. Set what a field holds on the Fields view.`}
              </Text>
            ) : (
              <ScrollArea.Root size="xs" maxH="340px">
                <ScrollArea.Viewport>
                  <ScrollArea.Content>
                    <VStack align="stretch" gap={3}>
                      {groups.map((group) => (
                        <VStack key={group.domain} align="stretch" gap={0.5}>
                          <Text
                            fontSize="10px"
                            fontWeight="600"
                            color="fg.muted"
                            textTransform="uppercase"
                            letterSpacing="0.04em"
                            px={1}
                            pb={0.5}
                          >
                            {domainLabel(group.domain)}
                          </Text>
                          {group.options.map((option) => (
                            <OptionRow
                              key={option.key}
                              option={option}
                              isCurrent={option.key === claimed}
                              onClick={() => onConfirm(option.key)}
                            />
                          ))}
                        </VStack>
                      ))}
                    </VStack>
                  </ScrollArea.Content>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar>
                  <ScrollArea.Thumb />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>
            )}
          </VStack>
        </>
      )}
    </VStack>
  );
}

/**
 * What prints into the box today, including when the answer is "nothing".
 *
 * A box mapped only to the form's own name for itself is the state this whole
 * view exists to clear, so it says what that means rather than showing the key
 * and leaving the reader to know.
 */
function CurrentMapping({
  formCode,
  label,
  fieldKey,
  isShared,
  onClear,
}: {
  formCode: string;
  label: string | undefined;
  fieldKey: string | null;
  isShared: boolean;
  onClear: () => void;
}) {
  if (fieldKey === null) {
    return (
      <Text fontSize="12px" color="fg.muted">
        Nothing is mapped to this box.
      </Text>
    );
  }

  if (!isShared) {
    return (
      <VStack align="stretch" gap={1}>
        <Text fontSize="12px" color="orange.fg" fontWeight="500">
          Prints nothing yet
        </Text>
        <Text fontSize="11px" color="fg.muted" lineHeight="16px">
          Mapped to {formCode}'s own name for this box (
          <Text as="span" fontFamily="mono" fontSize="10px">
            {fieldKey}
          </Text>
          ), which nobody is ever asked — so the box prints blank. Choose what
          should go in it below.
        </Text>
      </VStack>
    );
  }

  return (
    <HStack justify="space-between" align="start" gap={2}>
      <VStack align="stretch" gap={0} minW="0">
        <Text fontSize="12px" color="green.fg" fontWeight="500">
          {label ?? fieldKey}
        </Text>
        <Text
          fontSize="10px"
          color="fg.subtle"
          fontFamily="mono"
          overflowWrap="anywhere"
        >
          {fieldKey}
        </Text>
      </VStack>
      <Button
        variant="ghost"
        size="xs"
        h="26px"
        fontSize="11px"
        flexShrink="0"
        onClick={onClear}
      >
        Clear
      </Button>
    </HStack>
  );
}

/** One of the three best-ranked data, as a single click. */
function MatchButton({
  option,
  isCurrent,
  onClick,
}: {
  option: Offerable;
  isCurrent: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      borderColor={isCurrent ? "green.solid" : "border"}
      size="sm"
      h="auto"
      py={2}
      px={3}
      justifyContent="flex-start"
      textAlign="start"
      whiteSpace="normal"
      onClick={onClick}
    >
      <VStack align="stretch" gap={0} minW="0" w="full">
        <Text fontSize="12px" fontWeight="500" overflowWrap="anywhere">
          {option.label}
        </Text>
        <Text
          fontSize="10px"
          color="fg.subtle"
          fontFamily="mono"
          fontWeight="400"
          overflowWrap="anywhere"
        >
          {option.fieldKey}
        </Text>
      </VStack>
    </Button>
  );
}

/** One row of the full list. Same single click as a match button. */
function OptionRow({
  option,
  isCurrent,
  onClick,
}: {
  option: Offerable;
  isCurrent: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      textAlign="start"
      w="full"
      minW="0"
      px={2}
      py={1.5}
      borderRadius="sm"
      bg={isCurrent ? "green.subtle" : undefined}
      cursor="pointer"
      _hover={{ bg: isCurrent ? "green.subtle" : "bg.muted" }}
      _focusVisible={{ outline: "2px solid", outlineColor: "blue.solid" }}
      onClick={onClick}
    >
      <Text fontSize="12px" fontWeight="500" overflowWrap="anywhere">
        {option.label}
      </Text>
      <Text
        fontSize="10px"
        color="fg.subtle"
        fontFamily="mono"
        overflowWrap="anywhere"
      >
        {option.fieldKey}
      </Text>
    </Box>
  );
}

/** `…Pt2Line4a_FamilyName[0]` → `Pt2Line4a_FamilyName`, which is what a person reads. */
const leafOf = (boxName: string) =>
  (boxName.split(".").pop() ?? boxName).replace(/\[\d+\]$/, "");
