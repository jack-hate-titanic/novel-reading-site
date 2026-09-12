# Reader Pagination Design

Date: 2026-09-12
Status: Approved in conversation; pending implementation

## Goal

Turn the reader route (`/read/[bookSlug]/[chapterSlug]`) into a paginated,
one-viewport-per-page reading experience with:

1. **Height-based dynamic pagination** — segments are packed into pages by
   rendered height, so a smaller font fits more content per page and a larger
   font fits less.
2. **Adjustable font size** — four presets (S/M/L/XL) persisted globally.
3. **Pure English reading view** — all Chinese removed from the reading
   experience at the rendering layer: inline `（中文）` glosses stripped,
   Chinese translations and grammar/phrase notes not rendered.
4. **Exact position memory per book** — the current reading position (segment
   anchor) is saved on every page turn and restored on return, including via
   URL.

## Non-Goals

- No changes to `content/raw/` source files or `src/lib/content/parser.ts`.
  Filtering and gloss-stripping happen at render time (AGENTS.md: prefer
  fixing rendering over editing source).
- No `useSearchParams` / Suspense restructuring. The reader stays fully
  statically prerendered; the initial anchor is read from
  `window.location.search` in an effect, and URL updates use
  `history.replaceState` (verified against the bundled Next.js 16 docs:
  `useSearchParams` would force a client-side-render bailout and fail the
  static build without a Suspense boundary).
- No swipe gestures. Page turns via buttons and ←/→ keyboard keys only.
- No per-book font size. The font preference is global.
- No new dependencies.
- No lightweight "prototype" measuring (measuring plain paragraphs plus
  chrome constants). We measure the real rendered cards; payload stays at
  today's weight because pagination happens in place.

## Data Audit (drives the pure-English rules)

Run against the real parser over all 48 raw files (2026-09-12):

| Finding | Count |
| --- | --- |
| English lines carrying full-width `（…）` glosses | 708 |
| Parser-`english` lines with CJK outside full-width parens | 84 (nuan-nuan 81, si-teng 1, spring-and-autumn 2, munger 0) |
| Lines that are actually Chinese narration with embedded Latin (`我Sorry你`, `比個V`) | 67 |
| Lines that are real English sentences quoting hanzi as content (ch4/ch5 lessons about Chinese characters, `"北京"` at the Hong Kong gate) | 17 |

Verified with the real parser (nuan-nuan ch2): every Chinese-dominant
misclassified line becomes a **solo segment** (`chinese` empty), and its
English rendering exists as a **neighboring segment** (e.g. seg 42 `『如果妳問我AB的弟弟是誰？』…` ↔ seg 43 `"If you asked me, who is AB's little brother?"`). Skipping Chinese-dominant segments loses no story beats.

## Pure English Reading View

### Rules (pure functions in `src/lib/content/english-text.ts`)

```ts
// 1. Strip full-width parenthetical glosses, collapse double spaces, trim.
stripChineseGlosses(text: string): string
//    removes /（[^）]*）/g  — ASCII parentheses are never touched.

// 2. Does this segment have readable English?
hasReadableEnglish(text: string): boolean
//    const t = stripChineseGlosses(text);
//    const cjk = (t.match(/[一-鿿]/g) ?? []).length;
//    const latin = (t.match(/[A-Za-z]/g) ?? []).length;
//    return latin > 0 && cjk * 2 <= latin;
//    (cjk * 2 weights hanzi density: 11 hanzi ≈ more Chinese than 14 latin letters)

// 3. Filter for display (numbering is positional at render time;
//    segment.id stays raw and unique for React keys).
getDisplaySegments(segments: ReaderSegment[]): ReaderSegment[]
//    keeps segments where hasReadableEnglish(segment.english)
```

Effects: 708 gloss lines cleaned; 67 Chinese-narration segments skipped
(English versions live in neighbors); 17 intentional hanzi-quoting English
lines kept verbatim (the hanzi IS the content — e.g. `like *hou* (后), *mian*
(面)` teaches characters; stripping would corrupt meaning).

### Rendering changes

- `reader-segment.tsx` renders **only** `Segment {n}` + stripped English.
  The `Show Chinese` / `Show Notes` `<details>` blocks are removed entirely.
  `segment.chinese`, `grammarNotes`, `phrases` stay in the data model
  (parser/types untouched; reversible).
- The server filters segments before rendering: SSR HTML and the no-JS view
  are pure English from the start.
- Display numbering is 1..M over the **displayed** (filtered) segments — no
  gaps. The sidebar reads `Chapter {order} · {displayCount} segments`.

### Known residue (documented, not fixed here)

- 6 nuan-nuan dialogue lines retain small Chinese fragments outside quotes
  (e.g. `『Very good。』我說。`) — quoted English inside Chinese tags; the
  count rule keeps them because Latin ≥ hanzi. Fixing these properly means
  reclassifying lines in `parser.ts` (which would re-pair and renumber
  segments globally) — offered as a follow-up, out of scope here.
- 2 spring-and-autumn source lines contain untranslated words in ASCII
  context (`Jizu's功劳`, `insect灾害`) — raw-source warts; editing raw
  requires an explicit user request.
- 12 intentional hanzi-quoting lines keep their hanzi (feature, not bug).
- Author attribution `Cai Zhiheng (痞子蔡)` in `library.ts` stays — it is a
  name, not reading content.

## Pagination Model

One page = one viewport of reading content, computed client-side:

1. **Initial render (SSR / no-JS / pre-hydration):** all displayed segments
   render in the content column, exactly like today. Graceful degradation
   and zero extra HTML payload.
2. **Measure pass (`useLayoutEffect`):** measure each rendered segment card
   (`getBoundingClientRect().height`) and the available page height, then
   pack pages, then swap to paginated mode rendering only the current page —
   all before first paint, so the user never sees the unpaginated flash.
3. **Re-measure triggers:** font scale change, debounced window resize
   (150 ms), `document.fonts.ready` resolving after a late font load. Each
   re-measure re-runs the same render-all → measure → pack → show-page cycle
   inside `useLayoutEffect` (invisible, one commit).

### Page height

The content column becomes a viewport-locked flex box:

```
boxHeight = window.innerHeight − boxDocumentTop − BOTTOM_GUTTER (32px)
```

`boxDocumentTop` = `box.getBoundingClientRect().top + window.scrollY`,
measured during the measure pass (the site header is normal document flow,
not sticky). The box is `overflow-y: auto` so a single over-tall segment
(huge font, long paragraph) scrolls internally.

**Mobile (≤900px):** the grid already collapses to one column; the content
column gets `order: -1` so the page box sits above the sidebar (immersive
reading; chapter metadata follows the text). Desktop layout unchanged.

### Packing (pure functions in `src/lib/pagination.ts`)

```ts
packPagesByHeight(heights: number[], maxHeight: number, gap: number): number[][]
// Sequential packing: add segment i to the current page while
// usedHeight + gap * (page.length > 0 ? 1 : 0) + heights[i] <= maxHeight.
// A segment taller than maxHeight still gets its own page (never dropped).

pageIndexOfSegment(pages: number[][], segmentIndex: number): number
// Page containing segmentIndex; out-of-range clamps to the last page.

clampAnchor(anchor: number, totalSegments: number): number
```

`gap = 18` matches the CSS grid gap in `reader-page.module.css`. If all
measured heights are 0 (jsdom / styles not yet applied), `packPagesByHeight`
falls back to a single page containing every segment.

Page numbers are **font-relative** (small font ⇒ more pages). Position
memory is **content-anchored** (segment index); the displayed
`Page X of Y` is derived at render time.

## Font Size Control

- Presets: `FONT_SIZES = [0.85, 1, 1.15, 1.3]` (S/M/L/XL), default index 1.
- `src/lib/reader-preferences.ts`: `getReaderFontScaleIndex()` /
  `setReaderFontScaleIndex()` / `subscribeToFontPreferences()` +
  `storage`-event handling — same `useSyncExternalStore` pattern as
  `reading-progress.ts`. localStorage key `novel-reader-preferences`.
- Applied as `--reader-font-scale` on the reader content box;
  `.english { font-size: calc(clamp(1.4rem, 2.4vw, 2rem) * var(--reader-font-scale, 1)); }`
  (measurement and display share the rule, so measured heights are correct).
- Control: `A−` / `A+` buttons in the page control bar, disabled at the
  ends, with the current level shown. Changing size re-packs while keeping
  the current anchor segment on screen.
- SSR renders at default M; users with a stored non-default size see a
  one-frame resize after hydration (accepted; no flash-prevention script).

## Position Memory & URL

- **Anchor** = 0-based index into the chapter's displayed segments, pointing
  at the first segment of the current page.
- Saved via existing `saveBookProgress(bookSlug, chapterSlug, anchor)` —
  same localStorage key, same `BookProgress` shape. `lastSegmentIndex`
  semantics upgrade from "scroll estimate" to "exact anchor"; old stored
  values still land on (or within a page of) the right content. `SaveProgressTracker`
  and its scroll estimation are deleted.
- **Restore priority** on chapter open: URL `?s=` (1-based display index of
  the page's first segment) → stored progress when
  `lastChapterSlug === chapterSlug` → page 1.
- Every page turn: `history.replaceState` with `?s={anchor + 1}` (no router
  navigation, back button unaffected, refresh restores the exact page) and
  `saveBookProgress` with the same anchor. Saving also happens on mount with
  the restored anchor (so browsing a chapter records it, as today).
- `calculateBookPercentage` is unchanged (segment-ratio math; displayed
  counts differ from raw counts by ≤ ~1%, invisible on the progress bar).
- Progress consumers append `?s=`:
  - `continue-reading-link.tsx` → `?s={lastSegmentIndex + 1}`
  - `book-card-with-progress.tsx` → same
  - `book-detail-progress.tsx` → same

## Page-Turn Interaction

Control bar pinned at the bottom of the page box:

```
[ A− ] [ A+ ]    [ ← Previous ]  Page X of Y  [ Next → ]
```

- Next on the last page → `nextHref` (next chapter, page 1).
- Previous on the first page → `previousHref?s={prevChapterDisplayCount}`
  (server passes the previous chapter's displayed segment count; the page
  containing its last segment is its last page).
- Disabled at book edges (matches current sidebar link behavior).
- Keyboard: `ArrowLeft` / `ArrowRight` on `window`, ignored while any
  modifier key is held.
- After a page turn, scroll to the document top of the page box.
- Sidebar `Previous chapter` / `Next chapter` links remain unchanged
  (explicit chapter navigation goes to the chapter's first page).

## Components & Files

| File | Change |
| --- | --- |
| `src/lib/content/english-text.ts` | **New.** `stripChineseGlosses`, `hasReadableEnglish`, `getDisplaySegments` (pure, shared by server and client). |
| `src/lib/pagination.ts` | **New.** `packPagesByHeight`, `pageIndexOfSegment`, `clampAnchor` (pure). |
| `src/lib/reader-preferences.ts` | **New.** Font-scale store (get/set/subscribe). |
| `src/components/reader/paginated-reader.tsx` | **New** (`"use client"`). Measure/pack cycle, page rendering, control bar, keyboard, URL sync, progress save, font control. |
| `src/components/reader/reader-segment.tsx` | English-only render via `stripChineseGlosses`; details blocks removed. |
| `src/components/reader/reader-segment.test.tsx` | Update: English-only expectations. |
| `src/components/reader/reader-page.tsx` | Server-filter segments via `getDisplaySegments`; render `PaginatedReader`; drop `SaveProgressTracker`; sidebar shows displayed count. |
| `src/components/reader/reader-page.module.css` | Page box (viewport-locked flex, `overflow-y: auto`), control bar, `A−`/`A+` buttons, `--reader-font-scale` on `.english`, mobile `order: -1`. |
| `src/app/read/[bookSlug]/[chapterSlug]/page.tsx` | Pass `previousChapterDisplayCount` (computed server-side with `getDisplaySegments`). |
| `src/components/reading-progress/save-progress-tracker.tsx` | **Delete.** |
| `src/components/reading-progress/continue-reading-link.tsx` | Append `?s=`. |
| `src/components/reading-progress/book-card-with-progress.tsx` | Append `?s=`. |
| `src/components/reading-progress/book-detail-progress.tsx` | Append `?s=`. |
| `src/lib/content/library.ts` | Copy updates only (see below). |
| `src/app/layout.tsx` | Metadata description drops "bilingual literary study". |

New tests: `english-text.test.ts`, `pagination.test.ts`,
`reader-preferences.test.ts`, `paginated-reader.test.tsx`.

## Copy Updates (metadata promises now-hidden features)

- Spring and Autumn: subtitle `…study-friendly bilingual support` →
  `A sharp historical narrative in close English reading.`; tag
  `Grammar Notes` → `Close Reading`.
- Munger: subtitle `…retold as bilingual lessons` → `…retold as focused
  English lessons.`
- `layout.tsx` metadata: `An English-first reading home for bilingual
  literary study.` → `An English-first home for immersive novel reading.`
- `src/components/home/home-page.tsx` (checked 2026-09-12, two spots):
  - Kicker `Featured bilingual novels` → `Featured English novels`.
  - Reading-mode paragraph `English stays visible first. Chinese lines,
    grammar notes, and phrase support stay secondary until you need them.` →
    `Clean English prose in calm, paginated pages. Pick a book, turn a page,
    and the site remembers exactly where you stopped.`

## Testing

1. **`english-text.test.ts`** — gloss stripping (incl. adjacent-space
   collapse, ASCII parens untouched), skip-rule classification with real
   fixtures from the audit (`我Sorry你` line skipped; `*hou* (后)` line
   kept; `talk to this hand` line skipped; `"北京"` line kept),
   `getDisplaySegments` renumbering.
2. **`pagination.test.ts`** — packing (multiple per page, gap accounting,
   over-tall segment gets its own page, zero-height fallback → single page),
   `pageIndexOfSegment` clamping, `clampAnchor`.
3. **`reader-preferences.test.ts`** — defaults, persistence round-trip,
   listener notification.
4. **`paginated-reader.test.tsx`** — jsdom has no layout: mock
   `HTMLElement.prototype.getBoundingClientRect` to derive deterministic
   card heights (e.g. from `textContent.length`); `window.innerHeight` is
   768 in jsdom. Assert: initial pagination after mount, page turns update
   `Page X of Y`, `history.replaceState` called with `?s=`,
   `saveBookProgress` called with the page anchor, keyboard arrows, chapter
   boundary links, font buttons call `setReaderFontScaleIndex`.
5. **Existing suites keep passing** (`npm run test:run`).
6. **Build + prerender verification:** `npm run build`; then the CJK gate
   over `.next/server/app/read/**/*.html` (corrected 2026-09-12
   post-implementation — see Amendment below): the RSC flight payload must
   serialize no Chinese data fields (no `"chinese":` in any reader HTML),
   and any remaining CJK must be confined to the documented Known-residue
   files. Spot-check `?s=` handling and page controls against the user's
   dev server (`:3000`; never spawn a second one).

## Verification Checklist

1. `npm run test:run` — all suites green.
2. `npm run lint` — clean.
3. `npm run build` — 67 pages prerendered, no Suspense/CSR-bailout errors.
4. CJK gate over prerendered reader HTML — payload serializes no Chinese
   data fields; remaining CJK confined to the documented Known-residue
   files (8 files).
5. Dev-server spot check: pagination, font buttons, page memory across
   reload, Continue Reading deep links, chapter boundaries.

## Amendment (2026-09-12, post-implementation)

Two corrections made during Task 9 verification, recorded here so the spec
matches what shipped:

1. **English-only segment projection at the server/client boundary.**
   `getDisplaySegments` returns full `ReaderSegment` objects; passing those
   from the server `reader-page.tsx` to the client `PaginatedReader`
   serialized `chinese`/`grammarNotes`/`phrases` into the RSC flight payload
   of the static HTML (invisible, but Chinese data shipped to the client and
   failed the CJK gate). `english-text.ts` now also exports
   `getEnglishSegments(segments): EnglishSegment[]` where
   `EnglishSegment = { id, english }` (glosses stripped), and that is what
   crosses the boundary. `PaginatedReader` and `ReaderSegment` prop types
   narrowed accordingly. The visible DOM is unchanged; the data model and
   parser stay untouched.

2. **CJK gate corrected (supersedes the original "zero matches" line).**
   The original checklist demanded zero CJK over all reader HTML, which
   contradicted this spec's own "Known residue" section — those lines are
   deliberately kept (feature, not bug) and appear in the DOM and therefore
   the flight payload. The shipped gate: (a) no Chinese data fields in any
   payload (`"chinese":` never serialized), and (b) CJK confined to exactly
   the 8 documented residue files — nuan-nuan chapters 02, 04, 05, 12, 13,
   15 and spring-and-autumn chapters 20, 30.
