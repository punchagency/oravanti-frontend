import {
  Badge,
  Box,
  Card,
  Flex,
  HStack,
  Progress,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router";

import type { CatalogueFormOverview } from "@/api/platform";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { PlatformPageHeader } from "./page-header";
import {
  useCatalogueForms,
  useTaxonomyCounts,
  usePlatformMe,
  useSystemQuestionnaires,
} from "@/hooks/use-platform";

/**
 * What Oravanti maintains, and what still needs maintaining.
 *
 * Deliberately not a welcome screen. The catalogue's failure mode is silent —
 * a field with no box prints blank, an edition that lapses is rejected at the
 * counter — so the landing page's job is to make both visible before somebody
 * has to go looking. Everything on it is a number that should be going down or
 * a date that should not have passed.
 */
export function PlatformOverviewPage() {
  useDocumentTitle("Oravanti Platform");

  const { data: me } = usePlatformMe();
  /*
    The catalogue's first page, not all of it. The coverage list below is a
    summary — "here is where the wiring is thin" — and its job is to point at
    the Forms page, which is where the whole catalogue lives and is paged.
  */
  const { data: catalogue, isLoading } = useCatalogueForms({ limit: 12 });
  const forms = catalogue?.data;
  const { data: counts } = useTaxonomyCounts();
  const { data: questionnaires } = useSystemQuestionnaires({ limit: 1 });

  const expiring = (forms ?? []).filter(isExpiring);

  return (
    <Box maxW="1100px">
      <PlatformPageHeader
        title={me ? `Hello, ${me.firstName}` : "Platform"}
        description="The forms and questionnaires every firm on the platform works from."
      />

      {/*
        `caseTypesWithForms` rather than `caseTypes`, and the two are far
        apart: the taxonomy has 687 leaves and only a handful file anything.
        Reporting the larger number would say the catalogue is complete when
        the opposite is true.

        The questionnaire count comes from a `limit: 1` page's total. The list
        is paginated, so its length is a page size — asking for one row and
        reading the total is the honest way to get a count out of it.
      */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={3} mb={6}>
        <Tile label="Forms" value={catalogue?.pagination.total} />
        <Tile label="Practice areas" value={counts?.practiceAreas} />
        <Tile label="Case types set up" value={counts?.caseTypesWithForms} />
        <Tile label="Questionnaires" value={questionnaires?.pagination.total} />
      </SimpleGrid>

      {expiring.length > 0 && (
        <Card.Root size="sm" borderColor="border.error" mb={6}>
          <Card.Body>
            <HStack gap={2} mb={2}>
              <Box color="fg.error">
                <AlertTriangle size={15} />
              </Box>
              <Text fontSize="13px" fontWeight="600" color="fg">
                {expiring.length === 1
                  ? "One form's edition is about to lapse"
                  : `${expiring.length} forms' editions are about to lapse`}
              </Text>
            </HStack>
            {/*
              Stated as a consequence, not a status. "Expires soon" invites a
              shrug; "USCIS stops accepting it" is the thing somebody has to
              act on, and the action — a new blank, then a new catalogue — is
              not something this screen can do for them.
            */}
            <Text fontSize="12px" color="fg.muted" lineHeight="17px">
              After the date shown, USCIS stops accepting filings made on that
              edition. Nothing here breaks visibly when it passes: the mappings
              still resolve and the PDF still renders, from a blank that will be
              rejected. Each needs a replacement blank and a fresh field
              catalogue before then.
            </Text>
            <Stack gap={1.5} mt={3}>
              {expiring.map((form) => (
                <HStack key={form.id} gap={2} fontSize="12px">
                  <Text fontFamily="mono" fontWeight="600" minW="60px">
                    {form.formCode}
                  </Text>
                  <Text color="fg.muted">
                    {form.edition?.editionDate} version — can be filed until{" "}
                    <Text as="span" color="fg.error" fontWeight="500">
                      {form.edition?.acceptedUntil}
                    </Text>
                  </Text>
                </HStack>
              ))}
            </Stack>
          </Card.Body>
        </Card.Root>
      )}

      <Text fontSize="14px" fontWeight="600" mb={2}>
        Coverage
      </Text>
      {/* <Text fontSize="12px" color="fg.muted" mb={3} lineHeight="17px">
        How many of each form's fields print into a box on the blank currently
        in force. A field that is short here prints blank, with nothing on the
        rendered PDF to say it was meant to hold something.
      </Text> */}

      {isLoading && (
        <HStack gap={2} py={4}>
          <Spinner size="sm" />
          <Text fontSize="13px" color="fg.muted">
            Loading forms…
          </Text>
        </HStack>
      )}

      {!isLoading && (forms ?? []).length === 0 && (
        <Text fontSize="13px" color="fg.muted" py={4}>
          No forms yet. Add one, then upload its blank PDF.
        </Text>
      )}

      <Stack gap={2}>
        {(forms ?? []).map((form) => (
          <CoverageRow key={form.id} form={form} />
        ))}
      </Stack>
    </Box>
  );
}

/**
 * Inside 60 days of the edition lapsing.
 *
 * 60 rather than 30 because the fix is not a same-week job: it needs the new
 * blank published by USCIS, a field catalogue extracted from it, and every box
 * re-pointed. A month's warning would arrive with the work already late.
 */
const WARN_WITHIN_DAYS = 60;

function isExpiring(form: CatalogueFormOverview) {
  const until = form.edition?.acceptedUntil;
  if (!until) return false;

  const days = (new Date(until).getTime() - Date.now()) / 86_400_000;
  return days <= WARN_WITHIN_DAYS;
}

function CoverageRow({ form }: { form: CatalogueFormOverview }) {
  const { fieldCount, mappedCount } = form;
  const percent = fieldCount === 0 ? 0 : (mappedCount / fieldCount) * 100;
  const unmapped = fieldCount - mappedCount;

  return (
    <Card.Root size="sm" borderColor="border">
      <Card.Body>
        <Link to={`/platform/forms/${form.formCode}`}>
          <Flex justify="space-between" align="center" gap={3} mb={2}>
            <HStack gap={2} minW={0}>
              <Text fontSize="13px" fontWeight="600" fontFamily="mono">
                {form.formCode}
              </Text>
              <Text fontSize="13px" color="fg.muted" truncate>
                {form.title}
              </Text>
            </HStack>
            <HStack gap={2} flexShrink={0}>
              {isExpiring(form) && (
                <Badge size="sm" variant="subtle" colorPalette="red">
                  edition lapsing
                </Badge>
              )}
              <Text
                fontSize="12px"
                color={unmapped > 0 ? "fg.warning" : "fg.muted"}
                fontVariantNumeric="tabular-nums"
              >
                {mappedCount} / {fieldCount}
              </Text>
            </HStack>
          </Flex>

          <Progress.Root
            size="xs"
            value={percent}
            colorPalette={unmapped === 0 ? "green" : "orange"}
          >
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        </Link>
      </Card.Body>
    </Card.Root>
  );
}

function Tile({ label, value }: { label: string; value?: number }) {
  return (
    <Card.Root size="sm" borderColor="border">
      <Card.Body>
        <Text
          fontSize="11px"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="0.04em"
        >
          {label}
        </Text>
        <Text
          fontSize="24px"
          fontWeight="600"
          mt={1}
          fontVariantNumeric="tabular-nums"
        >
          {value ?? "—"}
        </Text>
      </Card.Body>
    </Card.Root>
  );
}
