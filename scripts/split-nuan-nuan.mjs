// One-shot helper: split the raw 暖暖 source into 16 chapter files (Traditional Chinese).
// Usage: node scripts/split-nuan-nuan.mjs <source.txt> <out-dir>
import fs from "node:fs";
import path from "node:path";

const [, , sourcePath, outDir] = process.argv;

if (!sourcePath || !outDir) {
  console.error("Usage: node scripts/split-nuan-nuan.mjs <source.txt> <out-dir>");
  process.exit(1);
}

const raw = fs.readFileSync(sourcePath, "utf8");
const lines = raw.split(/\r?\n/);

// Each chapter starts with a line that, after trimming Chinese full-width spaces, is "N."
const chapterHeading = /^\s*[　 ]*(\d+)\.\s*$/;

const chapters = [];
let current = null;

for (const line of lines) {
  const match = line.match(chapterHeading);
  if (match) {
    if (current) chapters.push(current);
    current = { order: Number(match[1]), bodyLines: [] };
    continue;
  }
  if (current) current.bodyLines.push(line);
}
if (current) chapters.push(current);

// Strip leading/trailing blank lines and the leading "　　" (full-width double space)
// indentation that the source uses on every paragraph line.
const cleanLines = (arr) => {
  let start = 0;
  let end = arr.length;
  while (start < end && arr[start].trim() === "") start += 1;
  while (end > start && arr[end - 1].trim() === "") end -= 1;
  return arr
    .slice(start, end)
    .map((line) => line.replace(/^[　 ]+/, "").replace(/\s+$/, ""));
};

fs.mkdirSync(outDir, { recursive: true });

for (const chapter of chapters) {
  const cleaned = cleanLines(chapter.bodyLines);
  const slug = `chapter-${String(chapter.order).padStart(2, "0")}`;
  const filename = path.join(outDir, `${slug}.zh.txt`);
  fs.writeFileSync(filename, cleaned.join("\n") + "\n", "utf8");
  console.log(`wrote ${filename} (${cleaned.length} lines)`);
}

console.log(`\nTotal chapters: ${chapters.length}`);
