import { AdminLayout } from "@/components/layout/admin-layout";
import { CrmLeadsPage } from "@/pages/admin/crm-leads";
import { AdminDashboard } from "@/pages/admin/dashboard";
import { IntakePipelinePage } from "@/pages/admin/intake";
import { EmailAccountConnectionPage } from "@/pages/admin/settings/email-account-connection";
import { NotFoundPage } from "@/pages/not-found";
import {
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
import Step1ProfilePage from "./pages/onboarding/step-1-profile";
import Step2FirmDetailsPage from "./pages/onboarding/step-2-firm-details";
import Step3TosPage from "./pages/onboarding/step-3-tos";
import ResetPassword from "./pages/reset-password";
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

      <Route element={<AuthGuard />}>
        <Route path="/email-verified" element={<EmailVerifiedPage />} />
        <Route path="/verify-email" element={<VerifyEmailNoticePage />} />
        <Route
          path="/onboarding/step-1-profile"
          element={<Step1ProfilePage />}
        />
        <Route
          path="/onboarding/step-2-firm-details"
          element={<Step2FirmDetailsPage />}
        />
        <Route path="/onboarding/step-3-tos" element={<Step3TosPage />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard/pipeline" element={<AdminDashboard />} />
          <Route path="dashboard/activity" element={<AdminDashboard />} />

          <Route path="settings">
            <Route
              path="email-accounts"
              element={<EmailAccountConnectionPage />}
            />
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
            path="intake/pipeline/fee-agreement"
            element={<IntakePipelinePage />}
          />
          <Route
            path="intake/pipeline/case-opening"
            element={<IntakePipelinePage />}
          />
          <Route path="intake/crm-leads" element={<CrmLeadsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>,
  ),
);

export default function App() {
  return <RouterProvider router={router} />;
}
