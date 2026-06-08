import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage as AdminDashboardPage } from "@/pages/admin/dashboard";
import { NotFoundPage } from "@/pages/not-found";
import { SignUpPage } from "@/pages/sign-up";
import { ContractorSignupPage } from "@/pages/sign-up/contractor";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router";
import { LoginPage } from "./pages/login";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup">
        <Route index element={<SignUpPage />} />
        <Route path="contractor" element={<ContractorSignupPage />} />
      </Route>

      <Route path="/admin" element={<AppShell />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </>,
  ),
);

export default function App() {
  return <RouterProvider router={router} />;
}
