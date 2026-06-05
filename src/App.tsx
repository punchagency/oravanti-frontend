import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage } from "@/pages/admin/dashboard";
import { NotFoundPage } from "@/pages/not-found";
import { SignUpPage } from "@/pages/sign-up";
import { ContractorSignupPage } from "@/pages/sign-up/contractor";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/signup/contractor" element={<ContractorSignupPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/sign-up/contractor" element={<ContractorSignupPage />} />

      <Route path="/admin" element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </>,
  ),
);

export default function App() {
  return <RouterProvider router={router} />;
}
