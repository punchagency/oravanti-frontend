/**
 * Static fixtures for the documents section. This module is UI-only for now —
 * there is no `/documents` API yet, so every page reads from here. When the
 * backend lands, swap these arrays for query hooks; the shapes below are what
 * the pages consume.
 */

export type DocumentReview =
  | "verified"
  | "under_review"
  | "missing"
  | "unfiled"
  | "expiry_risk"
  | "deadline_risk"
  | "none";

export type DocumentSource =
  | "Client upload"
  | "Pending client"
  | "Firm"
  | "USCIS";

export type DocumentMatter = {
  client: string;
  reference: string;
};

export type FirmDocument = {
  id: string;
  title: string;
  type: string;
  matter: DocumentMatter;
  source: DocumentSource;
  /** ISO date, or null when the document has not been uploaded yet. */
  date: string | null;
  review: DocumentReview;
  /** Drives the warning triangle next to the title. */
  flagged: boolean;
  /** Owning staff member — only surfaced through the staff filter. */
  owner: string;
};

export const REVIEW_LABELS: Record<DocumentReview, string> = {
  verified: "Verified",
  under_review: "Under review",
  missing: "Missing",
  unfiled: "Unfiled",
  expiry_risk: "Expiry risk",
  deadline_risk: "Deadline risk",
  none: "—",
};

export const documentStats = {
  total: 284,
  totalMatters: 22,
  pendingUpload: 12,
  aiFlags: 7,
  interviewPackages: 3,
};

/** Documents the AI review surfaced — rendered as the first table group. */
export const flaggedDocuments: FirmDocument[] = [
  {
    id: "doc-f1",
    title: "Passport biographic page",
    type: "Identity",
    matter: { client: "Aisha Patel", reference: "ORV-2026-0131" },
    source: "Client upload",
    date: "2026-06-19",
    review: "expiry_risk",
    flagged: true,
    owner: "Marcus Webb",
  },
  {
    id: "doc-f2",
    title: "I-693 Medical exam",
    type: "Required",
    matter: { client: "Aisha Patel", reference: "ORV-2026-0131" },
    source: "Pending client",
    date: null,
    review: "missing",
    flagged: true,
    owner: "Marcus Webb",
  },
  {
    id: "doc-f3",
    title: "Affidavit of support",
    type: "Required",
    matter: { client: "Amara Chen", reference: "ORV-2026-0142" },
    source: "Pending client",
    date: null,
    review: "missing",
    flagged: true,
    owner: "Priya Raman",
  },
  {
    id: "doc-f4",
    title: "Updated parenting plan",
    type: "Court Filing",
    matter: { client: "Carlos Rivera", reference: "ORV-2026-0128" },
    source: "Firm",
    date: "2026-06-20",
    review: "unfiled",
    flagged: true,
    owner: "Daniel Ortega",
  },
  {
    id: "doc-f5",
    title: "EEOC response package",
    type: "Legal",
    matter: { client: "Nina Vasquez", reference: "ORV-2026-0099" },
    source: "Firm",
    date: "2026-06-18",
    review: "deadline_risk",
    flagged: true,
    owner: "Priya Raman",
  },
  {
    id: "doc-f6",
    title: "I-485 Medical exam",
    type: "Required",
    matter: { client: "Amara Chen", reference: "ORV-2026-0142" },
    source: "Pending client",
    date: null,
    review: "missing",
    flagged: true,
    owner: "Priya Raman",
  },
  {
    id: "doc-f7",
    title: "LLC operating agreement",
    type: "Business",
    matter: { client: "James Okafor", reference: "ORV-2026-0108" },
    source: "Firm",
    date: "2026-06-15",
    review: "under_review",
    flagged: false,
    owner: "Marcus Webb",
  },
];

export const recentDocuments: FirmDocument[] = [
  {
    id: "doc-r1",
    title: "Fee agreement — signed",
    type: "Legal",
    matter: { client: "Aisha Patel", reference: "ORV-2026-0131" },
    source: "Firm",
    date: "2026-03-18",
    review: "verified",
    flagged: false,
    owner: "Marcus Webb",
  },
  {
    id: "doc-r2",
    title: "Passport — all pages",
    type: "Identity",
    matter: { client: "Amara Chen", reference: "ORV-2026-0142" },
    source: "Client upload",
    date: "2026-05-15",
    review: "verified",
    flagged: false,
    owner: "Priya Raman",
  },
  {
    id: "doc-r3",
    title: "Marriage certificate",
    type: "Supporting",
    matter: { client: "Aisha Patel", reference: "ORV-2026-0131" },
    source: "Client upload",
    date: "2026-06-10",
    review: "verified",
    flagged: false,
    owner: "Marcus Webb",
  },
  {
    id: "doc-r4",
    title: "USCIS interview notice",
    type: "Notice",
    matter: { client: "Aisha Patel", reference: "ORV-2026-0131" },
    source: "USCIS",
    date: "2026-06-01",
    review: "none",
    flagged: false,
    owner: "Marcus Webb",
  },
  {
    id: "doc-r5",
    title: "I-797 receipt notice",
    type: "Receipt",
    matter: { client: "Amara Chen", reference: "ORV-2026-0142" },
    source: "USCIS",
    date: "2026-05-05",
    review: "none",
    flagged: false,
    owner: "Priya Raman",
  },
  {
    id: "doc-r6",
    title: "Child custody order draft",
    type: "Court Filing",
    matter: { client: "Carlos Rivera", reference: "ORV-2026-0128" },
    source: "Firm",
    date: "2026-06-12",
    review: "under_review",
    flagged: false,
    owner: "Daniel Ortega",
  },
  {
    id: "doc-r7",
    title: "EAD approval notice",
    type: "Notice",
    matter: { client: "Amara Chen", reference: "ORV-2026-0143" },
    source: "USCIS",
    date: "2026-06-05",
    review: "none",
    flagged: false,
    owner: "Priya Raman",
  },
  {
    id: "doc-r8",
    title: "Residential purchase contract",
    type: "Real Estate",
    matter: { client: "Rachel Kim", reference: "ORV-2026-0074" },
    source: "Client upload",
    date: "2026-06-03",
    review: "verified",
    flagged: false,
    owner: "Daniel Ortega",
  },
  {
    id: "doc-r9",
    title: "I-864 Affidavit of support",
    type: "Supporting",
    matter: { client: "Roberto Morales", reference: "ORV-2026-0118" },
    source: "Client upload",
    date: "2026-06-02",
    review: "verified",
    flagged: false,
    owner: "Marcus Webb",
  },
  {
    id: "doc-r10",
    title: "Tax returns 2023–2025",
    type: "Financial",
    matter: { client: "Roberto Morales", reference: "ORV-2026-0118" },
    source: "Client upload",
    date: "2026-05-28",
    review: "verified",
    flagged: false,
    owner: "Marcus Webb",
  },
  {
    id: "doc-r11",
    title: "Employment verification letter",
    type: "Supporting",
    matter: { client: "David Kim", reference: "ORV-2026-0135" },
    source: "Firm",
    date: "2026-05-26",
    review: "under_review",
    flagged: false,
    owner: "Priya Raman",
  },
  {
    id: "doc-r12",
    title: "Birth certificate — translated",
    type: "Identity",
    matter: { client: "James Okonkwo", reference: "ORV-2026-0139" },
    source: "Client upload",
    date: "2026-05-22",
    review: "verified",
    flagged: false,
    owner: "Priya Raman",
  },
  {
    id: "doc-r13",
    title: "Retainer agreement — countersigned",
    type: "Legal",
    matter: { client: "Rachel Kim", reference: "ORV-2026-0074" },
    source: "Firm",
    date: "2026-05-19",
    review: "verified",
    flagged: false,
    owner: "Daniel Ortega",
  },
  {
    id: "doc-r14",
    title: "Green card copy",
    type: "Identity",
    matter: { client: "Roberto Morales", reference: "ORV-2026-0118" },
    source: "Client upload",
    date: "2026-05-12",
    review: "verified",
    flagged: false,
    owner: "Marcus Webb",
  },
  {
    id: "doc-r15",
    title: "Separation agreement draft",
    type: "Family",
    matter: { client: "Carlos Rivera", reference: "ORV-2026-0128" },
    source: "Firm",
    date: "2026-05-08",
    review: "under_review",
    flagged: false,
    owner: "Daniel Ortega",
  },
];

const allDocuments = [...flaggedDocuments, ...recentDocuments];

const unique = (values: string[]) => [...new Set(values)].sort();

export const documentCaseOptions = [
  ...new Map(
    allDocuments.map((doc) => [
      doc.matter.reference,
      { value: doc.matter.reference, label: `${doc.matter.client} · ${doc.matter.reference}` },
    ]),
  ).values(),
].sort((a, b) => a.label.localeCompare(b.label));

export const documentTypeOptions = unique(allDocuments.map((doc) => doc.type));

export const documentStaffOptions = unique(allDocuments.map((doc) => doc.owner));

export const documentStatusOptions: { value: DocumentReview; label: string }[] =
  (["verified", "under_review", "missing", "unfiled", "expiry_risk", "deadline_risk"] as const).map(
    (value) => ({ value, label: REVIEW_LABELS[value] }),
  );

/* ------------------------------- Case filings ------------------------------ */

export type FilingStatus =
  | "under_review"
  | "approved"
  | "rfe_due"
  | "filed"
  | "deadline_risk"
  | "unfiled";

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  under_review: "Under review",
  approved: "Approved",
  rfe_due: "RFE due",
  filed: "Filed",
  deadline_risk: "Deadline risk",
  unfiled: "Unfiled",
};

export type CaseFiling = {
  id: string;
  title: string;
  matter: DocumentMatter;
  filedDate: string | null;
  deadline: string | null;
  status: FilingStatus;
};

export const caseFilings: CaseFiling[] = [
  {
    id: "filing-1",
    title: "I-485 Adjustment of Status petition",
    matter: { client: "Aisha Patel", reference: "ORV-2026-0131" },
    filedDate: "2026-05-20",
    deadline: "2026-06-22",
    status: "under_review",
  },
  {
    id: "filing-2",
    title: "I-765 Employment Authorization petition",
    matter: { client: "Amara Chen", reference: "ORV-2026-0143" },
    filedDate: "2026-04-10",
    deadline: null,
    status: "approved",
  },
  {
    id: "filing-3",
    title: "I-130 Family Petition",
    matter: { client: "James Okonkwo", reference: "ORV-2026-0139" },
    filedDate: "2026-02-20",
    deadline: "2026-06-17",
    status: "rfe_due",
  },
  {
    id: "filing-4",
    title: "H-1B Specialty Occupation petition",
    matter: { client: "David Kim", reference: "ORV-2026-0135" },
    filedDate: "2026-04-15",
    deadline: null,
    status: "filed",
  },
  {
    id: "filing-5",
    title: "EEOC charge response",
    matter: { client: "Nina Vasquez", reference: "ORV-2026-0099" },
    filedDate: null,
    deadline: "2026-07-15",
    status: "deadline_risk",
  },
  {
    id: "filing-6",
    title: "Updated parenting plan",
    matter: { client: "Carlos Rivera", reference: "ORV-2026-0128" },
    filedDate: null,
    deadline: "2026-06-28",
    status: "unfiled",
  },
];

/* ---------------------------- Interview packages --------------------------- */

export type PackageItem = {
  label: string;
  present: boolean;
};

export type InterviewPackage = {
  id: string;
  client: string;
  reference: string;
  caseType: string;
  /** Right-hand badge: the interview date, or readiness once complete. */
  badge: string;
  items: PackageItem[];
};

export const interviewPackages: InterviewPackage[] = [
  {
    id: "pkg-1",
    client: "Aisha Patel",
    reference: "ORV-2026-0131",
    caseType: "I-485 Adjustment of Status",
    badge: "Interview Jun 22",
    items: [
      { label: "Fee agreement — signed", present: true },
      { label: "Passport biographic page", present: true },
      { label: "Marriage certificate", present: true },
      { label: "I-94 travel record", present: true },
      { label: "I-797 receipt notice", present: true },
      { label: "I-693 Medical exam", present: false },
      { label: "Affidavit of support", present: false },
    ],
  },
  {
    id: "pkg-2",
    client: "Roberto Morales",
    reference: "ORV-2026-0118",
    caseType: "N-400 Naturalization",
    badge: "Ready to transmit",
    items: [
      { label: "N-400 form", present: true },
      { label: "Green card copy", present: true },
      { label: "Passport biographic page", present: true },
      { label: "Tax returns (3 years)", present: true },
      { label: "Travel history document", present: true },
      { label: "Photo (×2)", present: true },
    ],
  },
  {
    id: "pkg-3",
    client: "Amara Chen",
    reference: "ORV-2026-0142",
    caseType: "I-485 Adjustment of Status",
    badge: "Interview Jul 9",
    items: [
      { label: "Passport — all pages", present: true },
      { label: "I-797 receipt notice", present: true },
      { label: "Birth certificate — translated", present: true },
      { label: "Employment verification letter", present: true },
      { label: "Affidavit of support", present: false },
      { label: "I-485 Medical exam", present: false },
    ],
  },
];

/* ---------------------------- Document creator ----------------------------- */

export type CreatorDocumentType = {
  value: string;
  label: string;
  /** Only types with a built template render a form; the rest show a stub. */
  hasTemplate: boolean;
};

export type CreatorGroup = {
  label: string;
  types: CreatorDocumentType[];
};

export const creatorGroups: CreatorGroup[] = [
  {
    label: "Motions & briefs",
    types: [
      { value: "motion-to-continue", label: "Motion to Continue", hasTemplate: true },
      { value: "motion-to-reopen", label: "Motion to Reopen", hasTemplate: false },
      { value: "motion-to-reconsider", label: "Motion to Reconsider", hasTemplate: false },
      { value: "bia-appeal-brief", label: "BIA Appeal Brief", hasTemplate: false },
      { value: "federal-court-brief", label: "Federal Court Brief", hasTemplate: false },
      { value: "notice-of-appearance", label: "Notice of Appearance", hasTemplate: false },
    ],
  },
  {
    label: "Letters",
    types: [
      { value: "cover-letter", label: "Cover letter", hasTemplate: false },
      { value: "client-letter", label: "Client letter", hasTemplate: false },
      { value: "demand-letter", label: "Demand letter", hasTemplate: false },
      { value: "appeal-letter", label: "Appeal letter", hasTemplate: false },
    ],
  },
  {
    label: "Declarations & exhibits",
    types: [
      { value: "declaration", label: "Declaration", hasTemplate: false },
      { value: "exhibit-list", label: "Exhibit list", hasTemplate: false },
    ],
  },
  {
    label: "Other",
    types: [{ value: "custom-document", label: "Custom document", hasTemplate: false }],
  },
];

export type CreatorCaseRecord = {
  value: string;
  label: string;
  clientName: string;
  aNumber: string;
  caseNumber: string;
  courtAddress: string;
};

/** Cases the creator can link to, with the fields a template pre-fills. */
export const creatorCases: CreatorCaseRecord[] = [
  {
    value: "ORV-2026-0131",
    label: "Aisha Patel · ORV-2026-0131",
    clientName: "Aisha Patel",
    aNumber: "A-208-441-903",
    caseNumber: "ORV-2026-0131",
    courtAddress: "USCIS Field Office, 5880 NW 18th St, Miami, FL 33126",
  },
  {
    value: "ORV-2026-0142",
    label: "Amara Chen · ORV-2026-0142",
    clientName: "Amara Chen",
    aNumber: "A-211-770-118",
    caseNumber: "ORV-2026-0142",
    courtAddress: "Miami Immigration Court, 333 S Miami Ave, Miami, FL 33130",
  },
  {
    value: "ORV-2026-0128",
    label: "Carlos Rivera · ORV-2026-0128",
    clientName: "Carlos Rivera",
    aNumber: "—",
    caseNumber: "ORV-2026-0128",
    courtAddress: "11th Judicial Circuit, 175 NW 1st Ave, Miami, FL 33128",
  },
  {
    value: "ORV-2026-0139",
    label: "James Okonkwo · ORV-2026-0139",
    clientName: "James Okonkwo",
    aNumber: "A-209-556-201",
    caseNumber: "ORV-2026-0139",
    courtAddress: "USCIS Texas Service Center, 6046 N Belt Line Rd, Irving, TX 75038",
  },
];

/** Attorney details come from the signed-in user's profile once wired up. */
export const creatorAttorney = {
  name: "Marcus Webb",
  barNumber: "FL-2024-38821",
};

/** Practice areas the templates module will adapt to. */
export const activePracticeAreas = ["Immigration", "Family law"];

export function formatDocumentDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
