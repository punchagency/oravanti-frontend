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

export const conflictReviews = [
  {
    name: "Liam Gallagher",
    practiceArea: "Family law",
    practiceTone: "neutral",
    addOnActive: false,
    received: "May 25, 2026",
    statusLabel: "Cleared & Approved",
    statusTone: "success",
    matterFocus: "Prenuptial agreement counsel.",
    outcome: "Conflict cleared — Approved to initiate retainer workflow.",
    outcomeTone: "success",
    actions: [
      {
        label: "Proceed to Questionnaire",
        tone: "brand",
      },
    ],
  },
  {
    name: "Amara Chen",
    practiceArea: "Immigration",
    practiceTone: "success",
    addOnActive: true,
    received: "June 2, 2026",
    statusLabel: "Conflict detected",
    statusTone: "danger",
    matterFocus:
      "My spouse and I are applying for a green card. We have been married for 3 years and he is a U.S. citizen.",
    outcome:
      "Record match identified: \"Chen found in adversary database on matching Matter #1084-A\". Please execute manual verification or request supervisor clearance prior to executing retainer.",
    outcomeTone: "danger",
    actions: [
      {
        label: "Flag Conflict",
        tone: "danger",
      },
      {
        label: "Clear & Approve",
        tone: "brand",
      },
    ],
  },
] as const;

export const questionnaires = [
  {
    title: "Family Law Questionnaire: Maria Santos",
    practiceArea: "Family law",
    practiceTone: "neutral",
    addOnActive: false,
    receivedFrom: "webhook portal",
    statusLabel: "Completed & Received",
  },
  {
    title: "Standard client onboarding questionnaire: Arthur Pendelton",
    practiceArea: "Business",
    practiceTone: "neutral",
    addOnActive: false,
    receivedFrom: "webhook portal",
    statusLabel: "Completed & Received",
  },
] as const;

export const consultations = [
  {
    initials: "KT",
    avatarTone: "mint",
    name: "Kenji Tanaka",
    matter: "I-130 — Petition for Alien Relative",
    status: "Scheduled",
    statusTone: "info",
    mode: "Video call",
    date: "June 11, 2026 · 10:00 AM · 60 min",
    questionnaire: "Submitted June 1, 2026 · Japanese",
    documentsReceived: "5 of 9 received",
    uploadedDocuments: [
      {
        title: "Passport — Sarah Tanaka (petitioner)",
        meta: "Identity document · May 30, 2026 · 2.4 MB",
      },
      {
        title: "Marriage certificate — June 14, 2022",
        meta: "Supporting document · May 30, 2026 · 1.1 MB",
      },
      {
        title: "Proof of US citizenship — Sarah Tanaka",
        meta: "Supporting document · Jun 1, 2026 · 0.8 MB",
      },
    ],
    requiredDocuments: [
      {
        title: "Petitioner's proof of US citizenship or LPR status",
        received: true,
      },
      {
        title: "Beneficiary's birth certificate (with certified translation)",
        received: false,
      },
      {
        title: "Marriage certificate (if filing for spouse)",
        received: true,
      },
      {
        title: "Passports — all pages (petitioner and beneficiary)",
        received: false,
      },
      {
        title: "Divorce decrees from all prior marriages",
        received: false,
      },
      {
        title: "Two passport-style photos (each)",
        received: false,
      },
    ],
    notes:
      "Record consultation notes, client statements, key facts, and your preliminary assessment here. These notes are saved to the matter record and referenced in the fee agreement stage.",
    assignee: "Sandra Adeyemi",
    assigneeInitials: "SA",
  },
  {
    initials: "MS",
    avatarTone: "blue",
    name: "Maria Santos",
    matter: "Uncontested / Simplified Dissolution",
    status: "In progress",
    statusTone: "success",
    mode: "In-person",
    date: "June 9, 2026 · 2:00 PM · 45 min",
    questionnaire: "Submitted June 2, 2026 · Español",
    documentsReceived: "6 of 9 received",
    uploadedDocuments: [
      {
        title: "Marriage certificate",
        meta: "Legal document · Jun 1, 2026 · 0.9 MB",
      },
      {
        title: "Financial disclosure form",
        meta: "Financial document · Jun 2, 2026 · 1.8 MB",
      },
      {
        title: "Bank statements — Chase (6 months)",
        meta: "Financial document · Jun 2, 2026 · 3.2 MB",
      },
    ],
    requiredDocuments: [
      {
        title: "Marriage certificate (original or certified copy)",
        received: true,
      },
      {
        title: "Government-issued photo ID (both parties)",
        received: false,
      },
      {
        title: "Tax returns — last 3 years (both parties)",
        received: true,
      },
      {
        title: "Bank and financial account statements (6 months)",
        received: true,
      },
      {
        title: "Property deed / mortgage documents (if applicable)",
        received: false,
      },
      {
        title: "Retirement account statements (if applicable)",
        received: false,
      },
    ],
    notes:
      "Client confirmed all assets are community property. Both parties cooperative. Main issue is condo ownership split and retirement account division. Alimony was requested — rehabilitative type likely appropriate. Attorney reviewing financial disclosures before fee agreement.",
    assignee: "Ayo Osei",
    assigneeInitials: "AO",
  },
] as const;

export const feeAgreements = [
  {
    title: "Standard contingency agreement (33%): Robert Vance",
    practiceArea: "Personal injury",
    practiceTone: "neutral",
    addOnActive: false,
    generatedBy: "administrator hub",
    statusLabel: "Pending signature",
    progressLabel: "75% complete",
    progress: 75,
  },
  {
    title: "General fee agreement & retainer contract: Kenji Tanaka",
    practiceArea: "Immigration",
    practiceTone: "success",
    addOnActive: true,
    generatedBy: "administrator hub",
    statusLabel: "Pending signature",
    progressLabel: "30% complete",
    progress: 30,
  },
] as const;
