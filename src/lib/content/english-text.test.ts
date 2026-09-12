import { describe, expect, it } from "vitest";
import {
  getDisplaySegments,
  hasReadableEnglish,
  stripChineseGlosses,
} from "@/lib/content/english-text";

describe("stripChineseGlosses", () => {
  it("removes full-width parenthetical glosses", () => {
    expect(
      stripChineseGlosses(
        "She leaned against the car door（靠着车门）, holding up her phone.",
      ),
    ).toBe("She leaned against the car door, holding up her phone.");
  });

  it("collapses the double space left by a spaced gloss", () => {
    expect(stripChineseGlosses("It was cold（很冷） outside.")).toBe(
      "It was cold outside.",
    );
  });

  it("never touches ASCII parentheses", () => {
    const text = "The word (hello) stays, and so does wan-fu (blessing).";
    expect(stripChineseGlosses(text)).toBe(text);
  });

  it("trims leading and trailing whitespace", () => {
    expect(stripChineseGlosses("（开头注） Hello there ")).toBe("Hello there");
  });
});

describe("hasReadableEnglish", () => {
  it("accepts plain English", () => {
    expect(hasReadableEnglish("The sun was bright, but it brought no warmth."))
      .toBe(true);
  });

  it("accepts English that quotes hanzi as content", () => {
    expect(
      hasReadableEnglish(
        "like *hou* (后), *mian* (面), *li* (里), *chou* (丑), *zhi* (只), *yun* (云).",
      ),
    ).toBe(true);
    expect(
      hasReadableEnglish(
        'At the Hong Kong gate, transferring to Beijing, I had seen the two characters "北京",',
      ),
    ).toBe(true);
  });

  it("rejects Chinese narration with embedded Latin (skip rule: cjk * 2 > latin)", () => {
    expect(
      hasReadableEnglish(
        "「那漢子眼睛瞪得老大說：啥？你Sorry我？我還Sorry你全家咧！」",
      ),
    ).toBe(false);
    expect(
      hasReadableEnglish("我能張開右手告訴他們 talk to this hand 嗎？"),
    ).toBe(false);
    expect(hasReadableEnglish("她靠在车门边。")).toBe(false);
  });
});

describe("getDisplaySegments", () => {
  it("keeps only readable-English segments and preserves id and order", () => {
    const segments = [
      { id: "segment-1", chinese: "", english: "First line of prose.", grammarNotes: [], phrases: [] },
      { id: "segment-2", chinese: "", english: "我能張開右手告訴他們 talk to this hand 嗎？", grammarNotes: [], phrases: [] },
      { id: "segment-3", chinese: "", english: "Third line（注释） of prose.", grammarNotes: [], phrases: [] },
    ];

    const displayed = getDisplaySegments(segments);

    expect(displayed.map((segment) => segment.id)).toEqual([
      "segment-1",
      "segment-3",
    ]);
  });
});
