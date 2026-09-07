import { Badge, Box, Card, HStack, Stack, Text } from "@chakra-ui/react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

import type { FormFiledOn } from "@/api/platform";

/**
 * Where this form is filed from — the case types whose package names it.
 *
 * ─── Why this is on the form's page at all ──────────────────────────────────
 *
 * Everything else here changes the form for *every firm in the deployment*, and
 * the page otherwise gives no hint of how far that reaches. Renaming a field on
 * the I-864 is a small edit on a family-based adjustment and the same small edit
 * on four employment-based ones; this is the list that says so before the edit
 * rather than after it.
 *
 * It is also the way in. A form has no "add to a practice area" control, because
 * a package belongs to a case type — so each row here is a link to the page that
 * *can* change it, and the only place that can.
 *
 * Read-only for that reason, and grouped by practice area because that is the
 * question being asked: not "which 40 case types", but "which parts of the
 * business does this touch".
 */
export function FiledOn({ rows }: { rows: FormFiledOn[] }) {
  if (rows.length === 0) {
    return (
      <Card.Root size="sm" borderColor="border" mb={4}>
        <Card.Body>
          <Text fontSize="13px" fontWeight="500">
            Not used by any matter type yet
          </Text>
          <Text fontSize="12px" color="fg.muted" mt={1} lineHeight="17px">
            No kind of matter opens with this form, so nobody will ever see it. Add
            it from a matter type’s own page — that is where the list of forms a
            matter starts with lives.
          </Text>
        </Card.Body>
      </Card.Root>
    );
  }

  // Runs, not a group-by: the server orders by practice area, then subcategory,
  // then case type, so the grouping is already in the row order and re-deriving
  // it would be a second opinion about the same thing.
  const areas: { id: string; name: string; rows: FormFiledOn[] }[] = [];
  for (const row of rows) {
    const last = areas.at(-1);
    if (last?.id === row.practiceAreaId) last.rows.push(row);
    else
      areas.push({
        id: row.practiceAreaId,
        name: row.practiceArea,
        rows: [row],
      });
  }

  return (
    <Card.Root size="sm" borderColor="border" mb={4}>
      <Card.Body>
        <HStack justify="space-between" align="baseline" mb={2.5}>
          <Text fontSize="13px" fontWeight="500">
            Filed on
          </Text>
          <Text fontSize="12px" color="fg.muted">
            {rows.length} case {rows.length === 1 ? "type" : "types"} across{" "}
            {areas.length} practice {areas.length === 1 ? "area" : "areas"}
          </Text>
        </HStack>

        <Stack gap={3}>
          {areas.map((area) => (
            <Box key={area.id}>
              <Text
                fontSize="11px"
                fontWeight="600"
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="0.04em"
              >
                {area.name}
              </Text>

              <Stack gap={0.5} mt={1}>
                {area.rows.map((row) => (
                  <Link
                    key={row.caseTypeId}
                    to={`/platform/case-types/${row.caseTypeId}`}
                  >
                    <HStack
                      gap={1.5}
                      py={1}
                      align="center"
                      flexWrap="wrap"
                      _hover={{ color: "fg" }}
                      color="fg.muted"
                    >
                      <Text fontSize="12px">{row.subcategory}</Text>
                      <ChevronRight size={11} />
                      <Text fontSize="12px" color="fg">
                        {row.caseType}
                      </Text>

                      {/* Core or supporting is a property of the package, so it
                          differs per case type — the I-693 is supporting on an
                          adjustment and could be core elsewhere. */}
                      {row.role === "supporting" && (
                        <Badge size="sm" variant="surface" colorPalette="gray">
                          Supporting
                        </Badge>
                      )}

                      {/* An archived case type still names this form. That is
                          the thing worth knowing before editing it, so it is
                          listed and marked rather than filtered out. */}
                      {row.caseTypeStatus === "archived" && (
                        <Badge
                          size="sm"
                          variant="surface"
                          colorPalette="orange"
                        >
                          Archived
                        </Badge>
                      )}
                    </HStack>
                  </Link>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
