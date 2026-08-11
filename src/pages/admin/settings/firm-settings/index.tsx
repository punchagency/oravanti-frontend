import { PageTitle } from "@/components/layout/shared/nav-context";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Box, ScrollArea, Tabs } from "@chakra-ui/react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { tabsConfig } from "./data";

const DEFAULT_TAB = "general";

export function FirmSettingsPage() {
  useDocumentTitle("Firm Settings - Oravanti");
  const navigate = useNavigate();
  const location = useLocation();
  const segments = location.pathname.replace(/\/+$/, "").split("/");
  const last = segments[segments.length - 1];
  const currentTab =
    last === "firm-settings"
      ? DEFAULT_TAB
      : tabsConfig.some((t) => t.value === last)
        ? last
        : DEFAULT_TAB;

  return (
    <>
      <Box
        pt="8"
        mb="2"
        borderBottom="1px solid"
        borderColor="border.subtle"
        pb="4"
      >
        <Box
          display="flex"
          alignItems="flex-start"
          justifyContent="space-between"
          gap="4"
        >
          <Box>
            <PageTitle>
              <Box
                as="h1"
                m="0"
                color="fg"
                fontSize={{ base: "20px", md: "22px" }}
                fontWeight="500"
                lineHeight="1.2"
              >
                Settings
              </Box>
            </PageTitle>
            <Box m="6px 0 0" color="fg.muted" fontSize="13px">
              Firm settings — manage your firm profile, billing, and compliance
              settings
            </Box>
          </Box>
        </Box>
      </Box>

      <Tabs.Root
        value={currentTab}
        onValueChange={(e) =>
          navigate(
            e.value === DEFAULT_TAB
              ? "/settings/firm-settings"
              : `/settings/firm-settings/${e.value}`,
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
                mt="4"
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
                    borderBottom="2px solid transparent"
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
