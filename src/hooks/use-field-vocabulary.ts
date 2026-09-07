import { useQuery } from "@tanstack/react-query";

import { getFieldVocabulary } from "@/api/questionnaires";

/**
 * Every name a question can be wired to.
 *
 * The catalogue changes when Oravanti re-extracts a blank, which is a release
 * rather than a thing that happens while a dialog is open — so this is fetched
 * once and kept. `QuestionDialog` is the only caller, and it asks only while it
 * is open and only on the two tiers that offer the field.
 */
export const useFieldVocabulary = (
  tier: "firm" | "platform",
  enabled: boolean,
) =>
  useQuery({
    queryKey: ["field-vocabulary", tier],
    queryFn: () => getFieldVocabulary(tier),
    enabled,
    staleTime: Infinity,
  });
