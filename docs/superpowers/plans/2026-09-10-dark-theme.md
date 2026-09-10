# Dark Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a warm-toned dark theme with a persistent manual Light/Dark toggle, and migrate all hardcoded component colors to the global CSS token system.

**Architecture:** CSS custom properties live in `src/app/globals.css` — light values in `:root`, dark overrides in a `[data-theme="dark"]` block. A synchronous inline script in the root layout sets `data-theme` on `<html>` before first paint (no flash). A client-side toggle button in the site header flips the attribute and persists the choice to `localStorage`. All component CSS modules migrate hardcoded colors to tokens so both themes work everywhere.

**Tech Stack:** Next.js 16.2.4 (App Router), React 19, CSS Modules, global CSS variables, Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-09-10-dark-theme-design.md`

## Global Constraints

- No new npm dependencies. No Tailwind. No Pages Router.
- Light token values in `:root` stay exactly as they are today. The only accepted light-mode shifts: home ranking page becomes warm-toned (was cool blue/white), and translucent glass panels normalize to `--card-glass` (`rgba(255,255,255,0.42)` light).
- Dark palette values are fixed by the spec (see Task 1) — do not improvise different hexes.
- Theme mechanism is fixed: `<html data-theme="light|dark">`, `localStorage` key `"theme"` with values `"light"` / `"dark"`, first visit falls back to `prefers-color-scheme`.
- UI copy stays English: `"Switch to dark theme"` / `"Switch to light theme"`.
- Do not touch `content/raw/`, `src/lib/content/`, or anything unrelated to theming.
- Never revert unrelated user changes.
- Environment: Windows, Git Bash. Run all commands from the repo root.
- Commit after every task. Message prefixes match repo history (`feat:`, `fix:`, `chore:`, `docs:`) and end with `Co-Authored-By: Claude Code <noreply@anthropic.com>`.
- Before running `npm run dev` manually, kill any dev server already on port 3000.
- Note: this Next.js version may differ from what you know — if you need an API not shown in this plan, check `node_modules/next/dist/docs/` first. All APIs used in this plan (`next/script` inline + `beforeInteractive`, `"use client"`, CSS Modules) were verified against those docs.

## Reference: current file contents you will modify

All "Modify" steps below replace only what is shown; everything else in the file stays byte-identical. Current state is in git (`master` branch, clean tree at commit `562e840`).

---

### Task 1: Dark token foundation in globals.css

Pure CSS change — no unit test applies (nothing JS-observable changes). Verification is the existing suite + build + a dev-server screenshot-level check that dark mode works via manually setting the attribute.

**Files:**
- Modify: `src/app/globals.css:1-29`

**Interfaces:**
- Consumes: nothing.
- Produces (used by every later task): CSS variables `--card`, `--card-glass`, `--page-bg` on `:root`, plus dark overrides for all tokens under `[data-theme="dark"]` — including `--paper: #191610`, `--paper-strong: #262117`, `--ink: #ece5d8`, `--ink-soft: #a89e8d`, `--olive: #9db284`, `--gold: #d4a94e`, `--line: rgba(236,229,216,0.16)`, `--shadow: 0 24px 60px rgba(0,0,0,0.4)`, `--card: #221e16`, `--card-glass: rgba(236,229,216,0.05)`.

- [ ] **Step 1: Replace the `:root` and `html` blocks, add the dark block**

Replace lines 1-21 of `src/app/globals.css` (the `:root` block through the `html` rule) with:

```css
:root {
  color-scheme: light;
  --paper: #f4efe5;
  --paper-strong: #e7decb;
  --ink: #1f1c17;
  --ink-soft: #5a5347;
  --olive: #4f5b43;
  --gold: #8b6b2f;
  --line: rgba(31, 28, 23, 0.14);
  --shadow: 0 24px 60px rgba(31, 28, 23, 0.12);
  --card: #fbf8f1;
  --card-glass: rgba(255, 255, 255, 0.42);
  --page-bg: linear-gradient(180deg, #efe7d8 0%, #f8f3ea 100%);
}

[data-theme="dark"] {
  color-scheme: dark;
  --paper: #191610;
  --paper-strong: #262117;
  --ink: #ece5d8;
  --ink-soft: #a89e8d;
  --olive: #9db284;
  --gold: #d4a94e;
  --line: rgba(236, 229, 216, 0.16);
  --shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  --card: #221e16;
  --card-glass: rgba(236, 229, 216, 0.05);
  --page-bg: linear-gradient(180deg, #14110c 0%, #1c1812 100%);
}

html {
  min-height: 100%;
  background: var(--page-bg);
}
```

The rest of the file (the `*`, `body`, `a`, `button…`, `.site-frame`, `.site-header`, `.site-brand`, `.site-nav` rules and both media queries) stays exactly as is.

- [ ] **Step 2: Run the existing test suite**

Run: `npm run test:run`
Expected: all tests PASS (CSS is not exercised by tests, but this guards against accidental syntax damage to imports).

- [ ] **Step 3: Run the build**

Run: `npm run build`
Expected: builds successfully with no CSS errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add dark theme token foundation

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: No-flash theme init script in root layout

**Files:**
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `localStorage` key `"theme"` (`"light"` | `"dark"`), `prefers-color-scheme`.
- Produces: `<html data-theme="light|dark">` set before first paint on every route. Task 3's toggle reads/writes the same attribute and storage key. Script id: `"theme-init"`.

- [ ] **Step 1: Update layout.tsx**

Replace the entire contents of `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import Script from "next/script";
import { SiteShell } from "@/components/site/site-shell";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
});

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Novel Reading Site",
  description: "An English-first reading home for bilingual literary study.",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable}`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
```

Why each piece:
- `strategy="beforeInteractive"` + placement in the root layout: per `node_modules/next/dist/docs/01-app/03-api-reference/02-components/script.md`, such scripts are "injected into the initial HTML from the server" and "always injected inside the head" — synchronous, before first paint.
- `suppressHydrationWarning` on `<html>`: the script mutates `data-theme` before hydration; this is the documented pattern and prevents a spurious hydration warning.
- `try/catch`: falls back to `"light"` when `localStorage` is unavailable (private mode).

- [ ] **Step 2: Run the build**

Run: `npm run build`
Expected: builds successfully.

- [ ] **Step 3: Verify the script is served in the initial HTML**

Run: `npm run dev` (background or separate terminal), then:

```bash
curl -s http://localhost:3000 | grep -c "theme-init"
```

Expected: a number ≥ 1 (the inline script is in the served HTML). Kill the dev server afterward.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add no-flash theme init script

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: ThemeToggle component (TDD) + header integration

**Files:**
- Create: `src/components/site/theme-toggle.tsx`
- Create: `src/components/site/theme-toggle.module.css`
- Test: `src/components/site/theme-toggle.test.tsx`
- Modify: `src/components/site/site-header.tsx`
- Modify: `src/components/site/site-header.test.tsx`
- Modify: `src/app/globals.css` (`.site-nav` rule only)

**Interfaces:**
- Consumes: `<html data-theme>` attribute and `localStorage` key `"theme"` (both from Task 2).
- Produces: `ThemeToggle` — a client component taking no props, rendering one `<button>` whose accessible name is `"Switch to dark theme"` when the current theme is light, `"Switch to light theme"` when dark. Exported as a named export `ThemeToggle` from `@/components/site/theme-toggle`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/site/theme-toggle.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeToggle } from "@/components/site/theme-toggle";

describe("ThemeToggle", () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
    window.localStorage.clear();
  });

  it("renders a button that offers to switch to dark in light mode", () => {
    render(<ThemeToggle />);

    expect(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    ).toBeInTheDocument();
  });

  it("flips the document theme and persists the choice on click", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    );
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("theme")).toBe("dark");

    await user.click(
      screen.getByRole("button", { name: "Switch to light theme" }),
    );
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("theme")).toBe("light");
  });
});
```

Also add this assertion inside the existing `it(...)` of `src/components/site/site-header.test.tsx`, after the last `expect(...)`:

```tsx
    expect(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    ).toBeInTheDocument();
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/site`
Expected: FAIL — `theme-toggle.tsx` does not exist (unresolved import), and SiteHeader has no theme button.

- [ ] **Step 3: Implement the component**

Create `src/components/site/theme-toggle.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import styles from "./theme-toggle.module.css";

type Theme = "light" | "dark";

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  // Initial render assumes light so server and first client render match
  // (avoids hydration mismatch); the effect below syncs the real value.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("theme", next);
    } catch {
      // Storage unavailable (e.g. private mode); in-memory toggle still works.
    }
  }

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button type="button" className={styles.toggle} onClick={toggle} aria-label={label} title={label}>
      {theme === "dark" ? (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
```

Create `src/components/site/theme-toggle.module.css`:

```css
.toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-soft);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}

.toggle:hover {
  color: var(--ink);
  border-color: var(--ink-soft);
}
```

- [ ] **Step 4: Wire the toggle into the header and align the nav**

In `src/components/site/site-header.tsx`, add the import and render the toggle inside `<nav>` after `<ContinueReadingLink ... />`:

```tsx
import Link from "next/link";
import { ContinueReadingLink } from "@/components/reading-progress/continue-reading-link";
import { ThemeToggle } from "@/components/site/theme-toggle";

const navItems = [
  { href: "/", label: "Library" },
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
        <ContinueReadingLink
          fallbackHref="/read/half-demon-si-teng/chapter-1"
          fallbackLabel="Continue Reading"
        />
        <ThemeToggle />
      </nav>
    </header>
  );
}
```

In `src/app/globals.css`, change the `.site-nav` rule to add vertical centering (the toggle is a fixed-height button among text links):

```css
.site-nav {
  display: flex;
  align-items: center;
  gap: 20px;
  color: var(--ink-soft);
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/components/site`
Expected: PASS — both new theme-toggle tests and the updated site-header test.

- [ ] **Step 6: Run lint and build**

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: builds successfully.

- [ ] **Step 7: Commit**

```bash
git add src/components/site/theme-toggle.tsx src/components/site/theme-toggle.module.css src/components/site/theme-toggle.test.tsx src/components/site/site-header.tsx src/components/site/site-header.test.tsx src/app/globals.css
git commit -m "feat: add light/dark theme toggle in site header

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: Home ranking list token migration

DOM is untouched, so the existing `home-page.test.tsx` is the regression guard. No new unit test (CSS-only change).

**Files:**
- Modify: `src/components/home/home-page.module.css` (full rewrite of color values; layout rules byte-identical)

**Interfaces:**
- Consumes: tokens from Task 1 (`--ink`, `--ink-soft`, `--gold`, `--line`, `--card`, `--card-glass` not used here).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Replace color declarations in home-page.module.css**

Apply these edits (all layout properties stay exactly as they are):

1. `.page`:
   - `border-top: 1px solid #dedede;` → `border-top: 1px solid var(--line);`
   - `border-bottom: 1px solid #dedede;` → `border-bottom: 1px solid var(--line);`
   - `background: #fff;` → `background: var(--card);`
   - `color: #1b2733;` → `color: var(--ink);`
2. `.header`: `border-bottom: 1px solid #e4e4e4;` → `border-bottom: 1px solid var(--line);`
3. `.kicker`: `color: #7f8c9a;` → `color: var(--ink-soft);`
4. `.summary`: `color: #6b7785;` → `color: var(--ink-soft);`
5. `.stats`: `color: #8a96a5;` → `color: var(--ink-soft);`
6. `.stats span:not(:last-child)::after`: `color: #d0d5da;` → `color: var(--line);`
7. `.rankingItem`: `border-bottom: 1px solid #e5e5e5;` → `border-bottom: 1px solid var(--line);`
8. `.rankingItem:nth-child(odd)`: `border-right: 1px solid #e5e5e5;` → `border-right: 1px solid var(--line);`
9. `.cover`: `border: 1px solid #d8d8d8;` → `border: 1px solid var(--line);` and `color: rgba(27, 39, 51, 0.72);` → `color: var(--ink-soft);` and the background gradient's second layer `linear-gradient(180deg, #f3f6f9, #cfd8e1)` → `linear-gradient(180deg, #f4efe5, #e7decb)` (the white sheen layer stays).
10. Insert a dark cover override **between** the `.cover` rule and the `.cover[data-theme="bronze"]` rule (order matters — equal-specificity ties resolve by source order, so bronze must come later to keep winning on bronze covers):

```css
[data-theme="dark"] .cover {
  background:
    linear-gradient(135deg, rgba(236, 229, 216, 0.06), transparent 46%),
    linear-gradient(180deg, #2a2519, #1d1912);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
}
```

11. `.rank`: `color: #172334;` → `color: var(--ink);`
12. `.title`: `color: #172334;` → `color: var(--ink);`
13. `.title:hover`: `color: #0067c5;` → `color: var(--gold);`
14. `.author`: `color: #7f8c9a;` → `color: var(--ink-soft);`
15. `.metaLine`: `color: #9aa5b1;` → `color: var(--ink-soft);`
16. `.tags`: `color: #f0a000;` → `color: var(--gold);`
17. `.readLink`: `color: #0086ff;` → `color: var(--gold);`
18. `.mode`: `border-top: 1px solid #e5e5e5;` → `border-top: 1px solid var(--line);` and `color: #6b7785;` → `color: var(--ink-soft);`
19. `.mode h2`: `color: #172334;` → `color: var(--ink);`
20. Inside `@media (max-width: 760px)`, `.rankingItem:nth-last-child(-n + 2)`: `border-bottom: 1px solid #e5e5e5;` → `border-bottom: 1px solid var(--line);`
21. `.cover[data-theme="bronze"]` stays exactly as is (bronze reads well on both themes).

- [ ] **Step 2: Run the test suite**

Run: `npm run test:run`
Expected: PASS (home page test asserts DOM, which is unchanged).

- [ ] **Step 3: Run the build**

Run: `npm run build`
Expected: builds successfully.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/home-page.module.css
git commit -m "refactor: migrate home ranking colors to theme tokens

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: Reader, book detail, and progress panel token migration

CSS-only plus one inline-style change. The existing suite is the regression guard.

**Files:**
- Modify: `src/components/reader/reader-page.module.css:16,58`
- Modify: `src/components/books/book-detail-page.module.css:12,44`
- Modify: `src/components/reading-progress/book-card-with-progress.module.css`
- Modify: `src/components/reading-progress/book-detail-progress.tsx:59`

**Interfaces:**
- Consumes: `--card-glass`, `--line` from Task 1.
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: reader-page.module.css — glass backgrounds to token**

- `.sidebar`: `background: rgba(255, 255, 255, 0.52);` → `background: var(--card-glass);`
- `.segment`: `background: rgba(255, 255, 255, 0.38);` → `background: var(--card-glass);`

- [ ] **Step 2: book-detail-page.module.css — glass backgrounds to token**

- `.hero`: `background: rgba(255, 255, 255, 0.46);` → `background: var(--card-glass);`
- `.panel`: `background: rgba(255, 255, 255, 0.42);` → `background: var(--card-glass);`

- [ ] **Step 3: book-card-with-progress.module.css — card, progress track, tags, dark variants**

- `.card`: `background: rgba(255, 255, 255, 0.42);` → `background: var(--card-glass);`
- `.progressBar`: `background: rgba(31, 28, 23, 0.1);` → `background: var(--line);`
- Append these dark overrides at the end of the file (after `.secondaryAction:hover`):

```css
[data-theme="dark"] .card[data-theme="mist"] {
  background: linear-gradient(180deg, rgba(236, 229, 216, 0.06), rgba(41, 36, 26, 0.92));
}

[data-theme="dark"] .card[data-theme="bronze"] {
  background: linear-gradient(180deg, rgba(212, 169, 78, 0.12), rgba(32, 26, 16, 0.92));
}

[data-theme="dark"] .tags span {
  background: rgba(157, 178, 132, 0.16);
}
```

(The light `.card[data-theme="mist"]` and `.card[data-theme="bronze"]` rules stay exactly as they are.)

- [ ] **Step 4: book-detail-progress.tsx — inline track color to token**

Line 59: `background: "rgba(31,28,23,0.1)",` → `background: "var(--line)",`

- [ ] **Step 5: Run the test suite**

Run: `npm run test:run`
Expected: PASS.

- [ ] **Step 6: Run the build**

Run: `npm run build`
Expected: builds successfully.

- [ ] **Step 7: Commit**

```bash
git add src/components/reader/reader-page.module.css src/components/books/book-detail-page.module.css src/components/reading-progress/book-card-with-progress.module.css src/components/reading-progress/book-detail-progress.tsx
git commit -m "refactor: migrate reader and detail panels to theme tokens

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 6: Delete dead page.module.css + full verification

**Files:**
- Delete: `src/app/page.module.css`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing (file has no importers — verified by grep before planning).

- [ ] **Step 1: Delete the dead file**

```bash
git rm src/app/page.module.css
```

- [ ] **Step 2: Run the full verification suite**

Run: `npm run test:run`
Expected: PASS — proves nothing imported the deleted file.

Run: `npm run lint`
Expected: no errors.

Run: `npm run build`
Expected: builds successfully.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove unused starter page styles

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

(`git rm` already staged the deletion; the commit needs no `git add`.)

---

### Task 7: Manual visual verification (both themes)

No code changes expected. If anything needs fixing, fix it, re-run the Task 6 suite, and commit the fix with a `fix:` prefix.

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (background or separate terminal).

- [ ] **Step 2: Verify every route in both themes**

For each of `/`, `/books/half-demon-si-teng`, `/read/half-demon-si-teng/chapter-1`:

1. Toggle to dark via the header button — background becomes warm dark (`#191610` tones), text becomes warm white, no unreadable low-contrast text, bronze/mist cover cards still look intentional.
2. Toggle back to light — matches the pre-change light design (warm paper), except the accepted home-page warm shift.
3. On the reader route, expand a Chinese/grammar disclosure in dark mode — secondary text (`--ink-soft`) must be readable.

- [ ] **Step 3: Verify persistence and no-flash**

1. In dark mode, hard-reload the page (Ctrl+Shift+R). Expect: still dark on first paint — no white flash.
2. DevTools → Application → Local Storage → confirm `"theme": "dark"`.
3. Clear the `theme` key, set DevTools → Rendering → Emulate CSS media feature `prefers-color-scheme: dark`, reload. Expect: dark theme (system fallback path works).
4. Repeat 3 with `prefers-color-scheme: light`. Expect: light theme.

- [ ] **Step 4: Stop the dev server and report**

Kill the dev server. Report results per the AGENTS.md output contract: summary, files, verification commands run, anything not verified.
