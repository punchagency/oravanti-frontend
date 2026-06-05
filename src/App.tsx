import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage } from "@/pages/dashboard";
import { NotFoundPage } from "@/pages/not-found";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
