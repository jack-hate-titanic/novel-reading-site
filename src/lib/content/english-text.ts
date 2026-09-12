import type { ReaderSegment } from "@/lib/content/types";

const CJK_PATTERN = /[一-鿿]/g;
const LATIN_PATTERN = /[A-Za-z]/g;
const FULL_WIDTH_GLOSS_PATTERN = /（[^）]*）/g;

export function stripChineseGlosses(text: string): string {
  return text
    .replace(FULL_WIDTH_GLOSS_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function hasReadableEnglish(text: string): boolean {
  const stripped = stripChineseGlosses(text);
  const cjkCount = (stripped.match(CJK_PATTERN) ?? []).length;
  const latinCount = (stripped.match(LATIN_PATTERN) ?? []).length;
  return latinCount > 0 && cjkCount * 2 <= latinCount;
}

export function getDisplaySegments(
  segments: ReaderSegment[],
): ReaderSegment[] {
  return segments.filter((segment) => hasReadableEnglish(segment.english));
}

export type EnglishSegment = {
  id: string;
  english: string;
};

export function getEnglishSegments(
  segments: ReaderSegment[],
): EnglishSegment[] {
  return getDisplaySegments(segments).map((segment) => ({
    id: segment.id,
    english: stripChineseGlosses(segment.english),
  }));
}
