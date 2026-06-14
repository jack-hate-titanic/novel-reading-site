"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import type { Book } from "@/lib/content/types";
import {
  getBookProgress,
  calculateBookPercentage,
  subscribeToProgressChanges,
} from "@/lib/reading-progress";

function useBookProgress(bookSlug: string) {
  return useSyncExternalStore(
    subscribeToProgressChanges,
    () => getBookProgress(bookSlug),
    () => null,
  );
}

export function BookDetailProgress({ book }: { book: Book }) {
  const progress = useBookProgress(book.slug);
  const firstChapter = book.chapters[0];

  if (!progress) {
    return (
      <Link
        href={`/read/${book.slug}/${firstChapter.slug}`}
        style={{
          display: "inline-flex",
          marginTop: 12,
          padding: "12px 20px",
          borderRadius: 999,
          background: "var(--olive)",
          color: "var(--paper)",
        }}
      >
        Begin reading
      </Link>
    );
  }

  const percentage = calculateBookPercentage(book.chapters, progress);

  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 4,
            borderRadius: 4,
            background: "rgba(31,28,23,0.1)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: "100%",
              borderRadius: 4,
              background: "var(--olive)",
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <span
          style={{
            color: "var(--olive)",
            fontSize: "0.85rem",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {percentage}%
        </span>
      </div>
      <Link
        href={`/read/${book.slug}/${progress.lastChapterSlug}`}
        style={{
          display: "inline-flex",
          padding: "12px 20px",
          borderRadius: 999,
          background: "var(--olive)",
          color: "var(--paper)",
        }}
      >
        Continue Reading
      </Link>
    </div>
  );
}
