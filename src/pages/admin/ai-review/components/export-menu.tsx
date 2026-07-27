import { OutlineButton } from "@/components/ui/intake-ui";
import { useExportReport } from "@/hooks/use-case-review";
import { HStack, Menu, Portal, Text } from "@chakra-ui/react";
import { Download } from "lucide-react";

export function ExportMenu({
  report,
  label,
}: {
  report: "issues" | "resolution-log";
  label: string;
}) {
  const exportReport = useExportReport();
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <OutlineButton loading={exportReport.isPending}>
          <HStack gap="6px">
            <Download size={14} />
            <Text>{label}</Text>
          </HStack>
        </OutlineButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item
              value="csv"
              onClick={() => exportReport.mutate({ report, format: "csv" })}
            >
              Export as CSV
            </Menu.Item>
            <Menu.Item
              value="pdf"
              onClick={() => exportReport.mutate({ report, format: "pdf" })}
            >
              Export as PDF
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
