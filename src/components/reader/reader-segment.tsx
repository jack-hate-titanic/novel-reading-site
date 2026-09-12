import type { EnglishSegment } from "@/lib/content/english-text";
import { stripChineseGlosses } from "@/lib/content/english-text";
import styles from "./reader-page.module.css";

export function ReaderSegment({
  index,
  segment,
}: {
  index: number;
  segment: EnglishSegment;
}) {
  return (
    <article className={styles.segment}>
      <p className={styles.segmentIndex}>Segment {index}</p>
      <p className={styles.english}>{stripChineseGlosses(segment.english)}</p>
    </article>
  );
}
