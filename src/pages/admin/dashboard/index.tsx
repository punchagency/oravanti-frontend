import { useDocumentTitle } from "@/hooks/use-document-title";
import { ActivityView } from "./views/activity";
import { OverviewView } from "./views/overview";
import { PipelineView } from "./views/pipeline";
import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { Box, Flex, HStack, Text, chakra } from "@chakra-ui/react";
import { BrandButton, OutlineButton } from "../../../components/ui/intake-ui";
import { dashboardTabs, type DashboardTabs } from "./data";

export function AdminDashboard() {
  useDocumentTitle("Dashboard - Oravanti");
  const [activeTab, setActiveTab] = useState<DashboardTabs>("Overview");

  return (
    <>
      <Flex
        as="header"
        align="flex-start"
        justify="space-between"
        gap="16px"
        py="28px"
        pb="16px"
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Box>
          <Text
            as="h1"
            m="0"
            color="fg"
            fontSize="22px"
            fontWeight="500"
            lineHeight="1.2"
          >
            CRM & leads
          </Text>
          <Text m="6px 0 0" color="fg.muted" fontSize="13px">
            Full pipeline from first contact to active client
          </Text>
        </Box>
        <HStack gap="8px">
          <BrandButton>
            <Plus size={15} />
            Add lead
          </BrandButton>
          <OutlineButton>
            <Download size={14} />
            Export
          </OutlineButton>
        </HStack>
      </Flex>

      <HStack
        as="nav"
        gap="0"
        borderBottom="1px solid"
        borderColor="border.subtle"
        aria-label="CRM & leads views"
      >
        {dashboardTabs.map((tab) => {
          const active = tab === activeTab;
          return (
            <chakra.button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              display="inline-flex"
              alignItems="center"
              minH="42px"
              px="14px"
              borderBottom="2px solid"
              borderColor={active ? "brand.solid" : "transparent"}
              bg="transparent"
              color={active ? "fg" : "fg.muted"}
              fontSize="13px"
              fontWeight={active ? "500" : "400"}
              whiteSpace="nowrap"
              cursor="pointer"
            >
              {tab}
            </chakra.button>
          );
        })}
      </HStack>
      {activeTab === "Overview" && <OverviewView />}
      {activeTab === "Pipeline" && <PipelineView />}
      {activeTab === "Activity" && <ActivityView />}
    </>
  );
}
