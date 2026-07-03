import type { StaffCertification } from "../types";
// ---------------------------------------------------------------------------
// Mock staff list with certification records
// ---------------------------------------------------------------------------

export const mockStaffList: StaffCertification[] = [
  {
    id: "staff-001",
    name: "Sandra Adeyemi",
    role: "attorney",
    active: true,
    certifications: [
      "PI Intake",
      "PI Medical",
      "PI Damages",
      "PI Demand",
      "PI Settlement",
      "PI Litigation",
    ],
  },
  {
    id: "staff-002",
    name: "Dayo Adeleke",
    role: "attorney",
    active: true,
    certifications: [
      "PI Intake",
      "PI Medical",
      "PI Damages",
      "PI Demand",
      "PI Settlement",
      "PI Litigation",
    ],
  },
  {
    id: "staff-003",
    name: "Andre Mensah",
    role: "paralegal",
    active: true,
    certifications: ["PI Intake", "PI Medical"],
  },
  {
    id: "staff-004",
    name: "Tolu Bamidele",
    role: "paralegal",
    active: true,
    certifications: ["PI Intake", "PI Damages", "PI Demand"],
  },
  {
    id: "staff-005",
    name: "Chioma Okafor",
    role: "case_manager",
    active: false,
    certifications: ["PI Intake"],
  },
  {
    id: "staff-006",
    name: "Funmi Lawson",
    role: "paralegal",
    active: true,
    certifications: [],
  },
  {
    id: "staff-007",
    name: "Robert Okafor",
    role: "paralegal",
    active: true,
    certifications: ["PI Intake", "PI Medical", "PI Damages"],
  },
  {
    id: "staff-008",
    name: "Amanda Foster",
    role: "admin",
    active: true,
    certifications: [
      "PI Intake",
      "PI Medical",
      "PI Damages",
      "PI Demand",
      "PI Settlement",
      "PI Litigation",
    ],
  },
];
