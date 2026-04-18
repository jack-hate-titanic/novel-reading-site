import fs from "node:fs";
import path from "node:path";
import { parseBilingualChapter } from "@/lib/content/parser";
import type { Book, Chapter } from "@/lib/content/types";

const rawRoot = path.join(process.cwd(), "content", "raw");

const readRaw = (segments: string[]) =>
  fs.readFileSync(path.join(rawRoot, ...segments), "utf8");

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
    slug: "chapter-01",
    bookSlug: "spring-and-autumn",
    title: "Chapter 1: The Fairy Maiden",
    order: 1,
    summary: "A witty historical opening that frames beauty, power, and early Zhou drama.",
    segments: parseBilingualChapter(
      readRaw(["spring-and-autumn", "chapter-01.md"]),
    ).segments,
  },
  {
    slug: "chapter-11-20",
    bookSlug: "spring-and-autumn",
    title: "Chapters 11-20",
    order: 11,
    summary: "A later historical arc about central authority, alliances, and political instability.",
    segments: parseBilingualChapter(
      readRaw(["spring-and-autumn", "chapter-11-20.md"]),
    ).segments,
  },
];

export function getBooks(): Book[] {
  return [
    {
      slug: "half-demon-si-teng",
      title: "Half-Demon Si Teng",
      subtitle: "A cold, cinematic modern fantasy for close English reading.",
      author: "Wei Yu",
      description:
        "An English-first reading edition built from the current bilingual Chapter 1 source.",
      coverTheme: "mist",
      tags: ["Modern Fantasy", "Atmospheric", "Dialogue"],
      readingModeLabel: "English First",
      chapters: chapterFixtures
        .filter((chapter) => chapter.bookSlug === "half-demon-si-teng")
        .map(({ segments, ...chapter }) => chapter),
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
        .map(({ segments, ...chapter }) => chapter),
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
