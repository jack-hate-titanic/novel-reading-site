import type { ChapterPreview } from "@/lib/content/types";

export type BookProgress = {
  lastChapterSlug: string;
  lastSegmentIndex: number;
  updatedAt: number;
};

export type ReadingProgressData = Record<string, BookProgress>;

const STORAGE_KEY = "novel-reading-progress";

const isBrowser = () => typeof window !== "undefined";

let cachedRawProgress: string | null | undefined;
let cachedProgress: ReadingProgressData = {};
let cachedRecentSource: ReadingProgressData | null = null;
let cachedRecentResult: {
  bookSlug: string;
  progress: BookProgress;
} | null = null;

function setCachedProgress(raw: string | null | undefined, progress: ReadingProgressData) {
  cachedRawProgress = raw;
  cachedProgress = progress;
  cachedRecentSource = null;
  cachedRecentResult = null;
  return cachedProgress;
}

export function getStoredProgress(): ReadingProgressData {
  if (!isBrowser()) return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRawProgress) return cachedProgress;
    if (!raw) return setCachedProgress(null, {});
    return setCachedProgress(raw, JSON.parse(raw) as ReadingProgressData);
  } catch {
    return setCachedProgress(undefined, {});
  }
}

export function saveBookProgress(
  bookSlug: string,
  chapterSlug: string,
  segmentIndex: number,
): void {
  if (!isBrowser()) return;

  const progress = {
    ...getStoredProgress(),
    [bookSlug]: {
      lastChapterSlug: chapterSlug,
      lastSegmentIndex: segmentIndex,
      updatedAt: Date.now(),
    },
  };

  try {
    const raw = JSON.stringify(progress);
    localStorage.setItem(STORAGE_KEY, raw);
    setCachedProgress(raw, progress);
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
    if (e.key === STORAGE_KEY) {
      cachedRawProgress = undefined;
      cachedProgress = {};
      cachedRecentSource = null;
      cachedRecentResult = null;
      notifyListeners();
    }
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
  if (progress === cachedRecentSource) return cachedRecentResult;

  const entries = Object.entries(progress);
  if (entries.length === 0) {
    cachedRecentSource = progress;
    cachedRecentResult = null;
    return cachedRecentResult;
  }

  let mostRecent: { bookSlug: string; progress: BookProgress } | null = null;
  for (const [bookSlug, bp] of entries) {
    if (!mostRecent || bp.updatedAt > mostRecent.progress.updatedAt) {
      mostRecent = { bookSlug, progress: bp };
    }
  }

  cachedRecentSource = progress;
  cachedRecentResult = mostRecent;
  return cachedRecentResult;
}
