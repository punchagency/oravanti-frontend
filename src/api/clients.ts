import { API } from "./index";

export interface ClientRow {
  id: string;
  entityType: string;
  displayName: string;
  status: string;
  createdAt: string;
  contactEmail: string | null;
  contactPhone: string | null;
}

export async function getAllClients(search?: string): Promise<ClientRow[]> {
  const params: Record<string, string> = { all: "true" };
  if (search) params.search = search;
  const { data: res } = await API.get<{ data: ClientRow[] }>("/clients", {
    params,
  });
  return res.data;
}
