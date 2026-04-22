import type {
  ParsedChapter,
  ReaderSegment,
  SplitChapter,
} from "@/lib/content/types";

type PendingLine = {
  language: "chinese" | "english";
  text: string;
};

const cleanInlineMarkup = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, "")
    .replace(/`/g, "")
    .trim();

const isHeading = (line: string) => line.startsWith("#");

const isMetaLine = (line: string) =>
  line === "说明：" ||
  line.startsWith("- ") ||
  line.startsWith("当前已完成") ||
  line.startsWith("排版规则") ||
  line.startsWith("英文以") ||
  line.startsWith("保留原书");

const isGrammarStart = (line: string) => line.startsWith("语法说明");
const isPhraseStart = (line: string) => line.startsWith("常用短语");
const isGrammarDetail = (line: string) =>
  line.startsWith("语法标记：") ||
  line.startsWith("句子主干：") ||
  line.startsWith("难点拆解：");
const isPhraseDetail = (line: string) => line.startsWith("- ");
const hasChinese = (line: string) => /[\u4e00-\u9fff]/.test(line);
const hasEnglish = (line: string) => /[A-Za-z]/.test(line);
const chapterHeadingPattern = /^##\s+第.+章/;
const englishChapterHeadingPattern = /^##\s+Chapter\s+(\d+)(?::\s*(.+))?$/;

const detectLanguage = (line: string): PendingLine["language"] | null => {
  if (hasChinese(line) && !hasEnglish(line)) {
    return "chinese";
  }

  if (hasEnglish(line)) {
    return "english";
  }

  return null;
};

const appendSegment = (
  segments: ReaderSegment[],
  first: PendingLine,
  second: PendingLine,
) => {
  const chinese = first.language === "chinese" ? first.text : second.text;
  const english = first.language === "english" ? first.text : second.text;

  segments.push({
    id: `segment-${segments.length + 1}`,
    chinese,
    english,
    grammarNotes: [],
    phrases: [],
  });
};

const toChapterSlug = (order: number) => `chapter-${String(order).padStart(2, "0")}`;

export function parseBilingualChapter(markdown: string): ParsedChapter {
  const lines = markdown
    .split(/\r?\n/)
    .map((line) => cleanInlineMarkup(line))
    .filter(Boolean);

  let title = "Untitled Chapter";
  const segments: ReaderSegment[] = [];
  let pendingLine: PendingLine | null = null;
  let collectGrammar = false;
  let collectPhrases = false;

  for (const line of lines) {
    if (isHeading(line)) {
      if (title === "Untitled Chapter" && line.startsWith("# ")) {
        title = line.replace(/^#\s+/, "");
      }
      collectGrammar = false;
      collectPhrases = false;
      continue;
    }

    if (isGrammarStart(line)) {
      collectGrammar = true;
      collectPhrases = false;
      continue;
    }

    if (isPhraseStart(line)) {
      collectGrammar = false;
      collectPhrases = true;
      continue;
    }

    if (collectGrammar && isGrammarDetail(line) && segments.length > 0) {
      segments[segments.length - 1].grammarNotes.push(line);
      continue;
    }

    if (collectPhrases && isPhraseDetail(line) && segments.length > 0) {
      segments[segments.length - 1].phrases.push(line.replace(/^- /, ""));
      continue;
    }

    if (collectGrammar && !isGrammarDetail(line)) {
      collectGrammar = false;
    }

    if (collectPhrases && !isPhraseDetail(line)) {
      collectPhrases = false;
    }

    if (isMetaLine(line)) {
      continue;
    }

    const language = detectLanguage(line);

    if (!language) {
      continue;
    }

    if (!pendingLine) {
      pendingLine = { language, text: line };
      continue;
    }

    if (pendingLine.language !== language) {
      appendSegment(segments, pendingLine, { language, text: line });
      pendingLine = null;
      continue;
    }

    pendingLine = { language, text: line };
  }

  return { title, segments };
}

export function splitBilingualChapterCollection(markdown: string): SplitChapter[] {
  const lines = markdown.split(/\r?\n/);
  const chapters: SplitChapter[] = [];
  let current:
    | {
        order: number;
        title: string;
        bodyLines: string[];
      }
    | null = null;

  const pushCurrent = () => {
    if (!current) {
      return;
    }

    chapters.push({
      order: current.order,
      slug: toChapterSlug(current.order),
      title: current.title,
      markdown: current.bodyLines.join("\n").trim(),
    });
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (chapterHeadingPattern.test(line)) {
      pushCurrent();

      const nextLine = lines[index + 1]?.trim() ?? "";
      const englishMatch = nextLine.match(englishChapterHeadingPattern);

      if (!englishMatch) {
        current = null;
        continue;
      }

      current = {
        order: Number.parseInt(englishMatch[1], 10),
        title: nextLine.replace(/^##\s+/, ""),
        bodyLines: [],
      };
      index += 1;
      continue;
    }

    if (!current) {
      continue;
    }

    current.bodyLines.push(line);
  }

  pushCurrent();

  return chapters.filter((chapter) => chapter.markdown.length > 0);
}
