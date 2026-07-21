import { Box } from "@chakra-ui/react";
import { Outlet } from "react-router";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import {
  ContextNavigation,
  PrimaryNavigation,
} from "@/components/layout/navigation";

export function AdminLayout() {
  return (
    <Box className="app-shell">
      <PrimaryNavigation />
      <ContextNavigation />
      <Box as="main" className="main-content">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Box>
    </Box>
  );
}
