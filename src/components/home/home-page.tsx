import Link from "next/link";
import type { Book } from "@/lib/content/types";
import { BookCardWithProgress } from "@/components/reading-progress/book-card-with-progress";
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
          <BookCardWithProgress key={book.slug} book={book} />
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
