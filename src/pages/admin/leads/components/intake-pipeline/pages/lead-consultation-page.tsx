import { useParams } from "react-router";
import { useLeadById } from "@/hooks/use-leads";
import { ConsultationSection } from "./lead-consultation-section";
import { PipelineLayout, ConsultationPageSkeleton } from "./pipeline-layout";
import { InstantConsultationDialog } from "../dialogs/instant-consultation-dialog";
import {
  ScheduleConsultationDialog,
  type ConsultationSummaryLead,
} from "../views/consultation-view";
import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { HStack, Dialog } from "@chakra-ui/react";
import { CalendarDays, Zap } from "lucide-react";
import { useState } from "react";

export function ConsultationPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const { data: fullLead, isLoading: fullLoading } = useLeadById(leadId!);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  if (fullLoading || !fullLead) {
    return <ConsultationPageSkeleton />;
  }

  const hasConsultation = Boolean(
    (fullLead as any).consultationId,
  );

  return (
    <PipelineLayout lead={fullLead} activeStep="consultation">
      <HStack justify="flex-end" gap="8px" wrap="wrap">
        {!hasConsultation ? (
          <>
            <InstantConsultationDialog presetLeadId={leadId}>
              <Dialog.Trigger asChild>
                <OutlineButton>
                  <Zap size={14} />
                  Start consultation now
                </OutlineButton>
              </Dialog.Trigger>
            </InstantConsultationDialog>
            <BrandButton onClick={() => setScheduleOpen(true)}>
              <CalendarDays size={14} />
              Schedule consultation
            </BrandButton>
          </>
        ) : null}
      </HStack>
      <ConsultationSection lead={fullLead} />
      <ScheduleConsultationDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        presetLead={fullLead as unknown as ConsultationSummaryLead}
      />
    </PipelineLayout>
  );
}
