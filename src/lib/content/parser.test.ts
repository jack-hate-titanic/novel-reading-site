import { describe, expect, it } from "vitest";
import {
  parseBilingualChapter,
  splitBilingualChapterCollection,
} from "@/lib/content/parser";

const sampleMarkdown = `
# Sample Chapter

第一句中文。
First English line.
第二句中文。
Second English line.
语法说明：<br>
语法标记：\`并列句\`。<br>
难点拆解：测试说明。<br>
常用短语：
- \`first phrase\`：第一个短语
- \`second phrase\`：第二个短语
`;

describe("parseBilingualChapter", () => {
  it("groups bilingual lines and attaches grammar aids to the latest segment", () => {
    const result = parseBilingualChapter(sampleMarkdown);

    expect(result.segments).toHaveLength(2);
    expect(result.segments[0]).toMatchObject({
      chinese: "第一句中文。",
      english: "First English line.",
    });
    expect(result.segments[1]).toMatchObject({
      chinese: "第二句中文。",
      english: "Second English line.",
      grammarNotes: ["语法标记：并列句。", "难点拆解：测试说明。"],
      phrases: ["first phrase：第一个短语", "second phrase：第二个短语"],
    });
  });

  it("splits a combined bilingual collection into individual chapter entries", () => {
    const collectionMarkdown = `
# Combined Book

说明：
- 示例

## 第一章 天仙妹妹
## Chapter 1: The Fairy Maiden

第一章第一句。
First line of chapter one.

## 第二章 后宫风暴
## Chapter 2: Turmoil in the Inner Palace

第二章第一句。
First line of chapter two.
`;

    const result = splitBilingualChapterCollection(collectionMarkdown);

    expect(result).toEqual([
      {
        order: 1,
        slug: "chapter-01",
        title: "Chapter 1: The Fairy Maiden",
        markdown: "第一章第一句。\nFirst line of chapter one.",
      },
      {
        order: 2,
        slug: "chapter-02",
        title: "Chapter 2: Turmoil in the Inner Palace",
        markdown: "第二章第一句。\nFirst line of chapter two.",
      },
    ]);
  });

  it("treats consecutive same-language lines as standalone segments", () => {
    const markdown = `
# English Only

First English sentence.
Second English sentence.
Third English sentence.
`;

    const result = parseBilingualChapter(markdown);

    expect(result.segments).toHaveLength(3);
    expect(result.segments[0]).toMatchObject({
      chinese: "",
      english: "First English sentence.",
    });
    expect(result.segments[2]).toMatchObject({
      chinese: "",
      english: "Third English sentence.",
    });
  });

  it("splits a pure-English collection using solo Chapter headings", () => {
    const collectionMarkdown = `
# English Book

## Chapter 1: The Beginning

First line of chapter one.

## Chapter 2: The Next Step

First line of chapter two.
`;

    const result = splitBilingualChapterCollection(collectionMarkdown);

    expect(result).toEqual([
      {
        order: 1,
        slug: "chapter-01",
        title: "Chapter 1: The Beginning",
        markdown: "First line of chapter one.",
      },
      {
        order: 2,
        slug: "chapter-02",
        title: "Chapter 2: The Next Step",
        markdown: "First line of chapter two.",
      },
    ]);
  });
});
