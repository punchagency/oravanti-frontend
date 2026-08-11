import { useMemo } from "react";
import { useStaffsList, type StaffMemberDTO } from "./use-staff-list";

/**
 * Mirrors the backend's three-way role match (organization.service.ts
 * `listStaffs`). The API projects `role: member.role ?? staff.role`, so an
 * attorney who is also the org owner arrives with role "owner" — a strict
 * `role === "attorney"` check would drop them.
 */
export function hasStaffRole(staff: StaffMemberDTO, role: string) {
  const target = role.toLowerCase();
  return (
    staff.role?.toLowerCase() === target ||
    (staff.jobTitle?.toLowerCase().includes(target) ?? false)
  );
}

/**
 * Active staff for the consultation wizards, plus the attorneys among them.
 *
 * `limit: 1000` is load-bearing: /organization/staffs defaults to 10 rows
 * ordered by createdAt, so without it the pickers only ever see the ten
 * oldest staff members. Keeping the params in one place also means every
 * wizard shares a single React Query cache entry.
 */
export function useConsultationStaff() {
  const { data, isLoading } = useStaffsList({ status: "active", limit: 1000 });

  const allStaff = useMemo(() => data?.data ?? [], [data]);
  const attorneys = useMemo(
    () => allStaff.filter((s) => hasStaffRole(s, "attorney")),
    [allStaff],
  );

  return { allStaff, attorneys, isLoading };
}
