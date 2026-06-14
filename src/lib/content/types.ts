export type ReaderSegment = {
  id: string;
  chinese: string;
  english: string;
  grammarNotes: string[];
  phrases: string[];
};

export type Chapter = {
  slug: string;
  bookSlug: string;
  title: string;
  order: number;
  summary: string;
  segments: ReaderSegment[];
};

export type ChapterPreview = {
  slug: string;
  bookSlug: string;
  title: string;
  order: number;
  summary: string;
  segmentCount: number;
};

export type Book = {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  description: string;
  coverTheme: "mist" | "bronze";
  tags: string[];
  readingModeLabel: string;
  chapters: ChapterPreview[];
};

export type ParsedChapter = {
  title: string;
  segments: ReaderSegment[];
};

export type SplitChapter = {
  order: number;
  slug: string;
  title: string;
  markdown: string;
};
