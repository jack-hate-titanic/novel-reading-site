<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md

This file defines how Codex should collaborate in `C:\Users\wson\Desktop\novel-reading-site`.

## 1. Project Profile

- Project type: standalone Next.js 16 App Router site
- Product direction: English-first novel reading website for desktop and mobile
- Main UI roots:
  - `src/app/`
  - `src/components/`
- Content roots:
  - `content/raw/`
  - `src/lib/content/`
- Planning docs:
  - `docs/superpowers/specs/`
  - `docs/superpowers/plans/`
- Package manager: npm
- Key scripts:
  - `npm run dev`
  - `npm run test:run`
  - `npm run lint`
  - `npm run build`

## 2. Default Collaboration Language

- Prefer Simplified Chinese for explanations, summaries, and requirement checks.
- Keep code, route names, and command names in English.
- Keep UI copy in English unless the user explicitly requests Chinese UI text.
- If the user explicitly asks for English-only collaboration, use English until they switch back.

## 3. Execution Defaults

- Default to direct execution instead of only suggesting.
- For code changes, prefer small safe patches, then verify immediately.
- Preserve the current product direction unless the user asks to change it:
  - editorial reading feel
  - English-first reader
  - strong desktop and mobile support
- Do not replace the current App Router structure with Pages Router.
- Do not introduce Tailwind or a different styling system unless the user asks.

## 4. Content Rules

- `content/raw/` stores the canonical imported bilingual source files.
- `src/lib/content/` is the adaptation layer from raw Markdown to structured reading data.
- When changing the parser, assume the source material may contain:
  - Chinese/English line pairs
  - occasional mixed ordering
  - grammar-note blocks
  - phrase lists
- Do not silently rewrite raw source content unless the user explicitly asks to clean or normalize it.
- Prefer fixing parsing and rendering logic over editing source text.

## 5. Product and UI Rules

- Required primary routes:
  - `/`
  - `/books/[slug]`
  - `/read/[bookSlug]/[chapterSlug]`
- The reader should keep English visually dominant.
- Chinese support, grammar notes, and phrase help should remain secondary and collapsible by default.
- Desktop and mobile layouts are both first-class; do not treat mobile as an afterthought.
- Preserve the current visual language:
  - warm paper palette
  - editorial typography
  - immersive reading layout

## 6. Documentation and Planning

- Keep design and implementation documents inside this repository from now on.
- New planning docs should go under:
  - `docs/superpowers/specs/`
  - `docs/superpowers/plans/`
- If a major feature changes product behavior, update the relevant spec or plan alongside code when appropriate.

## 7. Verification Checklist

After meaningful changes, run as applicable:

1. `npm run test:run`
2. `npm run lint`
3. `npm run build`
4. If a visual or interaction change matters, run `npm run dev` and verify the affected routes

If a change touches content parsing, include parser or content-library verification in the run.

## 8. Output Contract

In final responses, include:

1. A short summary of what changed
2. Exact file paths touched
3. Verification status with commands actually run
4. If something was not verified, say so directly

## 9. Safety and Boundaries

- Never revert unrelated user changes.
- No destructive git or filesystem operations unless the user explicitly asks.
- No dependency additions or removals unless they materially help the requested work.
- If external content, credentials, deployment config, or publishing steps are needed, ask concisely instead of guessing.
