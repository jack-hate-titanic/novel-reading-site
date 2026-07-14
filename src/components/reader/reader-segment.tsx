import type { ReaderSegment as ReaderSegmentType } from "@/lib/content/types";
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
      <p className={styles.english}>{segment.english}</p>

      {segment.chinese ? (
        <details className={styles.disclosure}>
          <summary>Show Chinese</summary>
          <p className={styles.chinese}>{segment.chinese}</p>
        </details>
      ) : null}

      {(segment.grammarNotes.length > 0 || segment.phrases.length > 0) && (
        <details className={styles.disclosure}>
          <summary>Show Notes</summary>
          {segment.grammarNotes.length > 0 && (
            <ul className={styles.noteList}>
              {segment.grammarNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
          {segment.phrases.length > 0 && (
            <ul className={styles.phraseList}>
              {segment.phrases.map((phrase) => (
                <li key={phrase}>{phrase}</li>
              ))}
            </ul>
          )}
        </details>
      )}
    </article>
  );
}
