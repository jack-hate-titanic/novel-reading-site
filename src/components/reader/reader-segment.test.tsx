import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReaderSegment } from "@/components/reader/reader-segment";

describe("ReaderSegment", () => {
  it("shows English first and keeps support content collapsed behind details labels", () => {
    render(
      <ReaderSegment
        index={1}
        segment={{
          id: "segment-1",
          english: "The sun was bright, but it brought no warmth.",
          chinese: "阳光很好，但没有暖意。",
          grammarNotes: ["语法标记：并列句。"],
          phrases: ["bring no warmth：毫无暖意"],
        }}
      />,
    );

    expect(
      screen.getByText("The sun was bright, but it brought no warmth."),
    ).toBeInTheDocument();
    expect(screen.getByText("Show Chinese")).toBeInTheDocument();
    expect(screen.getByText("Show Notes")).toBeInTheDocument();
  });
});
