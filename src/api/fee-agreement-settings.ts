import { API } from ".";

export type FeeAgreementSigningOrder = "client_first" | "firm_first";

export type FeeAgreementSettings = {
  organizationId: string;
  requiresFirmSignature: boolean;
  signingOrder: FeeAgreementSigningOrder;
  invoiceWaitsForFirmSignature: boolean;
  allowSignerOverride: boolean;
  defaultSignerStaffId: string | null;
  updatedAt: string | null;
};

/**
 * A partial update, and deliberately so: the settings card saves one control at
 * a time, and the endpoint applies only the fields it is given. Sending the
 * whole object back would let a card that knows nothing about the signing order
 * overwrite it.
 */
export type UpdateFeeAgreementSettings = Partial<
  Pick<
    FeeAgreementSettings,
    | "requiresFirmSignature"
    | "signingOrder"
    | "invoiceWaitsForFirmSignature"
    | "allowSignerOverride"
  >
> & { defaultSignerStaffId?: string | null };

export type EligibleSigner = {
  staffId: string;
  userId: string;
  name: string;
  jobTitle: string | null;
  email: string | null;
};

export const getFeeAgreementSettings = async (): Promise<FeeAgreementSettings> => {
  const { data } = await API.get<{ data: FeeAgreementSettings }>(
    "/settings/fee-agreements",
  );
  return data.data;
};

export const updateFeeAgreementSettings = async (
  body: UpdateFeeAgreementSettings,
): Promise<FeeAgreementSettings> => {
  const { data } = await API.put<{ data: FeeAgreementSettings }>(
    "/settings/fee-agreements",
    body,
  );
  return data.data;
};

/**
 * Who may sign for the firm. Resolved server-side from real permission grants —
 * the staff list's `role` field is a display projection and cannot see a firm's
 * custom roles or role groups, so it must not be used to filter this.
 */
export const getEligibleSigners = async (): Promise<EligibleSigner[]> => {
  const { data } = await API.get<{ data: EligibleSigner[] }>(
    "/settings/fee-agreements/eligible-signers",
  );
  return data.data;
};
