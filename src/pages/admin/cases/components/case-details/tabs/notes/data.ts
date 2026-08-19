import { createListCollection } from "@chakra-ui/react";

export interface Note {
  id: string;
  author: string;
  initials: string;
  role: string;
  roleColor: string;
  date: string;
  body: string;
  isPinned: boolean;
  visibility?: string;
}

export const notes: Note[] = [
  {
    id: "1",
    author: "Marcus Webb",
    initials: "MW",
    role: "Attorney",
    roleColor: "blue",
    date: "Jun 17, 2026",
    isPinned: true,
    visibility: "Visible to attorney + admin only",
    body: "Passport expiry is a critical concern ahead of the Jun 22 interview. USCIS requires passport validity extending beyond the adjudication period. Sofia \u2014 please request re-upload immediately and flag if client cannot obtain a renewal in time. We may need to request an interview postponement to avoid a denial on this ground.",
  },
  {
    id: "2",
    author: "Sofia Reyes",
    initials: "SR",
    role: "Paralegal",
    roleColor: "purple",
    date: "May 28, 2026",
    isPinned: false,
    body: "Document checklist reviewed. I-693 and affidavit of support still outstanding. Sent client a portal reminder on May 28. Client confirmed she is scheduling the medical exam and will upload within 2 weeks.",
  },
  {
    id: "3",
    author: "Marcus Webb",
    initials: "MW",
    role: "Attorney",
    roleColor: "blue",
    date: "Mar 18, 2026",
    isPinned: false,
    visibility: "Visible to attorney + admin only",
    body: "Case now open. Straightforward I-485 based on USC spouse petition \u2014 IR-1 category. No red flags in conflict check. Assigned Sofia as primary paralegal contact for document collection. Strategy: standard track, no expedite needed at this stage.",
  },
];

export const roleColors: Record<string, { bg: string; color: string }> = {
  Attorney: { bg: "brand.subtle", color: "brand.contrast" },
  Paralegal: { bg: "brand.muted", color: "brand.contrast" },
};

export const visibilityOptions = createListCollection({
  items: [
    { label: "Visible to all staff", value: "all" },
    { label: "Attorney + admin only", value: "attorney" },
    { label: "Paralegal + attorney", value: "paralegal" },
  ],
});
