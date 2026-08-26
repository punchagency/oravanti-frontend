import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from "react-router";
import { AdminLayout } from "@/components/layout/admin-layout";
import { UnsavedChangesProvider } from "@/contexts/unsaved-changes-context";
import { RouteErrorBoundary } from "@/components/ui/error-boundary";
import { RequirePermission } from "@/components/require-permission";
import { lazyPage, lazyStandalonePage } from "@/routers/lazy";
import { AdminGuard } from "@/routers/admin/guard";
import { CalendarDataProvider } from "@/pages/admin/calendar/calendar-data-context";

/* ------------------------------------------------------------------ *
 * Lazy-loaded pages. Kept in this file so the whole route table is   *
 * readable in one place; each page only loads when first visited.    *
 * ------------------------------------------------------------------ */

// Auth callback pages. These render without the dashboard chrome, so they use
// the spinner fallback — a skeleton reads as a broken screen on a centred card.
const AcceptInvitationPage = lazyStandalonePage(() => import("@/pages/accept-invitation"));
const EmailVerifiedPage = lazyStandalonePage(() => import("@/pages/email-verified"));
const SetPasswordPage = lazyStandalonePage(() => import("@/pages/set-password"));
const VerifyEmailNoticePage = lazyStandalonePage(() => import("@/pages/verify-email"));

// Token-gated recipient pages. Declared here as well as in the public router
// because they're reached from an emailed link: whoever opens it is whoever
// happens to be signed in in that browser, and that's often a staff member
// checking the link they just sent. Without these the admin router has no
// match and drops them on the dashboard 404 instead of the page.
const QuestionnairePortalPage = lazyStandalonePage(() =>
  import("@/pages/questionnaire-portal").then((m) => ({ default: m.QuestionnairePortalPage })),
);
const ConsultationBookingPage = lazyStandalonePage(() =>
  import("@/pages/consultation-booking").then((m) => ({ default: m.ConsultationBookingPage })),
);
const AgreementSigningPage = lazyStandalonePage(() =>
  import("@/pages/agreement-signing").then((m) => ({ default: m.AgreementSigningPage })),
);
const DocumentUploadPage = lazyStandalonePage(() =>
  import("@/pages/document-upload").then((m) => ({ default: m.DocumentUploadPage })),
);
const InvoicePaymentPage = lazyStandalonePage(() => import("@/pages/invoice-payment"));

// Onboarding — also outside AdminLayout, same reasoning.
const Step0SourcePage = lazyStandalonePage(() => import("@/pages/onboarding/step-0-source"));
const Step1ProfilePage = lazyStandalonePage(() => import("@/pages/onboarding/step-1-profile"));
const Step2FirmDetailsPage = lazyStandalonePage(() => import("@/pages/onboarding/step-2-firm-details"));
const Step3TosPage = lazyStandalonePage(() => import("@/pages/onboarding/step-3-tos"));

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
const ConsultationsTab = lazyPage(() => import("@/pages/admin/settings/firm-settings/tabs/consultations"));
const BillingTab = lazyPage(() => import("@/pages/admin/settings/firm-settings/tabs/billing"));
const NotificationsTab = lazyPage(() => import("@/pages/admin/settings/firm-settings/tabs/notifications"));
const ComplianceTab = lazyPage(() => import("@/pages/admin/settings/firm-settings/tabs/compliance"));
const AuditTrailPage = lazyPage(() =>
  import("@/pages/admin/settings/audit-trail").then((m) => ({ default: m.AuditTrailPage })),
);
const IntakeChecklistPage = lazyPage(() =>
  import("@/pages/admin/settings/intake-checklist").then((m) => ({ default: m.IntakeChecklistPage })),
);
const RolesPermissionsPage = lazyPage(() =>
  import("@/pages/admin/settings/roles-permissions").then((m) => ({ default: m.RolesPermissionsPage })),
);
const RbacStaffTab = lazyPage(() => import("@/pages/admin/settings/roles-permissions/tabs/staff"));
const RbacRolesTab = lazyPage(() => import("@/pages/admin/settings/roles-permissions/tabs/roles"));
const RbacGroupsTab = lazyPage(() => import("@/pages/admin/settings/roles-permissions/tabs/groups"));
const RbacMatrixTab = lazyPage(() => import("@/pages/admin/settings/roles-permissions/tabs/matrix"));
const PaymentsTab = lazyPage(() => import("@/pages/admin/settings/firm-settings/tabs/payments"));

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
const AnalyticsPageWrapper = lazyPage(() =>
  import("@/pages/admin/analytics/analytics-page-wrapper").then((m) => ({ default: m.AnalyticsPageWrapper })),
);
const NotFoundPage = lazyPage(() =>
  import("@/pages/not-found").then((m) => ({ default: m.NotFoundPage })),
);
const PortalAccessDisabledPage = lazyPage(() =>
  import("@/pages/portal-access-disabled"),
);

export function createAdminRouter() {
  return createBrowserRouter(
    createRoutesFromElements(
      <Route errorElement={<RouteErrorBoundary />}>
        {/* Auth callback routes */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/two-factor" element={<Navigate to="/" replace />} />
        <Route path="/email-verified" element={<EmailVerifiedPage />} />
        <Route path="/verify-email" element={<VerifyEmailNoticePage />} />
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />

        {/*
         * Public token-gated routes, mirrored from the public router. Outside
         * AdminGuard on purpose: the token is the authorisation, and the page
         * belongs to the lead/client the link was sent to, not to the signed-in
         * staff member who happens to be opening it.
         */}
        <Route path="/questionnaire/:firmSlug/:token" element={<QuestionnairePortalPage />} />
        <Route path="/consultation-booking/:token" element={<ConsultationBookingPage />} />
        <Route path="/sign/:token" element={<AgreementSigningPage />} />
        <Route path="/document-upload/:token" element={<DocumentUploadPage />} />
        <Route path="/invoice-payment/:token" element={<InvoicePaymentPage />} />

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
              <Route element={<RequirePermission permission="dashboard:read" />}>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard">
                  <Route path="pipeline" element={<AdminDashboard />} />
                  <Route path="activity" element={<AdminDashboard />} />
                </Route>
              </Route>

            <Route path="settings">
              <Route element={<RequirePermission permission="firm_settings:read" />}>
                <Route path="email-accounts" element={<EmailAccountConnectionPage />} />
                <Route path="firm-settings" element={<FirmSettingsPage />}>
                  <Route index element={<GeneralTab />} />
                  <Route path="general" element={<Navigate to="/settings/firm-settings" replace />} />
                  <Route path="consultations" element={<ConsultationsTab />} />
                  <Route path="billing" element={<BillingTab />} />
                  <Route path="notifications" element={<NotificationsTab />} />
                  <Route path="compliance" element={<ComplianceTab />} />
                  <Route path="payments" element={<PaymentsTab />} />
                </Route>
                <Route path="add-on-activation" element={<ComingSoonPage title="Add-on activation" showBack={false} />} />
                <Route path="integrations" element={<ComingSoonPage title="Integrations" showBack={false} />} />
                <Route path="training-platform" element={<ComingSoonPage title="Training platform" showBack={false} />} />
                <Route path="education-leads" element={<ComingSoonPage title="Education &amp; leads" showBack={false} />} />
              </Route>
              {/*
                The firm-wide trail. Gated server-side on the `audit` resource, so an
                attorney reaching this URL gets a 403 from the API rather than an
                empty table — the per-entity activity tabs are their surface.
              */}
              <Route element={<RequirePermission permission="audit:read" />}>
                <Route path="audit-trail" element={<AuditTrailPage />} />
              </Route>
              {/*
                The intake checklist. `workflow:read` to look, `workflow:update`
                to change — the same pair the case workflow template editor uses,
                and deliberately not `firm_settings`, which also carries billing
                and compliance.
              */}
              <Route element={<RequirePermission permission="workflow:read" />}>
                <Route path="intake-checklist" element={<IntakeChecklistPage />} />
              </Route>
              {/*
                Viewing RBAC (staff assignments, roles, groups, the matrix)
                is gated like every other page — `ac:read`, grantable through
                the matrix itself. Actually creating/editing/deleting a role
                or group stays locked to the owner/admin roles directly
                (`requireOwnerOrAdmin`, server-side) regardless of `ac:*`
                grants, so a firm can hand a custom role read access here
                without that role being able to grant itself more.
              */}
              <Route element={<RequirePermission permission="ac:read" />}>
                <Route path="rbac" element={<RolesPermissionsPage />}>
                  <Route index element={<RbacStaffTab />} />
                  <Route path="roles" element={<RbacRolesTab />} />
                  <Route path="groups" element={<RbacGroupsTab />} />
                  <Route path="matrix" element={<RbacMatrixTab />} />
                </Route>
              </Route>
            </Route>

            <Route path="profile" element={<MyProfilePage />}>
              <Route index element={<ProfileTab />} />
              <Route path="profile" element={<Navigate to="/profile" replace />} />
              <Route path="security" element={<SecurityTab />} />
              <Route path="appearance" element={<AppearanceTab />} />
            </Route>

            {/* Leads */}
            <Route element={<RequirePermission permission="leads:read" />}>
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
            </Route>

            {/* Cases */}
            <Route element={<RequirePermission permission="cases:read" />}>
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
            </Route>

            {/* Staff */}
            <Route element={<RequirePermission permission="staffs:read" />}>
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
            </Route>

            {/* Finance */}
            <Route element={<RequirePermission permission="finance:read" />}>
              <Route path="finance" element={<FinancePage />}>
                <Route index element={<Navigate to="/finance/invoicing" replace />} />
                <Route path="invoicing" element={<InvoicingTab />} />
                <Route path="time-billing" element={<TimeBillingTab />} />
                <Route path="reports" element={<ReportsTab />} />
              </Route>
            </Route>

            {/* Analytics */}
            <Route element={<RequirePermission permission="analytics:read" />}>
              <Route path="analytics">
                <Route path="firm-overview" element={<AnalyticsPageWrapper title="Firm overview" />} />
                <Route path="revenue-billing" element={<AnalyticsPageWrapper title="Revenue &amp; billing" />} />
                <Route path="staff-performance" element={<AnalyticsPageWrapper title="Staff performance" />} />
                <Route path="intake-crm" element={<AnalyticsPageWrapper title="Intake &amp; CRM" />} />
                <Route path="compliance" element={<AnalyticsPageWrapper title="Compliance" />} />
              </Route>
            </Route>

            {/* Documents */}
            <Route element={<RequirePermission permission="documents:read" />}>
              <Route path="documents">
                <Route index element={<AllDocumentsPage />} />
                <Route path="case-filings" element={<CaseFilingsPage />} />
                <Route path="interview-packages" element={<InterviewPackagesPage />} />
                <Route path="creator" element={<DocumentCreatorPage />} />
                <Route path="templates" element={<DocumentTemplatesPage />} />
              </Route>
            </Route>

            {/* Calendar */}
            <Route element={<RequirePermission permission="calendar:read" />}>
              <Route path="calendar">
                <Route index element={<CalendarDataProvider><CalendarPage /></CalendarDataProvider>} />
                <Route path="hearings" element={<CalendarDataProvider filter="master_calendar_hearing"><CalendarPage /></CalendarDataProvider>} />
                <Route path="interviews" element={<CalendarDataProvider filter="uscis_interview"><CalendarPage /></CalendarDataProvider>} />
                <Route path="deadlines" element={<CalendarDataProvider filter="filing_deadline"><CalendarPage /></CalendarDataProvider>} />
                <Route path="appointments" element={<CalendarDataProvider filter="client_meeting"><CalendarPage /></CalendarDataProvider>} />
                <Route path="deadline-rules" element={<DeadlineRulesPage />} />
                <Route path="service-requests" element={<ServiceRequestsPage />} />
              </Route>
            </Route>

            {/* AI Review */}
            <Route element={<RequirePermission permission="ai_review:read" />}>
              <Route path="ai-review">
                <Route index element={<AiReviewDashboardPage />} />
                <Route path="by-case" element={<AiReviewByCasePage />} />
                <Route path="by-document" element={<AiReviewByDocumentPage />} />
                <Route path="resolution-log" element={<AiReviewResolutionLogPage />} />
                <Route path="settings" element={<AiReviewSettingsPage />} />
              </Route>
            </Route>

            {/* Unknown admin paths render the 404 inside the dashboard layout. */}
            <Route path="*" element={<NotFoundPage />} />
            <Route path="portal-access-disabled" element={<PortalAccessDisabledPage />} />
          </Route>
        </Route>
      </Route>,
    ),
  );
}
