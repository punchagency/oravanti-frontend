import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from "react-router";
import { GuestGuard } from "@/routers/public/guard";
import { PublicCatchAll } from "@/routers/public/catch-all";
import { RouteErrorBoundary } from "@/components/ui/error-boundary";

import AcceptInvitationPage from "@/pages/accept-invitation";
import { AgreementSigningPage } from "@/pages/agreement-signing";
import { DocumentUploadPage } from "@/pages/document-upload";
import { ConsultationBookingPage } from "@/pages/consultation-booking";
import { SignUpPage } from "@/pages/contractor-sign-up";
import EmailVerifiedPage from "@/pages/email-verified";
import ForgotPassword from "@/pages/forgot-password";
import VerifyOtp from "@/pages/forgot-password/verify-otp";
import { LoginPage } from "@/pages/login";
import { QuestionnairePortalPage } from "@/pages/questionnaire-portal";
import ResetPassword from "@/pages/reset-password";
import SetPasswordPage from "@/pages/set-password";
import VerifyEmailNoticePage from "@/pages/verify-email";
import TwoFactorVerification from "@/pages/two-factor";
import InvoicePaymentPage from "@/pages/invoice-payment";
import ConfidoOwnerFormPage from "@/pages/confido-owner-form";

export function createPublicRouter() {
  return createBrowserRouter(
    createRoutesFromElements(
      <Route errorElement={<RouteErrorBoundary />}>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Guest routes (redirect to / if already authenticated) */}
        <Route element={<GuestGuard />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/two-factor" element={<TwoFactorVerification />} />
        </Route>

        {/* Password reset flows */}
        <Route path="/forgot-password">
          <Route index element={<ForgotPassword />} />
          <Route path="verify-otp" element={<VerifyOtp />} />
        </Route>
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Auth callback routes */}
        <Route path="/email-verified" element={<EmailVerifiedPage />} />
        <Route path="/verify-email" element={<VerifyEmailNoticePage />} />
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />

        {/* Public token-gated routes */}
        <Route
          path="/questionnaire/:firmSlug/:token"
          element={<QuestionnairePortalPage />}
        />
        <Route
          path="/consultation-booking/:token"
          element={<ConsultationBookingPage />}
        />
        <Route path="/sign/:token" element={<AgreementSigningPage />} />
        <Route path="/document-upload/:token" element={<DocumentUploadPage />} />
        <Route path="/invoice-payment/:token" element={<InvoicePaymentPage />} />
        {/* A beneficial owner is not a user of ours; the o_code is the credential. */}
        <Route path="/payments/owner-form" element={<ConfidoOwnerFormPage />} />

        {/*
         * Catch-all. Paths that only exist in the admin/client routers land
         * here while the public router is mounted (not signed in):
         *  - real app route → remember the destination in the URL, go to /login
         *  - anything else  → true 404 (no such page in the app)
         */}
        <Route path="*" element={<PublicCatchAll />} />
      </Route>
    ),
  );
}
