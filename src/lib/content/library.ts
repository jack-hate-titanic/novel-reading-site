import fs from "node:fs";
import path from "node:path";
import {
  parseBilingualChapter,
  splitBilingualChapterCollection,
} from "@/lib/content/parser";
import type { Book, Chapter } from "@/lib/content/types";

const rawRoot = path.join(process.cwd(), "content", "raw");

const readRaw = (segments: string[]) =>
  fs.readFileSync(path.join(rawRoot, ...segments), "utf8");

const toChapterPreview = (chapter: Chapter) => ({
  slug: chapter.slug,
  bookSlug: chapter.bookSlug,
  title: chapter.title,
  order: chapter.order,
  summary: chapter.summary,
});

const springAndAutumnSummaries: Record<string, string> = {
  "chapter-01": "Beauty, power, and desire collide in the story's legendary opening.",
  "chapter-02": "Court politics and royal obsession turn the inner palace into a storm.",
  "chapter-03": "Romance, legend, and narrative irony reshape an old tale of beauty.",
  "chapter-04": "Beacon fires, vanity, and spectacle push royal power toward disaster.",
  "chapter-05": "The Spring and Autumn era begins as order starts to fracture.",
  "chapter-06": "Family loyalty bends under pressure, proving even mothers can fail.",
  "chapter-07": "Promises in life and death lead to one of the era's most famous encounters.",
  "chapter-08": "Paternal authority proves just as fragile as every other bond.",
  "chapter-09": "Excess and indulgence rot power from the inside out.",
  "chapter-10": "A strange attachment to cranes reveals the absurdity of aristocratic taste.",
  "chapter-11": "As the Zhou center weakens, the old political order begins to crack.",
  "chapter-12": "Blood ties and shared hardship fail to guarantee real trust.",
  "chapter-13": "Chu builds alliances in the south and starts changing the regional balance.",
  "chapter-14": "Compromise collapses when one country can no longer live under two systems.",
  "chapter-15": "Power proves unable to keep beauty safely, and desire turns ruinous again.",
  "chapter-16": "Kong Fujia tries a clever political maneuver in a court full of danger.",
  "chapter-17": "Charm becomes a weapon again as handsome men bring trouble of their own.",
  "chapter-18": "Moral duty and political survival collide in a painful human dilemma.",
  "chapter-19": "Alliances fray as hard lessons show how unreliable friends can be.",
  "chapter-20": "Marriage, loyalty, and statecraft tangle together until wives prove least reliable of all.",
};

const springAndAutumnChapters: Chapter[] = [
  readRaw(["spring-and-autumn", "chapter-01.md"]),
  readRaw(["spring-and-autumn", "chapter-11-20.md"]),
]
  .flatMap((markdown) => splitBilingualChapterCollection(markdown))
  .map((chapter) => ({
    slug: chapter.slug,
    bookSlug: "spring-and-autumn",
    title: chapter.title,
    order: chapter.order,
    summary:
      springAndAutumnSummaries[chapter.slug] ??
      `A study-friendly bilingual reading of ${chapter.title}.`,
    segments: parseBilingualChapter(chapter.markdown).segments,
  }));

const chapterFixtures: Chapter[] = [
  {
    slug: "chapter-1",
    bookSlug: "half-demon-si-teng",
    title: "Chapter 1",
    order: 1,
    summary: "An Man waits in the cold and the story opens with unease and desire.",
    segments: parseBilingualChapter(
      readRaw(["half-demon-si-teng", "chapter-1.md"]),
    ).segments,
  },
  {
    slug: "chapter-2",
    bookSlug: "half-demon-si-teng",
    title: "Chapter 2",
    order: 2,
    summary: "An Man steps into a trap, old secrets return, and the night turns violent.",
    segments: parseBilingualChapter(
      readRaw(["half-demon-si-teng", "chapter-2.md"]),
    ).segments,
  },
  {
    slug: "chapter-3",
    bookSlug: "half-demon-si-teng",
    title: "Chapter 3",
    order: 3,
    summary: "A mountain-road escape turns into an ambush, and Qin Fang is thrown over the cliff.",
    segments: parseBilingualChapter(
      readRaw(["half-demon-si-teng", "chapter-3.md"]),
    ).segments,
  },
  ...springAndAutumnChapters,
];

export function getBooks(): Book[] {
  return [
    {
      slug: "half-demon-si-teng",
      title: "Half-Demon Si Teng",
      subtitle: "A cold, cinematic modern fantasy for close English reading.",
      author: "Wei Yu",
      description:
        "An English-first reading edition built from the current bilingual Si Teng chapter collection.",
      coverTheme: "mist",
      tags: ["Modern Fantasy", "Atmospheric", "Dialogue"],
      readingModeLabel: "English First",
      chapters: chapterFixtures
        .filter((chapter) => chapter.bookSlug === "half-demon-si-teng")
        .map(toChapterPreview),
    },
    {
      slug: "spring-and-autumn",
      title: "Spring and Autumn",
      subtitle: "A sharp historical narrative with study-friendly bilingual support.",
      author: "Jia Zhigang",
      description:
        "An English-first reading edition built from the current bilingual chapter collection.",
      coverTheme: "bronze",
      tags: ["History", "Narrative", "Grammar Notes"],
      readingModeLabel: "English First",
      chapters: chapterFixtures
        .filter((chapter) => chapter.bookSlug === "spring-and-autumn")
        .map(toChapterPreview),
    },
  ];
}

export function getBookBySlug(slug: string) {
  return getBooks().find((book) => book.slug === slug);
}

export function getChapterBySlugs(bookSlug: string, chapterSlug: string) {
  return chapterFixtures.find(
    (chapter) => chapter.bookSlug === bookSlug && chapter.slug === chapterSlug,
  );
}

export function getAdjacentChapters(bookSlug: string, chapterSlug: string) {
  const chapters = chapterFixtures
    .filter((chapter) => chapter.bookSlug === bookSlug)
    .sort((left, right) => left.order - right.order);

  const index = chapters.findIndex((chapter) => chapter.slug === chapterSlug);

  return {
    previous: index > 0 ? chapters[index - 1] : null,
    next: index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : null,
  };
}
