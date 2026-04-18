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
          <article
            key={book.slug}
            className={styles.card}
            data-theme={book.coverTheme}
          >
            <p className={styles.meta}>{book.readingModeLabel}</p>
            <h2>{book.title}</h2>
            <p className={styles.subtitle}>{book.subtitle}</p>
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
