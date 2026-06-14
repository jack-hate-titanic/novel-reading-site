import Link from "next/link";
import type { Book } from "@/lib/content/types";
import { BookDetailProgress } from "@/components/reading-progress/book-detail-progress";
import styles from "./book-detail-page.module.css";

export function BookDetailPage({ book }: { book: Book }) {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.mode}>{book.readingModeLabel}</p>
        <h1>{book.title}</h1>
        <p className={styles.subtitle}>{book.subtitle}</p>
        <p className={styles.description}>{book.description}</p>
        <BookDetailProgress book={book} />
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
