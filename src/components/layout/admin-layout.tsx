import { NavProvider } from "@/components/layout/shared/nav-context";
import { TopBar } from "@/components/layout/firm/top-bar";
import { DesktopNav } from "@/components/layout/firm/desktop-nav";
import { MobileNavDrawer } from "@/components/layout/firm/mobile-nav-drawer";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Box, Flex } from "@chakra-ui/react";
import { Outlet } from "react-router";

export function AdminLayout() {
  return (
    <NavProvider>
      <Flex minH="100vh" bg="bg">
        <DesktopNav />
        <Flex direction="column" flex="1" minW={0}>
          <TopBar />
          <Box
            as="main"
            flex="1"
            minH={0}
            p={{ base: "12px", lg: "0 20px 24px" }}
            bg="bg"
          >
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </Box>
        </Flex>
      </Flex>
      <MobileNavDrawer />
    </NavProvider>
  );
}
