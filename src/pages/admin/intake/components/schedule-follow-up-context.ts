import { createContext } from "react";
import type { Lead } from "@/api/leads";

/**
 * Lets a ConsultationCard — rendered deep inside the intake list, or inside the
 * CRM lead drawer — open the scheduling wizard as a follow-up without
 * prop-drilling through its parent.
 *
 * Lives in its own module so it can be shared without exporting a non-component
 * from a component file (react-refresh/only-export-components).
 */
export type FollowUpRequest = {
  lead: Pick<Lead, "id" | "name" | "caseTypeName">;
  attorneyId?: string | null;
  parentConsultationId: string;
};

export const ScheduleFollowUpContext = createContext<
  (req: FollowUpRequest) => void
>(() => {});
