import { createRequire } from "node:module";
const require = createRequire(
  "C:/Users/10027/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/",
);
const { chromium } = require("playwright");

const executablePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

function themeState() {
  return {
    dataTheme: document.documentElement.dataset.theme,
    bgImage: getComputedStyle(document.documentElement).backgroundImage,
    bodyColor: getComputedStyle(document.body).color,
  };
}

await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
console.log("LIGHT:", JSON.stringify(await page.evaluate(themeState), null, 2));
await page.screenshot({ path: "scripts/home-light.png" });

await page.click('button[aria-label="Switch to dark theme"]');
await page.waitForTimeout(300);
console.log("DARK:", JSON.stringify(await page.evaluate(themeState), null, 2));
await page.screenshot({ path: "scripts/home-dark.png" });

// Persistence: reload, expect dark to survive via init script
await page.reload({ waitUntil: "networkidle" });
const persisted = await page.evaluate(themeState);
console.log("AFTER RELOAD:", JSON.stringify(persisted, null, 2));

// Reader page in dark mode
await page.goto("http://localhost:3000/read/half-demon-si-teng/chapter-1", {
  waitUntil: "networkidle",
});
const reader = await page.evaluate(themeState);
await page.screenshot({ path: "scripts/reader-dark.png" });
console.log("READER DARK:", JSON.stringify(reader, null, 2));

console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
