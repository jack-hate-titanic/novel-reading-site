import { describe, expect, it } from "vitest";
import {
  getBooks,
  getChapterBySlugs,
} from "@/lib/content/library";

describe("content library", () => {
  it("loads both books and produces readable chapter segments from the real source files", () => {
    const books = getBooks();
    const siTeng = getChapterBySlugs("half-demon-si-teng", "chapter-1");
    const springOne = getChapterBySlugs("spring-and-autumn", "chapter-01");
    const springLater = getChapterBySlugs("spring-and-autumn", "chapter-11-20");

    expect(books.map((book) => book.slug)).toEqual([
      "half-demon-si-teng",
      "spring-and-autumn",
    ]);

    expect(siTeng?.segments.length).toBeGreaterThan(10);
    expect(springOne?.segments.length).toBeGreaterThan(10);
    expect(springLater?.segments.length).toBeGreaterThan(10);

    expect(siTeng?.segments[0].english).toContain("December 2013");
    expect(springOne?.segments[0].english).toContain("Love the realm");
    expect(springLater?.segments[0].english).toContain("people thrive when they move");
  });
});
