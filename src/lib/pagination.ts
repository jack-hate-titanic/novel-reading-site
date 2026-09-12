export function packPagesByHeight(
  heights: number[],
  maxHeight: number,
  gap: number,
): number[][] {
  const pages: number[][] = [];
  let current: number[] = [];
  let usedHeight = 0;

  for (let index = 0; index < heights.length; index += 1) {
    const height = Math.max(heights[index] ?? 0, 0);
    const gapBefore = current.length > 0 ? gap : 0;

    if (current.length > 0 && usedHeight + gapBefore + height > maxHeight) {
      pages.push(current);
      current = [index];
      usedHeight = height;
    } else {
      current.push(index);
      usedHeight += gapBefore + height;
    }
  }

  if (current.length > 0) {
    pages.push(current);
  }

  return pages;
}

export function pageIndexOfSegment(
  pages: number[][],
  segmentIndex: number,
): number {
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    if (pages[pageIndex].includes(segmentIndex)) {
      return pageIndex;
    }
  }
  return Math.max(pages.length - 1, 0);
}

export function clampAnchor(anchor: number, totalSegments: number): number {
  if (totalSegments <= 0 || Number.isNaN(anchor)) {
    return 0;
  }
  return Math.min(Math.max(Math.trunc(anchor), 0), totalSegments - 1);
}
