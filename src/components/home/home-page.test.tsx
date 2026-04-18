import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePage } from "@/components/home/home-page";
import { getBooks } from "@/lib/content/library";

describe("HomePage", () => {
  it("shows the hero message and both featured books", () => {
    render(<HomePage books={getBooks()} />);

    expect(
      screen.getByText("Read literary English without losing the original pulse."),
    ).toBeInTheDocument();
    expect(screen.getByText("Half-Demon Si Teng")).toBeInTheDocument();
    expect(screen.getByText("Spring and Autumn")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start with Si Teng" }),
    ).toBeInTheDocument();
  });
});
