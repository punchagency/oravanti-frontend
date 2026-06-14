import { API } from ".";

export type EmailProvider = "google" | "microsoft" | "custom";

export type ClassifyResponse = {
  success: boolean;
  message: string;
  data: {
    email: string;
    provider: EmailProvider;
  };
};

const rootPath = "/email-accounts";

export type ConnectAutoResponse =
  | { success: true; message: string }
  | { success: false; error: string; fallbackToManualForm: true };

export type ConnectManualResponse = {
  success: boolean;
  message: string;
};

export async function classifyEmail(email: string): Promise<ClassifyResponse> {
  const { data } = await API.post(`${rootPath}/classify`, { email });
  return data;
}

export async function connectCustomAuto(
  email: string,
  password: string,
): Promise<ConnectAutoResponse> {
  const { data } = await API.post(`${rootPath}/connect-custom-auto`, {
    email,
    password,
  });
  return data;
}

export async function connectCustomManual(params: {
  email: string;
  password: string;
  protocol?: "imap" | "pop3";
  imapHost?: string;
  imapPort?: number;
  pop3Host?: string;
  pop3Port?: number;
  smtpHost: string;
  smtpPort: number;
  secure: boolean;
}): Promise<ConnectManualResponse> {
  const { data } = await API.post(`${rootPath}/connect-custom-manual`, params);
  return data;
}

export type EmailAccountListItem = {
  id: string;
  email: string;
  provider: EmailProvider;
  isActive: boolean;
};

export type ListEmailAccountsResponse = {
  success: boolean;
  message: string;
  data: EmailAccountListItem[];
};

export async function listEmailAccounts(
  status?: "all" | "active" | "disabled",
): Promise<ListEmailAccountsResponse> {
  const params = status && status !== "all" ? { status } : undefined;
  const { data } = await API.get(`${rootPath}`, { params });
  return data;
}

export type ToggleEmailResponse = {
  success: boolean;
  message: string;
};

export type DeleteEmailResponse = {
  success: boolean;
  message: string;
};

export async function enableEmailAccount(
  id: string,
): Promise<ToggleEmailResponse> {
  const { data } = await API.patch(`${rootPath}/${id}/enable`);
  return data;
}

export async function disableEmailAccount(
  id: string,
): Promise<ToggleEmailResponse> {
  const { data } = await API.patch(`${rootPath}/${id}/disable`);
  return data;
}

export async function deleteEmailAccount(
  id: string,
): Promise<DeleteEmailResponse> {
  const { data } = await API.delete(`${rootPath}/${id}`);
  return data;
}
