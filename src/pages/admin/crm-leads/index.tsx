import { Box, Flex, Grid, HStack, Tabs, Text } from "@chakra-ui/react";
import { Download, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AddLeadDialog } from "@/components/ui/add-lead";
import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { PageTitle } from "@/components/layout/shared/nav-context";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useLeads, useLeadsStageCount } from "@/hooks/use-leads";
import { ArchivedLeadsTab } from "./components/archived-leads-tab";
import { ClientsTab } from "./components/clients-tab";
import { ConversionMetricsTab } from "./components/conversion-metrics-tab";
import { EducationFlywheelTab } from "./components/education-flywheel-tab";

export function CrmLeadsPage() {
  useDocumentTitle("CRM & leads - Oravanti");
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  const { data: stageCounts } = useLeadsStageCount();
  const { data: convertedData } = useLeads({ limit: 1, converted: true });

  const crmStats = [
    {
      label: "CONFLICT CHECK",
      count: stageCounts?.conflict_check ?? 0,
      color: "#d18400",
    },
    {
      label: "QUESTIONNAIRE",
      count: stageCounts?.questionnaire ?? 0,
      color: "#377dff",
    },
    {
      label: "PROSPECTIVE",
      count:
        (stageCounts?.consultation ?? 0) + (stageCounts?.fee_agreement ?? 0),
      color: "#534AB7",
    },
    {
      label: "ACTIVE CLIENTS",
      count: convertedData?.pagination?.total ?? 0,
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
          <PageTitle>
            <Text
              as="h1"
              m="0"
              color="fg"
              fontSize="22px"
              fontWeight="500"
              lineHeight="1.2"
            >
              CRM &amp; leads
            </Text>
          </PageTitle>
          <Text m="6px 0 0" color="fg.muted" fontSize="13px">
            Full pipeline from first contact to active client
          </Text>
        </Box>
        <HStack gap="8px">
          <BrandButton onClick={() => setAddLeadOpen(true)}>
            <Plus size={15} />
            Add lead
          </BrandButton>
          <OutlineButton
            onClick={() =>
              toast.info("Feature currently unavailable. Coming soon")
            }
          >
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

      <Tabs.Root defaultValue="clients">
        <Tabs.List
          gap="0"
          borderBottom="1px solid"
          borderColor="border.subtle"
          aria-label="CRM & leads views"
        >
          <Tabs.Trigger
            value="clients"
            minH="42px"
            px="14px"
            fontSize="13px"
            whiteSpace="nowrap"
          >
            Clients
          </Tabs.Trigger>
          <Tabs.Trigger
            value="conversion-metrics"
            minH="42px"
            px="14px"
            fontSize="13px"
            whiteSpace="nowrap"
          >
            Conversion metrics
          </Tabs.Trigger>
          <Tabs.Trigger
            value="education-flywheel"
            minH="42px"
            px="14px"
            fontSize="13px"
            whiteSpace="nowrap"
          >
            Education flywheel
          </Tabs.Trigger>
          <Tabs.Trigger
            value="archived-leads"
            minH="42px"
            px="14px"
            fontSize="13px"
            whiteSpace="nowrap"
          >
            Archived leads
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="clients">
          <ClientsTab />
        </Tabs.Content>
        <Tabs.Content value="conversion-metrics">
          <ConversionMetricsTab />
        </Tabs.Content>
        <Tabs.Content value="education-flywheel">
          <EducationFlywheelTab />
        </Tabs.Content>
        <Tabs.Content value="archived-leads">
          <ArchivedLeadsTab />
        </Tabs.Content>
      </Tabs.Root>

      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} />
    </>
  );
}
