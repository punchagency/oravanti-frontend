import { AdminLayout } from "@/components/layout/admin-layout";
import {
  AdminDashboardActivity,
  AdminDashboardOverview,
  AdminDashboardPipeline,
} from "@/pages/admin/dashboard";
import { NotFoundPage } from "@/pages/not-found";
import { SignUpPage } from "@/pages/sign-up";
import { ContractorSignupPage } from "@/pages/sign-up/contractor";
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
        <Route index element={<AdminDashboardOverview />} />
        <Route
          path="dashboard/pipeline"
          element={<AdminDashboardPipeline />}
        />
        <Route
          path="dashboard/activity"
          element={<AdminDashboardActivity />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
);

export default function App() {
  return <RouterProvider router={router} />;
}
