import { AdminLayout } from "@/components/layout/admin-layout";
import {
  AiReviewByCasePage,
  AiReviewByDocumentPage,
  AiReviewDashboardPage,
  AiReviewResolutionLogPage,
  AiReviewSettingsPage,
} from "@/pages/admin/ai-review";
import { CalendarDataProvider, CalendarPage, DeadlineRulesPage, ServiceRequestsPage } from "@/pages/admin/calendar";
import { CaseDetailPage, CasesPage } from "@/pages/admin/cases";
import {
  CaseAiReviewTabRoute,
  CaseAuditLogTabRoute,
  CaseDocumentsTabRoute,
  CaseNotesTabRoute,
  CaseOverviewTabRoute,
  CasePeopleTabRoute,
  CaseTimelineTabRoute,
  CaseWorkflowTabRoute,
} from "@/pages/admin/cases/components/case-details/tab-routes";
import { CrmLeadsPage } from "@/pages/admin/crm-leads";
import { AdminDashboard } from "@/pages/admin/dashboard";
import { InvoicePaymentPage } from "@/pages/invoice-payment";
import { FinancePage } from "@/pages/admin/finance";
import InvoicingTab from "@/pages/admin/finance/tabs/invoicing";
import ReportsTab from "@/pages/admin/finance/tabs/reports";
import TimeBillingTab from "@/pages/admin/finance/tabs/time-billing";
import { LeadReviewQueuePage } from "@/pages/admin/lead-review-queue";
import {
  LeadDetailPage,
  LeadsPage,
  MyLeadsTasksPage,
} from "@/pages/admin/leads";
import { CaseOpeningPage } from "@/pages/admin/leads/components/intake-pipeline/pages/lead-case-opening-page";
import { ConflictCheckPage } from "@/pages/admin/leads/components/intake-pipeline/pages/lead-conflict-check-page";
import { ConsultationPage } from "@/pages/admin/leads/components/intake-pipeline/pages/lead-consultation-page";
import { QuestionnairePage } from "@/pages/admin/leads/components/intake-pipeline/pages/lead-questionnaire-page";
import {
  DocumentsTabRoute,
  IntakePipelineTabRoute,
  LeadAuditLogTabRoute,
  LeadOverviewTabRoute,
  NotesTabRoute,
  TimelineTabRoute,
} from "@/pages/admin/leads/components/lead-details/tab-routes";
import { MyTasksPage } from "@/pages/admin/my-tasks";
import { ReviewQueuePage } from "@/pages/admin/review-queue";
import { EmailAccountConnectionPage } from "@/pages/admin/settings/email-account-connection";
import { FirmSettingsPage } from "@/pages/admin/settings/firm-settings";
import GeneralTab from "@/pages/admin/settings/firm-settings/tabs/general";
import BillingTab from "@/pages/admin/settings/firm-settings/tabs/billing";
import NotificationsTab from "@/pages/admin/settings/firm-settings/tabs/notifications";
import ComplianceTab from "@/pages/admin/settings/firm-settings/tabs/compliance";

import { MyProfilePage } from "@/pages/admin/my-profile";
import ProfileTab from "@/pages/admin/my-profile/tabs/profile";
import SecurityTab from "@/pages/admin/my-profile/tabs/security";
import AppearanceTab from "@/pages/admin/my-profile/tabs/appearance";
import { UnsavedChangesProvider } from "@/contexts/unsaved-changes-context";
import { StaffAndUsersPage } from "@/pages/admin/staff-and-users";
import Certifications from "@/pages/admin/staff-and-users/tabs/certifications";
import Invitations from "@/pages/admin/staff-and-users/tabs/invitations";
import Leave from "@/pages/admin/staff-and-users/tabs/leave";
import Performance from "@/pages/admin/staff-and-users/tabs/performance";
import Staff from "@/pages/admin/staff-and-users/tabs/staff";
import Teams from "@/pages/admin/staff-and-users/tabs/teams";
import TimeTracking from "@/pages/admin/staff-and-users/tabs/time-tracking";
import { NotFoundPage } from "@/pages/not-found";

import {
  Navigate,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router";
import { AuthGuard } from "./guards/auth-guard";
import { GuestGuard } from "./guards/guest-guard";
import AcceptInvitationPage from "./pages/accept-invitation";
import { AgreementSigningPage } from "./pages/agreement-signing";
import { DocumentUploadPage } from "./pages/document-upload";
import { ConsultationBookingPage } from "./pages/consultation-booking";
import { SignUpPage } from "./pages/contractor-sign-up";
import EmailVerifiedPage from "./pages/email-verified";
import ForgotPassword from "./pages/forgot-password";
import VerifyOtp from "./pages/forgot-password/verify-otp";
import { LoginPage } from "./pages/login";
import Step0SourcePage from "./pages/onboarding/step-0-source";
import Step1ProfilePage from "./pages/onboarding/step-1-profile";
import Step2FirmDetailsPage from "./pages/onboarding/step-2-firm-details";
import Step3TosPage from "./pages/onboarding/step-3-tos";
import { QuestionnairePortalPage } from "./pages/questionnaire-portal";
import ResetPassword from "./pages/reset-password";
import SetPasswordPage from "./pages/set-password";
import VerifyEmailNoticePage from "./pages/verify-email";
import TwoFactorVerification from "./pages/two-factor";

function createAppRouter() {
  return createBrowserRouter(
    createRoutesFromElements(
      <Route>
      <Route element={<GuestGuard />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/two-factor" element={<TwoFactorVerification />} />
      </Route>

      <Route path="/forgot-password">
        <Route path="" element={<ForgotPassword />} />
        <Route path="verify-otp" element={<VerifyOtp />} />
      </Route>
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public client-facing questionnaire portal (token-gated, no auth) */}
      <Route
        path="/questionnaire/:firmSlug/:token"
        element={<QuestionnairePortalPage />}
      />

      {/* Public consultation booking & payment portal (token-gated, no auth) */}
      <Route
        path="/consultation-booking/:token"
        element={<ConsultationBookingPage />}
      />

      {/* Public fee-agreement signing page (token-gated, no auth) */}
      <Route path="/sign/:token" element={<AgreementSigningPage />} />

      {/* Public invoice payment page (token-gated, no auth) */}
      <Route path="/invoice-payment/:token" element={<InvoicePaymentPage />} />

      {/* Public document upload for an external request (token-gated, no auth) */}
      <Route path="/document-upload/:token" element={<DocumentUploadPage />} />

      <Route element={<AuthGuard />}>
        <Route path="/email-verified" element={<EmailVerifiedPage />} />
        <Route path="/verify-email" element={<VerifyEmailNoticePage />} />
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/onboarding/step-0-source" element={<Step0SourcePage />} />
        <Route
          path="/onboarding/step-1-profile"
          element={<Step1ProfilePage />}
        />
        <Route
          path="/onboarding/step-2-firm-details"
          element={<Step2FirmDetailsPage />}
        />
        <Route path="/onboarding/step-3-tos" element={<Step3TosPage />} />

        <Route
          path="/"
          element={
            <UnsavedChangesProvider>
              <AdminLayout />
            </UnsavedChangesProvider>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard/pipeline" element={<AdminDashboard />} />
          <Route path="dashboard/activity" element={<AdminDashboard />} />

          <Route path="settings">
            <Route
              path="email-accounts"
              element={<EmailAccountConnectionPage />}
            />
            <Route path="firm-settings" element={<FirmSettingsPage />}>
              <Route index element={<GeneralTab />} />
              <Route
                path="general"
                element={<Navigate to="/settings/firm-settings" replace />}
              />
              <Route path="billing" element={<BillingTab />} />
              <Route path="notifications" element={<NotificationsTab />} />
              <Route path="compliance" element={<ComplianceTab />} />
            </Route>
          </Route>

          <Route path="profile" element={<MyProfilePage />}>
            <Route index element={<ProfileTab />} />
            <Route
              path="profile"
              element={<Navigate to="/profile" replace />}
            />
            <Route path="security" element={<SecurityTab />} />
            <Route path="appearance" element={<AppearanceTab />} />
          </Route>

          <Route path="leads" element={<LeadsPage />} />
          <Route path="leads/my-tasks" element={<MyLeadsTasksPage />} />
          <Route path="leads/review-queue" element={<LeadReviewQueuePage />} />
          <Route path="leads/:leadId" element={<LeadDetailPage />}>
            <Route index element={<LeadOverviewTabRoute />} />
            <Route
              path="intake-pipeline"
              element={<IntakePipelineTabRoute />}
            />
            <Route path="documents" element={<DocumentsTabRoute />} />
            <Route path="timeline" element={<TimelineTabRoute />} />
            <Route path="audit-log" element={<LeadAuditLogTabRoute />} />
            <Route path="notes" element={<NotesTabRoute />} />
          </Route>
          <Route path="finance" element={<FinancePage />}>
            <Route index element={<Navigate to="/finance/invoicing" replace />} />
            <Route path="invoicing" element={<InvoicingTab />} />
            <Route path="time-billing" element={<TimeBillingTab />} />
            <Route path="reports" element={<ReportsTab />} />
          </Route>
          <Route
            path="leads/:leadId/conflict-check"
            element={<ConflictCheckPage />}
          />
          <Route
            path="leads/:leadId/questionnaire"
            element={<QuestionnairePage />}
          />
          <Route
            path="leads/:leadId/consultation"
            element={<ConsultationPage />}
          />
          <Route
            path="leads/:leadId/case-opening"
            element={<CaseOpeningPage />}
          />
          <Route path="intake/crm-leads" element={<CrmLeadsPage />} />

          <Route path="cases" element={<CasesPage />} />
          <Route path="cases/:caseId" element={<CaseDetailPage />}>
            <Route index element={<CaseOverviewTabRoute />} />
            <Route path="workflow" element={<CaseWorkflowTabRoute />} />
            <Route path="people" element={<CasePeopleTabRoute />} />
            <Route path="documents" element={<CaseDocumentsTabRoute />} />
            <Route path="timeline" element={<CaseTimelineTabRoute />} />
            <Route path="notes" element={<CaseNotesTabRoute />} />
            <Route path="ai-review" element={<CaseAiReviewTabRoute />} />
            <Route path="audit-log" element={<CaseAuditLogTabRoute />} />
          </Route>
          <Route path="cases/my-tasks" element={<MyTasksPage />} />
          <Route path="cases/review-queue" element={<ReviewQueuePage />} />

          <Route
            path="calendar"
            element={
              <CalendarDataProvider>
                <CalendarPage />
              </CalendarDataProvider>
            }
          />
          <Route
            path="calendar/hearings"
            element={
              <CalendarDataProvider filter="master_calendar_hearing">
                <CalendarPage />
              </CalendarDataProvider>
            }
          />
          <Route
            path="calendar/interviews"
            element={
              <CalendarDataProvider filter="uscis_interview">
                <CalendarPage />
              </CalendarDataProvider>
            }
          />
          <Route
            path="calendar/deadlines"
            element={
              <CalendarDataProvider filter="filing_deadline">
                <CalendarPage />
              </CalendarDataProvider>
            }
          />
          <Route
            path="calendar/appointments"
            element={
              <CalendarDataProvider filter="client_meeting">
                <CalendarPage />
              </CalendarDataProvider>
            }
          />
          <Route
            path="calendar/deadline-rules"
            element={<DeadlineRulesPage />}
          />
          <Route
            path="calendar/service-requests"
            element={<ServiceRequestsPage />}
          />
          <Route path="ai-review" element={<AiReviewDashboardPage />} />
          <Route path="ai-review/by-case" element={<AiReviewByCasePage />} />
          <Route
            path="ai-review/by-document"
            element={<AiReviewByDocumentPage />}
          />
          <Route
            path="ai-review/resolution-log"
            element={<AiReviewResolutionLogPage />}
          />
          <Route path="ai-review/settings" element={<AiReviewSettingsPage />} />

          <Route path="staff-management" element={<StaffAndUsersPage />}>
            <Route index element={<Staff />} />
            <Route
              path="accounts"
              element={<Navigate to="/staff-management" replace />}
            />
            <Route path="teams" element={<Teams />} />
            <Route path="certifications" element={<Certifications />} />
            <Route path="performance" element={<Performance />} />
            <Route path="time-tracking" element={<TimeTracking />} />
            <Route path="leave" element={<Leave />} />
            <Route path="invitations" element={<Invitations />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>,
    ),
  );
}

const router = createAppRouter();

export default function App() {
  return <RouterProvider router={router} />;
}
