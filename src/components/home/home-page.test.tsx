import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePage } from "@/components/home/home-page";
import { getBooks } from "@/lib/content/library";

describe("HomePage", () => {
  it("shows the ranking list with featured books", () => {
    render(<HomePage books={getBooks()} />);

    expect(screen.getByRole("heading", { name: "Reader Rankings" })).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nuannuan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Half-Demon Si Teng" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Spring and Autumn" })).toBeInTheDocument();
    expect(screen.getByText("Recommendation 94.9%", { exact: false })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Read" })).toHaveLength(3);
  });
});
