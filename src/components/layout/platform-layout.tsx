import { Box, Flex } from "@chakra-ui/react";
import { Outlet } from "react-router";

import { DesktopNav } from "@/components/layout/platform/desktop-nav";
import { MobileNavDrawer } from "@/components/layout/platform/mobile-nav-drawer";
import { PlatformTopBar } from "@/components/layout/platform/top-bar";
import {
  STICKY_OFFSET_VAR,
  TOPBAR_HEIGHT,
} from "@/components/layout/shared/chrome";
import { NavProvider } from "@/components/layout/shared/nav-context";
import { ErrorBoundary } from "@/components/ui/error-boundary";

/**
 * The shell for Oravanti's own CRM.
 *
 * Structurally identical to `AdminLayout` and `ClientPortalLayout` — the same
 * `NavProvider`, the same collapsing rail, the same sticky bar — because it is
 * the same kind of thing and the people who maintain one should not have to
 * learn a second. What differs is `platform/nav-content.tsx`, which is where
 * the difference belongs.
 *
 * The tier is still marked, though: a `Platform` badge sits beside the
 * wordmark in the rail and the drawer. Operators hold a firm login too, and
 * one who thinks they are in a demo firm while editing the catalogue every
 * firm reads is the expensive mistake this tier makes possible.
 */
export function PlatformLayout() {
  return (
    <NavProvider>
      <Flex minH="100vh" bg="bg">
        <DesktopNav />
        <Flex direction="column" flex="1" minW={0}>
          <PlatformTopBar />
          <Box
            as="main"
            flex="1"
            minH={0}
            p={{ base: "12px", lg: "0 20px 24px" }}
            bg="bg"
            // Same reason as the admin shell: the bar is sticky and the page
            // scrolls under it, so sticky content inside a page has to start
            // below it.
            css={{ [STICKY_OFFSET_VAR]: TOPBAR_HEIGHT }}
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
