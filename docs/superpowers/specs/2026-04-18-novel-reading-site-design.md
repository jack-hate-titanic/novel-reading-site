# Novel Reading Site Design

## Summary

This spec defines a new standalone repository for an English-first novel reading website built with Next.js. The first release is a high-fidelity frontend prototype rather than a production CMS. It should feel like a premium reading product on both desktop browsers and mobile phones.

The initial library contains two books sourced from local Markdown files on the desktop:

- `Half-Demon Si Teng`
- `Spring and Autumn`

The product focus is not generic book browsing. It is an immersive English reading experience with study support, where English text is shown first and Chinese explanations remain available on demand.

## Goals

- Create a new independent repository instead of modifying the existing VuePress blog.
- Build a polished, responsive Next.js prototype with three core screens:
  - `Home`
  - `Book Detail`
  - `Reader`
- Make the reading page `English first` by default.
- Use the existing bilingual desktop content as the initial content source.
- Preserve a content structure that can later evolve from static files to structured data without rewriting the UI from scratch.

## Non-Goals

- No backend, auth, comments, payment, or user accounts in the first release.
- No online content editing workflow.
- No Figma dependency for the first release.
- No attempt to ingest the full source library at once beyond the currently available bilingual material.

## Product Direction

The site is positioned as an editorial-style reading experience for learners who want to read translated literary content in English without losing access to the original Chinese context.

The user experience priorities are:

1. `Read first`: the English sentence should dominate the page visually.
2. `Understand second`: Chinese text, grammar notes, and phrases should be one action away, not always expanded.
3. `Stay immersed`: the interface should avoid looking like a dashboard or language-learning worksheet.

## Approach Options Considered

### Option A: Static prototype with local content files

Use Next.js with repository-local content files and static routes. Import desktop Markdown into the new repo during setup, then render pages from local data.

Pros:

- Fastest path to a refined prototype
- Stable, deterministic builds
- Excellent fit for a content-first reading experience

Cons:

- No editing workflow inside the product

### Option B: Structured data first

Parse all source Markdown into normalized JSON before building pages.

Pros:

- Better long-term content consistency
- Easier to expand later

Cons:

- Slower initial delivery
- Adds parsing work before UI value is visible

### Option C: CMS-ready architecture from day one

Design the product as if a future CMS and backend already exist.

Pros:

- Future-facing architecture

Cons:

- Over-engineered for the current goal
- Would slow down the first meaningful prototype

## Chosen Approach

Choose `Option A`, but shape the content model so it can later migrate toward `Option B`.

This means the first release will:

- live in a new standalone Next.js repository
- store curated content inside the repo
- use a normalized internal data shape for books, chapters, and reading segments
- avoid backend complexity while still keeping future migration possible

## Information Architecture

### Primary routes

- `/`
  - Editorial landing page with featured books and recent reading entry points
- `/books/[slug]`
  - Book overview page with summary, tone, difficulty, highlights, and chapter list
- `/read/[bookSlug]/[chapterSlug]`
  - Chapter reading page with English-first segments and expandable learning aids

### Core navigation

- Brand mark or wordmark
- `Library`
- `Continue Reading`
- `About Reading Mode`

### Mobile navigation

Mobile keeps the same information architecture but reduces visible chrome:

- compact top bar
- sticky reading controls where needed
- chapter actions near thumb reach

## Visual System

The visual direction should feel like a literary magazine rather than a generic SaaS product.

### Tone

- thoughtful
- atmospheric
- restrained
- premium

### Color direction

- warm paper background
- deep ink text
- muted olive or forest accents
- aged gold for emphasis

Avoid bright tech-product colors and avoid a default purple aesthetic.

### Typography

Typography should create a strong editorial hierarchy:

- expressive serif or literary display face for major titles
- highly readable serif or humanist face for long-form English body text
- clean sans-serif for metadata, controls, and labels

### Layout behavior

- desktop: generous margins, strong content column, visible side metadata
- mobile: tighter top framing, comfortable line height, controls close to the reading flow

## Page Design

### Home

Purpose:

- introduce the product mood
- foreground the two featured books
- create immediate reading momentum

Sections:

- hero with brand statement and featured reading CTA
- featured books grid with contrasting visual identity for `Si Teng` and `Spring and Autumn`
- section for recent or highlighted chapters
- short explanation of `English-first reading`

### Book Detail

Purpose:

- help the user decide whether to start or continue a book

Sections:

- book hero with title, subtitle, tone, and estimated reading style
- synopsis and reading angle
- learning highlights such as grammar density or narrative style
- chapter list
- continue/start reading CTA

### Reader

Purpose:

- maximize immersion while preserving study support

Behavior:

- English text shown by default
- Chinese text hidden behind an expand interaction per segment
- grammar notes hidden by default
- phrases hidden by default
- clear previous/next chapter navigation
- reading progress visible but not distracting

Desktop layout:

- main reading column centered
- optional metadata rail for chapter info and quick toggles

Mobile layout:

- single-column immersive reading
- sticky lightweight chapter controls
- expandable cards for Chinese and notes beneath each segment

## Content Model

The source content currently exists in desktop Markdown files. The new repository should not depend on desktop paths at runtime. During setup, the selected files will be copied and normalized into the repo.

### Book model

- `slug`
- `title`
- `subtitle`
- `author`
- `description`
- `coverTheme`
- `tags`
- `readingModeLabel`

### Chapter model

- `slug`
- `bookSlug`
- `title`
- `order`
- `summary`

### Segment model

- `id`
- `english`
- `chinese`
- `grammarNotes`
- `phrases`

This model preserves the current bilingual source pattern while making the reader UI predictable.

## Initial Content Scope

### `Half-Demon Si Teng`

- start with the available Chapter 1 bilingual content

### `Spring and Autumn`

- start with the currently available first chapter collection
- include the existing Chapter 11 to Chapter 20 content where it fits the structure

Because the available material is uneven across the two books, the first release should present the library honestly instead of pretending both books are complete.

## Data Flow

First release data flow:

1. source Markdown is copied into the new repository
2. content is transformed into the internal book/chapter/segment shape
3. Next.js pages render from local structured data

This keeps runtime simple and allows later replacement of the content source without redesigning the UI.

## Responsive Strategy

The prototype must work well on both desktop and mobile from day one.

### Desktop priorities

- visual atmosphere
- readable long-form line length
- strong distinction between body content and support UI

### Mobile priorities

- thumb-friendly controls
- fast scanning between segments
- collapsible study content to reduce clutter

## Error Handling and Edge Cases

- If a book has only partial chapter coverage, the UI should label available chapters clearly rather than implying missing chapters exist.
- If a segment has no grammar notes or phrases, the reader should omit those toggles gracefully.
- If a chapter import is incomplete, the page should still render available reading content without breaking layout.

## Testing Strategy

The implementation plan should include:

- route rendering checks for the three primary screens
- content rendering checks for book, chapter, and segment data
- responsive verification in desktop and mobile layouts
- smoke validation for expand/collapse reading aids

Because the first release is a prototype, testing should focus on correctness of rendering and interaction behavior rather than backend concerns.

## Repository Boundary

This work belongs in a new standalone repository, not in `C:\Users\wson\Desktop\blog`.

This current repository only stores the planning spec for collaboration history. The implementation itself should happen in a separate Next.js project repository created next.

## Acceptance Criteria

The first implementation milestone is complete when:

- a new Next.js repository exists for the project
- the site has `Home`, `Book Detail`, and `Reader` pages
- the site is clearly usable on desktop and mobile
- `Half-Demon Si Teng` and `Spring and Autumn` both appear in the library
- the reader defaults to `English first`
- Chinese support and grammar notes can be accessed per segment without overwhelming the main reading flow

## Recommendation

Proceed next by writing an implementation plan for the new repository setup, content ingestion, and the three core screens.
