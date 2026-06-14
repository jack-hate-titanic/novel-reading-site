"use client";

import { useEffect, useRef } from "react";
import { saveBookProgress } from "@/lib/reading-progress";

export function SaveProgressTracker({
  bookSlug,
  chapterSlug,
  totalSegments,
}: {
  bookSlug: string;
  chapterSlug: string;
  totalSegments: number;
}) {
  const lastSavedIndex = useRef(0);

  useEffect(() => {
    // Save initial position on mount
    saveBookProgress(bookSlug, chapterSlug, 0);
    lastSavedIndex.current = 0;

    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;

        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const maxScroll = Math.max(docHeight - winHeight, 1);
        const ratio = Math.min(scrollTop / maxScroll, 1);
        const estimatedIndex = Math.min(
          Math.floor(ratio * totalSegments),
          totalSegments - 1,
        );

        if (estimatedIndex !== lastSavedIndex.current) {
          lastSavedIndex.current = estimatedIndex;
          saveBookProgress(bookSlug, chapterSlug, estimatedIndex);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const handleBeforeUnload = () => {
      saveBookProgress(bookSlug, chapterSlug, lastSavedIndex.current);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Save on unmount
      saveBookProgress(bookSlug, chapterSlug, lastSavedIndex.current);
    };
  }, [bookSlug, chapterSlug, totalSegments]);

  return null;
}
