import { API } from "./index";

export type StaffRole =
  | "admin"
  | "attorney"
  | "senior_paralegal"
  | "paralegal"
  | "junior_paralegal";

export type StaffStatus = "active" | "inactive" | "on_leave";

export type Staff = {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
};

export async function getStaffs(): Promise<Staff[]> {
  const { data } = await API.get<{ data: Staff[] }>("/organization/staffs");
  return data.data;
}
