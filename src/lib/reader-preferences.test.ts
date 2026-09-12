import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FONT_SIZES,
  getReaderFontScaleIndex,
  setReaderFontScaleIndex,
  subscribeToFontPreferences,
} from "@/lib/reader-preferences";

const STORAGE_KEY = "novel-reader-preferences";

beforeEach(() => {
  localStorage.clear();
});

describe("reader-preferences", () => {
  it("defaults to the medium size (index 1)", () => {
    expect(getReaderFontScaleIndex()).toBe(1);
    expect(FONT_SIZES[getReaderFontScaleIndex()]).toBe(1);
  });

  it("persists a font size change and notifies subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToFontPreferences(listener);

    setReaderFontScaleIndex(3);

    expect(getReaderFontScaleIndex()).toBe(3);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
      fontScaleIndex: 3,
    });
    expect(listener).toHaveBeenCalled();

    unsubscribe();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToFontPreferences(listener);
    unsubscribe();

    setReaderFontScaleIndex(0);

    expect(listener).not.toHaveBeenCalled();
  });

  it("ignores out-of-range indexes", () => {
    setReaderFontScaleIndex(-1);
    expect(getReaderFontScaleIndex()).toBe(1);
    setReaderFontScaleIndex(FONT_SIZES.length);
    expect(getReaderFontScaleIndex()).toBe(1);
  });

  it("falls back to the default when storage holds invalid JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(getReaderFontScaleIndex()).toBe(1);
  });

  it("falls back to the default when the stored index is out of range", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fontScaleIndex: 99 }));
    expect(getReaderFontScaleIndex()).toBe(1);
  });
});
