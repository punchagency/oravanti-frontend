export const intakeStages = [
  {
    label: "Lead inbox",
    path: "/admin/intake/pipeline/lead-inbox",
    countLabel: "3 leads",
    color: "#8c8f87",
  },
  {
    label: "Conflict check",
    path: "/admin/intake/pipeline/conflict-check",
    countLabel: "2 leads",
    color: "#d18400",
  },
  {
    label: "Questionnaire",
    path: "/admin/intake/pipeline/questionnaire",
    countLabel: "2 leads",
    color: "#377dff",
  },
  {
    label: "Consultation",
    path: "/admin/intake/pipeline/consultation",
    countLabel: "2 leads",
    color: "#6a00c7",
  },
  {
    label: "Fee agreement",
    path: "/admin/intake/pipeline/fee-agreement",
    countLabel: "2 leads",
    color: "#d18400",
  },
  {
    label: "Case opening",
    path: "/admin/intake/pipeline/case-opening",
    countLabel: "2 cases",
    color: "#00a878",
  },
] as const;

export const intakeTabs = [
  ["Lead inbox", "/admin/intake/pipeline/lead-inbox"],
  ["Conflict check", "/admin/intake/pipeline/conflict-check"],
  ["Questionnaire", "/admin/intake/pipeline/questionnaire"],
  ["Consultation & notes", "/admin/intake/pipeline/consultation"],
  ["Fee agreement", "/admin/intake/pipeline/fee-agreement"],
  ["Case opening", "/admin/intake/pipeline/case-opening"],
] as const;

export const leadInboxLeads = [
  {
    name: "Marcus Vance",
    status: "Reviewed",
    email: "marcus.vance@mail.org",
    phone: "+1 (555) 321-4567",
    practiceArea: "Criminal defense",
    practiceTone: "gold",
    addOnActive: false,
    source: "Education flywheel",
    received: "June 1, 2026",
  },
  {
    name: "Sophia Rodriguez",
    status: "Reviewed",
    email: "sophia.rod@gmail.com",
    phone: "+1 (555) 456-7890",
    practiceArea: "Immigration",
    practiceTone: "success",
    addOnActive: true,
    source: "Referral",
    received: "May 31, 2026",
  },
  {
    name: "Linda Sterling",
    status: "New",
    email: "linda@sterlingcorp.com",
    phone: "+1 (555) 987-6543",
    practiceArea: "Business",
    practiceTone: "neutral",
    addOnActive: false,
    source: "Direct",
    received: "May 30, 2026",
  },
] as const;

export const leadSources = [
  "Education flywheel",
  "Referral",
  "Direct",
  "Walk in",
  "Phone enquiry",
  "Client portal",
] as const;
export const leadStatuses = ["New", "Reviewed", "Archived"] as const;
