import { staffDisplayName, useStaffSearch } from "@/hooks/use-staff-search";
import { useMemo, useState } from "react";
import {
  SearchableSelect,
  type SearchableOption,
} from "@/components/ui/searchable-select";

/**
 * Picks one active staff member by searching the server rather than by loading
 * the whole roster.
 *
 * Nothing is fetched until the panel is opened for the first time, and typing
 * goes through the combobox's own debounce before it reaches the API, so the
 * common case — opening a task menu and never assigning anyone — costs no
 * requests at all.
 */
export function StaffSelect({
  value,
  onChange,
  placeholder = "Search staff to assign…",
  ariaLabel = "Staff member",
  invalid = false,
  disabled = false,
}: {
  value: string;
  onChange: (staffId: string, label: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  // Sticky: once opened, keep the query alive so reopening the panel is instant
  // instead of re-showing the spinner.
  const [hasOpened, setHasOpened] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>();

  const { data: staff, isFetching } = useStaffSearch(search, hasOpened);

  const options = useMemo<SearchableOption[]>(
    () =>
      (staff ?? []).map((member) => ({
        value: member.id,
        label: staffDisplayName(member),
        sublabel:
          member.jobTitle ?? member.orgEmail ?? member.email ?? undefined,
      })),
    [staff],
  );

  return (
    <SearchableSelect
      remote
      value={value}
      selectedLabel={selectedLabel}
      onChange={(staffId) => {
        const label =
          options.find((o) => o.value === staffId)?.label ??
          selectedLabel ??
          "";
        setSelectedLabel(label);
        onChange(staffId, label);
      }}
      options={options}
      loading={isFetching}
      loadingText="Searching staff…"
      placeholder={placeholder}
      searchPlaceholder="Search by name or email…"
      emptyText="No active staff found"
      ariaLabel={ariaLabel}
      invalid={invalid}
      disabled={disabled}
      onSearchChange={setSearch}
      onOpenChange={(open) => {
        if (open) setHasOpened(true);
      }}
    />
  );
}
