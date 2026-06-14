import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders an accessible command", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={onClick}>Run audit</Button>);
    await user.click(screen.getByRole("button", { name: "Run audit" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("prevents clicks while loading", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button loading onClick={onClick}>
        Export
      </Button>
    );
    await user.click(screen.getByRole("button", { name: "Export" }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
