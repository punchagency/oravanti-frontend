import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from "react-router";
import { GuestGuard } from "@/routers/public/guard";
import { PublicCatchAll } from "@/routers/public/catch-all";
import { RouteErrorBoundary } from "@/components/ui/error-boundary";
import { lazyPage } from "@/routers/lazy";

const AcceptInvitationPage = lazyPage(() => import("@/pages/accept-invitation"));
const AgreementSigningPage = lazyPage(() =>
  import("@/pages/agreement-signing").then((m) => ({ default: m.AgreementSigningPage })),
);
const DocumentUploadPage = lazyPage(() =>
  import("@/pages/document-upload").then((m) => ({ default: m.DocumentUploadPage })),
);
const ConsultationBookingPage = lazyPage(() =>
  import("@/pages/consultation-booking").then((m) => ({ default: m.ConsultationBookingPage })),
);
const SignUpPage = lazyPage(() =>
  import("@/pages/contractor-sign-up").then((m) => ({ default: m.SignUpPage })),
);
const EmailVerifiedPage = lazyPage(() => import("@/pages/email-verified"));
const ForgotPassword = lazyPage(() => import("@/pages/forgot-password"));
const VerifyOtp = lazyPage(() => import("@/pages/forgot-password/verify-otp"));
const LoginPage = lazyPage(() =>
  import("@/pages/login").then((m) => ({ default: m.LoginPage })),
);
const QuestionnairePortalPage = lazyPage(() =>
  import("@/pages/questionnaire-portal").then((m) => ({ default: m.QuestionnairePortalPage })),
);
const ResetPassword = lazyPage(() => import("@/pages/reset-password"));
const SetPasswordPage = lazyPage(() => import("@/pages/set-password"));
const VerifyEmailNoticePage = lazyPage(() => import("@/pages/verify-email"));
const TwoFactorVerification = lazyPage(() => import("@/pages/two-factor"));

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

        {/*
         * Catch-all. Paths that only exist in the admin/client routers land
         * here while the public router is mounted (not signed in):
         *  - real app route → remember the destination in the URL, go to /login
         *  - anything else  → true 404 (no such page in the app)
         */}
        <Route path="*" element={<PublicCatchAll />} />
      </Route>,
    ),
  );
}
