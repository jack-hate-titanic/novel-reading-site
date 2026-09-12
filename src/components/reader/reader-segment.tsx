import type { ReaderSegment as ReaderSegmentType } from "@/lib/content/types";
import { stripChineseGlosses } from "@/lib/content/english-text";
import styles from "./reader-page.module.css";

export function ReaderSegment({
  index,
  segment,
}: {
  index: number;
  segment: ReaderSegmentType;
}) {
  return (
    <article className={styles.segment}>
      <p className={styles.segmentIndex}>Segment {index}</p>
      <p className={styles.english}>{stripChineseGlosses(segment.english)}</p>
    </article>
  );
}
