import type { StaffMemberDTO } from "@/hooks/use-staff-list";

export type StaffMember = StaffMemberDTO & {
  name: string;
  caseloadCurrent: number;
  caseloadMax: number;
};

export function toStaffMember(dto: StaffMemberDTO): StaffMember {
  return {
    ...dto,
    name: `${dto.firstName} ${dto.lastName}`,
    caseloadCurrent: 0,
    caseloadMax: dto.maxCaseload ?? 7,
  };
}

export function getStatusBadgeStyles(status: string) {
  switch (status) {
    case "active":
      return { bg: "rgba(29, 158, 117, 0.15)", color: "#1D9E75" };
    case "recertify_required":
      return { bg: "rgba(232, 166, 53, 0.15)", color: "#E8A635" };
    case "on_leave":
      return { bg: "rgba(180, 178, 169, 0.2)", color: "fg.muted" };
    case "pending_invitation":
    case "lead":
      return { bg: "rgba(83, 74, 183, 0.15)", color: "#8B83EC" };
    default:
      return { bg: "bg.muted", color: "fg" };
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Active";
    case "recertify_required":
      return "Recertify required";
    case "on_leave":
      return "On leave";
    case "pending_invitation":
      return "Pending invitation";
    default:
      return status;
  }
}

export function getProgressColor(current: number, max: number) {
  const ratio = current / max;
  if (ratio >= 0.75) return "red.500";
  if (ratio >= 0.5) return "orange.400";
  return "teal.400";
}

export const tabsConfig = [
  { value: "accounts", label: "Staff accounts" },
  { value: "teams", label: "Teams" },
  { value: "certifications", label: "Certifications" },
  { value: "performance", label: "Performance" },
  { value: "time-tracking", label: "Time tracking" },
  { value: "leave", label: "Leave" },
  { value: "invitations", label: "Invitations" },
];
