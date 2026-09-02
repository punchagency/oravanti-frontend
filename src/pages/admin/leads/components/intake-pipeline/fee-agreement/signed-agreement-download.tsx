import { getSignedAgreementUrl, type FeeAgreement } from "@/api/leads";
import { OutlineButton } from "@/components/ui/intake-ui";
import type { APIError } from "@/hooks/types";
import { useMutation } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { toast } from "sonner";

/**
 * Download the archived, fully executed PDF.
 *
 * The URL is minted on demand rather than held on the agreement: the stored
 * value is an R2 object key, and a presigned link for it lasts about an hour —
 * far less than the time between a page load and someone clicking this.
 *
 * Absent until the copy exists. The archive step is deliberately non-fatal on
 * the server, so an agreement can be genuinely signed with nothing to download,
 * and a button that apologises is worse than no button.
 */
export function SignedAgreementDownload({
  agreement,
}: {
  agreement: FeeAgreement;
}) {
  const fetchUrl = useMutation({
    mutationFn: () => getSignedAgreementUrl(agreement.id),
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener,noreferrer"),
    onError: (err: APIError) =>
      toast.error(
        err.response?.data?.message ?? "Could not fetch the signed agreement",
      ),
  });

  if (!agreement.signedDocumentUrl) return null;

  return (
    <OutlineButton
      loading={fetchUrl.isPending}
      onClick={() => fetchUrl.mutate()}
    >
      <Download size={14} />
      Download signed agreement
    </OutlineButton>
  );
}
