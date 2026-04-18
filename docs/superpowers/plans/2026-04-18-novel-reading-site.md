# Novel Reading Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new standalone Next.js repository at `C:\Users\wson\Desktop\novel-reading-site` with responsive `Home`, `Book Detail`, and `Reader` pages for `Half-Demon Si Teng` and `Spring and Autumn`, using English-first reading with collapsible Chinese help and grammar notes.

**Architecture:** Use the Next.js App Router with repository-local raw Markdown in `content/raw/` and a small parser in `src/lib/content/` that transforms bilingual source files into normalized book, chapter, and segment data at build time. Keep the UI mostly server-rendered, and use native `<details>` disclosure blocks for Chinese and grammar aids so the reading experience stays lightweight on desktop and mobile.

**Tech Stack:** Next.js App Router, React, TypeScript, npm, CSS Modules, `next/font`, Vitest, React Testing Library, jsdom.

---

## File Structure

The implementation happens in a new repository rooted at `C:\Users\wson\Desktop\novel-reading-site`.

Core files and responsibilities:

- `package.json`
  - scripts and dependencies for Next.js and tests
- `vitest.config.ts`
  - Vitest configuration with jsdom and alias support
- `src/test/setup.ts`
  - shared Testing Library and matcher setup
- `content/raw/half-demon-si-teng/chapter-1.md`
  - copied bilingual source for `Half-Demon Si Teng`
- `content/raw/spring-and-autumn/chapter-01.md`
  - copied bilingual source for the first `Spring and Autumn` collection
- `content/raw/spring-and-autumn/chapter-11-20.md`
  - copied bilingual source for the Chapter 11 to Chapter 20 collection
- `src/lib/content/types.ts`
  - shared `Book`, `Chapter`, and `ReaderSegment` types
- `src/lib/content/parser.ts`
  - transform raw Markdown into normalized reading segments
- `src/lib/content/library.ts`
  - book metadata, file loading, route helpers, and chapter lookup
- `src/components/site/site-header.tsx`
  - global navigation
- `src/components/site/site-shell.tsx`
  - site-wide layout wrapper
- `src/components/home/home-page.tsx`
  - editorial landing page
- `src/components/books/book-detail-page.tsx`
  - book overview screen
- `src/components/reader/reader-page.tsx`
  - chapter reading experience
- `src/components/reader/reader-segment.tsx`
  - one English-first reading block with collapsible aids
- `src/app/layout.tsx`
  - global shell, fonts, metadata
- `src/app/globals.css`
  - tokens, atmosphere, typography, responsive rules
- `src/app/page.tsx`
  - home route
- `src/app/books/[slug]/page.tsx`
  - book detail route
- `src/app/read/[bookSlug]/[chapterSlug]/page.tsx`
  - reader route
- `src/components/home/home-page.test.tsx`
  - home UI rendering test
- `src/components/books/book-detail-page.test.tsx`
  - book detail rendering test
- `src/components/reader/reader-segment.test.tsx`
  - reader disclosure behavior test
- `src/lib/content/parser.test.ts`
  - parser normalization test

## Task 1: Create the New Repository and Test Harness

**Files:**
- Create: `C:\Users\wson\Desktop\novel-reading-site\`
- Modify: `C:\Users\wson\Desktop\novel-reading-site\package.json`
- Create: `C:\Users\wson\Desktop\novel-reading-site\vitest.config.ts`
- Create: `C:\Users\wson\Desktop\novel-reading-site\src\test\setup.ts`

- [ ] **Step 1: Scaffold the Next.js app**

Run:

```bash
cd C:\Users\wson\Desktop
npm create next-app@latest novel-reading-site -- --ts --eslint --app --src-dir --use-npm --import-alias "@/*" --no-tailwind
```

Expected:

```text
Success! Created novel-reading-site at C:\Users\wson\Desktop\novel-reading-site
```

- [ ] **Step 2: Install test dependencies**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Expected:

```text
added packages
found 0 vulnerabilities
```

- [ ] **Step 3: Update `package.json` scripts**

Replace the `scripts` block in `C:\Users\wson\Desktop\novel-reading-site\package.json` with:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest",
    "test:run": "vitest run --passWithNoTests"
  }
}
```

- [ ] **Step 4: Add Vitest configuration**

Create `C:\Users\wson\Desktop\novel-reading-site\vitest.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 5: Add the shared test setup**

Create `C:\Users\wson\Desktop\novel-reading-site\src\test\setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 6: Run the empty test suite once**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
npm run test:run
```

Expected:

```text
No test files found, exiting with code 0
```

- [ ] **Step 7: Commit the scaffold**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
git init
git add .
git commit -m "chore: scaffold novel reading site"
```

## Task 2: Import Raw Content and Build the Parser

**Files:**
- Create: `C:\Users\wson\Desktop\novel-reading-site\content\raw\half-demon-si-teng\chapter-1.md`
- Create: `C:\Users\wson\Desktop\novel-reading-site\content\raw\spring-and-autumn\chapter-01.md`
- Create: `C:\Users\wson\Desktop\novel-reading-site\content\raw\spring-and-autumn\chapter-11-20.md`
- Create: `C:\Users\wson\Desktop\novel-reading-site\src\lib\content\types.ts`
- Create: `C:\Users\wson\Desktop\novel-reading-site\src\lib\content\parser.ts`
- Create: `C:\Users\wson\Desktop\novel-reading-site\src\lib\content\library.ts`
- Test: `C:\Users\wson\Desktop\novel-reading-site\src\lib\content\parser.test.ts`

- [ ] **Step 1: Write the failing parser test**

Create `C:\Users\wson\Desktop\novel-reading-site\src\lib\content\parser.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseBilingualChapter } from "@/lib/content/parser";

const sampleMarkdown = `
# Sample Chapter

第一句中文。
First English line.
第二句中文。
Second English line.
语法说明：<br>
语法标记：\`并列句\`。<br>
难点拆解：测试说明。<br>
常用短语：
- \`first phrase\`：第一个短语
- \`second phrase\`：第二个短语
`;

describe("parseBilingualChapter", () => {
  it("groups bilingual lines and attaches grammar aids to the latest segment", () => {
    const result = parseBilingualChapter(sampleMarkdown);

    expect(result.segments).toHaveLength(2);
    expect(result.segments[0]).toMatchObject({
      chinese: "第一句中文。",
      english: "First English line.",
    });
    expect(result.segments[1]).toMatchObject({
      chinese: "第二句中文。",
      english: "Second English line.",
      grammarNotes: ["语法标记：并列句。", "难点拆解：测试说明。"],
      phrases: ["first phrase：第一个短语", "second phrase：第二个短语"],
    });
  });
});
```

- [ ] **Step 2: Run the parser test to verify it fails**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
npm run test:run -- src/lib/content/parser.test.ts
```

Expected:

```text
FAIL  src/lib/content/parser.test.ts
Error: Failed to resolve import "@/lib/content/parser"
```

- [ ] **Step 3: Create the shared content types**

Create `C:\Users\wson\Desktop\novel-reading-site\src\lib\content\types.ts`:

```ts
export type ReaderSegment = {
  id: string;
  chinese: string;
  english: string;
  grammarNotes: string[];
  phrases: string[];
};

export type Chapter = {
  slug: string;
  bookSlug: string;
  title: string;
  order: number;
  summary: string;
  segments: ReaderSegment[];
};

export type Book = {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  description: string;
  coverTheme: "mist" | "bronze";
  tags: string[];
  readingModeLabel: string;
  chapters: Omit<Chapter, "segments">[];
};

export type ParsedChapter = {
  title: string;
  segments: ReaderSegment[];
};
```

- [ ] **Step 4: Implement the parser**

Create `C:\Users\wson\Desktop\novel-reading-site\src\lib\content\parser.ts`:

```ts
import type { ParsedChapter, ReaderSegment } from "@/lib/content/types";

const cleanInlineMarkup = (value: string) =>
  value
    .replace(/<br>/g, "")
    .replace(/`/g, "")
    .trim();

const isHeading = (line: string) => line.startsWith("#");
const isMetaLine = (line: string) =>
  line === "说明：" ||
  line.startsWith("- ") ||
  line.startsWith("当前已完成") ||
  line.startsWith("排版规则") ||
  line.startsWith("英文以") ||
  line.startsWith("保留原书");

const isGrammarStart = (line: string) => line.startsWith("语法说明");
const isPhrasesStart = (line: string) => line.startsWith("常用短语");
const isChinese = (line: string) => /[\u4e00-\u9fff]/.test(line) && !/[A-Za-z]{3,}/.test(line);
const isEnglish = (line: string) => /[A-Za-z]/.test(line);

export function parseBilingualChapter(markdown: string): ParsedChapter {
  const lines = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let title = "Untitled Chapter";
  const segments: ReaderSegment[] = [];
  let pendingChinese: string | null = null;
  let collectGrammar = false;
  let collectPhrases = false;

  for (const rawLine of lines) {
    const line = cleanInlineMarkup(rawLine);

    if (isHeading(line)) {
      if (title === "Untitled Chapter" && line.startsWith("# ")) {
        title = line.replace(/^#\s+/, "");
      }
      collectGrammar = false;
      collectPhrases = false;
      continue;
    }

    if (isMetaLine(line)) {
      continue;
    }

    if (isGrammarStart(line)) {
      collectGrammar = true;
      collectPhrases = false;
      continue;
    }

    if (isPhrasesStart(line)) {
      collectGrammar = false;
      collectPhrases = true;
      continue;
    }

    if (collectGrammar && segments.length > 0) {
      segments[segments.length - 1].grammarNotes.push(line);
      continue;
    }

    if (collectPhrases && segments.length > 0) {
      segments[segments.length - 1].phrases.push(line.replace(/^- /, ""));
      continue;
    }

    collectGrammar = false;
    collectPhrases = false;

    if (isChinese(line)) {
      pendingChinese = line;
      continue;
    }

    if (pendingChinese && isEnglish(line)) {
      segments.push({
        id: `segment-${segments.length + 1}`,
        chinese: pendingChinese,
        english: line,
        grammarNotes: [],
        phrases: [],
      });
      pendingChinese = null;
    }
  }

  return { title, segments };
}
```

- [ ] **Step 5: Add the book library loader**

Create `C:\Users\wson\Desktop\novel-reading-site\src\lib\content\library.ts`:

```ts
import fs from "node:fs";
import path from "node:path";
import { parseBilingualChapter } from "@/lib/content/parser";
import type { Book, Chapter } from "@/lib/content/types";

const rawRoot = path.join(process.cwd(), "content", "raw");

const readRaw = (segments: string[]) =>
  fs.readFileSync(path.join(rawRoot, ...segments), "utf8");

const chapterFixtures: Chapter[] = [
  {
    slug: "chapter-1",
    bookSlug: "half-demon-si-teng",
    title: "Chapter 1",
    order: 1,
    summary: "An Man waits in the cold and the story opens with unease and desire.",
    segments: parseBilingualChapter(
      readRaw(["half-demon-si-teng", "chapter-1.md"]),
    ).segments,
  },
  {
    slug: "chapter-01",
    bookSlug: "spring-and-autumn",
    title: "Chapter 1: The Fairy Maiden",
    order: 1,
    summary: "A witty historical opening that frames beauty, power, and early Zhou drama.",
    segments: parseBilingualChapter(
      readRaw(["spring-and-autumn", "chapter-01.md"]),
    ).segments,
  },
  {
    slug: "chapter-11-20",
    bookSlug: "spring-and-autumn",
    title: "Chapters 11-20",
    order: 11,
    summary: "A later historical arc about central authority, alliances, and political instability.",
    segments: parseBilingualChapter(
      readRaw(["spring-and-autumn", "chapter-11-20.md"]),
    ).segments,
  },
];

export function getBooks(): Book[] {
  return [
    {
      slug: "half-demon-si-teng",
      title: "Half-Demon Si Teng",
      subtitle: "A cold, cinematic modern fantasy for close English reading.",
      author: "Wei Yu",
      description: "An English-first reading edition built from the bilingual Chapter 1 source.",
      coverTheme: "mist",
      tags: ["Modern Fantasy", "Atmospheric", "Dialogue"],
      readingModeLabel: "English First",
      chapters: chapterFixtures
        .filter((chapter) => chapter.bookSlug === "half-demon-si-teng")
        .map(({ segments, ...chapter }) => chapter),
    },
    {
      slug: "spring-and-autumn",
      title: "Spring and Autumn",
      subtitle: "A sharp historical narrative with study-friendly bilingual support.",
      author: "Liang Xiaosheng",
      description: "An English-first reading edition built from the current bilingual chapter collection.",
      coverTheme: "bronze",
      tags: ["History", "Narrative", "Grammar Notes"],
      readingModeLabel: "English First",
      chapters: chapterFixtures
        .filter((chapter) => chapter.bookSlug === "spring-and-autumn")
        .map(({ segments, ...chapter }) => chapter),
    },
  ];
}

export function getBookBySlug(slug: string) {
  return getBooks().find((book) => book.slug === slug);
}

export function getChapterBySlugs(bookSlug: string, chapterSlug: string) {
  return chapterFixtures.find(
    (chapter) => chapter.bookSlug === bookSlug && chapter.slug === chapterSlug,
  );
}

export function getAdjacentChapters(bookSlug: string, chapterSlug: string) {
  const chapters = chapterFixtures
    .filter((chapter) => chapter.bookSlug === bookSlug)
    .sort((left, right) => left.order - right.order);

  const index = chapters.findIndex((chapter) => chapter.slug === chapterSlug);

  return {
    previous: index > 0 ? chapters[index - 1] : null,
    next: index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : null,
  };
}
```

- [ ] **Step 6: Copy the source Markdown into the repository**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
mkdir content\raw\half-demon-si-teng
mkdir content\raw\spring-and-autumn
copy C:\Users\wson\Desktop\半妖司藤-第一章中英对照.md content\raw\half-demon-si-teng\chapter-1.md
copy C:\Users\wson\Desktop\说春秋-第一章中英对照.md content\raw\spring-and-autumn\chapter-01.md
copy C:\Users\wson\Desktop\说春秋-第11章到第20章中英对照.md content\raw\spring-and-autumn\chapter-11-20.md
```

Expected:

```text
        1 file(s) copied.
```

- [ ] **Step 7: Run the parser test again**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
npm run test:run -- src/lib/content/parser.test.ts
```

Expected:

```text
PASS  src/lib/content/parser.test.ts
```

- [ ] **Step 8: Commit the content foundation**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
git add .
git commit -m "feat: add reading content parser and source files"
```

## Task 3: Build the Shared Editorial Shell

**Files:**
- Create: `C:\Users\wson\Desktop\novel-reading-site\src\components\site\site-header.tsx`
- Create: `C:\Users\wson\Desktop\novel-reading-site\src\components\site\site-shell.tsx`
- Create: `C:\Users\wson\Desktop\novel-reading-site\src\components\site\site-header.test.tsx`
- Modify: `C:\Users\wson\Desktop\novel-reading-site\src\app\layout.tsx`
- Modify: `C:\Users\wson\Desktop\novel-reading-site\src\app\globals.css`

- [ ] **Step 1: Write the failing header test**

Create `C:\Users\wson\Desktop\novel-reading-site\src\components\site\site-header.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "@/components/site/site-header";

describe("SiteHeader", () => {
  it("renders the brand and primary navigation labels", () => {
    render(<SiteHeader />);

    expect(screen.getByText("Novel Reading Site")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Library" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue Reading" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About Reading Mode" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the header test to verify it fails**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
npm run test:run -- src/components/site/site-header.test.tsx
```

Expected:

```text
FAIL  src/components/site/site-header.test.tsx
Error: Failed to resolve import "@/components/site/site-header"
```

- [ ] **Step 3: Implement the header and site shell**

Create `C:\Users\wson\Desktop\novel-reading-site\src\components\site\site-header.tsx`:

```tsx
import Link from "next/link";

const navItems = [
  { href: "/", label: "Library" },
  { href: "/read/half-demon-si-teng/chapter-1", label: "Continue Reading" },
  { href: "/#reading-mode", label: "About Reading Mode" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="site-brand">
        Novel Reading Site
      </Link>
      <nav className="site-nav" aria-label="Primary">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
```

Create `C:\Users\wson\Desktop\novel-reading-site\src\components\site\site-shell.tsx`:

```tsx
import type { PropsWithChildren } from "react";
import { SiteHeader } from "@/components/site/site-header";

export function SiteShell({ children }: PropsWithChildren) {
  return (
    <div className="site-frame">
      <SiteHeader />
      <main>{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Replace the default layout with the editorial shell**

Replace `C:\Users\wson\Desktop\novel-reading-site\src\app\layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Instrument_Sans } from "next/font/google";
import { SiteShell } from "@/components/site/site-shell";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Novel Reading Site",
  description: "An English-first reading home for bilingual literary study.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Replace the global CSS tokens and shell styles**

Replace `C:\Users\wson\Desktop\novel-reading-site\src\app\globals.css` with:

```css
:root {
  --paper: #f4efe5;
  --paper-strong: #e7decb;
  --ink: #1f1c17;
  --ink-soft: #5a5347;
  --olive: #4f5b43;
  --gold: #8b6b2f;
  --line: rgba(31, 28, 23, 0.14);
  --shadow: 0 24px 60px rgba(31, 28, 23, 0.12);
}

* {
  box-sizing: border-box;
}

html {
  background: linear-gradient(180deg, #efe7d8 0%, #f8f3ea 100%);
}

body {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-sans), sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

.site-frame {
  min-height: 100vh;
  padding: 24px;
}

.site-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  margin: 0 auto 32px;
  max-width: 1200px;
}

.site-brand {
  font-family: var(--font-display), serif;
  font-size: clamp(2rem, 4vw, 3.25rem);
  letter-spacing: 0.02em;
}

.site-nav {
  display: flex;
  gap: 20px;
  color: var(--ink-soft);
}

@media (max-width: 720px) {
  .site-frame {
    padding: 16px;
  }

  .site-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .site-nav {
    flex-wrap: wrap;
    gap: 12px;
  }
}
```

- [ ] **Step 6: Run the header test again**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
npm run test:run -- src/components/site/site-header.test.tsx
```

Expected:

```text
PASS  src/components/site/site-header.test.tsx
```

- [ ] **Step 7: Commit the shell**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
git add .
git commit -m "feat: add editorial site shell"
```

## Task 4: Build the Home Page

**Files:**
- Create: `C:\Users\wson\Desktop\novel-reading-site\src\components\home\home-page.tsx`
- Create: `C:\Users\wson\Desktop\novel-reading-site\src\components\home\home-page.module.css`
- Create: `C:\Users\wson\Desktop\novel-reading-site\src\components\home\home-page.test.tsx`
- Modify: `C:\Users\wson\Desktop\novel-reading-site\src\app\page.tsx`

- [ ] **Step 1: Write the failing home page test**

Create `C:\Users\wson\Desktop\novel-reading-site\src\components\home\home-page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePage } from "@/components/home/home-page";
import { getBooks } from "@/lib/content/library";

describe("HomePage", () => {
  it("shows the hero message and both featured books", () => {
    render(<HomePage books={getBooks()} />);

    expect(
      screen.getByText("Read literary English without losing the original pulse."),
    ).toBeInTheDocument();
    expect(screen.getByText("Half-Demon Si Teng")).toBeInTheDocument();
    expect(screen.getByText("Spring and Autumn")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start with Si Teng" }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the home test to verify it fails**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
npm run test:run -- src/components/home/home-page.test.tsx
```

Expected:

```text
FAIL  src/components/home/home-page.test.tsx
Error: Failed to resolve import "@/components/home/home-page"
```

- [ ] **Step 3: Implement the home page component and styles**

Create `C:\Users\wson\Desktop\novel-reading-site\src\components\home\home-page.tsx`:

```tsx
import Link from "next/link";
import type { Book } from "@/lib/content/types";
import styles from "./home-page.module.css";

export function HomePage({ books }: { books: Book[] }) {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>English-first literary reading</p>
        <h1>Read literary English without losing the original pulse.</h1>
        <p className={styles.intro}>
          Move through story, tone, and rhythm in English first, then open
          Chinese support only when you need it.
        </p>
        <Link
          className={styles.primaryCta}
          href="/read/half-demon-si-teng/chapter-1"
        >
          Start with Si Teng
        </Link>
      </section>

      <section className={styles.books}>
        {books.map((book) => (
          <article key={book.slug} className={styles.card} data-theme={book.coverTheme}>
            <p className={styles.meta}>{book.readingModeLabel}</p>
            <h2>{book.title}</h2>
            <p>{book.subtitle}</p>
            <div className={styles.tags}>
              {book.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <Link href={`/books/${book.slug}`}>Open book</Link>
          </article>
        ))}
      </section>

      <section id="reading-mode" className={styles.mode}>
        <h2>How reading mode works</h2>
        <p>
          English stays visible first. Chinese lines, grammar notes, and phrase
          support stay folded until the reader asks for them.
        </p>
      </section>
    </div>
  );
}
```

Create `C:\Users\wson\Desktop\novel-reading-site\src\components\home\home-page.module.css`:

```css
.page {
  display: grid;
  gap: 32px;
  margin: 0 auto;
  max-width: 1200px;
}

.hero {
  padding: 48px;
  border: 1px solid var(--line);
  border-radius: 32px;
  background:
    radial-gradient(circle at top right, rgba(139, 107, 47, 0.22), transparent 32%),
    linear-gradient(145deg, rgba(79, 91, 67, 0.08), rgba(244, 239, 229, 0.92));
  box-shadow: var(--shadow);
}

.kicker {
  margin: 0 0 12px;
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: 0.16em;
}

.hero h1 {
  margin: 0 0 16px;
  font-family: var(--font-display), serif;
  font-size: clamp(3rem, 8vw, 5.6rem);
  line-height: 0.94;
}

.intro {
  max-width: 54ch;
  color: var(--ink-soft);
  font-size: 1.05rem;
}

.primaryCta {
  display: inline-flex;
  margin-top: 24px;
  padding: 14px 22px;
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper);
}

.books {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.card {
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.42);
}

.meta {
  color: var(--olive);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 16px 0;
}

.tags span {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(79, 91, 67, 0.12);
  color: var(--olive);
  font-size: 0.875rem;
}

.mode {
  padding: 32px;
  border-top: 1px solid var(--line);
}

@media (max-width: 720px) {
  .hero {
    padding: 28px 22px;
  }

  .books {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Wire the component to the home route**

Replace `C:\Users\wson\Desktop\novel-reading-site\src\app\page.tsx` with:

```tsx
import { HomePage } from "@/components/home/home-page";
import { getBooks } from "@/lib/content/library";

export default function Page() {
  return <HomePage books={getBooks()} />;
}
```

- [ ] **Step 5: Run the home test again**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
npm run test:run -- src/components/home/home-page.test.tsx
```

Expected:

```text
PASS  src/components/home/home-page.test.tsx
```

- [ ] **Step 6: Commit the home page**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
git add .
git commit -m "feat: add editorial home page"
```

## Task 5: Build the Book Detail Route

**Files:**
- Create: `C:\Users\wson\Desktop\novel-reading-site\src\components\books\book-detail-page.tsx`
- Create: `C:\Users\wson\Desktop\novel-reading-site\src\components\books\book-detail-page.module.css`
- Create: `C:\Users\wson\Desktop\novel-reading-site\src\components\books\book-detail-page.test.tsx`
- Modify: `C:\Users\wson\Desktop\novel-reading-site\src\app\books\[slug]\page.tsx`

- [ ] **Step 1: Write the failing book detail test**

Create `C:\Users\wson\Desktop\novel-reading-site\src\components\books\book-detail-page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BookDetailPage } from "@/components/books/book-detail-page";
import { getBookBySlug } from "@/lib/content/library";

describe("BookDetailPage", () => {
  it("renders the selected book summary and chapter list", () => {
    const book = getBookBySlug("spring-and-autumn");

    if (!book) {
      throw new Error("book not found");
    }

    render(<BookDetailPage book={book} />);

    expect(screen.getByText("Spring and Autumn")).toBeInTheDocument();
    expect(screen.getByText("English First")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Begin reading/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Chapter 1: The Fairy Maiden")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the book detail test to verify it fails**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
npm run test:run -- src/components/books/book-detail-page.test.tsx
```

Expected:

```text
FAIL  src/components/books/book-detail-page.test.tsx
Error: Failed to resolve import "@/components/books/book-detail-page"
```

- [ ] **Step 3: Implement the book detail component and styles**

Create `C:\Users\wson\Desktop\novel-reading-site\src\components\books\book-detail-page.tsx`:

```tsx
import Link from "next/link";
import type { Book } from "@/lib/content/types";
import styles from "./book-detail-page.module.css";

export function BookDetailPage({ book }: { book: Book }) {
  const firstChapter = book.chapters[0];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.mode}>{book.readingModeLabel}</p>
        <h1>{book.title}</h1>
        <p className={styles.subtitle}>{book.subtitle}</p>
        <p className={styles.description}>{book.description}</p>
        <Link
          className={styles.cta}
          href={`/read/${book.slug}/${firstChapter.slug}`}
        >
          Begin reading
        </Link>
      </section>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <h2>Why this book works here</h2>
          <ul>
            {book.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </article>

        <article className={styles.panel}>
          <h2>Available chapters</h2>
          <ol className={styles.chapterList}>
            {book.chapters.map((chapter) => (
              <li key={chapter.slug}>
                <Link href={`/read/${book.slug}/${chapter.slug}`}>
                  <strong>{chapter.title}</strong>
                  <span>{chapter.summary}</span>
                </Link>
              </li>
            ))}
          </ol>
        </article>
      </section>
    </div>
  );
}
```

Create `C:\Users\wson\Desktop\novel-reading-site\src\components\books\book-detail-page.module.css`:

```css
.page {
  display: grid;
  gap: 28px;
  margin: 0 auto;
  max-width: 1100px;
}

.hero {
  padding: 40px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.46);
}

.mode {
  margin: 0 0 8px;
  color: var(--gold);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero h1 {
  margin: 0;
  font-family: var(--font-display), serif;
  font-size: clamp(2.75rem, 7vw, 4.8rem);
}

.subtitle,
.description {
  max-width: 60ch;
  color: var(--ink-soft);
}

.cta {
  display: inline-flex;
  margin-top: 12px;
  padding: 12px 20px;
  border-radius: 999px;
  background: var(--olive);
  color: var(--paper);
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 24px;
}

.panel {
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.42);
}

.chapterList {
  display: grid;
  gap: 16px;
  padding-left: 20px;
}

.chapterList a {
  display: grid;
  gap: 6px;
}

.chapterList span {
  color: var(--ink-soft);
}

@media (max-width: 860px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .hero,
  .panel {
    padding: 24px;
  }
}
```

- [ ] **Step 4: Wire the dynamic route**

Create `C:\Users\wson\Desktop\novel-reading-site\src\app\books\[slug]\page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { BookDetailPage } from "@/components/books/book-detail-page";
import { getBookBySlug, getBooks } from "@/lib/content/library";

export function generateStaticParams() {
  return getBooks().map((book) => ({ slug: book.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = getBookBySlug(slug);

  if (!book) {
    notFound();
  }

  return <BookDetailPage book={book} />;
}
```

- [ ] **Step 5: Run the book detail test again**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
npm run test:run -- src/components/books/book-detail-page.test.tsx
```

Expected:

```text
PASS  src/components/books/book-detail-page.test.tsx
```

- [ ] **Step 6: Commit the book detail route**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
git add .
git commit -m "feat: add book detail route"
```

## Task 6: Build the Reader Experience

**Files:**
- Create: `C:\Users\wson\Desktop\novel-reading-site\src\components\reader\reader-segment.tsx`
- Create: `C:\Users\wson\Desktop\novel-reading-site\src\components\reader\reader-page.tsx`
- Create: `C:\Users\wson\Desktop\novel-reading-site\src\components\reader\reader-page.module.css`
- Create: `C:\Users\wson\Desktop\novel-reading-site\src\components\reader\reader-segment.test.tsx`
- Modify: `C:\Users\wson\Desktop\novel-reading-site\src\app\read\[bookSlug]\[chapterSlug]\page.tsx`

- [ ] **Step 1: Write the failing reader segment test**

Create `C:\Users\wson\Desktop\novel-reading-site\src\components\reader\reader-segment.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run the reader test to verify it fails**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
npm run test:run -- src/components/reader/reader-segment.test.tsx
```

Expected:

```text
FAIL  src/components/reader/reader-segment.test.tsx
Error: Failed to resolve import "@/components/reader/reader-segment"
```

- [ ] **Step 3: Implement the reader segment disclosure block**

Create `C:\Users\wson\Desktop\novel-reading-site\src\components\reader\reader-segment.tsx`:

```tsx
import type { ReaderSegment as ReaderSegmentType } from "@/lib/content/types";
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
      <p className={styles.english}>{segment.english}</p>

      <details className={styles.disclosure}>
        <summary>Show Chinese</summary>
        <p className={styles.chinese}>{segment.chinese}</p>
      </details>

      {(segment.grammarNotes.length > 0 || segment.phrases.length > 0) && (
        <details className={styles.disclosure}>
          <summary>Show Notes</summary>
          {segment.grammarNotes.length > 0 && (
            <ul className={styles.noteList}>
              {segment.grammarNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
          {segment.phrases.length > 0 && (
            <ul className={styles.phraseList}>
              {segment.phrases.map((phrase) => (
                <li key={phrase}>{phrase}</li>
              ))}
            </ul>
          )}
        </details>
      )}
    </article>
  );
}
```

- [ ] **Step 4: Implement the full reader page and styles**

Create `C:\Users\wson\Desktop\novel-reading-site\src\components\reader\reader-page.tsx`:

```tsx
import Link from "next/link";
import { ReaderSegment } from "@/components/reader/reader-segment";
import type { Book, Chapter } from "@/lib/content/types";
import styles from "./reader-page.module.css";

export function ReaderPage({
  book,
  chapter,
  previousHref,
  nextHref,
}: {
  book: Book;
  chapter: Chapter;
  previousHref: string | null;
  nextHref: string | null;
}) {
  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <p className={styles.sidebarLabel}>{book.readingModeLabel}</p>
        <h1>{chapter.title}</h1>
        <p>{chapter.summary}</p>
        <p className={styles.progress}>
          Chapter {chapter.order} · {chapter.segments.length} segments
        </p>
        <div className={styles.navLinks}>
          {previousHref ? <Link href={previousHref}>Previous chapter</Link> : <span />}
          {nextHref ? <Link href={nextHref}>Next chapter</Link> : <span />}
        </div>
      </aside>

      <section className={styles.content}>
        {chapter.segments.map((segment, index) => (
          <ReaderSegment key={segment.id} index={index + 1} segment={segment} />
        ))}
      </section>
    </div>
  );
}
```

Create `C:\Users\wson\Desktop\novel-reading-site\src\components\reader\reader-page.module.css`:

```css
.page {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 28px;
  margin: 0 auto;
  max-width: 1180px;
}

.sidebar {
  position: sticky;
  top: 24px;
  align-self: start;
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.52);
}

.sidebarLabel {
  margin: 0 0 8px;
  color: var(--gold);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.sidebar h1 {
  margin: 0 0 16px;
  font-family: var(--font-display), serif;
  font-size: clamp(2.1rem, 4vw, 3rem);
}

.progress {
  color: var(--ink-soft);
}

.navLinks {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
}

.content {
  display: grid;
  gap: 18px;
}

.segment {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.38);
}

.segmentIndex {
  margin: 0 0 12px;
  color: var(--olive);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.85rem;
}

.english {
  margin: 0;
  font-family: var(--font-display), serif;
  font-size: clamp(1.4rem, 2.4vw, 2rem);
  line-height: 1.45;
}

.disclosure {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.disclosure summary {
  cursor: pointer;
  color: var(--ink-soft);
}

.chinese,
.noteList,
.phraseList {
  margin-top: 12px;
  color: var(--ink-soft);
}

@media (max-width: 900px) {
  .page {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }
}
```

- [ ] **Step 5: Wire the reader route**

Create `C:\Users\wson\Desktop\novel-reading-site\src\app\read\[bookSlug]\[chapterSlug]\page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { ReaderPage } from "@/components/reader/reader-page";
import {
  getAdjacentChapters,
  getBookBySlug,
  getBooks,
  getChapterBySlugs,
} from "@/lib/content/library";

export function generateStaticParams() {
  return getBooks().flatMap((book) =>
    book.chapters.map((chapter) => ({
      bookSlug: book.slug,
      chapterSlug: chapter.slug,
    })),
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ bookSlug: string; chapterSlug: string }>;
}) {
  const { bookSlug, chapterSlug } = await params;
  const book = getBookBySlug(bookSlug);
  const chapter = getChapterBySlugs(bookSlug, chapterSlug);

  if (!book || !chapter) {
    notFound();
  }

  const adjacent = getAdjacentChapters(bookSlug, chapterSlug);

  return (
    <ReaderPage
      book={book}
      chapter={chapter}
      previousHref={
        adjacent.previous
          ? `/read/${bookSlug}/${adjacent.previous.slug}`
          : null
      }
      nextHref={
        adjacent.next
          ? `/read/${bookSlug}/${adjacent.next.slug}`
          : null
      }
    />
  );
}
```

- [ ] **Step 6: Run the reader test again**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
npm run test:run -- src/components/reader/reader-segment.test.tsx
```

Expected:

```text
PASS  src/components/reader/reader-segment.test.tsx
```

- [ ] **Step 7: Commit the reader**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
git add .
git commit -m "feat: add english-first reader"
```

## Task 7: Final Verification and Product Readme

**Files:**
- Modify: `C:\Users\wson\Desktop\novel-reading-site\README.md`

- [ ] **Step 1: Replace the default README**

Replace `C:\Users\wson\Desktop\novel-reading-site\README.md` with:

~~~~md
# Novel Reading Site

An editorial-style Next.js prototype for English-first reading with bilingual support.

## Included books

- Half-Demon Si Teng
- Spring and Autumn

## Local development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run test:run
npm run build
```
~~~~

- [ ] **Step 2: Run the full test suite**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
npm run test:run
```

Expected:

```text
PASS  src/lib/content/parser.test.ts
PASS  src/components/site/site-header.test.tsx
PASS  src/components/home/home-page.test.tsx
PASS  src/components/books/book-detail-page.test.tsx
PASS  src/components/reader/reader-segment.test.tsx
```

- [ ] **Step 3: Run the production build**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
npm run build
```

Expected:

```text
Route (app)
┌ ○ /
├ ○ /books/[slug]
└ ○ /read/[bookSlug]/[chapterSlug]
```

- [ ] **Step 4: Run the local UI check**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
npm run dev
```

Manual checks:

```text
1. Open http://localhost:3000/ and confirm the hero, featured books, and reading-mode section render.
2. Open http://localhost:3000/books/half-demon-si-teng and confirm the chapter list and CTA render.
3. Open http://localhost:3000/read/half-demon-si-teng/chapter-1 and confirm English is visible first.
4. Resize to a narrow mobile viewport and confirm the header wraps, cards stack, and the reader sidebar becomes a top section.
```

- [ ] **Step 5: Commit the verified release candidate**

Run:

```bash
cd C:\Users\wson\Desktop\novel-reading-site
git add .
git commit -m "docs: add project readme and verify prototype"
```

## Self-Review

Spec coverage check:

- New standalone repository: covered in Task 1.
- Local content copy and normalization: covered in Task 2.
- Shared editorial shell and responsive tone: covered in Task 3.
- `Home` page: covered in Task 4.
- `Book Detail` page: covered in Task 5.
- `Reader` page with English-first mode and collapsible help: covered in Task 6.
- Verification for desktop and mobile use: covered in Task 7.

Placeholder scan:

- No unresolved markers or deferred references remain.
- Each task names exact files and commands.
- Each code-writing step includes concrete code.

Type consistency:

- `Book`, `Chapter`, and `ReaderSegment` are introduced in Task 2 and reused consistently in later tasks.
- Route helper names remain `getBooks`, `getBookBySlug`, `getChapterBySlugs`, and `getAdjacentChapters` across Tasks 2, 4, 5, and 6.
