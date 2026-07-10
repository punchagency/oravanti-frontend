import { API } from ".";

export type Profile = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  barNumber: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateProfileInput = Partial<{
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
  barNumber: string;
  timezone: string;
}>;

export async function getProfile() {
  const { data } = await API.get<{ data: Profile }>("/settings/profile");
  return data.data;
}

export async function updateProfile(input: UpdateProfileInput) {
  const { data } = await API.patch<{ data: Profile }>(
    "/settings/profile",
    input,
  );
  return data.data;
}
