import type { ChapterPreview } from "@/lib/content/types";

export type BookProgress = {
  lastChapterSlug: string;
  lastSegmentIndex: number;
  updatedAt: number;
};

export type ReadingProgressData = Record<string, BookProgress>;

const STORAGE_KEY = "novel-reading-progress";

const isBrowser = () => typeof window !== "undefined";

export function getStoredProgress(): ReadingProgressData {
  if (!isBrowser()) return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ReadingProgressData;
  } catch {
    return {};
  }
}

export function saveBookProgress(
  bookSlug: string,
  chapterSlug: string,
  segmentIndex: number,
): void {
  if (!isBrowser()) return;

  const progress = getStoredProgress();
  progress[bookSlug] = {
    lastChapterSlug: chapterSlug,
    lastSegmentIndex: segmentIndex,
    updatedAt: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    notifyListeners();
  } catch {
    // localStorage may be full or unavailable
  }
}

export function getBookProgress(bookSlug: string): BookProgress | null {
  const progress = getStoredProgress();
  return progress[bookSlug] ?? null;
}

export function calculateBookPercentage(
  chapters: ChapterPreview[],
  progress: BookProgress,
): number {
  const totalSegments = chapters.reduce((sum, ch) => sum + ch.segmentCount, 0);
  if (totalSegments === 0) return 0;

  let completedSegments = 0;
  for (const ch of chapters) {
    if (ch.slug === progress.lastChapterSlug) {
      completedSegments += Math.min(progress.lastSegmentIndex, ch.segmentCount);
      break;
    }
    completedSegments += ch.segmentCount;
  }

  return Math.round((completedSegments / totalSegments) * 100);
}

/**
 * React 19 hook-friendly subscribe helper for useSyncExternalStore.
 * Subscribes to the STORAGE_KEY event (fired by other tabs) and a custom
 * "novel-reading-progress-changed" event (fired by saveBookProgress in the
 * same tab so that useSyncExternalStore-based hooks re-render).
 */
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

if (isBrowser()) {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) notifyListeners();
  });
}

export function subscribeToProgressChanges(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getMostRecentBook(): {
  bookSlug: string;
  progress: BookProgress;
} | null {
  const progress = getStoredProgress();
  const entries = Object.entries(progress);
  if (entries.length === 0) return null;

  let mostRecent: { bookSlug: string; progress: BookProgress } | null = null;
  for (const [bookSlug, bp] of entries) {
    if (!mostRecent || bp.updatedAt > mostRecent.progress.updatedAt) {
      mostRecent = { bookSlug, progress: bp };
    }
  }
  return mostRecent;
}
