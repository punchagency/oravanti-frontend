import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from "react-router";
import { AdminLayout } from "@/components/layout/admin-layout";
import { UnsavedChangesProvider } from "@/contexts/unsaved-changes-context";
import { RouteErrorBoundary } from "@/components/ui/error-boundary";
import { lazyPage } from "@/routers/lazy";
import { AdminGuard } from "@/routers/admin/guard";
import { CalendarDataProvider } from "@/pages/admin/calendar/calendar-data-context";

/* ------------------------------------------------------------------ *
 * Lazy-loaded pages. Kept in this file so the whole route table is   *
 * readable in one place; each page only loads when first visited.    *
 * ------------------------------------------------------------------ */

// Auth callback pages
const AcceptInvitationPage = lazyPage(() => import("@/pages/accept-invitation"));
const EmailVerifiedPage = lazyPage(() => import("@/pages/email-verified"));
const SetPasswordPage = lazyPage(() => import("@/pages/set-password"));
const VerifyEmailNoticePage = lazyPage(() => import("@/pages/verify-email"));

// Onboarding
const Step0SourcePage = lazyPage(() => import("@/pages/onboarding/step-0-source"));
const Step1ProfilePage = lazyPage(() => import("@/pages/onboarding/step-1-profile"));
const Step2FirmDetailsPage = lazyPage(() => import("@/pages/onboarding/step-2-firm-details"));
const Step3TosPage = lazyPage(() => import("@/pages/onboarding/step-3-tos"));

// Dashboard
const AdminDashboard = lazyPage(() =>
  import("@/pages/admin/dashboard").then((m) => ({ default: m.AdminDashboard })),
);

// Settings
const EmailAccountConnectionPage = lazyPage(() =>
  import("@/pages/admin/settings/email-account-connection").then((m) => ({ default: m.EmailAccountConnectionPage })),
);
const FirmSettingsPage = lazyPage(() =>
  import("@/pages/admin/settings/firm-settings").then((m) => ({ default: m.FirmSettingsPage })),
);
const GeneralTab = lazyPage(() => import("@/pages/admin/settings/firm-settings/tabs/general"));
const BillingTab = lazyPage(() => import("@/pages/admin/settings/firm-settings/tabs/billing"));
const NotificationsTab = lazyPage(() => import("@/pages/admin/settings/firm-settings/tabs/notifications"));
const ComplianceTab = lazyPage(() => import("@/pages/admin/settings/firm-settings/tabs/compliance"));

// Profile
const MyProfilePage = lazyPage(() =>
  import("@/pages/admin/my-profile").then((m) => ({ default: m.MyProfilePage })),
);
const ProfileTab = lazyPage(() => import("@/pages/admin/my-profile/tabs/profile"));
const SecurityTab = lazyPage(() => import("@/pages/admin/my-profile/tabs/security"));
const AppearanceTab = lazyPage(() => import("@/pages/admin/my-profile/tabs/appearance"));

// Leads
const LeadsPage = lazyPage(() =>
  import("@/pages/admin/leads").then((m) => ({ default: m.LeadsPage })),
);
const LeadDetailPage = lazyPage(() =>
  import("@/pages/admin/leads").then((m) => ({ default: m.LeadDetailPage })),
);
const MyLeadsTasksPage = lazyPage(() =>
  import("@/pages/admin/leads").then((m) => ({ default: m.MyLeadsTasksPage })),
);
const LeadReviewQueuePage = lazyPage(() =>
  import("@/pages/admin/lead-review-queue").then((m) => ({ default: m.LeadReviewQueuePage })),
);
const ConflictCheckPage = lazyPage(() =>
  import("@/pages/admin/leads/components/intake-pipeline/pages/lead-conflict-check-page").then((m) => ({ default: m.ConflictCheckPage })),
);
const QuestionnairePage = lazyPage(() =>
  import("@/pages/admin/leads/components/intake-pipeline/pages/lead-questionnaire-page").then((m) => ({ default: m.QuestionnairePage })),
);
const ConsultationPage = lazyPage(() =>
  import("@/pages/admin/leads/components/intake-pipeline/pages/lead-consultation-page").then((m) => ({ default: m.ConsultationPage })),
);
const CaseOpeningPage = lazyPage(() =>
  import("@/pages/admin/leads/components/intake-pipeline/pages/lead-case-opening-page").then((m) => ({ default: m.CaseOpeningPage })),
);

// Lead detail tabs
const LeadOverviewTabRoute = lazyPage(() =>
  import("@/pages/admin/leads/components/lead-details/tab-routes/overview-tab-route").then((m) => ({ default: m.LeadOverviewTabRoute })),
);
const IntakePipelineTabRoute = lazyPage(() =>
  import("@/pages/admin/leads/components/lead-details/tab-routes/intake-pipeline-tab-route").then((m) => ({ default: m.IntakePipelineTabRoute })),
);
const LeadDocumentsTabRoute = lazyPage(() =>
  import("@/pages/admin/leads/components/lead-details/tab-routes/documents-tab-route").then((m) => ({ default: m.DocumentsTabRoute })),
);
const LeadTimelineTabRoute = lazyPage(() =>
  import("@/pages/admin/leads/components/lead-details/tab-routes/timeline-tab-route").then((m) => ({ default: m.TimelineTabRoute })),
);
const LeadNotesTabRoute = lazyPage(() =>
  import("@/pages/admin/leads/components/lead-details/tab-routes/notes-tab-route").then((m) => ({ default: m.NotesTabRoute })),
);
const LeadAuditLogTabRoute = lazyPage(() =>
  import("@/pages/admin/leads/components/lead-details/tab-routes/audit-log-tab-route").then((m) => ({ default: m.LeadAuditLogTabRoute })),
);

// CRM
const CrmLeadsPage = lazyPage(() =>
  import("@/pages/admin/crm-leads").then((m) => ({ default: m.CrmLeadsPage })),
);

// Cases
const CasesPage = lazyPage(() =>
  import("@/pages/admin/cases").then((m) => ({ default: m.CasesPage })),
);
const CaseDetailPage = lazyPage(() =>
  import("@/pages/admin/cases").then((m) => ({ default: m.CaseDetailPage })),
);
const CaseOverviewTabRoute = lazyPage(() =>
  import("@/pages/admin/cases/components/case-details/tab-routes/overview-tab-route").then((m) => ({ default: m.CaseOverviewTabRoute })),
);
const CaseWorkflowTabRoute = lazyPage(() =>
  import("@/pages/admin/cases/components/case-details/tab-routes/workflow-tab-route").then((m) => ({ default: m.CaseWorkflowTabRoute })),
);
const CasePeopleTabRoute = lazyPage(() =>
  import("@/pages/admin/cases/components/case-details/tab-routes/people-tab-route").then((m) => ({ default: m.CasePeopleTabRoute })),
);
const CaseDocumentsTabRoute = lazyPage(() =>
  import("@/pages/admin/cases/components/case-details/tab-routes/documents-tab-route").then((m) => ({ default: m.CaseDocumentsTabRoute })),
);
const CaseTimelineTabRoute = lazyPage(() =>
  import("@/pages/admin/cases/components/case-details/tab-routes/timeline-tab-route").then((m) => ({ default: m.CaseTimelineTabRoute })),
);
const CaseNotesTabRoute = lazyPage(() =>
  import("@/pages/admin/cases/components/case-details/tab-routes/note-tab-route").then((m) => ({ default: m.CaseNotesTabRoute })),
);
const CaseAiReviewTabRoute = lazyPage(() =>
  import("@/pages/admin/cases/components/case-details/tab-routes/ai-review-tab-route").then((m) => ({ default: m.CaseAiReviewTabRoute })),
);
const CaseAuditLogTabRoute = lazyPage(() =>
  import("@/pages/admin/cases/components/case-details/tab-routes/audit-log-tab-route").then((m) => ({ default: m.CaseAuditLogTabRoute })),
);
const MyTasksPage = lazyPage(() =>
  import("@/pages/admin/my-tasks").then((m) => ({ default: m.MyTasksPage })),
);
const ReviewQueuePage = lazyPage(() =>
  import("@/pages/admin/review-queue").then((m) => ({ default: m.ReviewQueuePage })),
);

// Documents
const AllDocumentsPage = lazyPage(() =>
  import("@/pages/admin/documents/all-documents").then((m) => ({ default: m.AllDocumentsPage })),
);
const CaseFilingsPage = lazyPage(() =>
  import("@/pages/admin/documents/case-filings").then((m) => ({ default: m.CaseFilingsPage })),
);
const InterviewPackagesPage = lazyPage(() =>
  import("@/pages/admin/documents/interview-packages").then((m) => ({ default: m.InterviewPackagesPage })),
);
const DocumentCreatorPage = lazyPage(() =>
  import("@/pages/admin/documents/document-creator").then((m) => ({ default: m.DocumentCreatorPage })),
);
const DocumentTemplatesPage = lazyPage(() =>
  import("@/pages/admin/documents/templates").then((m) => ({ default: m.DocumentTemplatesPage })),
);

// Calendar
const CalendarPage = lazyPage(() =>
  import("@/pages/admin/calendar/calendar-page").then((m) => ({ default: m.CalendarPage })),
);
const DeadlineRulesPage = lazyPage(() =>
  import("@/pages/admin/calendar/deadline-rules-page").then((m) => ({ default: m.DeadlineRulesPage })),
);
const ServiceRequestsPage = lazyPage(() =>
  import("@/pages/admin/calendar/service-requests-page").then((m) => ({ default: m.ServiceRequestsPage })),
);

// AI Review
const AiReviewDashboardPage = lazyPage(() =>
  import("@/pages/admin/ai-review/error-dashboard").then((m) => ({ default: m.AiReviewDashboardPage })),
);
const AiReviewByCasePage = lazyPage(() =>
  import("@/pages/admin/ai-review/by-case").then((m) => ({ default: m.AiReviewByCasePage })),
);
const AiReviewByDocumentPage = lazyPage(() =>
  import("@/pages/admin/ai-review/by-document").then((m) => ({ default: m.AiReviewByDocumentPage })),
);
const AiReviewResolutionLogPage = lazyPage(() =>
  import("@/pages/admin/ai-review/resolution-log").then((m) => ({ default: m.AiReviewResolutionLogPage })),
);
const AiReviewSettingsPage = lazyPage(() =>
  import("@/pages/admin/ai-review/settings").then((m) => ({ default: m.AiReviewSettingsPage })),
);

// Staff
const StaffAndUsersPage = lazyPage(() =>
  import("@/pages/admin/staff-and-users").then((m) => ({ default: m.StaffAndUsersPage })),
);
const StaffTab = lazyPage(() => import("@/pages/admin/staff-and-users/tabs/staff"));
const TeamsTab = lazyPage(() => import("@/pages/admin/staff-and-users/tabs/teams"));
const CertificationsTab = lazyPage(() => import("@/pages/admin/staff-and-users/tabs/certifications"));
const PerformanceTab = lazyPage(() => import("@/pages/admin/staff-and-users/tabs/performance"));
const TimeTrackingTab = lazyPage(() => import("@/pages/admin/staff-and-users/tabs/time-tracking"));
const LeaveTab = lazyPage(() => import("@/pages/admin/staff-and-users/tabs/leave"));
const InvitationsTab = lazyPage(() => import("@/pages/admin/staff-and-users/tabs/invitations"));

// Finance
const FinancePage = lazyPage(() =>
  import("@/pages/admin/finance").then((m) => ({ default: m.FinancePage })),
);
const InvoicingTab = lazyPage(() => import("@/pages/admin/finance/tabs/invoicing"));
const TimeBillingTab = lazyPage(() => import("@/pages/admin/finance/tabs/time-billing"));
const ReportsTab = lazyPage(() => import("@/pages/admin/finance/tabs/reports"));

// Shared
const ComingSoonPage = lazyPage(() =>
  import("@/pages/coming-soon").then((m) => ({ default: m.ComingSoonPage })),
);
const NotFoundPage = lazyPage(() =>
  import("@/pages/not-found").then((m) => ({ default: m.NotFoundPage })),
);

export function createAdminRouter() {
  return createBrowserRouter(
    createRoutesFromElements(
      <Route errorElement={<RouteErrorBoundary />}>
        {/* Auth callback routes */}
        <Route path="/email-verified" element={<EmailVerifiedPage />} />
        <Route path="/verify-email" element={<VerifyEmailNoticePage />} />
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />

            <Route path="step-2-firm-details" element={<Step2FirmDetailsPage />} />
        {/* Protected admin routes */}
        <Route element={<AdminGuard />}>
          {/* Onboarding (no dashboard chrome yet) */}
          <Route path="/onboarding">
            <Route path="step-0-source" element={<Step0SourcePage />} />
            <Route path="step-1-profile" element={<Step1ProfilePage />} />
            <Route path="step-2-firm-details" element={<Step2FirmDetailsPage />} />
            <Route path="step-3-tos" element={<Step3TosPage />} />
          </Route>

          {/* Dashboard app — everything below renders inside AdminLayout */}
          <Route
            path="/"
            element={
              <UnsavedChangesProvider>
                <AdminLayout />
              </UnsavedChangesProvider>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard">
              <Route path="pipeline" element={<AdminDashboard />} />
              <Route path="activity" element={<AdminDashboard />} />
            </Route>

            <Route path="settings">
              <Route path="email-accounts" element={<EmailAccountConnectionPage />} />
              <Route path="firm-settings" element={<FirmSettingsPage />}>
                <Route index element={<GeneralTab />} />
                <Route path="general" element={<Navigate to="/settings/firm-settings" replace />} />
                <Route path="billing" element={<BillingTab />} />
                <Route path="notifications" element={<NotificationsTab />} />
                <Route path="compliance" element={<ComplianceTab />} />
              </Route>
              {/* Routes exist in the nav but aren't implemented yet */}
              <Route path="add-on-activation" element={<ComingSoonPage title="Add-on activation" showBack={false} />} />
              <Route path="rbac" element={<ComingSoonPage title="RBAC" showBack={false} />} />
              <Route path="integrations" element={<ComingSoonPage title="Integrations" showBack={false} />} />
              <Route path="training-platform" element={<ComingSoonPage title="Training platform" showBack={false} />} />
              <Route path="education-leads" element={<ComingSoonPage title="Education &amp; leads" showBack={false} />} />
            </Route>

            <Route path="profile" element={<MyProfilePage />}>
              <Route index element={<ProfileTab />} />
              <Route path="profile" element={<Navigate to="/profile" replace />} />
              <Route path="security" element={<SecurityTab />} />
              <Route path="appearance" element={<AppearanceTab />} />
            </Route>

            {/* Leads */}
            <Route path="leads">
              <Route index element={<LeadsPage />} />
              <Route path="my-tasks" element={<MyLeadsTasksPage />} />
              <Route path="review-queue" element={<LeadReviewQueuePage />} />
              <Route path=":leadId" element={<LeadDetailPage />}>
                <Route index element={<LeadOverviewTabRoute />} />
                <Route path="intake-pipeline" element={<IntakePipelineTabRoute />} />
                <Route path="documents" element={<LeadDocumentsTabRoute />} />
                <Route path="timeline" element={<LeadTimelineTabRoute />} />
                <Route path="audit-log" element={<LeadAuditLogTabRoute />} />
                <Route path="notes" element={<LeadNotesTabRoute />} />
              </Route>
              <Route path=":leadId/conflict-check" element={<ConflictCheckPage />} />
              <Route path=":leadId/questionnaire" element={<QuestionnairePage />} />
              <Route path=":leadId/consultation" element={<ConsultationPage />} />
              <Route path=":leadId/case-opening" element={<CaseOpeningPage />} />
            </Route>

            <Route path="intake">
              <Route path="crm-leads" element={<CrmLeadsPage />} />
            </Route>

            {/* Cases */}
            <Route path="cases">
              <Route index element={<CasesPage />} />
              <Route path=":caseId" element={<CaseDetailPage />}>
                <Route index element={<CaseOverviewTabRoute />} />
                <Route path="workflow" element={<CaseWorkflowTabRoute />} />
                <Route path="people" element={<CasePeopleTabRoute />} />
                <Route path="documents" element={<CaseDocumentsTabRoute />} />
                <Route path="timeline" element={<CaseTimelineTabRoute />} />
                <Route path="notes" element={<CaseNotesTabRoute />} />
                <Route path="ai-review" element={<CaseAiReviewTabRoute />} />
                <Route path="audit-log" element={<CaseAuditLogTabRoute />} />
              </Route>
              <Route path="my-tasks" element={<MyTasksPage />} />
              <Route path="review-queue" element={<ReviewQueuePage />} />
              {/* In the nav but not implemented yet */}
              <Route path="policy-alerts" element={<ComingSoonPage title="Policy alerts" showBack={false} />} />
            </Route>

            {/* Staff */}
            <Route path="staff">
              <Route path="contractors">
                <Route path="marketplace" element={<ComingSoonPage title="Contractor marketplace" showBack={false} />} />
                <Route path="active-engagements" element={<ComingSoonPage title="Active engagements" showBack={false} />} />
              </Route>
            </Route>
            <Route path="staff-management" element={<StaffAndUsersPage />}>
              <Route index element={<StaffTab />} />
              <Route path="accounts" element={<Navigate to="/staff-management" replace />} />
              <Route path="teams" element={<TeamsTab />} />
              <Route path="certifications" element={<CertificationsTab />} />
              <Route path="performance" element={<PerformanceTab />} />
              <Route path="time-tracking" element={<TimeTrackingTab />} />
              <Route path="leave" element={<LeaveTab />} />
              <Route path="invitations" element={<InvitationsTab />} />
            </Route>

            {/* Finance */}
            <Route path="finance" element={<FinancePage />}>
              <Route index element={<Navigate to="/finance/invoicing" replace />} />
              <Route path="invoicing" element={<InvoicingTab />} />
              <Route path="time-billing" element={<TimeBillingTab />} />
              <Route path="reports" element={<ReportsTab />} />
            </Route>

            {/* Analytics */}
            <Route path="analytics">
              <Route path="firm-overview" element={<ComingSoonPage title="Firm overview" showBack={false} />} />
              <Route path="revenue-billing" element={<ComingSoonPage title="Revenue &amp; billing" showBack={false} />} />
              <Route path="staff-performance" element={<ComingSoonPage title="Staff performance" showBack={false} />} />
              <Route path="intake-crm" element={<ComingSoonPage title="Intake &amp; CRM" showBack={false} />} />
              <Route path="compliance" element={<ComingSoonPage title="Compliance" showBack={false} />} />
            </Route>

            {/* Documents */}
            <Route path="documents">
              <Route index element={<AllDocumentsPage />} />
              <Route path="case-filings" element={<CaseFilingsPage />} />
              <Route path="interview-packages" element={<InterviewPackagesPage />} />
              <Route path="creator" element={<DocumentCreatorPage />} />
              <Route path="templates" element={<DocumentTemplatesPage />} />
            </Route>

            {/* Calendar */}
            <Route path="calendar">
              <Route index element={<CalendarDataProvider><CalendarPage /></CalendarDataProvider>} />
              <Route path="hearings" element={<CalendarDataProvider filter="master_calendar_hearing"><CalendarPage /></CalendarDataProvider>} />
              <Route path="interviews" element={<CalendarDataProvider filter="uscis_interview"><CalendarPage /></CalendarDataProvider>} />
              <Route path="deadlines" element={<CalendarDataProvider filter="filing_deadline"><CalendarPage /></CalendarDataProvider>} />
              <Route path="appointments" element={<CalendarDataProvider filter="client_meeting"><CalendarPage /></CalendarDataProvider>} />
              <Route path="deadline-rules" element={<DeadlineRulesPage />} />
              <Route path="service-requests" element={<ServiceRequestsPage />} />
            </Route>

            {/* AI Review */}
            <Route path="ai-review">
              <Route index element={<AiReviewDashboardPage />} />
              <Route path="by-case" element={<AiReviewByCasePage />} />
              <Route path="by-document" element={<AiReviewByDocumentPage />} />
              <Route path="resolution-log" element={<AiReviewResolutionLogPage />} />
              <Route path="settings" element={<AiReviewSettingsPage />} />
            </Route>

            {/* Unknown admin paths render the 404 inside the dashboard layout. */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Route>,
    ),
  );
}
