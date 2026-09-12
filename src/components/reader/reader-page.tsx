import Link from "next/link";
import { PaginatedReader } from "@/components/reader/paginated-reader";
import { getEnglishSegments } from "@/lib/content/english-text";
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
  const displaySegments = getEnglishSegments(chapter.segments);

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
