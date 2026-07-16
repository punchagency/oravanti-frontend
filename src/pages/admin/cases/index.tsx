import { useDocumentTitle } from "@/hooks/use-document-title";
import { Box } from "@chakra-ui/react";
import { CasesPageHeader } from "./components/cases-header";
import { CasesStatusSummary } from "./components/cases-status-summary";
import { AllMattersTab } from "./tabs/all-matters";
import { CasesDataProvider } from "./cases-data-context";

export { CaseDetailPage } from "./case-detail-page";

export function CasesPage() {
  useDocumentTitle("Cases - Oravanti");

  return (
    <CasesDataProvider>
      <CasesPageHeader />
      <CasesStatusSummary />
      <Box pt="24px">
        <AllMattersTab />
      </Box>
    </CasesDataProvider>
  );
}
