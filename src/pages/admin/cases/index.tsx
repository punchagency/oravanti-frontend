import { useDocumentTitle } from "@/hooks/use-document-title";
import { Box, ScrollArea, Tabs } from "@chakra-ui/react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { CasesPageHeader } from "./components/cases-header";
import { casesTabsConfig } from "./data";

const DEFAULT_TAB = "all-matters";

export function CasesPage() {
  useDocumentTitle("Cases - Oravanti");
  const navigate = useNavigate();
  const location = useLocation();
  const segments = location.pathname.replace(/\/+$/, "").split("/");
  const last = segments[segments.length - 1];
  const currentTab = casesTabsConfig.some((t) => t.value === last)
    ? (last as typeof DEFAULT_TAB)
    : DEFAULT_TAB;

  return (
    <>
      <CasesPageHeader />

      <Tabs.Root
        value={currentTab}
        onValueChange={(e) =>
          navigate(
            e.value === DEFAULT_TAB
              ? "/admin/cases"
              : `/admin/cases/${e.value}`,
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
                gap={8}
              >
                {casesTabsConfig.map((tab) => (
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
                    cursor="pointer"
                    _hover={{
                      color: "fg",
                    }}
                    _selected={{
                      color: "fg",
                      borderBottom: "2px solid",
                      borderColor: "brand.solid",
                    }}
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
