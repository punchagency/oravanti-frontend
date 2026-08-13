import { ClientPortalLayout } from "@/components/layout/client-portal-layout";
import { ClientGuard } from "@/routers/client/guard";
import { UnsavedChangesProvider } from "@/contexts/unsaved-changes-context";
import { Route, createBrowserRouter, createRoutesFromElements, Navigate } from "react-router";
import { lazyPage } from "@/routers/lazy";

import AcceptInvitationPage from "@/pages/accept-invitation";
import EmailVerifiedPage from "@/pages/email-verified";
import PortalAccessDisabledPage from "@/pages/portal-access-disabled";
import SetPasswordPage from "@/pages/set-password";
import VerifyEmailNoticePage from "@/pages/verify-email";
import { NotFoundPage } from "@/pages/not-found";

const ClientOverviewPage = lazyPage(() => import("@/pages/client-portal/overview"));
const CaseFilesPage = lazyPage(() => import("@/pages/client-portal/case-files"));
const TimelinePage = lazyPage(() => import("@/pages/client-portal/timeline"));
const AppointmentsPage = lazyPage(() => import("@/pages/client-portal/appointments"));
const UpcomingAppointmentsPage = lazyPage(() => import("@/pages/client-portal/appointments/upcoming"));
const PastAppointmentsPage = lazyPage(() => import("@/pages/client-portal/appointments/past"));
const PaymentsPage = lazyPage(() => import("@/pages/client-portal/payments"));
const FeeAgreementPage = lazyPage(() => import("@/pages/client-portal/payments/fee-agreement"));
const PaymentHistoryPage = lazyPage(() => import("@/pages/client-portal/payments/history"));
const MessagesPage = lazyPage(() => import("@/pages/client-portal/messages"));
const InboxPage = lazyPage(() => import("@/pages/client-portal/messages/inbox"));
const ResourcesPage = lazyPage(() => import("@/pages/client-portal/resources"));
const ClientSettingsPage = lazyPage(() =>
  import("@/pages/client-portal/settings").then((m) => ({ default: m.ClientSettingsPage })),
);
const ClientProfileTab = lazyPage(() => import("@/pages/client-portal/settings/tabs/profile"));
const SecurityTab = lazyPage(() => import("@/pages/admin/my-profile/tabs/security"));
const AppearanceTab = lazyPage(() => import("@/pages/admin/my-profile/tabs/appearance"));
const PreferencesTab = lazyPage(() => import("@/pages/client-portal/settings/tabs/preferences"));

export function createClientPortalRouter() {
  return createBrowserRouter(
    createRoutesFromElements(
      <Route>
        {/* Auth callback routes */}
        <Route path="/email-verified" element={<EmailVerifiedPage />} />
        <Route path="/verify-email" element={<VerifyEmailNoticePage />} />
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />

        {/* Protected client portal routes */}
        <Route element={<ClientGuard />}>
          <Route path="/" element={<UnsavedChangesProvider><ClientPortalLayout /></UnsavedChangesProvider>}>
            <Route index element={<ClientOverviewPage />} />
            <Route path="portal-access-disabled" element={<PortalAccessDisabledPage />} />
            <Route path="case-files" element={<CaseFilesPage />} />
            <Route path="timeline" element={<TimelinePage />} />

            <Route path="appointments">
              <Route index element={<AppointmentsPage />} />
              <Route path="upcoming" element={<UpcomingAppointmentsPage />} />
              <Route path="past" element={<PastAppointmentsPage />} />
            </Route>

            <Route path="payments">
              <Route index element={<PaymentsPage />} />
              <Route path="fee-agreement" element={<FeeAgreementPage />} />
              <Route path="history" element={<PaymentHistoryPage />} />
            </Route>

            <Route path="messages">
              <Route index element={<MessagesPage />} />
              <Route path="inbox" element={<InboxPage />} />
            </Route>

            <Route path="resources" element={<ResourcesPage />} />

            <Route path="settings" element={<ClientSettingsPage />}>
              <Route index element={<Navigate to="/settings/profile" replace />} />
              <Route path="profile" element={<ClientProfileTab />} />
              <Route path="preferences" element={<PreferencesTab />} />
              <Route path="security" element={<SecurityTab />} />
              <Route path="appearance" element={<AppearanceTab />} />
            </Route>

            {/* Unknown client paths render the 404 inside the portal layout. */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Route>
    ),
  );
}
