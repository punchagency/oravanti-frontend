import type { EmailProvider } from "@/api/email-accounts";

export type { EmailProvider };

export type ConnectedEmail = {
  id: string;
  email: string;
  provider: EmailProvider;
  isActive?: boolean;
};

export type ManualConfig = {
  protocol: "imap" | "pop3";
  smtpHost: string;
  smtpPort: number;
  secure: boolean;
} & ({ protocol: "imap"; imapHost: string; imapPort: number } | { protocol: "pop3"; pop3Host: string; pop3Port: number });

export function providerLabel(provider: EmailProvider) {
  switch (provider) {
    case "google":
      return "Google (Gmail)";
    case "microsoft":
      return "Microsoft (Outlook)";
    case "custom":
      return "Custom (SMTP/IMAP,POP3)";
    default:
      return provider;
  }
}

export function providerColorPalette(provider: EmailProvider) {
  switch (provider) {
    case "google":
      return "blue";
    case "microsoft":
      return "purple";
    case "custom":
      return "orange";
  }
}
