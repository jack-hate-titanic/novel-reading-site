import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  getStoredProgress,
  saveBookProgress,
  getBookProgress,
  calculateBookPercentage,
  getMostRecentBook,
} from "@/lib/reading-progress";
import type { ChapterPreview } from "@/lib/content/types";

const STORAGE_KEY = "novel-reading-progress";

const sampleChapters: ChapterPreview[] = [
  { slug: "chapter-01", bookSlug: "nuan-nuan", title: "Chapter 1", order: 1, summary: "", segmentCount: 90 },
  { slug: "chapter-02", bookSlug: "nuan-nuan", title: "Chapter 2", order: 2, summary: "", segmentCount: 100 },
  { slug: "chapter-03", bookSlug: "nuan-nuan", title: "Chapter 3", order: 3, summary: "", segmentCount: 80 },
];

beforeEach(() => {
  localStorage.clear();
});

describe("reading-progress", () => {
  it("returns empty object when no progress is stored", () => {
    expect(getStoredProgress()).toEqual({});
  });

  it("reuses the same progress snapshot when storage has not changed", () => {
    saveBookProgress("nuan-nuan", "chapter-01", 5);

    expect(getStoredProgress()).toBe(getStoredProgress());
  });

  it("saves and retrieves progress for a book", () => {
    saveBookProgress("nuan-nuan", "chapter-01", 5);

    const progress = getBookProgress("nuan-nuan");
    expect(progress).not.toBeNull();
    expect(progress!.lastChapterSlug).toBe("chapter-01");
    expect(progress!.lastSegmentIndex).toBe(5);
    expect(progress!.updatedAt).toBeGreaterThan(0);
  });

  it("overwrites progress for the same book", () => {
    saveBookProgress("nuan-nuan", "chapter-01", 5);
    saveBookProgress("nuan-nuan", "chapter-02", 20);

    const progress = getBookProgress("nuan-nuan");
    expect(progress!.lastChapterSlug).toBe("chapter-02");
    expect(progress!.lastSegmentIndex).toBe(20);
  });

  it("returns null for a book with no progress", () => {
    expect(getBookProgress("nonexistent")).toBeNull();
  });

  it("calculates percentage: first chapter, early segment", () => {
    const progress = { lastChapterSlug: "chapter-01", lastSegmentIndex: 9, updatedAt: 1 };
    // 9 / (90 + 100 + 80) = 9 / 270 ≈ 3%
    expect(calculateBookPercentage(sampleChapters, progress)).toBe(3);
  });

  it("calculates percentage: first chapter completed", () => {
    const progress = { lastChapterSlug: "chapter-01", lastSegmentIndex: 90, updatedAt: 1 };
    // 90 / 270 = 33%
    expect(calculateBookPercentage(sampleChapters, progress)).toBe(33);
  });

  it("calculates percentage: halfway through second chapter", () => {
    const progress = { lastChapterSlug: "chapter-02", lastSegmentIndex: 50, updatedAt: 1 };
    // (90 + 50) / 270 = 140 / 270 ≈ 52%
    expect(calculateBookPercentage(sampleChapters, progress)).toBe(52);
  });

  it("calculates percentage: last chapter completed", () => {
    const progress = { lastChapterSlug: "chapter-03", lastSegmentIndex: 80, updatedAt: 1 };
    // (90 + 100 + 80) / 270 = 100%
    expect(calculateBookPercentage(sampleChapters, progress)).toBe(100);
  });

  it("clamps segment index to chapter's segment count", () => {
    const progress = { lastChapterSlug: "chapter-02", lastSegmentIndex: 999, updatedAt: 1 };
    // (90 + 100) / 270 ≈ 70%
    expect(calculateBookPercentage(sampleChapters, progress)).toBe(70);
  });

  it("returns most recently updated book", () => {
    saveBookProgress("book-a", "ch-1", 0);
    // Small delay to ensure different timestamps
    const later = Date.now() + 10;
    vi.spyOn(Date, "now").mockReturnValueOnce(later);
    saveBookProgress("book-b", "ch-2", 0);

    const recent = getMostRecentBook();
    expect(recent).not.toBeNull();
    expect(recent!.bookSlug).toBe("book-b");
  });

  it("returns null from getMostRecentBook when no progress exists", () => {
    expect(getMostRecentBook()).toBeNull();
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "not-valid-json");
    expect(getStoredProgress()).toEqual({});
  });
});
