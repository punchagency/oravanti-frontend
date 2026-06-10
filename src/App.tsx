import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage as AdminDashboardPage } from "@/pages/admin/dashboard";
import { NotFoundPage } from "@/pages/not-found";
import { SignUpPage } from "@/pages/sign-up";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router";
import { AuthGuard } from "./guards/auth-guard";
import { GuestGuard } from "./guards/guest-guard";
import EmailVerifiedPage from "./pages/email-verified";
import ForgotPassword from "./pages/forgot-password";
import VerifyOtp from "./pages/forgot-password/verify-otp";
import { LoginPage } from "./pages/login";
import Step1DomainPage from "./pages/onboarding/step-1-domain";
import Step2ProfilePage from "./pages/onboarding/step-2-profile";
import Step3FirmDetailsPage from "./pages/onboarding/step-3-firm-details";
import Step4TosPage from "./pages/onboarding/step-4-tos";
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
        <Route path="/onboarding/step-1-domain" element={<Step1DomainPage />} />
        <Route
          path="/onboarding/step-2-profile"
          element={<Step2ProfilePage />}
        />
        <Route
          path="/onboarding/step-3-firm-details"
          element={<Step3FirmDetailsPage />}
        />
        <Route path="/onboarding/step-4-tos" element={<Step4TosPage />} />
        <Route path="/admin" element={<AppShell />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
);

export default function App() {
  return <RouterProvider router={router} />;
}
