import { useDocumentTitle } from "@/hooks/use-document-title";
import { Box, ScrollArea, Tabs } from "@chakra-ui/react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { StaffPageHeader } from "./components/staff-page-header";
import { tabsConfig } from "./data";

const DEFAULT_TAB = "accounts";

export function StaffAndUsersPage() {
  useDocumentTitle("Staff Management - Oravanti");
  const navigate = useNavigate();
  const location = useLocation();
  const segments = location.pathname.replace(/\/+$/, "").split("/");
  const last = segments[segments.length - 1];
  const currentTab =
    last === "staff-management"
      ? DEFAULT_TAB
      : tabsConfig.some((t) => t.value === last)
        ? last
        : DEFAULT_TAB;

  return (
    <>
      <StaffPageHeader />

      <Tabs.Root
        value={currentTab}
        onValueChange={(e) =>
          navigate(
            e.value === DEFAULT_TAB
              ? "/admin/staff-management"
              : `/admin/staff-management/${e.value}`,
          )
        }
        variant="plain"
        w="full"
      >
        <ScrollArea.Root w="full" size="xs">
          <ScrollArea.Viewport>
            <ScrollArea.Content>
              <Tabs.List
                borderBottom="1px solid"
                borderColor="border.muted"
                gap={6}
              >
                {tabsConfig.map((tab) => (
                  <Tabs.Trigger
                    key={tab.value}
                    value={tab.value}
                    textStyle="label"
                    color="fg.muted"
                    pb="10px"
                    px={0}
                    borderRadius="none"
                    whiteSpace="nowrap"
                    borderBottom={"2px solid transparent"}
                    _selected={{
                      borderBottom: "2px solid",
                      borderColor: "brand.solid",
                    }}
                    _hover={{ color: "fg" }}
                    transition="all 0.2s"
                  >
                    {tab.label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="horizontal" />
          <ScrollArea.Corner />
        </ScrollArea.Root>

        <Box pt="24px">
          <Outlet />
        </Box>
      </Tabs.Root>
    </>
  );
}
