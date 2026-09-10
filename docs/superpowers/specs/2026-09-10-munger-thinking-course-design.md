# Munger Thinking Course — Design

Date: 2026-09-10
Status: Approved (user approved design in session)

## Goal

Add a fourth book, **Munger Thinking Course** (《芒格思维课》), to the library as a
structured placeholder scaffold. The book appears alongside the three existing
books on the homepage ranking list and is fully navigable in the reader. Real
course content will be filled in later by replacing raw markdown only — no code
changes needed at that time.

## Non-Goals

- No new category/taxonomy system (user confirmed this is a book, not a category).
- No course-specific UI (lesson-numbered layouts, syllabus views) — the site
  renders all books uniformly.
- No real course content in this change — placeholder only.

## 1. Book Registration (`src/lib/content/library.ts`)

Register a fourth book in `getBooks()`:

| Field | Value |
|---|---|
| slug | `munger-thinking-course` |
| title | Munger Thinking Course |
| subtitle | Charlie Munger's mental models, retold as bilingual lessons. |
| author | Charlie Munger |
| coverTheme | `ink` (new theme) |
| tags | Mental Models, Thinking, Non-fiction |
| readingModeLabel | English First |
| description | "An English-first bilingual edition of Charlie Munger's thinking course. Lessons are being prepared — placeholder scaffolding for now." |

Chapter loading follows the **Nuannuan per-file pattern**: one markdown file per
chapter under `content/raw/munger-thinking-course/`, with a meta map in
`library.ts` supplying each lesson's title and summary (mirroring
`nuanNuanChapterSummaries`). Chapter titles render as `Lesson N: <Title>`;
chapter slugs stay `chapter-XX` to match the existing convention.

## 2. Placeholder Chapters (`content/raw/munger-thinking-course/`)

Ten files, `chapter-01.md` through `chapter-10.md`, titled after Munger's core
thinking models:

1. Lesson 1: The Latticework of Mental Models (多元思维格栅)
2. Lesson 2: Inversion — Think It Through Backward (逆向思维)
3. Lesson 3: The Circle of Competence (能力圈)
4. Lesson 4: The Psychology of Human Misjudgment (误判心理学)
5. Lesson 5: Incentives Shape Behavior (激励机制)
6. Lesson 6: Avoid Stupidity Rather than Seek Brilliance (避免愚蠢)
7. Lesson 7: The Lollapalooza Effect (合奏效应)
8. Lesson 8: Patience and Discipline (耐心与纪律)
9. Lesson 9: Lifelong Learning Through Reading (终身学习)
10. Lesson 10: Simplicity and Integrity (简单与诚信)

Each placeholder file follows the parser's expected format so the reader
renders realistically:

- `# ` heading with the bilingual lesson title (readability only; title comes
  from the library meta map)
- `说明：` meta block (parser skips these lines)
- Two alternating Chinese/English line pairs — placeholder copy that honestly
  states the lesson is being prepared (e.g., "This lesson is being prepared."),
  not fabricated course prose
- One `语法说明` block with `语法标记：` / `句子主干：` / `难点拆解：` details
- One `常用短语` block with `- ` items

Placeholder copy must be honest: it signals "content coming soon" rather than
inventing Munger lesson text.

## 3. New `ink` Cover Theme

Visually distinguishes the course book from the novels.

- `src/lib/content/types.ts`: extend `coverTheme` union to
  `"mist" | "bronze" | "ink"`.
- `src/components/home/home-page.module.css`: add `.cover[data-theme="ink"]` —
  deep ink color that stays harmonious with the warm paper palette.
- `src/components/reading-progress/book-card-with-progress.module.css`: add
  `.card[data-theme="ink"]` with the same ink tone.

The book detail page does not render a cover theme, so no changes there.

## 4. Test Updates

- `src/lib/content/library.test.ts`:
  - Update the exact slug-array assertion to include `munger-thinking-course`.
  - Add a test verifying the Munger book loads: 10 chapter slugs in order,
    segments parse to more than 0, and the first segment contains the
    placeholder text.
- `src/components/home/home-page.test.tsx`:
  - Update the Read-link count assertion from 3 to 4.
  - Assert the Munger Thinking Course link is present.

## 5. Verification

1. `npm run test:run`
2. `npm run lint`
3. `npm run build`
4. `npm run dev` — verify routes:
   - `/` (ranking list shows the new book with ink cover)
   - `/books/munger-thinking-course`
   - `/read/munger-thinking-course/chapter-01`

## Future Work (out of scope here)

- Replacing placeholder markdown with real bilingual lesson content (no code
  change required by design).
- Optional course-specific UI treatment once real content exists.
