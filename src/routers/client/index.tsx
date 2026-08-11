import { ClientPortalLayout } from "@/components/layout/client-portal-layout";
import { ClientGuard } from "@/routers/client/guard";
import { UnsavedChangesProvider } from "@/contexts/unsaved-changes-context";
import { Route, createBrowserRouter, createRoutesFromElements, Navigate } from "react-router";
import AcceptInvitationPage from "@/pages/accept-invitation";
import EmailVerifiedPage from "@/pages/email-verified";
import SetPasswordPage from "@/pages/set-password";
import VerifyEmailNoticePage from "@/pages/verify-email";
import ClientOverviewPage from "@/pages/client-portal/overview";
import CaseFilesPage from "@/pages/client-portal/case-files";
import TimelinePage from "@/pages/client-portal/timeline";
import AppointmentsPage from "@/pages/client-portal/appointments";
import UpcomingAppointmentsPage from "@/pages/client-portal/appointments/upcoming";
import PastAppointmentsPage from "@/pages/client-portal/appointments/past";
import PaymentsPage from "@/pages/client-portal/payments";
import FeeAgreementPage from "@/pages/client-portal/payments/fee-agreement";
import PaymentHistoryPage from "@/pages/client-portal/payments/history";
import MessagesPage from "@/pages/client-portal/messages";
import InboxPage from "@/pages/client-portal/messages/inbox";
import ResourcesPage from "@/pages/client-portal/resources";
import { ClientSettingsPage } from "@/pages/client-portal/settings";
import ClientProfileTab from "@/pages/client-portal/settings/tabs/profile";
import SecurityTab from "@/pages/admin/my-profile/tabs/security";
import AppearanceTab from "@/pages/admin/my-profile/tabs/appearance";
import { NotFoundPage } from "@/pages/not-found";

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
              <Route path="security" element={<SecurityTab />} />
              <Route path="appearance" element={<AppearanceTab />} />
            </Route>

            {/* Unknown client paths render the 404 inside the portal layout. */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Route>,
    ),
  );
}
