"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import type { Book } from "@/lib/content/types";
import {
  getBookProgress,
  calculateBookPercentage,
  subscribeToProgressChanges,
} from "@/lib/reading-progress";
import styles from "./book-card-with-progress.module.css";

function useBookProgress(bookSlug: string) {
  return useSyncExternalStore(
    subscribeToProgressChanges,
    () => getBookProgress(bookSlug),
    () => null,
  );
}

export function BookCardWithProgress({ book }: { book: Book }) {
  const progress = useBookProgress(book.slug);
  const percentage = progress
    ? calculateBookPercentage(book.chapters, progress)
    : 0;
  const firstChapter = book.chapters[0];
  const continueHref = progress
    ? `/read/${book.slug}/${progress.lastChapterSlug}`
    : `/read/${book.slug}/${firstChapter.slug}`;
  const continueLabel = progress ? "Continue Reading" : "Begin reading";

  return (
    <article
      className={styles.card}
      data-theme={book.coverTheme}
    >
      <p className={styles.meta}>{book.readingModeLabel}</p>
      <h2 className={styles.title}>{book.title}</h2>
      <p className={styles.author}>{book.author}</p>
      <div className={styles.tags}>
        {book.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      {progress && (
        <div className={styles.progressArea}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className={styles.progressLabel}>{percentage}%</span>
        </div>
      )}

      <div className={styles.actions}>
        <Link href={continueHref} className={styles.primaryAction}>
          {continueLabel}
        </Link>
        <Link href={`/books/${book.slug}`} className={styles.secondaryAction}>
          Details
        </Link>
      </div>
    </article>
  );
}
