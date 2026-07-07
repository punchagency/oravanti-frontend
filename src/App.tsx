import { AdminLayout } from "@/components/layout/admin-layout";
import { CrmLeadsPage } from "@/pages/admin/crm-leads";
import { AdminDashboard } from "@/pages/admin/dashboard";
import { IntakePipelinePage } from "@/pages/admin/intake";
import { CasesPage } from "@/pages/admin/cases";
import { StaffAndUsersPage } from "@/pages/admin/staff-and-users";
import { EmailAccountConnectionPage } from "@/pages/admin/settings/email-account-connection";
import { FirmSettingsPage } from "@/pages/admin/settings/firm-settings";
import { NotFoundPage } from "@/pages/not-found";
import Certifications from "@/pages/admin/staff-and-users/tabs/certifications";
import Invitations from "@/pages/admin/staff-and-users/tabs/invitations";
import Leave from "@/pages/admin/staff-and-users/tabs/leave";
import Performance from "@/pages/admin/staff-and-users/tabs/performance";
import Staff from "@/pages/admin/staff-and-users/tabs/staff";
import Teams from "@/pages/admin/staff-and-users/tabs/teams";
import TimeTracking from "@/pages/admin/staff-and-users/tabs/time-tracking";
import {
  Navigate,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router";
import { AuthGuard } from "./guards/auth-guard";
import { GuestGuard } from "./guards/guest-guard";
import { SignUpPage } from "./pages/contractor-sign-up";
import EmailVerifiedPage from "./pages/email-verified";
import ForgotPassword from "./pages/forgot-password";
import VerifyOtp from "./pages/forgot-password/verify-otp";
import { LoginPage } from "./pages/login";
import AcceptInvitationPage from "./pages/accept-invitation";
import SetPasswordPage from "./pages/set-password";
import Step0SourcePage from "./pages/onboarding/step-0-source";
import Step1ProfilePage from "./pages/onboarding/step-1-profile";
import Step2FirmDetailsPage from "./pages/onboarding/step-2-firm-details";
import Step3TosPage from "./pages/onboarding/step-3-tos";
import ResetPassword from "./pages/reset-password";
import { QuestionnairePortalPage } from "./pages/questionnaire-portal";
import { ConsultationBookingPage } from "./pages/consultation-booking";
import { AgreementSigningPage } from "./pages/agreement-signing";
import VerifyEmailNoticePage from "./pages/verify-email";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route element={<GuestGuard />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
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

      <Route element={<AuthGuard />}>
        <Route path="/email-verified" element={<EmailVerifiedPage />} />
        <Route path="/verify-email" element={<VerifyEmailNoticePage />} />
        <Route
          path="/accept-invitation"
          element={<AcceptInvitationPage />}
        />
        <Route
          path="/set-password"
          element={<SetPasswordPage />}
        />
        <Route
          path="/onboarding/step-0-source"
          element={<Step0SourcePage />}
        />
        <Route
          path="/onboarding/step-1-profile"
          element={<Step1ProfilePage />}
        />
        <Route
          path="/onboarding/step-2-firm-details"
          element={<Step2FirmDetailsPage />}
        />
        <Route path="/onboarding/step-3-tos" element={<Step3TosPage />} />

        <Route path="/" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard/pipeline" element={<AdminDashboard />} />
          <Route path="dashboard/activity" element={<AdminDashboard />} />

          <Route path="settings">
            <Route
              path="email-accounts"
              element={<EmailAccountConnectionPage />}
            />
            <Route path="firm-settings" element={<FirmSettingsPage />} />
          </Route>

          <Route
            path="intake/pipeline/lead-inbox"
            element={<IntakePipelinePage />}
          />
          <Route
            path="intake/pipeline/conflict-check"
            element={<IntakePipelinePage />}
          />
          <Route
            path="intake/pipeline/questionnaire"
            element={<IntakePipelinePage />}
          />
          <Route
            path="intake/pipeline/consultation"
            element={<IntakePipelinePage />}
          />
          <Route
            path="intake/pipeline/case-opening"
            element={<IntakePipelinePage />}
          />
          <Route path="intake/crm-leads" element={<CrmLeadsPage />} />

          <Route path="cases" element={<CasesPage />} />

          <Route path="staff-management" element={<StaffAndUsersPage />}>
            <Route index element={<Staff />} />
            <Route path="accounts" element={<Navigate to="/staff-management" replace />} />
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

export default function App() {
  return <RouterProvider router={router} />;
}
