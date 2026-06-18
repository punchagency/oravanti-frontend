import { Box, Flex, HStack, Link, Text, VStack } from "@chakra-ui/react";
import { Download, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router";
import { intakeStages, intakeTabs } from "../data";
import { BrandButton, OutlineButton } from "../../../../components/ui/intake-ui";
import { AddLeadDialog } from "@/components/ui/add-lead";
import { useLeads } from "@/hooks/use-leads";
import type { PipelineStage } from "@/api/leads";

function useStageCounts() {
  const { data } = useLeads({ all: true });
  const leads = Array.isArray(data) ? data : (data as { leads?: { pipelineStage: PipelineStage }[] } | undefined)?.leads ?? [];
  const counts: Record<string, number> = {};
  for (const lead of leads) {
    counts[lead.pipelineStage] = (counts[lead.pipelineStage] ?? 0) + 1;
  }
  return counts;
}

export function PipelineFrame({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const stageCounts = useStageCounts();

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
            Intake pipeline
          </Text>
          <Text m="6px 0 0" color="fg.muted" fontSize="13px">
            Manage leads from first contact to active case
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

      <Box
        as="section"
        display="grid"
        gridTemplateColumns={{
          base: "repeat(3, minmax(0, 1fr))",
          xl: "repeat(6, minmax(0, 1fr))",
        }}
        rowGap="18px"
        mt="34px"
        mb="28px"
        pb="28px"
        borderBottom="1px solid"
        borderColor="border.subtle"
        aria-label="Intake pipeline stages"
      >
        {intakeStages.map((stage, index) => {
          const active = location.pathname === stage.path;
          const count = stageCounts[stage.stage] ?? 0;
          const label = stage.stage === "case_opening"
            ? `${count} ${count === 1 ? "case" : "cases"}`
            : `${count} ${count === 1 ? "lead" : "leads"}`;

          return (
            <Link
              key={stage.path}
              asChild
              display="block"
              w="full"
              textDecoration="none"
              _focus={{ outline: "none", boxShadow: "none" }}
              _focusVisible={{
                outline: "2px solid",
                outlineColor: "brand.solid",
                outlineOffset: "4px",
                borderRadius: "8px",
              }}
            >
              <RouterLink to={stage.path}>
                <VStack
                  position="relative"
                  w="full"
                  gap="6px"
                  textAlign="center"
                >
                  {index > 0 ? (
                    <Box
                      position="absolute"
                      top="14px"
                      left="-50%"
                      w="100%"
                      h="2px"
                      bg="border"
                    />
                  ) : null}
                  <Box
                    zIndex="1"
                    display="grid"
                    placeItems="center"
                    w="28px"
                    h="28px"
                    border="2px solid"
                    borderColor={stage.color}
                    borderRadius="full"
                    bg="bg"
                    color={stage.color}
                    fontSize="13px"
                    fontWeight="500"
                    boxShadow={
                      active ? `0 0 0 3px ${stage.color}1f` : undefined
                    }
                  >
                    {index + 1}
                  </Box>
                  <Text
                    m="0"
                    color="fg"
                    fontSize="11px"
                    fontWeight="500"
                    lineHeight="1.1"
                  >
                    {stage.label}
                  </Text>
                  <Text m="0" color="fg.muted" fontSize="11px" lineHeight="1.1">
                    {label}
                  </Text>
                </VStack>
              </RouterLink>
            </Link>
          );
        })}
      </Box>

      <HStack
        as="nav"
        gap="18px"
        borderBottom="1px solid"
        borderColor="border.subtle"
        overflowX="auto"
        aria-label="Intake pipeline views"
      >
        {intakeTabs.map(([label, path]) => {
          const active = location.pathname === path;

          return (
            <Link
              key={path}
              asChild
              textDecoration="none"
              _focus={{ outline: "none", boxShadow: "none" }}
              _focusVisible={{
                outline: "2px solid",
                outlineColor: "brand.solid",
                outlineOffset: "2px",
                borderRadius: "6px",
              }}
            >
              <RouterLink to={path}>
                <Box
                  display="inline-flex"
                  alignItems="center"
                  minH="42px"
                  px="12px"
                  borderBottom="2px solid"
                  borderColor={active ? "brand.solid" : "transparent"}
                  color={active ? "fg" : "fg.muted"}
                  fontSize="13px"
                  fontWeight={active ? "500" : "400"}
                  whiteSpace="nowrap"
                >
                  {label}
                </Box>
              </RouterLink>
            </Link>
          );
        })}
      </HStack>

      {children}

      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} />
    </>
  );
}
