import Link from "next/link";
import { ReaderSegment } from "@/components/reader/reader-segment";
import { SaveProgressTracker } from "@/components/reading-progress/save-progress-tracker";
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
      <SaveProgressTracker
        bookSlug={book.slug}
        chapterSlug={chapter.slug}
        totalSegments={chapter.segments.length}
      />
      <aside className={styles.sidebar}>
        <p className={styles.sidebarLabel}>{book.readingModeLabel}</p>
        <h1>{chapter.title}</h1>
        <p>{chapter.summary}</p>
        <p className={styles.progress}>
          Chapter {chapter.order} · {chapter.segments.length} segments
        </p>
        <p className={styles.savedIndicator}>Progress auto-saved</p>
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
