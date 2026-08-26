import { useAssignableStaff } from "@/hooks/use-tasks";
import {
  SearchableSelect,
  type SearchableOption,
} from "@/components/ui/searchable-select";
import { Text } from "@chakra-ui/react";
import { useMemo } from "react";

/**
 * Picks who holds a task, from the people who are actually allowed to.
 *
 * Not `StaffSelect`: that searches the whole firm, which is the wrong pool for
 * a case task. A case's work stays on the team the case is assigned to, and
 * offering someone the backend will then refuse is worse than not offering them.
 * The pool comes from the task itself, so this component never has to know
 * whether it is looking at a case step or an intake step.
 *
 * The list is a team, not a roster, so it is fetched whole and filtered in the
 * browser — no debounced round trips for a dozen names.
 */
export function TaskAssigneeSelect({
  taskId,
  value,
  onChange,
  enabled = true,
  ariaLabel = "Staff member",
  invalid = false,
  disabled = false,
}: {
  taskId: string;
  value: string;
  onChange: (staffId: string) => void;
  /** Set false to hold the fetch back until the picker is actually reachable. */
  enabled?: boolean;
  ariaLabel?: string;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const { data: staff, isLoading } = useAssignableStaff(taskId, enabled);

  const options = useMemo<SearchableOption[]>(
    () =>
      (staff ?? []).map((person) => ({
        value: person.id,
        label: person.name,
        sublabel: person.role ?? undefined,
      })),
    [staff],
  );

  // Distinguish "still loading" from "the team has nobody" — the second is a
  // real answer, and the fix for it is to put someone on the team.
  if (!isLoading && options.length === 0) {
    return (
      <Text fontSize="12px" color="fg.muted">
        Nobody on this case's team can take this task. Add a member to the team,
        or assign the case to a different one.
      </Text>
    );
  }

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={options}
      loading={isLoading}
      loadingText="Loading team…"
      placeholder="Select who takes this…"
      searchPlaceholder="Search by name…"
      emptyText="No matching team member"
      ariaLabel={ariaLabel}
      invalid={invalid}
      disabled={disabled}
    />
  );
}
