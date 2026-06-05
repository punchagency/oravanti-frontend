import { Box } from "@chakra-ui/react";
import { Outlet } from "react-router";
import {
  ContextNavigation,
  PrimaryNavigation,
} from "@/components/layout/navigation";

export function AppShell() {
  return (
    <Box className="app-shell">
      <PrimaryNavigation />
      <ContextNavigation />
      <Box as="main" className="main-content">
        <Outlet />
      </Box>
    </Box>
  );
}
