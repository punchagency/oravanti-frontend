import { CircleCheck } from "lucide-react";
import { ThemeCircle } from "./theme-circle";

export function CompleteView() {
  return (
    <main className="signup-page">
      <ThemeCircle />
      <section className="signup-card signup-card--complete">
        <div className="signup-complete-icon">
          <CircleCheck size={28} />
        </div>
        <h1>Profile submitted for review</h1>
        <p>
          Your contractor profile is saved. Once your background check clears
          (2-3 business days), your profile goes live on the marketplace and you
          can start receiving assignments.
        </p>
        <a className="signup-primary-button signup-primary-button--dashboard" href="/">
          Go to contractor dashboard
        </a>
      </section>
    </main>
  );
}
