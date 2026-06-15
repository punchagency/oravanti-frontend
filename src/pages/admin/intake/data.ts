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
    receivedDetail: "June 1, 2026 - 3:15 PM",
    situationSummary:
      "I received a speeding ticket in Virginia and need representation for the upcoming court date.",
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
    receivedDetail: "May 31, 2026 - 11:20 AM",
    situationSummary:
      "I need help filing an adjustment of status application and understanding what supporting documents are required.",
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
    receivedDetail: "May 30, 2026 - 9:45 AM",
    situationSummary:
      "I want to set up an S-Corp and need guidance on initial filings, compliance, and registry requirements.",
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
    responseTitle: "Maria Santos's questionnaire",
    matter: "Uncontested / Simplified Dissolution",
    submitted: "Submitted June 2, 2026",
    language: "Español",
    completionPercent: 90,
    answeredLabel: "18 of 20 questions answered",
    practiceArea: "Family law",
    practiceTone: "neutral",
    addOnActive: false,
    receivedFrom: "webhook portal",
    statusLabel: "Completed & Received",
    documents: [
      "Marriage certificate",
      "Financial disclosure form",
      "Bank statements - Chase (6 months)",
      "Government-issued photo ID",
      "Tax returns - last 3 years",
      "Retirement account statement",
    ],
    responseSections: [
      {
        title: "Personal information",
        questions: [
          ["Full legal name", "Maria Elena Santos"],
          ["Date of birth", "1985-09-03"],
          ["Current address", "4521 W Fullerton Ave, Chicago, IL 60639"],
          ["Date of marriage", "2014-04-12"],
          ["Place of marriage", "Cook County, Illinois"],
          ["Date of separation", "2026-01-01"],
          ["Spouse full legal name", "Ricardo Juan Santos"],
          ["Spouse current address", "8820 N Clark St, Chicago, IL 60626"],
        ],
      },
      {
        title: "Assets and finances",
        questions: [
          ["Do you own real property together?", "Yes"],
          ["Estimated property value (if applicable)", "Approximately $280,000"],
          ["Outstanding mortgage balance (if applicable)", "Approximately $190,000"],
          ["Do you have joint bank accounts?", "Yes"],
          ["Do you have retirement accounts?", ""],
          ["Do you have any business interests together?", "No"],
          ["Are you requesting spousal support / alimony?", "Yes"],
        ],
      },
      {
        title: "Children and custody",
        questions: [
          ["Do you have minor children from this marriage?", "No"],
          ["Names and dates of birth of minor children", ""],
          ["Have both parties agreed on custody arrangements?", "Yes - both parties in agreement"],
        ],
      },
      {
        title: "Additional information",
        questions: [
          ["Are there any domestic violence incidents to disclose?", "No"],
          [
            "Additional notes for your attorney",
            "We have already divided most personal property by mutual agreement. Main dispute is the condo and retirement funds.",
          ],
        ],
      },
    ],
  },
  {
    title: "Standard client onboarding questionnaire: Arthur Pendelton",
    responseTitle: "Arthur Pendelton's questionnaire",
    matter: "Business formation",
    submitted: "Submitted June 2, 2026",
    language: "English",
    completionPercent: 90,
    answeredLabel: "18 of 20 questions answered",
    practiceArea: "Business",
    practiceTone: "neutral",
    addOnActive: false,
    receivedFrom: "webhook portal",
    statusLabel: "Completed & Received",
    documents: [
      "Articles of organization",
      "EIN confirmation",
      "Operating agreement draft",
      "Founder ID",
      "Registered agent consent",
      "Prior business tax notice",
    ],
    responseSections: [
      {
        title: "Business information",
        questions: [
          ["Legal business name", "Pendelton Studio Works LLC"],
          ["Business address", "1209 Market St, Philadelphia, PA 19107"],
          ["Entity type requested", "Limited liability company"],
          ["Primary business activity", "Design consulting and digital production"],
        ],
      },
      {
        title: "Ownership and management",
        questions: [
          ["Number of owners", "2"],
          ["Managing member", "Arthur Pendelton"],
          ["Ownership split", "Arthur Pendelton 70%, Mina Rao 30%"],
          ["Will the business hire employees this year?", ""],
        ],
      },
      {
        title: "Filing preferences",
        questions: [
          ["Requested tax election", "S-Corp election"],
          ["Preferred filing state", "Pennsylvania"],
          ["Need registered agent support?", "Yes"],
          ["Additional notes for your attorney", "We want to complete formation before signing our first enterprise contract."],
        ],
      },
    ],
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
    questionnaireResponse: {
      responseTitle: "Kenji Tanaka's questionnaire",
      matter: "I-130 — Petition for Alien Relative",
      submitted: "Submitted June 1, 2026",
      language: "Japanese",
      completionPercent: 92,
      answeredLabel: "22 of 24 questions answered",
      documents: [
        "Passport — Sarah Tanaka (petitioner)",
        "Marriage certificate — June 14, 2022",
        "Proof of US citizenship — Sarah Tanaka",
        "Petitioner's proof of US citizenship or LPR status",
        "Marriage certificate (if filing for spouse)",
        "Two passport-style photos",
      ],
      responseSections: [
        {
          title: "Petitioner information",
          questions: [
            ["Petitioner full legal name", "Sarah Tanaka"],
            ["Petitioner immigration status", "U.S. citizen"],
            ["Current address", "1409 Pine St, Seattle, WA 98101"],
            ["Preferred language", "English"],
          ],
        },
        {
          title: "Beneficiary information",
          questions: [
            ["Beneficiary full legal name", "Kenji Tanaka"],
            ["Current country of residence", "Japan"],
            ["Date of birth", "1990-11-18"],
            ["Prior U.S. immigration filings", "No prior petitions filed"],
          ],
        },
        {
          title: "Marriage and relationship history",
          questions: [
            ["Date of marriage", "2022-06-14"],
            ["Place of marriage", "King County, Washington"],
            ["Have either spouse been married before?", "No"],
            ["Additional notes for your attorney", "We have lived together in Seattle since 2023 and have joint lease and bank records."],
          ],
        },
      ],
    },
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
    questionnaireResponse: {
      responseTitle: "Maria Santos's questionnaire",
      matter: "Uncontested / Simplified Dissolution",
      submitted: "Submitted June 2, 2026",
      language: "Español",
      completionPercent: 90,
      answeredLabel: "18 of 20 questions answered",
      documents: [
        "Marriage certificate",
        "Financial disclosure form",
        "Bank statements — Chase (6 months)",
        "Government-issued photo ID",
        "Tax returns — last 3 years",
        "Retirement account statement",
      ],
      responseSections: [
        {
          title: "Personal information",
          questions: [
            ["Full legal name", "Maria Elena Santos"],
            ["Date of birth", "1985-09-03"],
            ["Current address", "4521 W Fullerton Ave, Chicago, IL 60639"],
            ["Spouse full legal name", "Ricardo Juan Santos"],
          ],
        },
        {
          title: "Assets and finances",
          questions: [
            ["Do you own real property together?", "Yes"],
            ["Estimated property value (if applicable)", "Approximately $280,000"],
            ["Outstanding mortgage balance (if applicable)", "Approximately $190,000"],
            ["Do you have retirement accounts?", ""],
          ],
        },
        {
          title: "Additional information",
          questions: [
            ["Are there any domestic violence incidents to disclose?", "No"],
            ["Additional notes for your attorney", "Main dispute is the condo and retirement funds."],
          ],
        },
      ],
    },
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

export const caseOpenings = [
  {
    title: "Case initialization: Elena Rostova",
    practiceArea: "Immigration",
    practiceTone: "success",
    addOnActive: true,
    retainerCopy: "Received signed retainer contract (100% full authorization)",
    summary: "Adjustment of status filing, retainer and contract signed.",
    actionLabel: "Open physical case",
    actionTone: "brand",
  },
  {
    title: "Case initialization: Chloe Bennett",
    practiceArea: "Business",
    practiceTone: "neutral",
    addOnActive: false,
    retainerCopy: "Received signed retainer contract (100% full authorization)",
    summary: "S-Corp election filings and initial corporate registry.",
    actionLabel: "Activate Business to open case",
    actionTone: "danger",
  },
] as const;
