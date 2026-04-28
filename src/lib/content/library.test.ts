import { describe, expect, it } from "vitest";
import {
  getBookBySlug,
  getBooks,
  getChapterBySlugs,
} from "@/lib/content/library";

describe("content library", () => {
  it("loads both books and produces readable chapter segments from the real source files", () => {
    const books = getBooks();
    const siTeng = getChapterBySlugs("half-demon-si-teng", "chapter-1");
    const springOne = getChapterBySlugs("spring-and-autumn", "chapter-01");
    const springLater = getChapterBySlugs("spring-and-autumn", "chapter-11");

    expect(books.map((book) => book.slug)).toEqual([
      "half-demon-si-teng",
      "spring-and-autumn",
    ]);

    expect(siTeng?.segments.length).toBeGreaterThan(10);
    expect(springOne?.segments.length).toBeGreaterThan(10);
    expect(springLater?.segments.length).toBeGreaterThan(10);

    expect(siTeng?.segments[0].english).toContain("December 2013");
    expect(springOne?.segments[0].english).toContain("Love the realm");
    expect(springLater?.segments[0].english).toContain("people thrive when they move");
  });

  it("loads Half-Demon Si Teng chapter 2 into the book navigation and reader content", () => {
    const siTeng = getBookBySlug("half-demon-si-teng");
    const chapterTwo = getChapterBySlugs("half-demon-si-teng", "chapter-2");

    expect(siTeng?.chapters.map((chapter) => chapter.slug)).toContain("chapter-2");
    expect(chapterTwo?.segments.length).toBeGreaterThan(20);
    expect(chapterTwo?.segments[0].chinese).toBe(
      "我就住城中心的金马大酒店，188号房，你一定来啊，咱们聊聊。",
    );
    expect(chapterTwo?.segments[0].english).toContain(
      "I'm staying at the Jinma Grand Hotel",
    );
  });

  it("loads Half-Demon Si Teng chapter 3 into the book navigation and reader content", () => {
    const siTeng = getBookBySlug("half-demon-si-teng");
    const chapterThree = getChapterBySlugs("half-demon-si-teng", "chapter-3");

    expect(siTeng?.chapters.map((chapter) => chapter.slug)).toContain("chapter-3");
    expect(chapterThree?.segments.length).toBeGreaterThan(20);
    expect(chapterThree?.segments[0].chinese).toBe(
      "安蔓脑子再乱，也知道开夜路危险，尤其是盘山道，当地人称“九十九道盘，鬼走也难”，具体有没有九十九道没数过，但是上一道盘陡过一道，整个呈螺旋锥样绕十几座山上去，最顶上那道说是万丈悬崖一点都不过分。",
    );
    expect(chapterThree?.segments[0].english).toContain(
      "driving mountain roads at night was dangerous",
    );
  });

  it("loads Spring and Autumn as individual chapters instead of merged chapter ranges", () => {
    const spring = getBookBySlug("spring-and-autumn");
    const chapterTwelve = getChapterBySlugs("spring-and-autumn", "chapter-12");
    const chapterTwenty = getChapterBySlugs("spring-and-autumn", "chapter-20");
    const chapterThirty = getChapterBySlugs("spring-and-autumn", "chapter-30");

    expect(spring?.chapters.map((chapter) => chapter.slug)).toEqual([
      "chapter-01",
      "chapter-02",
      "chapter-03",
      "chapter-04",
      "chapter-05",
      "chapter-06",
      "chapter-07",
      "chapter-08",
      "chapter-09",
      "chapter-10",
      "chapter-11",
      "chapter-12",
      "chapter-13",
      "chapter-14",
      "chapter-15",
      "chapter-16",
      "chapter-17",
      "chapter-18",
      "chapter-19",
      "chapter-20",
      "chapter-21",
      "chapter-22",
      "chapter-23",
      "chapter-24",
      "chapter-25",
      "chapter-26",
      "chapter-27",
      "chapter-28",
      "chapter-29",
      "chapter-30",
    ]);
    expect(chapterTwelve?.title).toBe("Chapter 12: Passing Themselves Off as the Central Army");
    expect(chapterTwelve?.segments[0].english).toContain("History has told us time and again");
    expect(chapterTwenty?.title).toBe("Chapter 20: Wives Are Even Less Reliable");
    expect(chapterTwenty?.segments[0].english).toContain("While the Zheng-Lu allied army was attacking Song");
    expect(chapterThirty?.title).toBe("Chapter 30: Guan Zhong's Policies for Enriching the People");
    expect(chapterThirty?.segments[0].english).toContain("Bao Shuya returned in embarrassment");
  });
});
