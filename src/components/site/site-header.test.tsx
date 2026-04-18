import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "@/components/site/site-header";

describe("SiteHeader", () => {
  it("renders the brand and primary navigation labels", () => {
    render(<SiteHeader />);

    expect(screen.getByText("Novel Reading Site")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Library" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue Reading" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "About Reading Mode" }),
    ).toBeInTheDocument();
  });
});
