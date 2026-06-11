import { AdminLayout } from "@/components/layout/admin-layout";
import { AdminDashboard } from "@/pages/admin/dashboard";
import { IntakePipelinePage } from "@/pages/admin/intake";
import { NotFoundPage } from "@/pages/not-found";
import { SignUpPage } from "@/pages/contractor-sign-up";
import { ContractorSignupPage } from "@/pages/contractor-sign-up/contractor";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router";
import { FirmSignupFlow } from "./pages/firm-signup";
import { LoginPage } from "./pages/login";
import ForgotPassword from "./pages/forgot-password";
import VerifyOtp from "./pages/forgot-password/verify-otp";
import ResetPassword from "./pages/reset-password";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup">
        <Route index element={<SignUpPage />} />
        <Route path="contractor" element={<ContractorSignupPage />} />
      </Route>
      <Route path="/firm-signup">
        <Route index element={<FirmSignupFlow />} />
      </Route>
      <Route path="/forgot-password">
        <Route path="" element={<ForgotPassword />} />
        <Route path="verify-otp" element={<VerifyOtp />} />
      </Route>
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard/pipeline" element={<AdminDashboard />} />
        <Route path="dashboard/activity" element={<AdminDashboard />} />
        <Route path="intake/pipeline/lead-inbox" element={<IntakePipelinePage />} />
        <Route path="intake/pipeline/conflict-check" element={<IntakePipelinePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
);

export default function App() {
  return <RouterProvider router={router} />;
}
