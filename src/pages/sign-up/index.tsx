import { Building2, Moon, User, UserRoundPlus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useDocumentTitle } from "@/hooks/use-document-title";

type SignupRole = "firm" | "contractor" | "client";

function RoleCard({
  icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={selected ? "signup-role-card is-selected" : "signup-role-card"}
      type="button"
      onClick={onClick}
    >
      <span className="signup-role-icon">{icon}</span>
      <strong>{title}</strong>
      <span>{description}</span>
    </button>
  );
}

function ThemeCircle() {
  return (
    <button className="signup-theme-button" type="button" aria-label="Toggle theme">
      <Moon size={16} />
    </button>
  );
}

export function SignUpPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<SignupRole | null>(null);

  useDocumentTitle("Sign up - Oravanti");

  return (
    <main className="signup-page">
      <ThemeCircle />
      <section className="signup-card signup-card--chooser">
        <div className="signup-logo">Ov</div>
        <h1 className="signup-welcome-title">Welcome to Oravanti</h1>
        <p className="signup-welcome-copy">
          The all-in-one platform for U.S. law firms, legal professionals, and their clients.
          Choose how you'd like to get started.
        </p>

        <div className="signup-role-grid">
          <RoleCard
            icon={<Building2 size={20} />}
            title="Sign up as a firm"
            description="Law firms and legal practices"
            selected={role === "firm"}
            onClick={() => setRole("firm")}
          />
          <RoleCard
            icon={<UserRoundPlus size={20} />}
            title="Sign up as a contractor"
            description="Paralegals, interpreters, experts"
            selected={role === "contractor"}
            onClick={() => setRole("contractor")}
          />
          <RoleCard
            icon={<User size={20} />}
            title="Sign up as a client"
            description="Individuals seeking legal services"
            selected={role === "client"}
            onClick={() => setRole("client")}
          />
        </div>

        <button
          className="signup-primary-button signup-primary-button--wide"
          type="button"
          disabled={role !== "contractor"}
          onClick={() => navigate("/signup/contractor")}
        >
          Continue
        </button>
        <a className="signup-login-link" href="/login">
          Already have an account? Log in
        </a>
      </section>
    </main>
  );
}
