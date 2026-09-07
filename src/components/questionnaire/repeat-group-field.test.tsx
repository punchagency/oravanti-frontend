import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { QuestionConfig } from "@/api/questionnaires";
import { Provider } from "@/providers/provider";
import { RepeatGroupField } from "./repeat-group-field";

/*
  The control behind every list a USCIS form asks for.

  What is asserted here is the handful of behaviours that are silent when wrong:
  a client cannot delete their way to no answer, an entry they never filled is
  not stored, and a question whose config is broken says so rather than
  offering an Add button that produces nothing.
*/

const config: QuestionConfig = {
  itemLabel: "Address",
  fields: [
    { key: "street", label: "Street number and name", type: "short_text" },
    { key: "city", label: "City or town", type: "short_text" },
  ],
};

const setup = (props: Partial<Parameters<typeof RepeatGroupField>[0]> = {}) => {
  const onChange = vi.fn();
  render(
    <Provider>
      <RepeatGroupField
        value=""
        onChange={onChange}
        config={config}
        {...props}
      />
    </Provider>,
  );
  /** The list as it would be stored, from the most recent change. */
  const lastSaved = () =>
    JSON.parse(onChange.mock.calls.at(-1)?.[0] ?? "null") as unknown;
  return { onChange, lastSaved };
};

describe("RepeatGroupField", () => {
  it("opens with one empty entry rather than a lone Add button", () => {
    // An empty list would read as "this does not apply to me" instead of as a
    // first row waiting to be filled.
    setup();
    expect(screen.getByText("Address 1")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Address 1: City or town"),
    ).toBeInTheDocument();
  });

  it("marks the first entry as the most recent", () => {
    // The order is the whole meaning of an address history, and the form reads
    // entry 1 as the current address.
    setup();
    expect(screen.getByText(/most recent/)).toBeInTheDocument();
  });

  it("adds an entry and keeps the ones already there", async () => {
    const { lastSaved } = setup({
      value: JSON.stringify([{ street: "123 Main St" }]),
    });

    await userEvent.click(
      screen.getByRole("button", { name: /add another address/i }),
    );
    expect(lastSaved()).toEqual([{ street: "123 Main St" }, {}]);
  });

  it("offers no way to remove the only entry", () => {
    // There is nothing to undo it with, and a removed sole entry leaves the
    // question looking unasked.
    setup({ value: JSON.stringify([{ street: "123 Main St" }]) });
    expect(screen.queryByLabelText(/remove address/i)).not.toBeInTheDocument();
  });

  it("removes the entry that was asked for, not the last one", async () => {
    const { lastSaved } = setup({
      value: JSON.stringify([{ city: "Brooklyn" }, { city: "Newark" }]),
    });

    await userEvent.click(screen.getByLabelText("Remove address 1"));
    expect(lastSaved()).toEqual([{ city: "Newark" }]);
  });

  it("stops at maxItems and says why", () => {
    setup({
      config: { ...config, maxItems: 1 },
      value: JSON.stringify([{ city: "Brooklyn" }]),
    });
    expect(
      screen.getByRole("button", { name: /add another address/i }),
    ).toBeDisabled();
  });

  it("says a broken config is broken instead of offering an empty entry", () => {
    // `config` is jsonb with nothing validating it. An Add button here would
    // produce entries with no fields in them, which saves nothing and looks
    // like the client's fault.
    setup({ config: { itemLabel: "Address" } });
    expect(screen.getByText(/not set up yet/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add another/i }),
    ).not.toBeInTheDocument();
  });
});
