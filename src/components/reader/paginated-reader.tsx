"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ReaderSegment } from "@/components/reader/reader-segment";
import type { EnglishSegment } from "@/lib/content/english-text";
import {
  clampAnchor,
  packPagesByHeight,
  pageIndexOfSegment,
} from "@/lib/pagination";
import {
  FONT_SIZES,
  getReaderFontScaleIndex,
  setReaderFontScaleIndex,
  subscribeToFontPreferences,
} from "@/lib/reader-preferences";
import { getBookProgress, saveBookProgress } from "@/lib/reading-progress";
import styles from "./reader-page.module.css";

const BOTTOM_GUTTER = 32;
const BOX_INNER_GAP = 12;
const SEGMENT_GAP = 18;
const FONT_LABELS = ["S", "M", "L", "XL"] as const;

// useLayoutEffect warns when server-rendered; the reader SSRs the full
// segment list, so fall back to useEffect on the server.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function PaginatedReader({
  bookSlug,
  chapterSlug,
  segments,
  previousHref,
  nextHref,
  previousChapterDisplayCount,
}: {
  bookSlug: string;
  chapterSlug: string;
  segments: EnglishSegment[];
  previousHref: string | null;
  nextHref: string | null;
  previousChapterDisplayCount: number;
}) {
  const router = useRouter();

  const fontScaleIndex = useSyncExternalStore(
    subscribeToFontPreferences,
    getReaderFontScaleIndex,
    () => 1,
  );

  // null = measuring pass: every segment renders (SSR, no-JS, re-measure).
  const [pages, setPages] = useState<number[][] | null>(null);
  const [anchor, setAnchor] = useState(0);
  const [boxHeight, setBoxHeight] = useState<number | null>(null);

  const boxRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastBoxTop = useRef(0);
  const anchorResolved = useRef(false);

  const currentPage = pages === null ? 0 : pageIndexOfSegment(pages, anchor);
  const pageCount = pages === null ? 1 : Math.max(pages.length, 1);
  const visibleIndexes =
    pages === null
      ? segments.map((_, index) => index)
      : (pages[currentPage] ?? []);

  const runMeasure = useCallback(() => {
    const box = boxRef.current;
    if (!box) return;

    if (segments.length === 0) {
      setPages([]);
      return;
    }

    const heights = segmentRefs.current.map(
      (element) => element?.getBoundingClientRect().height ?? 0,
    );
    const barHeight = barRef.current?.getBoundingClientRect().height ?? 56;
    const boxTop = box.getBoundingClientRect().top + window.scrollY;
    lastBoxTop.current = boxTop;

    // Fit the viewport exactly — no minimum floor, so short screens get a
    // smaller box instead of a page taller than the visible area.
    const fullBoxHeight = Math.max(
      window.innerHeight - boxTop - BOTTOM_GUTTER,
      0,
    );
    const packHeight = Math.max(fullBoxHeight - barHeight - BOX_INNER_GAP, 0);

    setBoxHeight(fullBoxHeight);
    setPages(packPagesByHeight(heights, packHeight, SEGMENT_GAP));
  }, [segments.length]);

  // Resolve the starting anchor once per mount: URL ?s= first, then stored
  // progress for this chapter, then page 1. Runs before first paint.
  useIsomorphicLayoutEffect(() => {
    if (anchorResolved.current) return;
    anchorResolved.current = true;

    let initialAnchor = 0;
    const sParam = Number.parseInt(
      new URLSearchParams(window.location.search).get("s") ?? "",
      10,
    );

    if (Number.isInteger(sParam) && sParam >= 1 && sParam <= segments.length) {
      initialAnchor = sParam - 1;
    } else {
      const stored = getBookProgress(bookSlug);
      if (stored && stored.lastChapterSlug === chapterSlug) {
        initialAnchor = clampAnchor(stored.lastSegmentIndex, segments.length);
      }
    }

    setAnchor(initialAnchor);
    saveBookProgress(bookSlug, chapterSlug, initialAnchor);
  }, [bookSlug, chapterSlug, segments.length]);

  // Measure whenever a measuring pass has been requested (pages === null).
  // Runs after every commit but does nothing once pages are packed.
  useIsomorphicLayoutEffect(() => {
    if (pages !== null) return;
    if (typeof document !== "undefined" && document.fonts?.status !== "loaded") {
      // Custom fonts still loading: re-measure once they settle.
      document.fonts?.ready
        .then(() => setPages(null))
        .catch(() => undefined);
    }
    runMeasure();
  });

  // Font size changes re-render at a new scale, so re-measure (before paint).
  useIsomorphicLayoutEffect(() => {
    setPages(null);
  }, [fontScaleIndex]);

  // Viewport resizes re-measure, debounced.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => setPages(null), 150);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      if (timer !== null) clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const goToPage = useCallback(
    (pageIndex: number) => {
      if (!pages || pages.length === 0) return;

      const clamped = Math.min(Math.max(pageIndex, 0), pages.length - 1);
      const firstSegment = pages[clamped][0] ?? 0;
      setAnchor(firstSegment);

      const url = new URL(window.location.href);
      url.searchParams.set("s", String(firstSegment + 1));
      window.history.replaceState(null, "", url);

      saveBookProgress(bookSlug, chapterSlug, firstSegment);

      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
      window.scrollTo(0, lastBoxTop.current);
    },
    [pages, bookSlug, chapterSlug],
  );

  const goNext = useCallback(() => {
    if (pages && currentPage < pages.length - 1) {
      goToPage(currentPage + 1);
    } else if (nextHref) {
      router.push(nextHref);
    }
  }, [pages, currentPage, nextHref, goToPage, router]);

  const goPrevious = useCallback(() => {
    if (pages && currentPage > 0) {
      goToPage(currentPage - 1);
    } else if (previousHref) {
      router.push(
        `${previousHref}?s=${Math.max(previousChapterDisplayCount, 1)}`,
      );
    }
  }, [
    pages,
    currentPage,
    previousHref,
    previousChapterDisplayCount,
    goToPage,
    router,
  ]);

  // Arrow keys turn pages.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrevious]);

  const fontScale = FONT_SIZES[fontScaleIndex] ?? 1;

  const boxStyle = {
    "--reader-font-scale": String(fontScale),
    ...(boxHeight !== null ? { height: `${boxHeight}px` } : {}),
  } as CSSProperties;

  return (
    <section ref={boxRef} className={styles.pageBox} style={boxStyle}>
      <div ref={scrollRef} className={styles.pageScroll}>
        {visibleIndexes.map((index) => (
          <div
            key={segments[index].id}
            ref={(element) => {
              segmentRefs.current[index] = element;
            }}
            data-segment-index={index}
          >
            <ReaderSegment index={index + 1} segment={segments[index]} />
          </div>
        ))}
      </div>

      <div ref={barRef} className={styles.controlBar}>
        <div className={styles.fontControls}>
          <button
            type="button"
            className={styles.controlButton}
            onClick={() => setReaderFontScaleIndex(fontScaleIndex - 1)}
            disabled={fontScaleIndex === 0}
            aria-label="Decrease font size"
          >
            A−
          </button>
          <span className={styles.fontLabel}>{FONT_LABELS[fontScaleIndex]}</span>
          <button
            type="button"
            className={styles.controlButton}
            onClick={() => setReaderFontScaleIndex(fontScaleIndex + 1)}
            disabled={fontScaleIndex === FONT_SIZES.length - 1}
            aria-label="Increase font size"
          >
            A+
          </button>
        </div>
        <div className={styles.pageControls}>
          <button
            type="button"
            className={styles.controlButton}
            onClick={goPrevious}
            disabled={currentPage === 0 && !previousHref}
            aria-label="Previous page"
          >
            <span aria-hidden="true">←</span>
            <span className={styles.buttonWord}>Previous</span>
          </button>
          <span
            className={styles.pageIndicator}
            title={`Page ${currentPage + 1} of ${pageCount}`}
          >
            {currentPage + 1} / {pageCount}
          </span>
          <button
            type="button"
            className={styles.controlButton}
            onClick={goNext}
            disabled={pages !== null && currentPage >= pageCount - 1 && !nextHref}
            aria-label="Next page"
          >
            <span className={styles.buttonWord}>Next</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
