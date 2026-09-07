import {
  Badge,
  Box,
  Button,
  Card,
  HStack,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FileText, Pencil, Plus, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import {
  useAddFormEdition,
  useFormEditions,
  useFormImportPlan,
  useImportFormCatalogue,
  useUpdateFormEdition,
  useUploadFormBlank,
} from "@/hooks/use-platform";
import type { FormEdition, ImportPlan } from "@/api/platform";

import { EditionDialog } from "./edition-dialog";
import { ImportPlanSummary } from "./import-plan-summary";

/**
 * A form's editions, and the blank each one is filed on.
 *
 * ─── This is where a form actually comes from now ───────────────────────────
 *
 * A form's fields, its parts, and which box each datum prints into are all read
 * off the blank PDF. That blank used to be a file committed to the repo, which
 * made adding a form — and every new USCIS edition of one already catalogued —
 * a deploy. It is uploaded here instead.
 *
 * ─── Upload and import are two steps on purpose ─────────────────────────────
 *
 * Uploading stores the file and reads its boxes. It changes nothing about the
 * catalogue. **Save the fields** is what writes the field rows and the box
 * mappings, and it is confirmed against a summary that says what will change.
 *
 * The old arrangement got that review from a diff on a committed file, and
 * somebody read it before it reached anyone's matter. Dropping the file is not
 * a reason to drop the review: these rows decide what prints on a statutory
 * form for every firm in the deployment, and uploading the wrong edition is a
 * mistake somebody will make on a Tuesday.
 *
 * ─── …but the second step must always be reachable ──────────────────────────
 *
 * The summary used to live only in this component's state, so leaving the page
 * without confirming stranded a blank the server had already stored and read.
 * Nothing said so: the row showed a PDF, the form kept whatever fields it had,
 * and the only way back was to upload the same file again — which somebody has
 * to first work out is what they need to do.
 *
 * Two things fix it and both are needed. `form_editions.imported_at` makes the
 * half-finished state a fact rather than a guess, so the row can say *Fields
 * not saved*; and `useFormImportPlan` regenerates the summary from the stored
 * blank on demand, so *Read the fields* works on a cold page load.
 */
export function EditionsView({ formCode }: { formCode: string }) {
  const { data: editions, isLoading } = useFormEditions(formCode);
  const [adding, setAdding] = useState(false);

  const addEdition = useAddFormEdition(formCode);

  if (isLoading) {
    return (
      <HStack justify="center" py={10}>
        <Spinner size="sm" />
      </HStack>
    );
  }

  const rows = editions ?? [];

  return (
    <Stack gap={3}>
      <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={2}>
        <Text fontSize="12px" color="fg.muted" lineHeight="17px" maxW="640px">
          Forms are reissued, and an old one gets rejected. So each version is
          kept separately, with the blank PDF it was published as. Everything
          this form knows — its questions, its sections, where each answer
          prints — is read off that PDF.
        </Text>
        <Button
          size="xs"
          variant="outline"
          borderColor="border"
          fontSize="12px"
          h="28px"
          onClick={() => setAdding(true)}
        >
          <Plus size={13} />
          Add a version
        </Button>
      </HStack>

      {rows.length === 0 ? (
        <Card.Root size="sm" borderColor="border">
          <Card.Body>
            <Text fontSize="13px" fontWeight="500">
              No versions yet
            </Text>
            <Text fontSize="12px" color="fg.muted" mt={1} lineHeight="17px">
              Nobody can fill in or print this form until you add a version and
              upload its PDF. Start with the date printed at the bottom of the
              PDF you have.
            </Text>
          </Card.Body>
        </Card.Root>
      ) : (
        rows.map((edition) => (
          <EditionRow
            key={edition.id}
            formCode={formCode}
            edition={edition}
            /*
              Which edition a filing made today would use. Computed here rather
              than sent, because it is the same acceptance-window question the
              server answers and the answer changes at midnight — a flag baked
              into a cached response would be wrong the morning after.
            */
            isInForce={inForce(rows) === edition.id}
          />
        ))
      )}

      <EditionDialog
        formCode={formCode}
        open={adding}
        onOpenChange={setAdding}
        isPending={addEdition.isPending}
        onSubmit={(values) => addEdition.mutateAsync(values)}
      />
    </Stack>
  );
}

/**
 * The edition a filing made *today* would be prepared on.
 *
 * The same rule the server applies, and it is a date question rather than a
 * "latest row" one: an edition USCIS has announced but not yet started
 * accepting is on record with a null end date, and picking that would mark an
 * edition in force months before it is. Where two windows overlap — a grace
 * period — the newer wins, because it is the one still valid when the grace
 * period closes.
 */
function inForce(editions: FormEdition[]) {
  const today = new Date().toISOString().slice(0, 10);
  const accepted = editions.filter(
    (e) =>
      e.acceptedFrom <= today && (e.acceptedUntil === null || e.acceptedUntil >= today),
  );
  // The list arrives newest first, so the first match is the newest accepted.
  return accepted[0]?.id ?? null;
}

function EditionRow({
  formCode,
  edition,
  isInForce,
}: {
  formCode: string;
  edition: FormEdition;
  isInForce: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  /*
    The plan handed back by an upload. Held here only so it appears without a
    second round trip — it is NOT the only way to see one.

    It used to be. Leaving the page dropped it, and there was then no route back
    to a PDF the server had already stored and read: the row said it had a PDF,
    the form kept whatever fields it had, and nothing on any screen said the
    fields in that file had never been saved. *Read the fields* below is the
    other door — the server rebuilds the summary from the stored PDF — and
    `needsFields` is what makes the gap visible before somebody goes looking.
  */
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [editing, setEditing] = useState(false);
  /** Set by *Read the fields*, which re-asks the server for the plan. */
  const [asking, setAsking] = useState(false);

  const { showConfirm } = useConfirmDialog();
  const upload = useUploadFormBlank(formCode);
  const importCatalogue = useImportFormCatalogue(formCode);
  const updateEdition = useUpdateFormEdition(formCode);
  const fetched = useFormImportPlan(formCode, asking ? edition.id : null);

  /*
    Uploaded, and its fields never written. Also true of a *replaced* PDF whose
    fields were not re-read, which is why this compares the two timestamps
    rather than testing one flag — that state is invisible otherwise and it is
    the one where the form prints from a document nobody is looking at.
  */
  const needsFields =
    edition.hasBlank &&
    (edition.importedAt === null ||
      (edition.blankUploadedAt !== null &&
        edition.blankUploadedAt > edition.importedAt));

  const shownPlan = plan ?? fetched.data ?? null;

  const chooseFile = () => fileInput.current?.click();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setAsking(false);
    const result = await upload.mutateAsync({ editionId: edition.id, file });
    // A byte-identical re-upload has no plan, because nothing would change.
    setPlan(result.plan);
  };

  const dismissPlan = () => {
    setPlan(null);
    setAsking(false);
  };

  const confirmImport = () => {
    showConfirm({
      title: "Save these fields?",
      /*
        The consequence, stated where the decision is made. Saving rewrites what
        every firm's Forms tab shows for this form and what every future filing
        prints — and the one thing it does *not* touch is answers already typed
        on a matter, which is the first thing anybody worries about.
      */
      description: `This saves ${shownPlan?.fields ?? 0} fields for ${formCode} and where each one prints, for every firm. Anything you set by hand is left alone, and nothing already filled in on a matter is changed.`,
      confirmLabel: "Save the fields",
      onConfirm: () => {
        importCatalogue.mutate(edition.id, {
          // Cleared on success only: a failure leaves the summary on screen so
          // the retry is one click rather than another upload.
          onSuccess: dismissPlan,
        });
      },
    });
  };

  return (
    <Card.Root size="sm" borderColor={isInForce ? "border.emphasized" : "border"}>
      <Card.Body>
        <Stack gap={2.5}>
          <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={2}>
            <Box>
              <HStack gap={2} flexWrap="wrap">
                <Text fontSize="13px" fontWeight="600" fontFamily="mono">
                  {edition.editionDate}
                </Text>
                {isInForce && (
                  <Badge size="sm" colorPalette="green" variant="subtle">
                    Accepted now
                  </Badge>
                )}
                {!edition.hasBlank && (
                  /*
                    Not an error state — a version is often added months before
                    its PDF exists — but it is the one thing on this row that
                    stops the form working, so it says so plainly.
                  */
                  <Badge size="sm" colorPalette="orange" variant="subtle">
                    No PDF yet
                  </Badge>
                )}
                {needsFields && (
                  /*
                    The half-finished state, which had no way of announcing
                    itself before. Red rather than orange: "no PDF yet" is
                    waiting on the world, this is waiting on the person reading
                    the row, and the form is printing from an older version's
                    fields — or from none — until they act.
                  */
                  <Badge size="sm" colorPalette="red" variant="subtle">
                    Fields not saved
                  </Badge>
                )}
              </HStack>
              {/*
                Said as a sentence rather than as a date range. "Accepted
                2025-01-20 — 2026-09-17" leaves the reader to work out which end
                is which, on a row where getting it backwards means preparing a
                filing on a version that will be rejected.
              */}
              <Text fontSize="12px" color="fg.muted" mt={1} lineHeight="17px">
                Can be filed from {edition.acceptedFrom}
                {edition.acceptedUntil
                  ? ` until ${edition.acceptedUntil}`
                  : ", with no end date announced"}
                {edition.verifiedOn && ` · last checked ${edition.verifiedOn}`}
              </Text>
            </Box>

            <HStack gap={1.5}>
              <Button
                size="xs"
                variant="ghost"
                fontSize="12px"
                h="28px"
                onClick={() => setEditing(true)}
              >
                <Pencil size={12} />
                Edit
              </Button>
              <Button
                size="xs"
                variant="outline"
                borderColor="border"
                fontSize="12px"
                h="28px"
                loading={upload.isPending}
                onClick={chooseFile}
              >
                <Upload size={12} />
                {edition.hasBlank ? "Replace PDF" : "Upload PDF"}
              </Button>
            </HStack>
          </HStack>

          {edition.hasBlank ? (
            <Text fontSize="11px" color="fg.muted" fontFamily="mono">
              {formatBytes(edition.blankBytes)} ·{" "}
              {/* Enough of the checksum to compare two by eye, which is all
                  anybody does with one. */}
              {edition.blankChecksum?.slice(0, 12)}
              {edition.importedAt
                ? ` · fields saved ${new Date(edition.importedAt).toLocaleDateString()}`
                : ""}
            </Text>
          ) : (
            <Text fontSize="12px" color="fg.muted" lineHeight="17px">
              Upload the fillable PDF — the one you can type into. A flat,
              print-only scan has no boxes to read and will be refused.
            </Text>
          )}

          {/*
            The way back into a PDF that was uploaded and left.

            Offered whenever the fields are unsaved and no summary is on screen
            — including on a fresh page load, which is exactly when somebody has
            come back to finish. The summary itself is regenerated by the server
            from the stored PDF, so nothing depends on the browser having kept
            it.
          */}
          {needsFields && !shownPlan && (
            <Box
              borderWidth="1px"
              borderColor="border"
              borderRadius="md"
              bg="bg.subtle"
              p={3}
            >
              <Text fontSize="12px" lineHeight="17px">
                This PDF is stored, but its fields have never been saved — so
                nothing on it can be filled in or printed yet.
              </Text>
              <Button
                mt={2}
                size="xs"
                variant="outline"
                borderColor="border"
                fontSize="12px"
                h="28px"
                loading={fetched.isFetching}
                onClick={() => setAsking(true)}
              >
                <FileText size={12} />
                Read the fields
              </Button>
            </Box>
          )}

          {shownPlan && (
            <ImportPlanSummary
              plan={shownPlan}
              isPending={importCatalogue.isPending}
              onImport={confirmImport}
              onDismiss={dismissPlan}
            />
          )}
        </Stack>
      </Card.Body>

      {/*
        Hidden, and reset on every pick. Without the reset, choosing the same
        file twice — which is exactly what somebody does after fixing a
        download — fires no change event and looks like the button is dead.
      */}
      <input
        ref={fileInput}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void onFile(file).catch(() => {
            // The mutation's own onError has already said what went wrong.
          });
        }}
      />

      <EditionDialog
        formCode={formCode}
        edition={edition}
        open={editing}
        onOpenChange={setEditing}
        isPending={updateEdition.isPending}
        onSubmit={(values) =>
          updateEdition.mutateAsync({
            editionId: edition.id,
            patch: {
              acceptedFrom: values.acceptedFrom,
              acceptedUntil: values.acceptedUntil,
              sourceUrl: values.sourceUrl,
              verifiedOn: values.verifiedOn,
            },
          })
        }
      />
    </Card.Root>
  );
}

const formatBytes = (bytes: number | null) =>
  bytes === null ? "unknown size" : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
