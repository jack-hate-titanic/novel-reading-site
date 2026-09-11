# Dark Theme Design

Date: 2026-09-10
Status: Implemented (default changed to dark on 2026-09-11)

## Goal

Add a warm-toned dark theme to the novel reading site with a manual Light/Dark
toggle in the site header. The choice persists in `localStorage`; first visit
defaults to dark (changed 2026-09-11 from following the system
`prefers-color-scheme` preference).

## Non-Goals

- No tri-state (Light/Dark/System) toggle — two states only.
- No system-preference detection at all (removed 2026-09-11): dark is the
  fixed default, and only an explicit toggle choice is stored.
- No cross-tab synchronization.
- No new dependencies (no `next-themes`).

## Approach

CSS custom properties on `:root` (light) with a `[data-theme="dark"]` override
block. A synchronous inline script in the document head sets
`document.documentElement.dataset.theme` before first paint to prevent a
light-theme flash on dark-mode visits.

## Token Architecture

`src/app/globals.css` keeps the existing light values in `:root` and adds
three new tokens to absorb currently hardcoded colors:

| Token          | Light value               | Dark value                 | Used by                        |
| -------------- | ------------------------- | -------------------------- | ------------------------------ |
| `--card`       | `#fbf8f1` (warm white)    | `#221e16`                  | Solid cards (home ranking)     |
| `--card-glass` | `rgba(255,255,255,0.42)`  | `rgba(236,229,216,0.05)`   | Glass panels (reader, detail)  |

Links (Read link, title hover) use the existing `--gold` token in both themes
(`#8b6b2f` light / `#d4a94e` dark) rather than a separate `--link` token — the
values would be identical, so one token suffices.

Note: several components use translucent glass backgrounds with alpha values
between 0.38 and 0.52; they all normalize to `--card-glass`'s reference value
(0.42 light).

## Dark Palette (warm dark)

```css
[data-theme="dark"] {
  --paper: #191610;
  --paper-strong: #262117;
  --ink: #ece5d8;
  --ink-soft: #a89e8d;
  --olive: #9db284;
  --gold: #d4a94e;
  --line: rgba(236, 229, 216, 0.16);
  --shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  color-scheme: dark;
}
```

`:root` also gets `color-scheme: light`. The hardcoded `html` background
gradient becomes token-driven: light `#efe7d8 → #f8f3ea` (unchanged), dark
`#14110c → #1c1812`.

## Theme State Mechanism

### No-flash inline script

Injected into `<head>` in `src/app/layout.tsx` (runs synchronously before
paint):

1. Read `localStorage.getItem("theme")`.
2. If `"light"` or `"dark"`, use it; otherwise default to `"dark"`.
3. Set `document.documentElement.dataset.theme`.

The `<html>` tag is server-rendered with `data-theme="dark"` (the site
default) and carries `suppressHydrationWarning` because the script may mutate
it before hydration.

### Toggle button

New client component `src/components/site/theme-toggle.tsx`:

- Icon button (sun/moon SVG) with `aria-label` "Switch to dark theme" /
  "Switch to light theme" matching the action it will perform.
- Click flips `<html>`'s `data-theme` and writes `localStorage`.
- Initial render is theme-independent (reads actual theme after mount) to
  avoid hydration mismatches.
- Rendered at the end of the nav row in `src/components/site/site-header.tsx`,
  visible on every route (the reader is also inside `SiteShell`).

## Component Changes

1. `src/components/home/home-page.module.css` — migrate all hardcoded colors
   to tokens: cool blue-gray text (`#1b2733`, `#172334`) → `--ink`; secondary
   grays → `--ink-soft`; blue links (`#0067c5`, `#0086ff`) → `--gold`; orange
   tags (`#f0a000`) → `--gold`; white card background → `--card`; borders →
   `--line`. In light mode the page shifts slightly from cool white to warm
   paper — an accepted consequence of unifying tokens.
2. `src/components/reader/reader-page.module.css` — glass backgrounds →
   `--card-glass`.
3. `src/components/books/book-detail-page.module.css` — glass backgrounds →
   `--card-glass`.
4. `src/components/reading-progress/book-card-with-progress.module.css` —
   glass background → `--card-glass`; progress-bar track → `--line`; tag
   background → translucent olive over the card (works on both themes).
   Theme variants get dark overrides under `[data-theme="dark"]`:
   `mist` → `linear-gradient(180deg, rgba(236,229,216,0.06),
   rgba(41,36,26,0.92))`; `bronze` → `linear-gradient(180deg,
   rgba(212,169,78,0.12), rgba(32,26,16,0.92))`.
5. `src/components/reading-progress/book-detail-progress.tsx` — inline
   `rgba(31,28,23,0.1)` → `var(--line)`.
6. Default cover placeholder: gradient → `--paper`/`--paper-strong` tones
   (light `#f4efe5 → #e7decb`, dark `#2a2519 → #1d1912`); cover letter color →
   `--ink-soft`; border → `--line`. The `bronze` cover works on both themes
   and stays.
7. Delete dead `src/app/page.module.css` (no references).

## Error Handling

- `localStorage` unavailable (private mode): both the inline script and the
  toggle wrap storage access in try/catch and degrade to in-memory toggling.
  No crashes.

## Testing

- New `src/components/site/theme-toggle.test.tsx`: renders; click flips
  `data-theme` on `<html>`; persists to `localStorage`.
- Existing `site-header.test.tsx` only asserts links; unaffected.
- Token refactor does not change DOM structure, so existing component tests
  should pass unchanged.
- Manual verification via `npm run dev`: both themes on `/`,
  `/books/half-demon-si-teng`, and a reader route; theme survives refresh;
  first visit defaults to dark; no flash on load.
- The no-flash script is not unit-testable; verified manually.

## Verification Checklist

Run after implementation:

1. `npm run test:run`
2. `npm run lint`
3. `npm run build`
4. `npm run dev` + manual route/theme checks above
