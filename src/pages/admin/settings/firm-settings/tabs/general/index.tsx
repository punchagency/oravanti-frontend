import { Box } from "@chakra-ui/react";
import { DangerZoneCard } from "../../components/danger-zone-card";
import { FirmInformationCard } from "../../components/firm-information-card";
import { FirmSnapshotCard } from "../../components/firm-snapshot-card";

export default function GeneralTab() {
  return (
    <Box
      display="grid"
      gridTemplateColumns={{ base: "1fr", lg: "1fr 340px" }}
      gap="6"
      alignItems="start"
    >
      <Box display="flex" flexDirection="column" gap="6">
        <FirmInformationCard />
      </Box>

      <Box display="flex" flexDirection="column" gap="6">
        <FirmSnapshotCard />
        <DangerZoneCard />
      </Box>
    </Box>
  );
}
