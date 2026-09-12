import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PaginatedReader } from "@/components/reader/paginated-reader";
import {
  getBookProgress,
  saveBookProgress,
} from "@/lib/reading-progress";
import type { EnglishSegment } from "@/lib/content/english-text";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const makeSegments = (count: number): EnglishSegment[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `segment-${index + 1}`,
    english: `Segment text ${index + 1} for pagination tests.`,
  }));

const defaultProps = () => ({
  bookSlug: "nuan-nuan",
  chapterSlug: "chapter-01",
  segments: makeSegments(5),
  previousHref: null,
  nextHref: null,
  previousChapterDisplayCount: 0,
});

// jsdom has no layout: give every segment wrapper a fixed 300px height and
// every other element (box, control bar) 56px. window.innerHeight is 768.
// packHeight = 768 - 0 - 32 - 56 - 12 = 668 -> two 300px segments per page.
const mockLayout = () => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      const height = this.hasAttribute("data-segment-index") ? 300 : 56;
      return {
        height,
        width: 600,
        top: 0,
        left: 0,
        right: 600,
        bottom: height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect;
    },
  );
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
};

beforeEach(() => {
  localStorage.clear();
  mockLayout();
  window.history.replaceState(null, "", "/read/nuan-nuan/chapter-01");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  pushMock.mockReset();
});

describe("PaginatedReader", () => {
  it("packs two segments per page and shows Page 1 of 3", () => {
    render(<PaginatedReader {...defaultProps()} />);

    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(
      screen.getByText("Segment text 1 for pagination tests."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Segment text 2 for pagination tests."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Segment text 5 for pagination tests."),
    ).not.toBeInTheDocument();
  });

  it("caps the box height to a short viewport instead of a fixed floor", () => {
    vi.stubGlobal("innerHeight", 280);
    const { container } = render(<PaginatedReader {...defaultProps()} />);

    // 280 - 0 (box top) - 32 (bottom gutter) = 248: the box never grows
    // past the visible screen, so pages fit short viewports too.
    expect(container.querySelector("section")).toHaveStyle({ height: "248px" });
    expect(screen.getByText("1 / 5")).toBeInTheDocument();
  });

  it("saves the anchor for the opened page on mount", () => {
    render(<PaginatedReader {...defaultProps()} />);

    const progress = getBookProgress("nuan-nuan");
    expect(progress?.lastChapterSlug).toBe("chapter-01");
    expect(progress?.lastSegmentIndex).toBe(0);
  });

  it("turns the page: indicator, URL, and progress all update", async () => {
    const user = userEvent.setup();
    render(<PaginatedReader {...defaultProps()} />);

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(window.location.search).toBe("?s=3");
    expect(getBookProgress("nuan-nuan")?.lastSegmentIndex).toBe(2);
  });

  it("turns pages with the arrow keys", () => {
    render(<PaginatedReader {...defaultProps()} />);

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("restores the page from the ?s= URL parameter", () => {
    window.history.replaceState(null, "", "/read/nuan-nuan/chapter-01?s=5");
    render(<PaginatedReader {...defaultProps()} />);

    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    expect(
      screen.getByText("Segment text 5 for pagination tests."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Segment text 1 for pagination tests."),
    ).not.toBeInTheDocument();
    expect(getBookProgress("nuan-nuan")?.lastSegmentIndex).toBe(4);
  });

  it("falls back to stored progress for this chapter when no ?s= is given", () => {
    saveBookProgress("nuan-nuan", "chapter-01", 2);
    render(<PaginatedReader {...defaultProps()} />);

    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("navigates to the next chapter from the last page", async () => {
    const user = userEvent.setup();
    render(
      <PaginatedReader {...defaultProps()} nextHref="/read/nuan-nuan/chapter-02" />,
    );

    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(pushMock).toHaveBeenCalledWith("/read/nuan-nuan/chapter-02");
  });

  it("navigates to the previous chapter's last page from the first page", async () => {
    const user = userEvent.setup();
    render(
      <PaginatedReader
        {...defaultProps()}
        previousHref="/read/nuan-nuan/chapter-00"
        previousChapterDisplayCount={10}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Previous page" }));

    expect(pushMock).toHaveBeenCalledWith("/read/nuan-nuan/chapter-00?s=10");
  });

  it("disables boundary buttons when there is no chapter to go to", () => {
    render(<PaginatedReader {...defaultProps()} />);

    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("adjusts and persists the font size", async () => {
    const user = userEvent.setup();
    render(<PaginatedReader {...defaultProps()} />);

    expect(screen.getByText("M")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Increase font size" }));
    expect(screen.getByText("L")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Increase font size" }));
    await user.click(screen.getByRole("button", { name: "Increase font size" }));
    expect(screen.getByText("XL")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Increase font size" }),
    ).toBeDisabled();

    expect(
      JSON.parse(localStorage.getItem("novel-reader-preferences")!),
    ).toEqual({ fontScaleIndex: 3 });
  });
});
