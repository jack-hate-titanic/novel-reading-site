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
      <header className={styles.chapterHeader}>
        <p className={styles.chapterMeta}>
          {displaySegments.length} segments
        </p>
        <h1 className={styles.chapterTitle}>{chapter.title}</h1>
      </header>

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
