# Munger Thinking Course Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fourth book, "Munger Thinking Course", to the library as a ten-lesson placeholder scaffold with a new `ink` cover theme.

**Architecture:** Follow the existing Nuannuan per-file chapter pattern — one markdown file per chapter under `content/raw/munger-thinking-course/`, a meta map in `library.ts` supplying titles/summaries, and the book registered as the fourth entry in `getBooks()`. A new `ink` cover theme distinguishes the course book visually via two CSS module additions.

**Tech Stack:** Next.js 16 App Router (see `node_modules/next/dist/docs/` — do not rely on prior Next.js knowledge), TypeScript, Vitest + Testing Library, CSS Modules.

**Spec:** `docs/superpowers/specs/2026-09-10-munger-thinking-course-design.md`

## Global Constraints

- Book slug: `munger-thinking-course`; display title: `Munger Thinking Course`
- Chapter slugs stay `chapter-XX` (zero-padded, matching existing convention); chapter titles render as `Lesson N: <Title>`
- UI copy in English; raw markdown source files keep Chinese/English line-pair format
- Placeholder copy must honestly state the lesson is being prepared — no fabricated Munger course prose
- Parser rules (from `src/lib/content/parser.ts`): Chinese lines must contain NO Latin letters (mixed Chinese+English lines are detected as English); grammar details must start with `语法标记：` / `句子主干：` / `难点拆解：`; phrase items must start with `- `
- Do not edit any raw source content under `content/raw/` other than creating the new `munger-thinking-course/` directory
- No dependency changes; no Tailwind; no Pages Router
- Verification commands: `npm run test:run`, `npm run lint`, `npm run build`

---

### Task 1: Register the book — placeholder chapters, meta map, type extension

**Files:**
- Modify: `src/lib/content/library.test.ts` (slug-array assertion + new test)
- Modify: `src/lib/content/types.ts:33` (coverTheme union)
- Create: `content/raw/munger-thinking-course/chapter-01.md` through `chapter-10.md`
- Modify: `src/lib/content/library.ts` (meta map, chapters array, fixtures spread, book entry)

**Interfaces:**
- Consumes: `parseBilingualChapter`, `readRaw`, `toChapterPreview`, `Chapter`/`Book` types (all exist)
- Produces: `getBooks()` returns 4 books ending with `munger-thinking-course` (coverTheme `"ink"`, 10 chapters); `getChapterBySlugs("munger-thinking-course", "chapter-01"…"chapter-10")` returns chapters with 2 segments each; `coverTheme` type is `"mist" | "bronze" | "ink"`

- [ ] **Step 1: Write the failing tests**

In `src/lib/content/library.test.ts`, update the exact slug-array assertion in the first test:

```ts
    expect(books.map((book) => book.slug)).toEqual([
      "nuan-nuan",
      "half-demon-si-teng",
      "spring-and-autumn",
      "munger-thinking-course",
    ]);
```

Then add this test inside the existing `describe("content library", ...)` block (after the Spring and Autumn test):

```ts
  it("loads Munger Thinking Course as ten placeholder lessons", () => {
    const munger = getBookBySlug("munger-thinking-course");
    const first = getChapterBySlugs("munger-thinking-course", "chapter-01");
    const last = getChapterBySlugs("munger-thinking-course", "chapter-10");

    expect(munger?.coverTheme).toBe("ink");
    expect(munger?.chapters.map((chapter) => chapter.slug)).toEqual([
      "chapter-01",
      "chapter-02",
      "chapter-03",
      "chapter-04",
      "chapter-05",
      "chapter-06",
      "chapter-07",
      "chapter-08",
      "chapter-09",
      "chapter-10",
    ]);
    expect(first?.title).toBe("Lesson 1: The Latticework of Mental Models");
    expect(first?.segments).toHaveLength(2);
    expect(first?.segments[0].chinese).toBe(
      "本课正在筹备中，正式双语内容将在稍后补充。",
    );
    expect(first?.segments[0].english).toContain("This lesson is being prepared");
    expect(last?.title).toBe("Lesson 10: Simplicity and Integrity");
    expect(last?.segments).toHaveLength(2);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- src/lib/content/library.test.ts`
Expected: FAIL — slug array mismatch (`munger-thinking-course` missing) and `munger` is `undefined`.

- [ ] **Step 3: Extend the coverTheme type**

In `src/lib/content/types.ts`, change:

```ts
  coverTheme: "mist" | "bronze";
```

to:

```ts
  coverTheme: "mist" | "bronze" | "ink";
```

- [ ] **Step 4: Create the ten placeholder chapter files**

Create `content/raw/munger-thinking-course/chapter-01.md` with exactly:

```markdown
# 《芒格思维课》第一课：多元思维格栅

说明：
- 本文件为占位稿，正式双语内容筹备中。
- 排版规则为“一句中文，一句英文”；遇到较长句子时，补充语法说明和常用短语。

本课正在筹备中，正式双语内容将在稍后补充。
This lesson is being prepared; the full bilingual content will arrive soon.
本课主题：多元思维格栅，敬请期待。
Lesson topic: The Latticework of Mental Models. The full bilingual reading is coming soon.
语法说明：
语法标记：`并列句`、`现在进行时被动语态`、`一般将来时`。
句子主干：主句是 `This lesson is being prepared`，并列分句是 `the full bilingual content will arrive soon`。
难点拆解：`is being prepared` 是现在进行时的被动语态；`coming soon` 表示“即将到来”，常见于预告类文案。
常用短语：
- `be prepared`：被准备好
- `arrive soon`：即将到来
- `look forward to`：期待
- `a latticework of mental models`：多元思维格栅
```

Create `chapter-02.md` through `chapter-10.md` from the same template, substituting the per-lesson slots (`第N课`, 中文课题 in heading and 本课主题 line, English Topic, lesson phrase) per this table. Everything else is byte-identical to the template above. The 本课主题 line must contain NO Latin characters (parser detects mixed lines as English and breaks segment pairing).

| File | Heading | 本课主题 line (3rd content line) | English topic line (4th content line) | Last phrase line |
|---|---|---|---|---|
| chapter-02.md | `# 《芒格思维课》第二课：逆向思维` | `本课主题：逆向思维，敬请期待。` | `Lesson topic: Inversion — Think It Through Backward. The full bilingual reading is coming soon.` | ``- `think backward`：倒过来想`` |
| chapter-03.md | `# 《芒格思维课》第三课：能力圈` | `本课主题：能力圈，敬请期待。` | `Lesson topic: The Circle of Competence. The full bilingual reading is coming soon.` | ``- `circle of competence`：能力圈`` |
| chapter-04.md | `# 《芒格思维课》第四课：人类误判心理学` | `本课主题：人类误判心理学，敬请期待。` | `Lesson topic: The Psychology of Human Misjudgment. The full bilingual reading is coming soon.` | ``- `human misjudgment`：人类误判`` |
| chapter-05.md | `# 《芒格思维课》第五课：激励机制` | `本课主题：激励机制，敬请期待。` | `Lesson topic: Incentives Shape Behavior. The full bilingual reading is coming soon.` | ``- `incentives shape behavior`：激励机制塑造行为`` |
| chapter-06.md | `# 《芒格思维课》第六课：避免愚蠢` | `本课主题：避免愚蠢，敬请期待。` | `Lesson topic: Avoid Stupidity Rather than Seek Brilliance. The full bilingual reading is coming soon.` | ``- `avoid stupidity`：避免愚蠢`` |
| chapter-07.md | `# 《芒格思维课》第七课：合奏效应` | `本课主题：合奏效应，敬请期待。` | `Lesson topic: The Lollapalooza Effect. The full bilingual reading is coming soon.` | ``- `lollapalooza effect`：合奏效应`` |
| chapter-08.md | `# 《芒格思维课》第八课：耐心与纪律` | `本课主题：耐心与纪律，敬请期待。` | `Lesson topic: Patience and Discipline. The full bilingual reading is coming soon.` | ``- `patience and discipline`：耐心与纪律`` |
| chapter-09.md | `# 《芒格思维课》第九课：终身学习` | `本课主题：终身学习，敬请期待。` | `Lesson topic: Lifelong Learning Through Reading. The full bilingual reading is coming soon.` | ``- `lifelong learning`：终身学习`` |
| chapter-10.md | `# 《芒格思维课》第十课：简单与诚信` | `本课主题：简单与诚信，敬请期待。` | `Lesson topic: Simplicity and Integrity. The full bilingual reading is coming soon.` | ``- `simplicity and integrity`：简单与诚信`` |

- [ ] **Step 5: Register chapters and the book in `src/lib/content/library.ts`**

After the `nuanNuanChapters` definition (around line 106) and before `chapterFixtures`, add:

```ts
const mungerLessonMeta: { title: string; summary: string }[] = [
  {
    title: "Lesson 1: The Latticework of Mental Models",
    summary:
      "Why Munger insists on a latticework of mental models drawn from many disciplines.",
  },
  {
    title: "Lesson 2: Inversion — Think It Through Backward",
    summary:
      "Solving problems backward: Munger's favorite way to avoid fooling yourself.",
  },
  {
    title: "Lesson 3: The Circle of Competence",
    summary:
      "Knowing the edge of what you truly understand, and staying inside it.",
  },
  {
    title: "Lesson 4: The Psychology of Human Misjudgment",
    summary:
      "The cognitive biases Munger catalogued and how they distort decisions.",
  },
  {
    title: "Lesson 5: Incentives Shape Behavior",
    summary:
      "Reading incentives first — the most reliable predictor of what people do.",
  },
  {
    title: "Lesson 6: Avoid Stupidity Rather than Seek Brilliance",
    summary: "Why not being wrong beats being clever in the long run.",
  },
  {
    title: "Lesson 7: The Lollapalooza Effect",
    summary:
      "When several forces act in the same direction at once, outcomes go extreme.",
  },
  {
    title: "Lesson 8: Patience and Discipline",
    summary:
      "Sitting on your hands: Munger's approach to rare, decisive moments.",
  },
  {
    title: "Lesson 9: Lifelong Learning Through Reading",
    summary:
      "Invert the usual retirement of the mind — keep learning, keep compounding.",
  },
  {
    title: "Lesson 10: Simplicity and Integrity",
    summary:
      "Reduce complexity, keep your reputation — the quiet pillars of Munger's system.",
  },
];

const mungerChapters: Chapter[] = mungerLessonMeta.map((meta, index) => {
  const order = index + 1;
  const slug = `chapter-${String(order).padStart(2, "0")}`;

  return {
    slug,
    bookSlug: "munger-thinking-course",
    title: meta.title,
    order,
    summary: meta.summary,
    segments: parseBilingualChapter(
      readRaw(["munger-thinking-course", `${slug}.md`]),
    ).segments,
  };
});
```

In the `chapterFixtures` array, add `...mungerChapters` after `...springAndAutumnChapters`.

In `getBooks()`, add a fourth entry after the Spring and Autumn entry:

```ts
    {
      slug: "munger-thinking-course",
      title: "Munger Thinking Course",
      subtitle: "Charlie Munger's mental models, retold as bilingual lessons.",
      author: "Charlie Munger",
      description:
        "An English-first bilingual edition of Charlie Munger's thinking course. Lessons are being prepared — placeholder scaffolding for now.",
      coverTheme: "ink",
      tags: ["Mental Models", "Thinking", "Non-fiction"],
      readingModeLabel: "English First",
      chapters: chapterFixtures
        .filter((chapter) => chapter.bookSlug === "munger-thinking-course")
        .map(toChapterPreview),
    },
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test:run -- src/lib/content/library.test.ts`
Expected: PASS (all 6 tests, including the 2 new/updated ones).

- [ ] **Step 7: Commit**

```bash
git add src/lib/content/library.test.ts src/lib/content/types.ts src/lib/content/library.ts content/raw/munger-thinking-course
git commit -m "feat: add Munger Thinking Course placeholder book"
```

---

### Task 2: Update homepage ranking test for the fourth book

**Files:**
- Modify: `src/components/home/home-page.test.tsx`

**Interfaces:**
- Consumes: `getBooks()` now returns 4 books (Task 1)
- Produces: homepage test suite asserting 4 Read links and the Munger link

- [ ] **Step 1: Update the test assertions**

In `src/components/home/home-page.test.tsx`, add after the Spring and Autumn link assertion:

```ts
    expect(
      screen.getByRole("link", { name: "Munger Thinking Course" }),
    ).toBeInTheDocument();
```

And change:

```ts
    expect(screen.getAllByRole("link", { name: "Read" })).toHaveLength(3);
```

to:

```ts
    expect(screen.getAllByRole("link", { name: "Read" })).toHaveLength(4);
```

- [ ] **Step 2: Run the test**

Run: `npm run test:run -- src/components/home/home-page.test.tsx`
Expected: PASS immediately (HomePage renders books generically; the book exists from Task 1). If it FAILS, Task 1's registration is incomplete — go back and fix.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/home-page.test.tsx
git commit -m "test: expect Munger Thinking Course in homepage ranking"
```

---

### Task 3: Add the ink cover theme styles

**Files:**
- Modify: `src/components/home/home-page.module.css` (after the `.cover[data-theme="bronze"]` block, line ~103)
- Modify: `src/components/reading-progress/book-card-with-progress.module.css` (after the `.card[data-theme="bronze"]` block, line ~16)

**Interfaces:**
- Consumes: `coverTheme: "ink"` from Task 1; existing `.cover` / `.card` base styles
- Produces: dark-ink homepage cover + light-to-mid-ink translucent progress-card background, readable dark text preserved

- [ ] **Step 1: Add `.cover[data-theme="ink"]` to `home-page.module.css`**

Insert after the `.cover[data-theme="bronze"]` block:

```css
.cover[data-theme="ink"] {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.28), transparent 46%),
    linear-gradient(180deg, #39424e, #151b24);
  color: rgba(245, 242, 233, 0.88);
}
```

- [ ] **Step 2: Add `.card[data-theme="ink"]` to `book-card-with-progress.module.css`**

Insert after the `.card[data-theme="bronze"]` block:

```css
.card[data-theme="ink"] {
  background:
    linear-gradient(180deg, rgba(235, 238, 241, 0.92), rgba(88, 98, 111, 0.38));
}
```

(The card gradient stays light at the top so the existing dark `.title`/`.author` text remains readable, while trending toward ink at the bottom.)

- [ ] **Step 3: Run the full test suite and lint**

Run: `npm run test:run && npm run lint`
Expected: PASS / no errors (CSS modules have no unit tests; this guards against syntax breakage and regressions).

- [ ] **Step 4: Commit**

```bash
git add src/components/home/home-page.module.css src/components/reading-progress/book-card-with-progress.module.css
git commit -m "feat: add ink cover theme for course books"
```

---

### Task 4: Full verification and route check

**Files:**
- None modified (verification only; fix and re-run if anything fails)

- [ ] **Step 1: Run the full suite**

Run: `npm run test:run`
Expected: all tests PASS.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Verify routes in dev**

Run: `npm run dev` and check:
- `/` — ranking list shows 4 books; Munger Thinking Course at rank 4 with dark ink cover labeled "MT"
- `/books/munger-thinking-course` — subtitle, tags, and 10 "Lesson N" chapter links
- `/read/munger-thinking-course/chapter-01` — 2 bilingual segments render with English dominant; grammar notes and phrase list collapsed by default; previous/next navigation to chapter-02

If any route fails, fix the code (not the raw content format assumptions) and re-run from Step 1.
