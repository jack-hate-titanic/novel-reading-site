# 添加《暖暖》中英双语版到项目

## 概述

将蔡智恒（痞子蔡）的小说《暖暖》翻译为英文，按项目中英对照格式（一句中文一句英文）组织，添加到本站书籍中。

## 源文件

- `C:\Users\wson\Downloads\蔡智恒-暖暖.txt` — 纯中文（繁体），共 6689 行，16 章
- 作者：蔡智恒（痞子蔡），台湾作家
- 书名：暖暖

## 目标格式

参照 `content/raw/half-demon-si-teng/chapter-1.md` 格式：
- 文件头：书名、说明
- 正文：一句中文 + 一句英文成对排列
- 可选：语法说明、常用短语

## 实施步骤

### Step 1：拆分源文件为 16 个章节

从纯中文源文件中按 `　　N.` 标记切分出 16 章，保存到 `content/raw/nuan-nuan/chapter-N.md`（纯中文原始档）。

### Step 2：翻译并生成双语文件

逐章翻译，生成 `content/raw/nuan-nuan/chapter-N.md`，格式为：
```
中文句子  
English translation  
中文句子  
English translation  
```

### Step 3：注册到 content library

更新 `src/lib/content/library.ts`：
- 新增 `nuan-nuan` book entry
- author: "蔡智恒 (Cai Zhiheng)"
- coverTheme: 选择合适主题（如 "mist"）
- tags: ["Romance", "Contemporary", "Bilingual"]
- 为每章编写英文 summary

### Step 4：验证

- `npm run test:run`
- `npm run lint`
- `npm run build`

## 章节概览

| # | 起始行 | 内容概要 |
|---|--------|----------|
| 1 | 行 4 | 夏令营初识暖暖 |
| 2 | 行 215 | 紫禁城游览 |
| 3 | 行 726 | — |
| 4 | 行 1172 | — |
| 5 | 行 1704 | — |
| 6 | 行 2409 | — |
| 7 | 行 3125 | — |
| 8 | 行 3841 | — |
| 9 | 行 3963 | — |
| 10 | 行 4090 | — |
| 11 | 行 4492 | — |
| 12 | 行 4720 | — |
| 13 | 行 5063 | — |
| 14 | 行 5607 | — |
| 15 | 行 6062 | — |
| 16 | 行 6470 | 机场告别 |
