import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BookDetailPage } from "@/components/books/book-detail-page";
import { getBookBySlug } from "@/lib/content/library";

describe("BookDetailPage", () => {
  it("renders the selected book summary and chapter list", () => {
    const book = getBookBySlug("spring-and-autumn");

    if (!book) {
      throw new Error("book not found");
    }

    render(<BookDetailPage book={book} />);

    expect(screen.getByText("Spring and Autumn")).toBeInTheDocument();
    expect(screen.getByText("English First")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Begin reading/i })).toBeInTheDocument();
    expect(screen.getByText("Chapter 1: The Fairy Maiden")).toBeInTheDocument();
  });
});
