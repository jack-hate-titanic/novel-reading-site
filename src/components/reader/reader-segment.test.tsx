import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReaderSegment } from "@/components/reader/reader-segment";

describe("ReaderSegment", () => {
  it("renders the segment label and gloss-free English", () => {
    render(
      <ReaderSegment
        index={1}
        segment={{
          id: "segment-1",
          english:
            "She leaned against the car door（靠着车门）, holding up her phone.",
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

  it("renders only the label and English text", () => {
    const { container } = render(
      <ReaderSegment
        index={2}
        segment={{ id: "segment-2", english: "The sun was bright." }}
      />,
    );

    const article = container.querySelector("article");
    expect(article).not.toBeNull();
    expect(article?.children).toHaveLength(2);
    expect(screen.getByText("Segment 2")).toBeInTheDocument();
    expect(screen.getByText("The sun was bright.")).toBeInTheDocument();
  });
});
