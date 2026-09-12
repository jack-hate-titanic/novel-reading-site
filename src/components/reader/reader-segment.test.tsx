import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReaderSegment } from "@/components/reader/reader-segment";

describe("ReaderSegment", () => {
  it("renders gloss-free English text", () => {
    render(
      <ReaderSegment
        segment={{
          id: "segment-1",
          english:
            "She leaned against the car door（靠着车门）, holding up her phone.",
        }}
      />,
    );

    expect(
      screen.getByText(
        "She leaned against the car door, holding up her phone.",
      ),
    ).toBeInTheDocument();
  });

  it("renders only the English text with no label", () => {
    const { container } = render(
      <ReaderSegment
        segment={{ id: "segment-2", english: "The sun was bright." }}
      />,
    );

    expect(container.querySelectorAll("p")).toHaveLength(1);
    expect(screen.getByText("The sun was bright.")).toBeInTheDocument();
    expect(screen.queryByText(/^Segment \d/)).not.toBeInTheDocument();
  });
});
