# Reader Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the paginated, pure-English reader described in `docs/superpowers/specs/2026-09-12-reader-pagination-design.md`: viewport-height pagination with adjustable font size, segment-anchored position memory, and all Chinese hidden at the rendering layer.

**Architecture:** Three pure libs (`english-text`, `pagination`, `reader-preferences`) feed one new client component (`PaginatedReader`) that measures the SSR-rendered segment list in `useLayoutEffect`, packs pages by height, and swaps to page-only rendering before first paint. Server components filter segments for display so prerendered HTML is already pure English. Progress consumers deep-link with `?s=`.

**Tech Stack:** Next.js 16.2.4 App Router (static prerender), React 19, CSS Modules, Vitest 4 + @testing-library/react + jsdom.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-12-reader-pagination-design.md` — every task must match it.
- Do NOT modify `content/raw/**` or `src/lib/content/parser.ts`. No new dependencies.
- Next.js is 16.2.4 and differs from training data — consult `node_modules/next/dist/docs/` before writing Next-specific code (already verified for this plan: no `useSearchParams`; URL state via `window.location.search` + `history.replaceState`).
- UI copy stays English. Code stays English.
- Never spawn a dev server on port 3000 — the user runs their own. Verify visually against `http://localhost:3000` if it is up; otherwise mark visual checks unverified.
- Environment is Windows + Git Bash; repo uses `core.autocrlf=true` (LF stored, CRLF in worktree — normal).
- The working tree has unrelated uncommitted user files (`README.md`, `.claude/settings.json`, `scripts/*`). NEVER `git add -A` — always add the exact files a task touched.
- Commit messages end with: `Co-Authored-By: Claude Code <noreply@anthropic.com>`
- Full-suite commands: `npm run test:run`, `npm run lint`, `npm run build`. Single file: `npx vitest run <path>`.

---

### Task 1: English text filter lib

**Files:**
- Create: `src/lib/content/english-text.ts`
- Test: `src/lib/content/english-text.test.ts`

**Interfaces:**
- Consumes: `ReaderSegment` from `src/lib/content/types` (`{ id, chinese, english, grammarNotes, phrases }`).
- Produces (used by Tasks 4, 5, 6):
  - `stripChineseGlosses(text: string): string`
  - `hasReadableEnglish(text: string): boolean`
  - `getDisplaySegments(segments: ReaderSegment[]): ReaderSegment[]`

- [ ] **Step 1: Write the failing test**

Create `src/lib/content/english-text.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/content/english-text.test.ts`
Expected: FAIL — cannot resolve `@/lib/content/english-text`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/content/english-text.ts`:

```ts
import type { ReaderSegment } from "@/lib/content/types";

const CJK_PATTERN = /[一-鿿]/g;
const LATIN_PATTERN = /[A-Za-z]/g;
const FULL_WIDTH_GLOSS_PATTERN = /（[^）]*）/g;

export function stripChineseGlosses(text: string): string {
  return text
    .replace(FULL_WIDTH_GLOSS_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function hasReadableEnglish(text: string): boolean {
  const stripped = stripChineseGlosses(text);
  const cjkCount = (stripped.match(CJK_PATTERN) ?? []).length;
  const latinCount = (stripped.match(LATIN_PATTERN) ?? []).length;
  return latinCount > 0 && cjkCount * 2 <= latinCount;
}

export function getDisplaySegments(
  segments: ReaderSegment[],
): ReaderSegment[] {
  return segments.filter((segment) => hasReadableEnglish(segment.english));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/content/english-text.test.ts`
Expected: PASS (all 7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/english-text.ts src/lib/content/english-text.test.ts
git commit -m "feat: add English display text filter for the pure-English reader

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: Pagination packing lib

**Files:**
- Create: `src/lib/pagination.ts`
- Test: `src/lib/pagination.test.ts`

**Interfaces:**
- Produces (used by Task 5):
  - `packPagesByHeight(heights: number[], maxHeight: number, gap: number): number[][]` — pages of segment indexes; an over-tall segment still gets its own page; all-zero heights pack into a single page naturally.
  - `pageIndexOfSegment(pages: number[][], segmentIndex: number): number` — page containing the segment; out-of-range clamps to the last page.
  - `clampAnchor(anchor: number, totalSegments: number): number`

- [ ] **Step 1: Write the failing test**

Create `src/lib/pagination.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/pagination.test.ts`
Expected: FAIL — cannot resolve `@/lib/pagination`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/pagination.ts`:

```ts
export function packPagesByHeight(
  heights: number[],
  maxHeight: number,
  gap: number,
): number[][] {
  const pages: number[][] = [];
  let current: number[] = [];
  let usedHeight = 0;

  for (let index = 0; index < heights.length; index += 1) {
    const height = Math.max(heights[index] ?? 0, 0);
    const gapBefore = current.length > 0 ? gap : 0;

    if (current.length > 0 && usedHeight + gapBefore + height > maxHeight) {
      pages.push(current);
      current = [index];
      usedHeight = height;
    } else {
      current.push(index);
      usedHeight += gapBefore + height;
    }
  }

  if (current.length > 0) {
    pages.push(current);
  }

  return pages;
}

export function pageIndexOfSegment(
  pages: number[][],
  segmentIndex: number,
): number {
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    if (pages[pageIndex].includes(segmentIndex)) {
      return pageIndex;
    }
  }
  return Math.max(pages.length - 1, 0);
}

export function clampAnchor(anchor: number, totalSegments: number): number {
  if (totalSegments <= 0) {
    return 0;
  }
  return Math.min(Math.max(Math.trunc(anchor), 0), totalSegments - 1);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/pagination.test.ts`
Expected: PASS (all 10 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pagination.ts src/lib/pagination.test.ts
git commit -m "feat: add height-based page packing helpers

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: Reader font preference store

**Files:**
- Create: `src/lib/reader-preferences.ts`
- Test: `src/lib/reader-preferences.test.ts`

**Interfaces:**
- Produces (used by Task 5):
  - `FONT_SIZES: readonly number[]` — `[0.85, 1, 1.15, 1.3]` (S/M/L/XL)
  - `getReaderFontScaleIndex(): number` — default `1`
  - `setReaderFontScaleIndex(index: number): void`
  - `subscribeToFontPreferences(cb: () => void): () => void` — for `useSyncExternalStore`
- Pattern reference: `src/lib/reading-progress.ts` (same localStorage + listener + cache style).

- [ ] **Step 1: Write the failing test**

Create `src/lib/reader-preferences.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/reader-preferences.test.ts`
Expected: FAIL — cannot resolve `@/lib/reader-preferences`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/reader-preferences.ts`:

```ts
export const FONT_SIZES = [0.85, 1, 1.15, 1.3] as const;

export const DEFAULT_FONT_SCALE_INDEX = 1;

const STORAGE_KEY = "novel-reader-preferences";

type ReaderPreferences = {
  fontScaleIndex: number;
};

const isBrowser = () => typeof window !== "undefined";

let cachedRaw: string | null | undefined;
let cachedIndex = DEFAULT_FONT_SCALE_INDEX;

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function parseIndex(raw: string | null): number {
  if (raw === null) {
    return DEFAULT_FONT_SCALE_INDEX;
  }

  try {
    const parsed = JSON.parse(raw) as ReaderPreferences;
    if (
      Number.isInteger(parsed.fontScaleIndex) &&
      parsed.fontScaleIndex >= 0 &&
      parsed.fontScaleIndex < FONT_SIZES.length
    ) {
      return parsed.fontScaleIndex;
    }
  } catch {
    // Invalid JSON falls through to the default.
  }

  return DEFAULT_FONT_SCALE_INDEX;
}

export function getReaderFontScaleIndex(): number {
  if (!isBrowser()) return DEFAULT_FONT_SCALE_INDEX;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedIndex;
    cachedRaw = raw;
    cachedIndex = parseIndex(raw);
    return cachedIndex;
  } catch {
    return DEFAULT_FONT_SCALE_INDEX;
  }
}

export function setReaderFontScaleIndex(index: number): void {
  if (!isBrowser()) return;
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= FONT_SIZES.length
  ) {
    return;
  }

  const preferences: ReaderPreferences = { fontScaleIndex: index };

  try {
    const raw = JSON.stringify(preferences);
    localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedIndex = index;
    notifyListeners();
  } catch {
    // localStorage may be full or unavailable.
  }
}

export function subscribeToFontPreferences(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

if (isBrowser()) {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      cachedRaw = undefined;
      cachedIndex = DEFAULT_FONT_SCALE_INDEX;
      notifyListeners();
    }
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/reader-preferences.test.ts`
Expected: PASS (all 6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/reader-preferences.ts src/lib/reader-preferences.test.ts
git commit -m "feat: add persisted reader font size preference

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: ReaderSegment renders English only

**Files:**
- Modify: `src/components/reader/reader-segment.tsx`
- Modify: `src/components/reader/reader-segment.test.tsx` (full rewrite)
- Modify: `src/components/reader/reader-page.module.css` (remove now-unused classes only)

**Interfaces:**
- Consumes: `stripChineseGlosses` from Task 1.
- Produces: `ReaderSegment({ index: number, segment: ReaderSegmentType })` — renders one `<article>` with `Segment {index}` label and gloss-stripped English. Tasks 5 and 6 render this component.

- [ ] **Step 1: Rewrite the failing test**

Replace the full content of `src/components/reader/reader-segment.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/reader/reader-segment.test.tsx`
Expected: FAIL — "Show Chinese" assertions fail against the current component.

- [ ] **Step 3: Write the implementation**

Replace the full content of `src/components/reader/reader-segment.tsx`:

```tsx
import type { ReaderSegment as ReaderSegmentType } from "@/lib/content/types";
import { stripChineseGlosses } from "@/lib/content/english-text";
import styles from "./reader-page.module.css";

export function ReaderSegment({
  index,
  segment,
}: {
  index: number;
  segment: ReaderSegmentType;
}) {
  return (
    <article className={styles.segment}>
      <p className={styles.segmentIndex}>Segment {index}</p>
      <p className={styles.english}>{stripChineseGlosses(segment.english)}</p>
    </article>
  );
}
```

- [ ] **Step 4: Remove now-unused CSS classes**

In `src/components/reader/reader-page.module.css`, delete these four rule
blocks (they styled the removed Chinese/notes disclosures):

```css
.disclosure { ... }
.disclosure summary { ... }
.chinese, .noteList, .phraseList { ... }
```

Leave every other rule (including `.content`, removed later in Task 6)
untouched.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/reader/reader-segment.test.tsx`
Expected: PASS (2 tests).

Then run: `npm run test:run`
Expected: PASS — no other suite references the removed disclosures.

- [ ] **Step 6: Commit**

```bash
git add src/components/reader/reader-segment.tsx src/components/reader/reader-segment.test.tsx src/components/reader/reader-page.module.css
git commit -m "feat: render reader segments in English only

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: PaginatedReader client component

**Files:**
- Create: `src/components/reader/paginated-reader.tsx`
- Modify: `src/components/reader/reader-page.module.css` (add pagination styles + font-scale on `.english`)
- Test: `src/components/reader/paginated-reader.test.tsx`

**Interfaces:**
- Consumes: `packPagesByHeight`, `pageIndexOfSegment`, `clampAnchor` (Task 2); `FONT_SIZES`, `getReaderFontScaleIndex`, `setReaderFontScaleIndex`, `subscribeToFontPreferences` (Task 3); `ReaderSegment` (Task 4); `getBookProgress`, `saveBookProgress` from `src/lib/reading-progress`.
- Produces (used by Task 6):
  `PaginatedReader({ bookSlug: string; chapterSlug: string; segments: ReaderSegment[]; previousHref: string | null; nextHref: string | null; previousChapterDisplayCount: number })`
- Component is keyed by chapter in Task 6, so it may assume `segments` is stable for its lifetime.

- [ ] **Step 1: Write the failing test**

Create `src/components/reader/paginated-reader.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PaginatedReader } from "@/components/reader/paginated-reader";
import {
  getBookProgress,
  saveBookProgress,
} from "@/lib/reading-progress";
import type { ReaderSegment as ReaderSegmentData } from "@/lib/content/types";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const makeSegments = (count: number): ReaderSegmentData[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `segment-${index + 1}`,
    chinese: "",
    english: `Segment text ${index + 1} for pagination tests.`,
    grammarNotes: [],
    phrases: [],
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
  pushMock.mockReset();
});

describe("PaginatedReader", () => {
  it("packs two segments per page and shows Page 1 of 3", () => {
    render(<PaginatedReader {...defaultProps()} />);

    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Segment 1")).toBeInTheDocument();
    expect(screen.getByText("Segment 2")).toBeInTheDocument();
    expect(screen.queryByText("Segment 5")).not.toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: "Next →" }));

    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(window.location.search).toBe("?s=3");
    expect(getBookProgress("nuan-nuan")?.lastSegmentIndex).toBe(2);
  });

  it("turns pages with the arrow keys", () => {
    render(<PaginatedReader {...defaultProps()} />);

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
  });

  it("restores the page from the ?s= URL parameter", () => {
    window.history.replaceState(null, "", "/read/nuan-nuan/chapter-01?s=5");
    render(<PaginatedReader {...defaultProps()} />);

    expect(screen.getByText("Page 3 of 3")).toBeInTheDocument();
    expect(screen.getByText("Segment 5")).toBeInTheDocument();
    expect(screen.queryByText("Segment 1")).not.toBeInTheDocument();
    expect(getBookProgress("nuan-nuan")?.lastSegmentIndex).toBe(4);
  });

  it("falls back to stored progress for this chapter when no ?s= is given", () => {
    saveBookProgress("nuan-nuan", "chapter-01", 2);
    render(<PaginatedReader {...defaultProps()} />);

    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
  });

  it("navigates to the next chapter from the last page", async () => {
    const user = userEvent.setup();
    render(
      <PaginatedReader {...defaultProps()} nextHref="/read/nuan-nuan/chapter-02" />,
    );

    await user.click(screen.getByRole("button", { name: "Next →" }));
    await user.click(screen.getByRole("button", { name: "Next →" }));
    await user.click(screen.getByRole("button", { name: "Next →" }));

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

    await user.click(screen.getByRole("button", { name: "← Previous" }));

    expect(pushMock).toHaveBeenCalledWith("/read/nuan-nuan/chapter-00?s=10");
  });

  it("disables boundary buttons when there is no chapter to go to", () => {
    render(<PaginatedReader {...defaultProps()} />);

    expect(screen.getByRole("button", { name: "← Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next →" })).toBeDisabled();
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/reader/paginated-reader.test.tsx`
Expected: FAIL — cannot resolve `@/components/reader/paginated-reader`.

- [ ] **Step 3: Add the pagination CSS**

In `src/components/reader/reader-page.module.css`, apply two changes.

(a) Replace the existing `.english` rule with the font-scale-aware version:

```css
.english {
  margin: 0;
  font-family: var(--font-display), serif;
  font-size: calc(clamp(1.4rem, 2.4vw, 2rem) * var(--reader-font-scale, 1));
  line-height: 1.45;
}
```

(b) Append these rules at the end of the file, before the existing
`@media (max-width: 900px)` block, and add `.pageBox { order: -1; }` inside
that media block (after `.sidebar { position: static; }`):

```css
.pageBox {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 320px;
}

.pageScroll {
  flex: 1;
  min-height: 0;
  display: grid;
  gap: 18px;
  align-content: start;
  overflow-y: auto;
}

.controlBar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--card-glass);
}

.fontControls,
.pageControls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.controlButton {
  padding: 8px 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--ink);
  font-family: inherit;
  cursor: pointer;
}

.controlButton:hover:not(:disabled) {
  border-color: var(--gold);
  color: var(--gold);
}

.controlButton:disabled {
  opacity: 0.4;
  cursor: default;
}

.fontLabel {
  min-width: 2ch;
  text-align: center;
  color: var(--ink-soft);
  font-size: 0.85rem;
}

.pageIndicator {
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}
```

The media block ends up as:

```css
@media (max-width: 900px) {
  .page {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }

  .pageBox {
    order: -1;
  }
}
```

- [ ] **Step 4: Write the component**

Create `src/components/reader/paginated-reader.tsx`:

```tsx
"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ReaderSegment } from "@/components/reader/reader-segment";
import type { ReaderSegment as ReaderSegmentData } from "@/lib/content/types";
import {
  clampAnchor,
  packPagesByHeight,
  pageIndexOfSegment,
} from "@/lib/pagination";
import {
  FONT_SIZES,
  getReaderFontScaleIndex,
  setReaderFontScaleIndex,
  subscribeToFontPreferences,
} from "@/lib/reader-preferences";
import { getBookProgress, saveBookProgress } from "@/lib/reading-progress";
import styles from "./reader-page.module.css";

const BOTTOM_GUTTER = 32;
const BOX_INNER_GAP = 12;
const SEGMENT_GAP = 18;
const MIN_BOX_HEIGHT = 320;
const FONT_LABELS = ["S", "M", "L", "XL"] as const;

// useLayoutEffect warns when server-rendered; the reader SSRs the full
// segment list, so fall back to useEffect on the server.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function PaginatedReader({
  bookSlug,
  chapterSlug,
  segments,
  previousHref,
  nextHref,
  previousChapterDisplayCount,
}: {
  bookSlug: string;
  chapterSlug: string;
  segments: ReaderSegmentData[];
  previousHref: string | null;
  nextHref: string | null;
  previousChapterDisplayCount: number;
}) {
  const router = useRouter();

  const fontScaleIndex = useSyncExternalStore(
    subscribeToFontPreferences,
    getReaderFontScaleIndex,
    () => 1,
  );

  // null = measuring pass: every segment renders (SSR, no-JS, re-measure).
  const [pages, setPages] = useState<number[][] | null>(null);
  const [anchor, setAnchor] = useState(0);
  const [boxHeight, setBoxHeight] = useState<number | null>(null);

  const boxRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastBoxTop = useRef(0);
  const anchorResolved = useRef(false);

  const measuring = pages === null;
  const currentPage = pages === null ? 0 : pageIndexOfSegment(pages, anchor);
  const pageCount = pages === null ? 1 : Math.max(pages.length, 1);
  const visibleIndexes =
    pages === null
      ? segments.map((_, index) => index)
      : (pages[currentPage] ?? []);

  const runMeasure = useCallback(() => {
    const box = boxRef.current;
    if (!box) return;

    if (segments.length === 0) {
      setPages([]);
      return;
    }

    const heights = segmentRefs.current.map(
      (element) => element?.getBoundingClientRect().height ?? 0,
    );
    const barHeight = barRef.current?.getBoundingClientRect().height ?? 56;
    const boxTop = box.getBoundingClientRect().top + window.scrollY;
    lastBoxTop.current = boxTop;

    const fullBoxHeight = Math.max(
      window.innerHeight - boxTop - BOTTOM_GUTTER,
      MIN_BOX_HEIGHT,
    );
    const packHeight = Math.max(
      fullBoxHeight - barHeight - BOX_INNER_GAP,
      120,
    );

    setBoxHeight(fullBoxHeight);
    setPages(packPagesByHeight(heights, packHeight, SEGMENT_GAP));
  }, [segments.length]);

  // Resolve the starting anchor once per mount: URL ?s= first, then stored
  // progress for this chapter, then page 1. Runs before first paint.
  useIsomorphicLayoutEffect(() => {
    if (anchorResolved.current) return;
    anchorResolved.current = true;

    let initialAnchor = 0;
    const sParam = Number.parseInt(
      new URLSearchParams(window.location.search).get("s") ?? "",
      10,
    );

    if (Number.isInteger(sParam) && sParam >= 1 && sParam <= segments.length) {
      initialAnchor = sParam - 1;
    } else {
      const stored = getBookProgress(bookSlug);
      if (stored && stored.lastChapterSlug === chapterSlug) {
        initialAnchor = clampAnchor(stored.lastSegmentIndex, segments.length);
      }
    }

    setAnchor(initialAnchor);
    saveBookProgress(bookSlug, chapterSlug, initialAnchor);
  }, [bookSlug, chapterSlug, segments.length]);

  // Measure whenever a measuring pass has been requested (pages === null).
  // Runs after every commit but does nothing once pages are packed.
  useIsomorphicLayoutEffect(() => {
    if (pages !== null) return;
    if (typeof document !== "undefined" && document.fonts?.status !== "loaded") {
      // Custom fonts still loading: re-measure once they settle.
      document.fonts?.ready
        .then(() => setPages(null))
        .catch(() => undefined);
    }
    runMeasure();
  });

  // Font size changes re-render at a new scale, so re-measure (before paint).
  useIsomorphicLayoutEffect(() => {
    setPages(null);
  }, [fontScaleIndex]);

  // Viewport resizes re-measure, debounced.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => setPages(null), 150);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      if (timer !== null) clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const goToPage = useCallback(
    (pageIndex: number) => {
      if (!pages || pages.length === 0) return;

      const clamped = Math.min(Math.max(pageIndex, 0), pages.length - 1);
      const firstSegment = pages[clamped][0] ?? 0;
      setAnchor(firstSegment);

      const url = new URL(window.location.href);
      url.searchParams.set("s", String(firstSegment + 1));
      window.history.replaceState(null, "", url);

      saveBookProgress(bookSlug, chapterSlug, firstSegment);

      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
      window.scrollTo(0, lastBoxTop.current);
    },
    [pages, bookSlug, chapterSlug],
  );

  const goNext = useCallback(() => {
    if (pages && currentPage < pages.length - 1) {
      goToPage(currentPage + 1);
    } else if (nextHref) {
      router.push(nextHref);
    }
  }, [pages, currentPage, nextHref, goToPage, router]);

  const goPrevious = useCallback(() => {
    if (pages && currentPage > 0) {
      goToPage(currentPage - 1);
    } else if (previousHref) {
      router.push(
        `${previousHref}?s=${Math.max(previousChapterDisplayCount, 1)}`,
      );
    }
  }, [
    pages,
    currentPage,
    previousHref,
    previousChapterDisplayCount,
    goToPage,
    router,
  ]);

  // Arrow keys turn pages.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrevious]);

  const fontScale = FONT_SIZES[fontScaleIndex] ?? 1;

  const boxStyle = {
    "--reader-font-scale": String(fontScale),
    ...(boxHeight !== null ? { height: `${boxHeight}px` } : {}),
  } as CSSProperties;

  return (
    <section ref={boxRef} className={styles.pageBox} style={boxStyle}>
      <div ref={scrollRef} className={styles.pageScroll}>
        {visibleIndexes.map((index) => (
          <div
            key={segments[index].id}
            ref={(element) => {
              segmentRefs.current[index] = element;
            }}
            data-segment-index={index}
          >
            <ReaderSegment index={index + 1} segment={segments[index]} />
          </div>
        ))}
      </div>

      <div ref={barRef} className={styles.controlBar}>
        <div className={styles.fontControls}>
          <button
            type="button"
            className={styles.controlButton}
            onClick={() => setReaderFontScaleIndex(fontScaleIndex - 1)}
            disabled={fontScaleIndex === 0}
            aria-label="Decrease font size"
          >
            A−
          </button>
          <span className={styles.fontLabel}>{FONT_LABELS[fontScaleIndex]}</span>
          <button
            type="button"
            className={styles.controlButton}
            onClick={() => setReaderFontScaleIndex(fontScaleIndex + 1)}
            disabled={fontScaleIndex === FONT_SIZES.length - 1}
            aria-label="Increase font size"
          >
            A+
          </button>
        </div>
        <div className={styles.pageControls}>
          <button
            type="button"
            className={styles.controlButton}
            onClick={goPrevious}
            disabled={currentPage === 0 && !previousHref}
          >
            ← Previous
          </button>
          <span className={styles.pageIndicator}>
            Page {currentPage + 1} of {pageCount}
          </span>
          <button
            type="button"
            className={styles.controlButton}
            onClick={goNext}
            disabled={pages !== null && currentPage >= pageCount - 1 && !nextHref}
          >
            Next →
          </button>
        </div>
      </div>
    </section>
  );
}
```

Notes for the implementer:
- `setReaderFontScaleIndex` ignores out-of-range indexes (Task 3), so the
  button callbacks need no clamping.
- The measure layout effect intentionally has no dependency array; the
  `pages !== null` guard makes it a no-op after packing.
- On the last page the Next button is disabled only when there is no
  `nextHref`; `goNext` handles the chapter-boundary push otherwise.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/reader/paginated-reader.test.tsx`
Expected: PASS (9 tests). If a test fails, fix the component, not the mocked
layout math — the math is verified in Task 2.

Then run: `npm run test:run`
Expected: PASS — all suites.

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: no errors. (Watch for: unused `useLayoutEffect` import warning if
the isomorphic alias was inlined differently — keep the alias exactly as
written.)

- [ ] **Step 7: Commit**

```bash
git add src/components/reader/paginated-reader.tsx src/components/reader/paginated-reader.test.tsx src/components/reader/reader-page.module.css
git commit -m "feat: add viewport-height paginated reader with font size control

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 6: Wire the server reader route

**Files:**
- Modify: `src/components/reader/reader-page.tsx` (full rewrite)
- Modify: `src/app/read/[bookSlug]/[chapterSlug]/page.tsx`
- Delete: `src/components/reading-progress/save-progress-tracker.tsx`
- Modify: `src/components/reader/reader-page.module.css` (remove `.content`)

**Interfaces:**
- Consumes: `getDisplaySegments` (Task 1), `PaginatedReader` (Task 5).
- Produces: `ReaderPage({ book, chapter, previousHref, nextHref, previousChapterDisplayCount: number })` — rendered by the route page; `previousChapterDisplayCount` is the previous chapter's displayed segment count.

- [ ] **Step 1: Check for other SaveProgressTracker references**

Run: `grep -rn "SaveProgressTracker\|save-progress-tracker" src/`
Expected: exactly two hits — the import and usage in
`src/components/reader/reader-page.tsx` (both removed in this task). If any
other file references it, stop and reconcile before proceeding.

- [ ] **Step 2: Rewrite the reader page component**

Replace the full content of `src/components/reader/reader-page.tsx`:

```tsx
import Link from "next/link";
import { PaginatedReader } from "@/components/reader/paginated-reader";
import { getDisplaySegments } from "@/lib/content/english-text";
import type { Book, Chapter } from "@/lib/content/types";
import styles from "./reader-page.module.css";

export function ReaderPage({
  book,
  chapter,
  previousHref,
  nextHref,
  previousChapterDisplayCount,
}: {
  book: Book;
  chapter: Chapter;
  previousHref: string | null;
  nextHref: string | null;
  previousChapterDisplayCount: number;
}) {
  const displaySegments = getDisplaySegments(chapter.segments);

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <p className={styles.sidebarLabel}>{book.readingModeLabel}</p>
        <h1>{chapter.title}</h1>
        <p>{chapter.summary}</p>
        <p className={styles.progress}>
          Chapter {chapter.order} · {displaySegments.length} segments
        </p>
        <p className={styles.savedIndicator}>Progress auto-saved</p>
        <div className={styles.navLinks}>
          {previousHref ? (
            <Link href={previousHref}>Previous chapter</Link>
          ) : (
            <span />
          )}
          {nextHref ? <Link href={nextHref}>Next chapter</Link> : <span />}
        </div>
      </aside>

      <PaginatedReader
        key={chapter.slug}
        bookSlug={book.slug}
        chapterSlug={chapter.slug}
        segments={displaySegments}
        previousHref={previousHref}
        nextHref={nextHref}
        previousChapterDisplayCount={previousChapterDisplayCount}
      />
    </div>
  );
}
```

The `key={chapter.slug}` remounts the reader on chapter navigation so pages,
anchor, and refs never go stale.

- [ ] **Step 3: Pass the previous chapter's display count from the route**

In `src/app/read/[bookSlug]/[chapterSlug]/page.tsx`:

(a) Add the import:

```tsx
import { getDisplaySegments } from "@/lib/content/english-text";
```

(b) After `const adjacent = getAdjacentChapters(bookSlug, chapterSlug);` add:

```tsx
  const previousChapterDisplayCount = adjacent.previous
    ? getDisplaySegments(adjacent.previous.segments).length
    : 0;
```

(c) Add the prop to `<ReaderPage>`:

```tsx
      previousChapterDisplayCount={previousChapterDisplayCount}
```

- [ ] **Step 4: Delete SaveProgressTracker and the .content CSS rule**

Run: `git rm src/components/reading-progress/save-progress-tracker.tsx`

In `src/components/reader/reader-page.module.css`, delete the `.content`
rule block (`.pageScroll` in Task 5 replaced it).

- [ ] **Step 5: Verify**

Run: `npm run test:run`
Expected: PASS — all suites (no test referenced SaveProgressTracker or
`.content`).

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds, 67 pages prerendered, no Suspense / CSR-bailout
errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/reader/reader-page.tsx "src/app/read/[bookSlug]/[chapterSlug]/page.tsx" src/components/reader/reader-page.module.css
git commit -m "feat: serve paginated pure-English reader route

The scroll-based SaveProgressTracker is gone; PaginatedReader saves the
exact page anchor instead.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

(`git rm` already staged the deletion.)

---

### Task 7: Deep-link reading progress consumers

**Files:**
- Modify: `src/lib/reading-progress.ts` (add one export)
- Modify: `src/lib/reading-progress.test.ts` (add one test)
- Modify: `src/components/reading-progress/continue-reading-link.tsx`
- Modify: `src/components/reading-progress/book-card-with-progress.tsx`
- Modify: `src/components/reading-progress/book-detail-progress.tsx`

**Interfaces:**
- Produces: `getContinueReadingHref(bookSlug: string, progress: BookProgress): string` — returns `/read/{bookSlug}/{lastChapterSlug}?s={lastSegmentIndex + 1}`. All three consumers use it.

- [ ] **Step 1: Write the failing test**

In `src/lib/reading-progress.test.ts`:

(a) Add `getContinueReadingHref` to the import from `@/lib/reading-progress`.

(b) Append this test inside the top-level `describe("reading-progress", ...)`:

```ts
  it("builds a deep link to the stored reading position", () => {
    const progress = {
      lastChapterSlug: "chapter-02",
      lastSegmentIndex: 4,
      updatedAt: 1,
    };

    expect(getContinueReadingHref("nuan-nuan", progress)).toBe(
      "/read/nuan-nuan/chapter-02?s=5",
    );
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/reading-progress.test.ts`
Expected: FAIL — `getContinueReadingHref` is not exported.

- [ ] **Step 3: Implement the helper**

In `src/lib/reading-progress.ts`, append after `getMostRecentBook`:

```ts
export function getContinueReadingHref(
  bookSlug: string,
  progress: BookProgress,
): string {
  return `/read/${bookSlug}/${progress.lastChapterSlug}?s=${progress.lastSegmentIndex + 1}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/reading-progress.test.ts`
Expected: PASS.

- [ ] **Step 5: Update the three consumers**

`src/components/reading-progress/continue-reading-link.tsx` — change the
import and the href construction:

```tsx
import {
  getContinueReadingHref,
  getMostRecentBook,
  subscribeToProgressChanges,
} from "@/lib/reading-progress";
```

```tsx
  if (recent) {
    const href = getContinueReadingHref(recent.bookSlug, recent.progress);
    return <Link href={href}>Continue Reading</Link>;
  }
```

`src/components/reading-progress/book-card-with-progress.tsx` — add
`getContinueReadingHref` to the existing `@/lib/reading-progress` import and
change:

```tsx
  const continueHref = progress
    ? getContinueReadingHref(book.slug, progress)
    : `/read/${book.slug}/${firstChapter.slug}`;
```

`src/components/reading-progress/book-detail-progress.tsx` — add
`getContinueReadingHref` to the existing `@/lib/reading-progress` import and
change the progress-branch link:

```tsx
      <Link
        href={getContinueReadingHref(book.slug, progress)}
        style={{
          display: "inline-flex",
          padding: "12px 20px",
          borderRadius: 999,
          background: "var(--olive)",
          color: "var(--paper)",
        }}
      >
        Continue Reading
      </Link>
```

(The no-progress "Begin reading" links stay as they are.)

- [ ] **Step 6: Verify and commit**

Run: `npm run test:run`
Expected: PASS — all suites (the two component tests render the no-progress
branch, which is unchanged).

Run: `npm run lint`
Expected: no errors.

```bash
git add src/lib/reading-progress.ts src/lib/reading-progress.test.ts src/components/reading-progress/continue-reading-link.tsx src/components/reading-progress/book-card-with-progress.tsx src/components/reading-progress/book-detail-progress.tsx
git commit -m "feat: deep-link continue-reading entries to the saved page

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 8: Update copy that promised bilingual features

**Files:**
- Modify: `src/lib/content/library.ts` (4 strings)
- Modify: `src/app/layout.tsx` (1 string)
- Modify: `src/components/home/home-page.tsx` (2 strings)

**Interfaces:**
- No code interfaces change — string values only, verified by existing suites.

Decision recorded in the spec: descriptions that describe the **source
material** (e.g. "built from the current bilingual Si Teng chapter
collection", "Cai Zhiheng's bilingual novella") stay — the raw files are
bilingual and that remains accurate. Only copy promising reader-facing
features changes. The author attribution `Cai Zhiheng (痞子蔡)` stays.

- [ ] **Step 1: Apply the exact string replacements**

`src/lib/content/library.ts`:

1. Spring-and-autumn fallback chapter summary (inside
   `springAndAutumnChapters`):
   - from: `` `A study-friendly bilingual reading of ${chapter.title}.` ``
   - to: `` `A close English reading of ${chapter.title}.` ``

2. Spring and Autumn book subtitle:
   - from: `"A sharp historical narrative with study-friendly bilingual support."`
   - to: `"A sharp historical narrative in close English reading."`

3. Spring and Autumn tags:
   - from: `tags: ["History", "Narrative", "Grammar Notes"],`
   - to: `tags: ["History", "Narrative", "Close Reading"],`

4. Munger book subtitle:
   - from: `"Charlie Munger's mental models, retold as bilingual lessons."`
   - to: `"Charlie Munger's mental models, retold as focused English lessons."`

`src/app/layout.tsx` metadata description:
- from: `"An English-first reading home for bilingual literary study."`
- to: `"An English-first home for immersive novel reading."`

`src/components/home/home-page.tsx`:

1. Kicker:
   - from: `<p className={styles.kicker}>Featured bilingual novels</p>`
   - to: `<p className={styles.kicker}>Featured English novels</p>`

2. Reading-mode paragraph:
   - from:
     ```tsx
         <p>
           English stays visible first. Chinese lines, grammar notes, and phrase
           support stay secondary until you need them.
         </p>
     ```
   - to:
     ```tsx
         <p>
           Clean English prose in calm, paginated pages. Pick a book, turn a page,
           and the site remembers exactly where you stopped.
         </p>
     ```

- [ ] **Step 2: Verify**

Run: `npm run test:run`
Expected: PASS — `home-page.test.tsx` and `book-detail-page.test.tsx` do not
assert on any changed string (verified while planning: they check headings,
links, "Begin reading", and "English First", all untouched).

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/content/library.ts src/app/layout.tsx src/components/home/home-page.tsx
git commit -m "content: update copy for the pure-English paginated reader

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 9: Full verification battery

**Files:**
- None created or modified (verification only).

- [ ] **Step 1: Full test suite**

Run: `npm run test:run`
Expected: PASS — all suites including the four new files from Tasks 1-5.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: success; 67 pages prerendered (16 nuan-nuan + 3 si-teng + 30
spring-and-autumn + 10 munger + home + 4 book detail + ... — the same total
as before this feature); no Suspense or CSR-bailout errors.

- [ ] **Step 4: Reader HTML is CJK-free**

Run from the repo root (Git Bash):

```bash
node -e "const fs=require('fs'),path=require('path');const root='.next/server/app/read';let bad=0;(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(p.endsWith('.html')&&fs.readFileSync(p,'utf8').match(/[一-鿿]/)){bad++;console.log('CJK found: '+p)}}})(root);console.log(bad===0?'PASS: reader HTML is CJK-free':'FAIL: '+bad+' file(s) contain CJK');process.exit(bad===0?0:1)"
```

Expected: `PASS: reader HTML is CJK-free`.
If it FAILs: inspect the printed file(s), find which rendered string carries
hanzi, and fix the rendering layer (never `content/raw`). Likely suspects
are lines the Task 1 rule classifies as kept-but-carrying-hanzi; if a new
pattern shows up, extend `stripChineseGlosses`/`hasReadableEnglish` with a
test first.

- [ ] **Step 5: Check paginated output in the prerendered HTML**

Run: `grep -o "Page 1 of" ".next/server/app/read/nuan-nuan/chapter-01.html" | head -1`
and: `grep -o "data-segment-index=\"0\"" ".next/server/app/read/nuan-nuan/chapter-01.html" | head -1`

Expected: both print a match (the control bar and segment wrappers are in
the static HTML).

- [ ] **Step 6: Dev-server spot check (user's server only)**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/read/nuan-nuan/chapter-01`

- If it returns `200`: spot-check in the browser — pagination packs by
  viewport, A−/A+ change density (smaller font ⇒ more segments per page),
  ←/→ keys turn pages, reload restores the exact page, the home
  "Continue Reading" card lands on the saved page, and Previous from a
  chapter's first page opens the previous chapter's last page.
- If the server is down: do NOT start one. Mark visual checks as unverified
  in the final report and list them for the user to confirm.

- [ ] **Step 7: Report**

Report the output-contract summary: what changed, files touched, commands
run with results, and anything unverified (likely: visual checks if the dev
server was down).
