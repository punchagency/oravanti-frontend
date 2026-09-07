import { Badge, Box, HStack, Stack, Text, Wrap } from "@chakra-ui/react";
import { X } from "lucide-react";

import { FormSelect } from "@/components/ui/form-select";
import { usePracticeAreas } from "@/hooks/use-platform";

/**
 * Which practice areas a form is for, picked when the form is named.
 *
 * ─── Why an area and not a matter type ──────────────────────────────────────
 *
 * Somebody naming a form knows the practice area immediately — it is why they
 * are adding it — and does not yet know which of the 150 matter types under
 * Immigration will file the thing. That second decision belongs on the matter
 * type's own page, where the rest of its filing package is visible, and it must
 * not be inferred from this one: turning "Immigration" into 150 filing-package
 * rows would put the form on every matter opened afterwards.
 *
 * So this writes `form_practice_areas` and never `case_type_forms`. The Forms
 * list reads the union of the two — what a form says it is *for*, and what
 * actually files it — because the second is empty for exactly as long as a form
 * is new, which is when somebody is most likely to be looking for it.
 *
 * ─── Why several, and not one ───────────────────────────────────────────────
 *
 * A *single* owning area would be a lie the catalogue then has to maintain: the
 * I-864 is filed on a family-based adjustment and on an employment-based one,
 * the I-693 on both of those and on asylum. Rows, not a column, and nothing
 * anywhere reads the first of them.
 *
 * Leaving it empty is fine. A form nobody has classified yet shows on the list
 * as "Not used by any matter type yet", which is honest rather than hidden.
 */
export type PickedArea = { id: string; name: string };

export function FiledOnPicker({
  picked,
  onChange,
}: {
  picked: PickedArea[];
  onChange: (next: PickedArea[]) => void;
}) {
  // Eight rows, and the only level of the taxonomy small enough to show whole.
  const { data: areas } = usePracticeAreas({ limit: 100 });

  const add = (areaId: string) => {
    const area = areas?.data.find((a) => a.id === areaId);
    if (!area || picked.some((p) => p.id === areaId)) return;
    onChange([...picked, { id: area.id, name: area.name }]);
  };

  return (
    <Stack gap={2.5}>
      <Box>
        <Text fontSize="12px" fontWeight="500" mb={1}>
          What kind of work is this form for? (optional)
        </Text>
        <Text fontSize="11px" color="fg.muted" lineHeight="16px">
          Pick one or more practice areas, so the form shows up under them on
          the Forms page. Choosing which matters actually open with it is a
          separate step, on the matter type&rsquo;s own page.
        </Text>
      </Box>

      <FormSelect
        size="sm"
        ariaLabel="Practice area"
        /*
          Never holds a value: choosing is what adds a chip below, and a select
          still showing the last pick would read as "this one is selected"
          beside a list where it already is.
        */
        value=""
        onChange={add}
        placeholder="Add a practice area"
        options={(areas?.data ?? [])
          .filter((area) => !picked.some((p) => p.id === area.id))
          .map((area) => ({ value: area.id, label: area.name }))}
      />

      {picked.length > 0 && (
        <Wrap gap={1.5}>
          {picked.map((area) => (
            <Badge
              key={area.id}
              size="sm"
              variant="surface"
              cursor="pointer"
              onClick={() => onChange(picked.filter((p) => p.id !== area.id))}
              title={`Remove ${area.name}`}
            >
              <HStack gap={1}>
                <Text as="span" fontSize="11px">
                  {area.name}
                </Text>
                <X size={11} />
              </HStack>
            </Badge>
          ))}
        </Wrap>
      )}
    </Stack>
  );
}
