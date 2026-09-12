import type { EnglishSegment } from "@/lib/content/english-text";
import { stripChineseGlosses } from "@/lib/content/english-text";
import styles from "./reader-page.module.css";

export function ReaderSegment({
  segment,
}: {
  segment: EnglishSegment;
}) {
  return <p className={styles.english}>{stripChineseGlosses(segment.english)}</p>;
}
