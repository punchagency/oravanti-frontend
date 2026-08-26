import { Button } from "@chakra-ui/react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Provider } from "@/providers/provider";
import { OverrideDialog } from "./override-dialog";

/*
  The locked backbone's front door.

  A locked step is one a firm's template says must happen — a limitation
  deadline, a statutory notice. Weakening one is allowed, but only on the
  record. If this dialog ever submits without a rationale, the backend still
  refuses, but the user meets a raw 400 instead of a prompt; if it submits an
  empty one, the audit trail fills with overrides nobody can account for.
*/

function open() {
  return render(
    <Provider>
      <OverrideDialog taskTitle="Serve pre-suit notice" action="Skip this step" onConfirm={onConfirm}>
        <Button>Skip</Button>
      </OverrideDialog>
    </Provider>,
  );
}

let onConfirm = vi.fn();

describe("OverrideDialog", () => {
  it("will not submit without a rationale", async () => {
    onConfirm = vi.fn();
    const user = userEvent.setup();
    open();

    await user.click(screen.getByRole("button", { name: "Skip" }));

    const confirm = await screen.findByRole("button", { name: "Skip this step" });
    expect(confirm).toBeDisabled();

    await user.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("will not submit a token rationale", async () => {
    onConfirm = vi.fn();
    const user = userEvent.setup();
    open();

    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.type(await screen.findByLabelText("Reason for override"), "n/a");

    expect(screen.getByRole("button", { name: "Skip this step" })).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("submits the rationale once it is a real sentence", async () => {
    onConfirm = vi.fn();
    const user = userEvent.setup();
    open();

    const rationale = "Client settled directly; the statutory notice no longer applies.";

    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.type(await screen.findByLabelText("Reason for override"), rationale);

    const confirm = screen.getByRole("button", { name: "Skip this step" });
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);

    expect(onConfirm).toHaveBeenCalledWith(rationale);
  });
});
