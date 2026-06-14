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
  segmentCount: chapter.segments.length,
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
  "chapter-21": "Succession and kinship collide as the age asks whether brothers can really be trusted.",
  "chapter-22": "Political legitimacy gets reframed through a new reading of the Duke of Zhou.",
  "chapter-23": "Family affection deepens into danger as sibling bonds grow too entangled.",
  "chapter-24": "A seemingly simple melon case turns into a memorable political murder story.",
  "chapter-25": "The famous bond of Guan and Bao is retold beside Guan Zhong's most human retreat.",
  "chapter-26": "Bao Shuya's patience and strategy make room for one of history's great statesmen.",
  "chapter-27": "Qi rises under a new political sun as momentum shifts across the realm.",
  "chapter-28": "The ideas of Master Guan are laid out as a durable system of statecraft.",
  "chapter-29": "Cao Gui's reflections on war turn one battle into a lasting military classic.",
  "chapter-30": "Guan Zhong's wealth-building policies show how governance begins with enriching the people.",
};

const springAndAutumnChapters: Chapter[] = [
  readRaw(["spring-and-autumn", "chapter-01.md"]),
  readRaw(["spring-and-autumn", "chapter-11-20.md"]),
  readRaw(["spring-and-autumn", "chapter-21-30.md"]),
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

const nuanNuanChapterSummaries: Record<number, string> = {
  1: "Two strangers meet at a cross-strait summer camp in Beijing, and a half-joking false name turns into something more.",
  2: "A long day touring the Forbidden City, Beihai, and Snack Street ends with a sharp, fiery dinner and a quietly captured smile.",
  3: "A grueling climb up the Great Wall takes the group from Juyong Pass to the North Eighth Tower, with stories of Meng Jiangnü along the way.",
  4: "A morning lecture on Chinese language and an afternoon of Beijing pedicabs, hutong life, and a chance encounter with a hidden bat-shaped pond.",
  5: "A morning of fermented bean juice, a lively class on simplified Chinese, and an afternoon exploring the Temple of Heaven and Da Zha Lan's old shops.",
  6: "A day at Peking University and the Summer Palace, from Weiming Lake and the Echo Wall to a fortune-teller's cryptic reading on Suzhou Street.",
  7: "Ji Xiaolan's tragic love story, the Lama Temple's giant Buddha, a farewell talent show, and the night before departure from Beijing.",
  8: "The journey home: flight security, a hidden scroll, and unpacking Nuannuan's gift in Taiwan.",
  9: "Adjusting to life back in Taiwan — emails with Nuannuan, a job offer, and a move to Hsinchu.",
  10: "Life at a new job, emails across the strait, and a year of longing before a work assignment in Suzhou.",
  11: "From Suzhou, a phone call to Nuannuan leads to a birthday surprise and the decision to go to Beijing.",
  12: "The flight to Beijing, a snowy reunion, and a warm dinner of lamb hotpot at Donglaishun.",
  13: "A day of snow, red leaves, and the quiet intimacy of being together again in Beijing.",
  14: "A work trip to Harbin: Russian architecture, street food, and a night train conversation about the future.",
  15: "The last full day in Beijing — visiting the Forbidden City alone, an evening at Lao She Teahouse, and a farewell leaf inscribed with poetry.",
  16: "The final goodbye at the airport, a last glimpse of Nuannuan's car in the snow, and the echo of their first meeting.",
};

const nuanNuanOrders = Object.keys(nuanNuanChapterSummaries)
  .map((key) => Number.parseInt(key, 10))
  .sort((a, b) => a - b);

const nuanNuanChapters: Chapter[] = nuanNuanOrders.map((order) => {
  const slug = `chapter-${String(order).padStart(2, "0")}`;
  return {
    slug,
    bookSlug: "nuan-nuan",
    title: `Chapter ${order}`,
    order,
    summary: nuanNuanChapterSummaries[order],
    segments: parseBilingualChapter(readRaw(["nuan-nuan", `${slug}.md`])).segments,
  };
});

const chapterFixtures: Chapter[] = [
  ...nuanNuanChapters,
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
      slug: "nuan-nuan",
      title: "Nuannuan",
      subtitle: "A quiet, tender Taiwanese romance retold for English readers.",
      author: "Cai Zhiheng (痞子蔡)",
      description:
        "An English-first reading edition of Cai Zhiheng's bilingual novella about a brief, warm encounter between two students at a cross-strait summer camp.",
      coverTheme: "mist",
      tags: ["Romance", "Contemporary", "Taiwan"],
      readingModeLabel: "English First",
      chapters: chapterFixtures
        .filter((chapter) => chapter.bookSlug === "nuan-nuan")
        .map(toChapterPreview),
    },
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
