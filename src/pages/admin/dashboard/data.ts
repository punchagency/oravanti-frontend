import {
  AlertTriangle,
  Bot,
  CalendarDays,
  Clock,
  Cloud,
  Rss,
  ShieldCheck,
} from "lucide-react";

export const chips = [
  ["All active", "#6b6252"],
  ["Immigration", "#00a878"],
  ["Business", "#6a00c7"],
  ["Employment", "#e14a2d"],
  ["Criminal defense", "#5e4500"],
  ["Family law", "#377dff"],
  ["Estate planning", "#d18400"],
  ["Real estate", "#007f67"],
  ["Personal injury", "#b00020"],
] as const;

export const alerts = [
  ["#e82c45", "RFE received — Chen Immigration matter", "Response due in 14 days · I-485 AOS", "2h ago"],
  ["#d18400", "Staff certification expiring", "Yemi Okafor — I-130 recertification due", "Today"],
  ["#d18400", "3 leads awaiting conflict check", "Assigned to Sandra Adeyemi for review", "Yesterday"],
  ["#6a00c7", "New policy alert — USCIS processing update", "I-485 average processing time revised", "1d ago"],
  ["#377dff", "Invoice overdue — Okonkwo matter", "$3,200 outstanding — 7 days overdue", "2d ago"],
] as const;

export const matterStageStats = [
  ["Intake", "4", "#8c8f87", 8],
  ["Forms preparation", "11", "#4b78dd", 23],
  ["Filed / Submitted", "9", "#6a00c7", 19],
  ["Under review", "12", "#d18400", 25],
  ["Response due", "5", "#e82c45", 10],
  ["Interview scheduled", "4", "#6a00c7", 8],
  ["Decision received", "3", "#00a878", 6],
] as const;

export const deadlines = [
  ["#e82c45", "Ahmed Hassan", "ORV-2026-0109", "EEOC Charge · Response due", "Today", "urgent"],
  ["#e82c45", "Sofia Reyes", "ORV-2026-0094", "Protective Order (TRO)", "Tomorrow", "urgent"],
  ["#d18400", "James Okonkwo", "ORV-2026-0139", "I-130 RFE Response", "3 days", "warning"],
  ["#d18400", "Aisha Patel", "ORV-2026-0131", "I-485 AOS Interview", "4 days", "warning"],
  ["#377dff", "Roberto Morales", "ORV-2026-0118", "N-400 Interview", "6 days", "info"],
] as const;

export const velocityWeeks = [
  ["Apr 21", "3", 36],
  ["Apr 28", "5", 62],
  ["May 05", "4", 50],
  ["May 12", "7", 86],
  ["May 19", "6", 74],
  ["May 26", "8", 100],
  ["Jun 02", "5", 62],
  ["Jun 09", "4", 50],
] as const;

export const healthIndicators = [
  ["Firm RFE rate", "12%", "Target: below 10%", "warning", 56, AlertTriangle],
  ["Avg lead to case", "11d", "↓ 3 days from last month", "success", 54, Clock],
  ["Conflict check clearance", "94%", "6% declined / referred out", "success", 94, ShieldCheck],
] as const;

export const activityStats = [
  ["12 workflow steps completed", "#00a878"],
  ["3 documents uploaded", "#377dff"],
  ["2 deadlines approaching", "#d18400"],
  ["1 new matter opened", "#6a00c7"],
  ["4 client messages sent", "#8c8f87"],
] as const;

export const morningActivity = [
  ["9:02 AM", "#00a878", "Ruth Babatunde filed RFE response package with USCIS", "ORV-2026-0139 · James Okonkwo · I-130", ""],
  ["9:14 AM", "#377dff", "Client completed questionnaire", "ORV-intake · Maria Santos · Family law", "View responses"],
  ["9:31 AM", "#6a00c7", "Sandra Adeyemi opened new matter — I-485 Adjustment of Status", "ORV-2026-0143 · Emeka Eze · Immigration", ""],
  ["9:45 AM", "#e82c45", "System deadline alert — EEOC response due today", "ORV-2026-0109 · Ahmed Hassan · Employment", "View"],
  ["10:03 AM", "#377dff", "Yemi Okafor uploaded document — Medical examination (I-693)", "ORV-2026-0131 · Aisha Patel · Immigration", ""],
  ["10:22 AM", "#00a878", "Yemi Okafor completed workflow step — Document collection", "ORV-2026-0142 · Amara Chen · I-485 AOS", ""],
  ["10:45 AM", "#6a00c7", "Sandra Adeyemi cleared conflict check — questionnaire sent", "Intake · Kenji Tanaka · Immigration", ""],
  ["11:08 AM", "#00a878", "Ayo Osei submitted court filing — TRO petition", "ORV-2026-0094 · Sofia Reyes · Family law", ""],
  ["11:30 AM", "#d18400", "System alert — Yemi Okafor at 9/12 caseload (75%)", "Approaching individual caseload cap", "Review"],
  ["11:52 AM", "#377dff", "Client viewed fee agreement — not yet signed", "Intake · Aisha Patel · Immigration", ""],
] as const;

export const afternoonActivity = [
  ["12:15 PM", "#e82c45", "USCIS bulletin policy alert — I-693 new edition required", "Immigration · 2 matters affected", "View alert"],
  ["12:44 PM", "#00a878", "System retainer payment received — $3,500", "Intake · Aisha Patel · I-485 AOS", ""],
  ["1:10 PM", "#00a878", "Yemi Okafor confirmed biometrics appointment", "ORV-2026-0142 · Amara Chen · I-485 AOS", ""],
  ["1:33 PM", "#377dff", "Ruth Babatunde sent document request to external party", "ORV-2026-0139 · James Okonkwo · Cook County Hospital", ""],
  ["2:05 PM", "#6a00c7", "System AI QC review completed — 0 hard errors, 2 soft flags", "ORV-2026-0143 · Emeka Eze · I-485 AOS", ""],
  ["2:28 PM", "#00a878", "Sandra Adeyemi passed Attorney review on workflow step", "ORV-2026-0131 · Aisha Patel · I-485 AOS", ""],
  ["2:51 PM", "#d18400", "System reminder sent — fee agreement not yet signed", "Intake · Carlos Rivera · Family law", ""],
  ["3:14 PM", "#377dff", "Aisha Patel sent client portal message — question about interview", "ORV-2026-0131 · Aisha Patel", "Reply"],
  ["3:30 PM", "#00a878", "Ruth Babatunde filed DACA renewal — receipt tracking activated", "ORV-2026-0076 · Ibrahim Al-Amin · DACA Renewal", ""],
  ["3:55 PM", "#00a878", "Ayo Osei sent parenting plan draft for client review", "ORV-2026-0128 · Carlos Rivera · Child Custody", ""],
  ["4:18 PM", "#6a00c7", "System new lead received via client portal", "Intake · Sophia Rodriguez · Family law", "Review"],
  ["4:40 PM", "#d18400", "System certification expiry alert — Yemi Okafor I-130", "Expires Aug 2026 — recertification recommended", "Assign training"],
  ["5:02 PM", "#00a878", "Sandra Adeyemi saved consultation notes — fee agreement approved", "Intake · Kenji Tanaka · Immigration", ""],
  ["5:15 PM", "#377dff", "System daily USCIS processing time update received", "Immigration · 3 matters auto-updated", ""],
] as const;

export const staffDuty = [
  ["Sandra Adeyemi", "Attorney", "SA", "12/20", 60, "success", "mint"],
  ["Yemi Okafor", "Paralegal", "YO", "9/12", 75, "warning", "gold"],
  ["Ruth Babatunde", "Case manager", "RB", "7/10", 70, "warning", "gold"],
  ["Ayo Osei", "Paralegal", "AO", "6/10", 60, "success", "gold"],
  ["James Kolade", "Case manager", "JK", "0/10", 0, "neutral", "gold"],
] as const;

export const teamCaseload = [
  ["Immigration Team A", "28/40", 70, "warning"],
  ["Family & Estate Team", "8/20", 40, "success"],
] as const;

export const systemStatuses = [
  ["AI QC engine", "Operational", "success", Bot],
  ["Policy alert feed", "Live", "success", Rss],
  ["Deadline engine", "Active", "success", CalendarDays],
  ["USCIS processing sync", "Updated 6:00 AM", "gold", Cloud],
] as const;

export const closedThisWeek = [
  ["Fatima Diallo — Spousal Support", "ORV-2026-0121 · Closed Jun 5, 2026"],
  ["Chioma Okafor — Child Custody", "ORV-2026-0054 · Closed Jun 3, 2026"],
] as const;

export const dashboardTabs = [
  "Overview",
  "Pipeline",
  "Activity",
] as const;

export type DashboardTabs = (typeof dashboardTabs)[number];
