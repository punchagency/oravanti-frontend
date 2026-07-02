import {
  ExternalLink,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

export const participants = [
  {
    section: "Client",
    initials: "AP",
    name: "Aisha Patel",
    role: "Client",
    email: "aisha.patel@email.com",
    phone: "+1 (305) 555-0192",
    status: { dot: true, label: "Active in portal" },
    buttons: [
      { label: "Message", icon: MessageSquare },
      { label: "View portal", icon: ExternalLink },
    ],
  },
  {
    section: "Assigned attorney",
    initials: "MW",
    name: "Marcus Webb",
    role: "Attorney",
    email: "marcus.webb@harringtoncole.com",
    phone: "+1 (212) 555-0100",
    status: { dot: false, label: "5 active matters" },
    buttons: [
      { label: "Reassign", icon: RefreshCw },
      { label: "Message", icon: MessageSquare },
    ],
  },
  {
    section: "Assigned paralegal",
    initials: "SR",
    name: "Sofia Reyes",
    role: "Paralegal",
    email: "sofia.reyes@harringtoncole.com",
    phone: "+1 (212) 555-0101",
    status: { dot: false, label: "8 assigned cases" },
    buttons: [
      { label: "Reassign", icon: RefreshCw },
      { label: "Message", icon: MessageSquare },
    ],
  },
  {
    section: "Government / third party",
    initials: "UN",
    name: "USCIS National Customer Service",
    role: "Government",
    refNumber: "Ref: MSC2190123456",
    agency: "Agency: U.S. Citizenship & Immigration Services",
    buttons: [{ label: "Log contact", icon: RefreshCw }],
  },
];

export const roleColors: Record<
  string,
  { bg: string; color: string }
> = {
  Client: { bg: "bg.subtle", color: "fg" },
  Attorney: { bg: "blue.subtle", color: "blue.fg" },
  Paralegal: { bg: "purple.subtle", color: "purple.fg" },
  Government: { bg: "blue.subtle", color: "blue.fg" },
};
