import {
  Navigate,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage } from "@/pages/dashboard";
import { NotFoundPage } from "@/pages/not-found";
import { ContractorSignupPage } from "@/pages/sign-up/contractor";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/signup" element={<ContractorSignupPage />} />
      <Route
        path="/signup/contractor"
        element={<ContractorSignupPage initialView="wizard" />}
      />
      <Route path="/sign-up" element={<ContractorSignupPage />} />
      <Route
        path="/sign-up/contractor"
        element={<ContractorSignupPage initialView="wizard" />}
      />

      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </>,
  ),
);

export default function App() {
  return <RouterProvider router={router} />;
}
