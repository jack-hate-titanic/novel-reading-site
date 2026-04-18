import { describe, expect, it } from "vitest";
import { parseBilingualChapter } from "@/lib/content/parser";

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
});
