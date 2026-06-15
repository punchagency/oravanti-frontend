export type PracticeTone =
  | "success"
  | "neutral"
  | "warning"
  | "gold"
  | "danger"
  | "info"
  | "brand";

export type StageTone = PracticeTone;

export type PipelineLead = {
  name: string;
  email: string;
  practiceArea: string;
  practiceTone: PracticeTone;
  stage: string;
  stageTone: StageTone;
  source: string;
  assignedTo: string;
  lastActivity: string;
  actionLabel: string;
  actionPrimary: boolean;
};

export const crmStats = [
  { label: "NEW LEADS", count: 6, color: "#1a1a1a" },
  { label: "CONFLICT CHECK", count: 4, color: "#d18400" },
  { label: "QUESTIONNAIRE", count: 3, color: "#377dff" },
  { label: "PROSPECTIVE", count: 4, color: "#534AB7" },
  { label: "ACTIVE CLIENTS", count: 45, color: "#1D9E75" },
] as const;

export const crmTabs = [
  "Pipeline",
  "Conversion metrics",
  "Education flywheel",
  "Archived leads",
] as const;

export type CrmTab = (typeof crmTabs)[number];

export const pipelineLeads: PipelineLead[] = [
  {
    name: "Amara Chen",
    email: "amara.chen@email.com",
    practiceArea: "Immigration",
    practiceTone: "success",
    stage: "New lead",
    stageTone: "neutral",
    source: "Client portal",
    assignedTo: "Sandra Adeyemi",
    lastActivity: "2 days ago",
    actionLabel: "Review",
    actionPrimary: true,
  },
  {
    name: "Sophia Rodriguez",
    email: "s.rodriguez@email.com",
    practiceArea: "Family law",
    practiceTone: "neutral",
    stage: "New lead",
    stageTone: "neutral",
    source: "Client portal",
    assignedTo: "Unassigned",
    lastActivity: "1 day ago",
    actionLabel: "Review",
    actionPrimary: true,
  },
  {
    name: "Kofi Mensah",
    email: "kofi.m@email.com",
    practiceArea: "Business law",
    practiceTone: "info",
    stage: "Conflict check",
    stageTone: "gold",
    source: "Referral",
    assignedTo: "Sandra Adeyemi",
    lastActivity: "3 days ago",
    actionLabel: "Check",
    actionPrimary: true,
  },
  {
    name: "Yuki Tanaka",
    email: "yuki.tanaka@email.com",
    practiceArea: "Estate planning",
    practiceTone: "gold",
    stage: "Conflict check",
    stageTone: "gold",
    source: "Direct",
    assignedTo: "Rachel Abubakar",
    lastActivity: "4 days ago",
    actionLabel: "Check",
    actionPrimary: true,
  },
  {
    name: "Chinedu Eze",
    email: "chinedu.eze@outlook.com",
    practiceArea: "Immigration",
    practiceTone: "success",
    stage: "Questionnaire sent",
    stageTone: "info",
    source: "Client portal",
    assignedTo: "Sandra Adeyemi",
    lastActivity: "Just now",
    actionLabel: "Track",
    actionPrimary: false,
  },
  {
    name: "Mateo Silva",
    email: "mateo.silva@email.com",
    practiceArea: "Business law",
    practiceTone: "info",
    stage: "Fee agreement",
    stageTone: "warning",
    source: "Phone enquiry",
    assignedTo: "Unassigned",
    lastActivity: "5 days ago",
    actionLabel: "Follow up",
    actionPrimary: false,
  },
  {
    name: "Aisha Patel",
    email: "a.patel@email.com",
    practiceArea: "Immigration",
    practiceTone: "success",
    stage: "Consultation",
    stageTone: "info",
    source: "Referral",
    assignedTo: "Sandra Adeyemi",
    lastActivity: "2 days ago",
    actionLabel: "Review",
    actionPrimary: false,
  },
  {
    name: "Carlos Rivera",
    email: "c.rivera@email.com",
    practiceArea: "Family law",
    practiceTone: "neutral",
    stage: "Consultation",
    stageTone: "info",
    source: "Client portal",
    assignedTo: "Ayo Osei",
    lastActivity: "Today",
    actionLabel: "Review",
    actionPrimary: false,
  },
  {
    name: "Fatima Hassan",
    email: "f.hassan@email.com",
    practiceArea: "Immigration",
    practiceTone: "success",
    stage: "New lead",
    stageTone: "neutral",
    source: "Client portal",
    assignedTo: "Sandra Adeyemi",
    lastActivity: "Just now",
    actionLabel: "Review",
    actionPrimary: true,
  },
  {
    name: "David Okonkwo",
    email: "david.okonkwo@email.com",
    practiceArea: "Business law",
    practiceTone: "info",
    stage: "Conflict check",
    stageTone: "gold",
    source: "Referral",
    assignedTo: "Sandra Adeyemi",
    lastActivity: "1 day ago",
    actionLabel: "Check",
    actionPrimary: true,
  },
  {
    name: "Lin Wei",
    email: "lin.wei@email.com",
    practiceArea: "Immigration",
    practiceTone: "success",
    stage: "Questionnaire sent",
    stageTone: "info",
    source: "Client portal",
    assignedTo: "Sandra Adeyemi",
    lastActivity: "3 days ago",
    actionLabel: "Track",
    actionPrimary: false,
  },
  {
    name: "Adaeze Obi",
    email: "adaeze.obi@email.com",
    practiceArea: "Family law",
    practiceTone: "neutral",
    stage: "Fee agreement",
    stageTone: "warning",
    source: "Referral",
    assignedTo: "Unassigned",
    lastActivity: "4 days ago",
    actionLabel: "Follow up",
    actionPrimary: false,
  },
  {
    name: "Marcus Johnson",
    email: "m.johnson@email.com",
    practiceArea: "Criminal defense",
    practiceTone: "warning",
    stage: "New lead",
    stageTone: "neutral",
    source: "Walk-in",
    assignedTo: "Yemi Okafor",
    lastActivity: "Yesterday",
    actionLabel: "Review",
    actionPrimary: true,
  },
  {
    name: "Ngozi Okafor",
    email: "ngozi.okafor@email.com",
    practiceArea: "Immigration",
    practiceTone: "success",
    stage: "Questionnaire sent",
    stageTone: "info",
    source: "Client portal",
    assignedTo: "Sandra Adeyemi",
    lastActivity: "2 days ago",
    actionLabel: "Track",
    actionPrimary: false,
  },
  {
    name: "Roberto Santos",
    email: "roberto.santos@email.com",
    practiceArea: "Business law",
    practiceTone: "info",
    stage: "Consultation",
    stageTone: "info",
    source: "Client portal",
    assignedTo: "Rachel Abubakar",
    lastActivity: "5 days ago",
    actionLabel: "Review",
    actionPrimary: false,
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@email.com",
    practiceArea: "Immigration",
    practiceTone: "success",
    stage: "Fee agreement",
    stageTone: "warning",
    source: "Referral",
    assignedTo: "Sandra Adeyemi",
    lastActivity: "3 days ago",
    actionLabel: "Follow up",
    actionPrimary: false,
  },
  {
    name: "Emmanuel Adeyemi",
    email: "emmanuel.adeyemi@email.com",
    practiceArea: "Business law",
    practiceTone: "info",
    stage: "New lead",
    stageTone: "neutral",
    source: "Client portal",
    assignedTo: "Unassigned",
    lastActivity: "4 days ago",
    actionLabel: "Review",
    actionPrimary: true,
  },
  {
    name: "Zara Ahmed",
    email: "zara.ahmed@email.com",
    practiceArea: "Estate planning",
    practiceTone: "gold",
    stage: "Conflict check",
    stageTone: "gold",
    source: "Direct",
    assignedTo: "Rachel Abubakar",
    lastActivity: "1 day ago",
    actionLabel: "Check",
    actionPrimary: true,
  },
  {
    name: "James Nwachukwu",
    email: "j.nwachukwu@email.com",
    practiceArea: "Immigration",
    practiceTone: "success",
    stage: "Consultation",
    stageTone: "info",
    source: "Client portal",
    assignedTo: "Sandra Adeyemi",
    lastActivity: "Yesterday",
    actionLabel: "Review",
    actionPrimary: false,
  },
  {
    name: "Fatou Diallo",
    email: "fatou.diallo@email.com",
    practiceArea: "Family law",
    practiceTone: "neutral",
    stage: "New lead",
    stageTone: "neutral",
    source: "Referral",
    assignedTo: "Ayo Osei",
    lastActivity: "Today",
    actionLabel: "Review",
    actionPrimary: true,
  },
];

export const pipelineStages = [
  "All stages",
  "New lead",
  "Conflict check",
  "Questionnaire sent",
  "Consultation",
  "Fee agreement",
] as const;

export const practiceAreas = [
  "All practice areas",
  "Immigration",
  "Business law",
  "Family law",
  "Estate planning",
  "Criminal defense",
] as const;

export const leadSources = [
  "All sources",
  "Client portal",
  "Referral",
  "Direct",
  "Phone enquiry",
  "Walk-in",
  "Education flywheel",
] as const;

export type ArchivedLead = {
  name: string;
  email: string;
  practiceArea: string;
  practiceTone: PracticeTone;
  archiveReason: string;
  archiveReasonTone: PracticeTone;
  archivedBy: string;
  archiveDate: string;
};

export const archivedLeads: ArchivedLead[] = [
  {
    name: "Thomas Wright",
    email: "t.wright@email.com",
    practiceArea: "Immigration",
    practiceTone: "success",
    archiveReason: "Conflict of interest",
    archiveReasonTone: "danger",
    archivedBy: "Sandra Adeyemi",
    archiveDate: "May 28, 2026",
  },
  {
    name: "Anna Kowalski",
    email: "a.kowalski@email.com",
    practiceArea: "Immigration",
    practiceTone: "success",
    archiveReason: "Conflict of interest",
    archiveReasonTone: "danger",
    archivedBy: "Sandra Adeyemi",
    archiveDate: "May 20, 2026",
  },
  {
    name: "Samuel Adekunle",
    email: "s.adekunle@email.com",
    practiceArea: "Immigration",
    practiceTone: "success",
    archiveReason: "Referred elsewhere",
    archiveReasonTone: "neutral",
    archivedBy: "Sandra Adeyemi",
    archiveDate: "May 12, 2026",
  },
];

export const archiveReasons = [
  "All reasons",
  "Conflict of interest",
  "Referred elsewhere",
  "Unresponsive",
  "Withdrawn",
] as const;

export type EducationLead = {
  name: string;
  email: string;
  practiceArea: string;
  practiceTone: PracticeTone;
  educationCompleted: string;
  assignedTo: string;
  received: string;
};

export const educationLeads: EducationLead[] = [
  {
    name: "Lin Wei",
    email: "lin.wei@email.com",
    practiceArea: "Immigration",
    practiceTone: "success",
    educationCompleted: "Tier 3 (Investment / EB-5)",
    assignedTo: "Yemi Okafor",
    received: "6 days ago",
  },
  {
    name: "Daniel Park",
    email: "daniel.p@email.com",
    practiceArea: "Immigration",
    practiceTone: "success",
    educationCompleted: "Tier 3 (EB-5 pathway)",
    assignedTo: "Ayo Osei",
    received: "3 weeks ago",
  },
  {
    name: "Emeka Eze",
    email: "emeka.e@email.com",
    practiceArea: "Immigration",
    practiceTone: "success",
    educationCompleted: "Free tier (Legal basics)",
    assignedTo: "Sandra Adeyemi",
    received: "2 weeks ago",
  },
  {
    name: "Ibrahim Al-Amin",
    email: "ibrahim.a@email.com",
    practiceArea: "Immigration",
    practiceTone: "success",
    educationCompleted: "Tier 3 (EB-5 / E-2)",
    assignedTo: "Sandra Adeyemi",
    received: "1 month ago",
  },
];

export const educationTiers = ["All tiers", "Free tier", "Tier 2", "Tier 3"] as const;
