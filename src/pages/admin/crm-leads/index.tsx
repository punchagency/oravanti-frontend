import { Box, Flex, Grid, HStack, Text, chakra } from "@chakra-ui/react";
import { Download, Plus } from "lucide-react";
import { useState } from "react";
import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useLeads } from "@/hooks/use-leads";
import { ArchivedLeadsTab } from "./components/archived-leads-tab";
import { ConversionMetricsTab } from "./components/conversion-metrics-tab";
import { EducationFlywheelTab } from "./components/education-flywheel-tab";
import { PipelineTab } from "./components/pipeline-tab";
import { type CrmTab, crmTabs } from "./data";
import { AddLeadDialog } from "@/components/ui/add-lead";

export function CrmLeadsPage() {
  useDocumentTitle("CRM & leads - Oravanti");
  const [activeTab, setActiveTab] = useState<CrmTab>("Pipeline");
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  const { data: allLeadsData } = useLeads({ all: true });
  const allLeads = Array.isArray(allLeadsData)
    ? allLeadsData
    : (allLeadsData?.leads ?? []);

  const crmStats = [
    {
      label: "CONFLICT CHECK",
      count: allLeads.filter((l) => l.pipelineStage === "conflict_check").length,
      color: "#d18400",
    },
    {
      label: "QUESTIONNAIRE",
      count: allLeads.filter((l) => l.pipelineStage === "questionnaire").length,
      color: "#377dff",
    },
    {
      label: "PROSPECTIVE",
      count: allLeads.filter(
        (l) =>
          l.pipelineStage === "consultation" ||
          l.pipelineStage === "fee_agreement",
      ).length,
      color: "#534AB7",
    },
    {
      label: "ACTIVE CLIENTS",
      count: allLeads.filter((l) => l.convertedCaseId !== null).length,
      color: "#1D9E75",
    },
  ];

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
          <BrandButton onClick={() => setAddLeadOpen(true)}>
            <Plus size={15} />
            Add lead
          </BrandButton>
          <OutlineButton>
            <Download size={14} />
            Export
          </OutlineButton>
        </HStack>
      </Flex>

      <Grid
        as="section"
        templateColumns={{ base: "repeat(3, 1fr)", xl: "repeat(5, 1fr)" }}
        gap="14px"
        mt="24px"
        mb="24px"
        aria-label="Pipeline summary"
      >
        {crmStats.map((stat) => (
          <Box
            key={stat.label}
            border="1px solid"
            borderColor="border"
            borderRadius="10px"
            bg="bg"
            p="14px 16px"
          >
            <Text
              m="0 0 6px"
              color={stat.color}
              fontSize="26px"
              fontWeight="600"
              lineHeight="1"
            >
              {stat.count}
            </Text>
            <Text
              m="0"
              color="fg.muted"
              fontSize="10px"
              fontWeight="500"
              textTransform="uppercase"
              letterSpacing="0.04em"
            >
              {stat.label}
            </Text>
          </Box>
        ))}
      </Grid>

      <HStack
        as="nav"
        gap="0"
        borderBottom="1px solid"
        borderColor="border.subtle"
        aria-label="CRM & leads views"
      >
        {crmTabs.map((tab) => {
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

      {activeTab === "Pipeline" && <PipelineTab />}
      {activeTab === "Conversion metrics" && <ConversionMetricsTab />}
      {activeTab === "Education flywheel" && <EducationFlywheelTab />}
      {activeTab === "Archived leads" && <ArchivedLeadsTab />}

      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} />
    </>
  );
}
