import Link from "next/link";
import type { Book } from "@/lib/content/types";
import styles from "./home-page.module.css";

const recommendationScores = ["94.9", "77.0", "90.2", "92.8", "92.2", "81.3"];

function getCoverLabel(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function RankingBookItem({ book, rank }: { book: Book; rank: number }) {
  const firstChapter = book.chapters[0];
  const recommendation = recommendationScores[(rank - 1) % recommendationScores.length];
  const tagLine = book.tags.slice(0, 2).join(" / ");

  return (
    <li className={styles.rankingItem}>
      <span
        className={styles.cover}
        data-theme={book.coverTheme}
        aria-hidden="true"
      >
        {getCoverLabel(book.title)}
      </span>
      <span className={styles.rank}>{rank}</span>
      <div className={styles.bookInfo}>
        <Link href={`/books/${book.slug}`} className={styles.title}>
          {book.title}
        </Link>
        <p className={styles.author}>{book.author}</p>
        <p className={styles.metaLine}>
          <span>Recommendation {recommendation}%</span>
          {tagLine && <span className={styles.tags}>{tagLine}</span>}
          {firstChapter && (
            <Link
              href={`/read/${book.slug}/${firstChapter.slug}`}
              className={styles.readLink}
            >
              Read
            </Link>
          )}
        </p>
      </div>
    </li>
  );
}

export function HomePage({ books }: { books: Book[] }) {
  const totalChapters = books.reduce((sum, book) => sum + book.chapters.length, 0);

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <p className={styles.kicker}>Featured bilingual novels</p>
        <h1>Reader Rankings</h1>
        <p className={styles.summary}>
          English-first selections arranged like a compact reading chart, with
          quick access to every book and chapter.
        </p>
        <div className={styles.stats} aria-label="Library summary">
          <span>{books.length} books</span>
          <span>{totalChapters} chapters</span>
          <span>English-first</span>
        </div>
      </section>

      <ol className={styles.rankingList}>
        {books.map((book, index) => (
          <RankingBookItem key={book.slug} book={book} rank={index + 1} />
        ))}
      </ol>

      <section id="reading-mode" className={styles.mode}>
        <h2>Reading mode</h2>
        <p>
          English stays visible first. Chinese lines, grammar notes, and phrase
          support stay secondary until you need them.
        </p>
      </section>
    </div>
  );
}
