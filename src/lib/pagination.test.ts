import { describe, expect, it } from "vitest";
import {
  clampAnchor,
  packPagesByHeight,
  pageIndexOfSegment,
} from "@/lib/pagination";

describe("packPagesByHeight", () => {
  it("packs sequential segments until the page is full", () => {
    // 100 + 18 + 100 = 218 <= 250; adding another 18 + 100 = 336 > 250.
    expect(packPagesByHeight([100, 100, 100], 250, 18)).toEqual([[0, 1], [2]]);
  });

  it("gives an over-tall segment its own page instead of dropping it", () => {
    expect(packPagesByHeight([400, 100], 250, 18)).toEqual([[0], [1]]);
  });

  it("packs zero-height segments into one page", () => {
    expect(packPagesByHeight([0, 0, 0, 0], 250, 18)).toEqual([[0, 1, 2, 3]]);
  });

  it("returns an empty page list for no segments", () => {
    expect(packPagesByHeight([], 250, 18)).toEqual([]);
  });

  it("starts a new page when the gap alone would overflow", () => {
    // 120 + 18 + 120 = 258 > 250, so each segment gets its own page.
    expect(packPagesByHeight([120, 120], 250, 18)).toEqual([[0], [1]]);
  });
});

describe("pageIndexOfSegment", () => {
  it("finds the page containing a segment", () => {
    const pages = [[0, 1], [2], [3, 4]];
    expect(pageIndexOfSegment(pages, 0)).toBe(0);
    expect(pageIndexOfSegment(pages, 2)).toBe(1);
    expect(pageIndexOfSegment(pages, 4)).toBe(2);
  });

  it("clamps unknown segments to the last page", () => {
    expect(pageIndexOfSegment([[0, 1], [2]], 99)).toBe(1);
  });

  it("returns 0 for an empty page list", () => {
    expect(pageIndexOfSegment([], 0)).toBe(0);
  });
});

describe("clampAnchor", () => {
  it("clamps negative and too-large anchors", () => {
    expect(clampAnchor(-3, 5)).toBe(0);
    expect(clampAnchor(9, 5)).toBe(4);
    expect(clampAnchor(2, 5)).toBe(2);
  });

  it("returns 0 when there are no segments", () => {
    expect(clampAnchor(3, 0)).toBe(0);
  });
});
