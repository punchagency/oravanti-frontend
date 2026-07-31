import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import {
  REPORT_CELL_PY,
  ReportRow,
  ReportTable,
} from "@/components/ui/report-table";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Box, Flex, HStack, Table, Text } from "@chakra-ui/react";
import { Download, Eye, Plus } from "lucide-react";
import {
  ActionIconButton,
  FilingStatusPill,
  MatterCell,
} from "./components/document-cells";
import { caseFilings, formatDocumentDate } from "./data";

const HEADERS = ["Document", "Case", "Filed date", "Deadline", "Status", "Actions"];

export function CaseFilingsPage() {
  useDocumentTitle("Case filings");

  return (
    <Box pt="24px" pb="56px">
      <Flex
        justifyContent="space-between"
        alignItems="flex-start"
        gap="16px"
        flexWrap="wrap"
      >
        <Box>
          <Text textStyle="heading">Case filings</Text>
          <Text color="fg.muted" mt="2px" fontSize="14px">
            All USCIS, court, and agency filings across active matters
          </Text>
        </Box>
        <HStack gap="8px">
          <OutlineButton>
            <HStack gap="6px">
              <Download size={14} />
              <Text>Export</Text>
            </HStack>
          </OutlineButton>
          <BrandButton>
            <HStack gap="6px">
              <Plus size={14} />
              <Text>New filing</Text>
            </HStack>
          </BrandButton>
        </HStack>
      </Flex>

      <ReportTable mt="20px" headers={HEADERS}>
        {caseFilings.map((filing) => (
          <ReportRow key={filing.id}>
            <Table.Cell py={REPORT_CELL_PY}>
              <Text fontWeight="500" fontSize="13px">
                {filing.title}
              </Text>
            </Table.Cell>
            <Table.Cell py={REPORT_CELL_PY}>
              <MatterCell matter={filing.matter} />
            </Table.Cell>
            <Table.Cell py={REPORT_CELL_PY} color="fg.muted" fontSize="13px">
              {formatDocumentDate(filing.filedDate)}
            </Table.Cell>
            <Table.Cell py={REPORT_CELL_PY} color="fg.muted" fontSize="13px">
              {formatDocumentDate(filing.deadline)}
            </Table.Cell>
            <Table.Cell py={REPORT_CELL_PY}>
              <FilingStatusPill status={filing.status} />
            </Table.Cell>
            <Table.Cell py={REPORT_CELL_PY}>
              <HStack gap="6px" justifyContent="flex-end">
                <ActionIconButton label="Preview filing">
                  <Eye size={14} />
                </ActionIconButton>
                <ActionIconButton label="Download">
                  <Download size={14} />
                </ActionIconButton>
              </HStack>
            </Table.Cell>
          </ReportRow>
        ))}
      </ReportTable>
    </Box>
  );
}
