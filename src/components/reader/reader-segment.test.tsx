import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReaderSegment } from "@/components/reader/reader-segment";

describe("ReaderSegment", () => {
  it("renders the segment label and gloss-free English only", () => {
    render(
      <ReaderSegment
        index={1}
        segment={{
          id: "segment-1",
          english:
            "She leaned against the car door（靠着车门）, holding up her phone.",
          chinese: "阳光很好，但没有暖意。",
          grammarNotes: ["语法标记：并列句。"],
          phrases: ["bring no warmth：毫无暖意"],
        }}
      />,
    );

    expect(screen.getByText("Segment 1")).toBeInTheDocument();
    expect(
      screen.getByText(
        "She leaned against the car door, holding up her phone.",
      ),
    ).toBeInTheDocument();
  });

  it("does not render Chinese translations, notes, or phrase blocks", () => {
    render(
      <ReaderSegment
        index={2}
        segment={{
          id: "segment-2",
          english: "The sun was bright, but it brought no warmth.",
          chinese: "阳光很好，但没有暖意。",
          grammarNotes: ["语法标记：并列句。"],
          phrases: ["bring no warmth：毫无暖意"],
        }}
      />,
    );

    expect(screen.queryByText("Show Chinese")).not.toBeInTheDocument();
    expect(screen.queryByText("Show Notes")).not.toBeInTheDocument();
    expect(screen.queryByText("阳光很好，但没有暖意。")).not.toBeInTheDocument();
    expect(
      screen.queryByText("语法标记：并列句。"),
    ).not.toBeInTheDocument();
  });
});
