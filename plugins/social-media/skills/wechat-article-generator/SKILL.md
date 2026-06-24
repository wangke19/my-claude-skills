---
name: wechat-article-generator
description: "Generate a WeChat public account article as a self-contained HTML file with inline SVG cover and illustrations, ready for copy-paste into the WeChat editor. Includes writing style guide."
---

# WeChat Article Generator

## Overview

Generate a complete WeChat public account article as a self-contained HTML file. The output renders a cover image (2.35:1 aspect ratio), body content with styled illustrations, and all text formatting—ready to copy-paste directly into the WeChat editor with zero formatting loss.

## Writing Style Rules

默认写作风格为通用科普风格。当用户**显式提到「白居易风格」**时，才启用以下白居易风格规则：

### 白居易风格（仅按需启用）

> 白居易写完诗会读给老奶奶听，老奶奶听不懂就改。本文的读者就是老奶奶和学龄前儿童。

**核心原则：**

1. **白居易原则**: 所有内容必须能让学龄前儿童和六十岁老奶奶理解。任何术语如果找不到大白话替代，宁可不说。
2. **类比驱动**: 用生活中的类比解释一切（学徒、菜谱、翻页动画、雕塑家、输入法联想）。类比比定义好100倍。
3. **实用收尾**: 文章结尾必须有「知道这些，对你有什么用？」——从认知、能力、判断三个层面给出具体建议。不做泛泛之谈。
4. **金句点睛**: 用耳熟能详的诗句/俗语总结核心观点（如"熟读唐诗三百首，不会作诗也会吟"），让读者有一个记忆锚点。

**禁忌词表（白居易风格下绝对不能出现）：**

| ❌ 禁用词 | ✅ 替换为 |
|-----------|----------|
| 量子力学、赛博朋克 | 作文、画画（用日常能理解的例子） |
| 米其林三星 | 一桌子好菜 |
| 千亿级别、万亿级 | 数量大到你想不到、比这多得多得多 |
| 模式匹配器 | 模仿秀选手 |
| 噪声、去噪 | 全是麻点的图、擦掉麻点 |
| 帧（视频术语） | 张（图） |
| 一致性 | 不能穿帮 |
| 容错率 | 犯错代价 |
| 训练材料、训练数据 | 练的东西、看的例子 |
| 电控系统 | 车子的系统 |
| 数据 | 例子、信息 |
| 涌现 | 居然学会了 |
| 算法 | 方法、办法 |
| 参数 | 设置、细节 |
| 神经网络 | ——别提，用类比代替 |

**判断标准：** 写完一段话后，问自己：**这句话读给 60 岁不碰电脑的老奶奶听，她能听懂吗？** 如果不能，重写。

**正面示例：**
```
✅ "它的工作原理就是猜下一个字，就像你手机输入法会联想下一个词"
✅ "AI 画图就像雕塑家从石头里凿出形状——先是一团混沌，一刀一刀凿出人脸"
✅ "视频就是一张张图片快速翻过去，就像课本角落画的翻页动画"
```

**反面示例：**
```
❌ "大模型基于 Transformer 架构，通过自注意力机制处理序列数据" → 老奶奶：？？？
❌ "扩散模型通过逐步去噪生成高质量图像" → 应该说"从雪花屏里一步步擦出画面"
```

## When to Use

**⚠️ CRITICAL — MUST load this skill at the START of every WeChat article task:**

When the user mentions any of the following, load this skill immediately (do NOT respond with raw text or self-generated HTML):
- "写公众号文章" / "微信公众号" / "发到草稿箱" / "发布到草稿箱" / "发到草稿"
- "生成文章" / "帮我写一篇"
- Any request that implies producing content for a WeChat public account

The skill is the **only** correct way to generate WeChat-compatible HTML. Do not write HTML from scratch or use generic formatting — it will break in the WeChat editor.

**⚠️ 两种意图，触发后走不同路径（本次修复重点）：**

| 用户意图 | 路径 | 说明 |
|---------|------|------|
| "帮我写一篇关于X的文章" | 新写流程 | Step 1 问需求 → 写稿 → 生成 HTML → 发布 |
| "帮我重新排版" / "用技能重新发布" | 快速路径 | Step 1 跳过，直接用已给内容生成 HTML（用户已给全部参数：标题、内容、封面要求） |
| "润色+发布" / "润色一下上面的文章发布到草稿箱" | 新写流程 | 先加载 skill，重新处理内容，不直接复用 Q&A 文本 |

**⚠️ 快速路径判断标准**：用户已提供 **全部三项**（标题 + 正文内容 + 明确输出要求如"不要封面"）→ 直接生成 HTML，不逐条询问 Step 1。缺少任何一项则走新写流程。

**⚠️ Common failure mode (happened 3+ times in 2026-05):** The user first asks a plain question (e.g., "AI为什么也会胡说八道？" — just Q&A). Then says "润色一下上面的文章发布到草稿箱" — this is a **trigger** to immediately load this skill and re-process the content through the full workflow. Do NOT treat it as a continuation of the Q&A.

**⚠️ I MUST load this skill even if I think I already know how to do it.** The skill encodes WeChat-specific rendering quirks, the user's content preferences, and the correct output format. Failing to load it has repeatedly caused wrong approaches (e.g., writing raw markdown, skipping the copy-hint, using the wrong HTML structure). Load it at the start of every session before touching any WeChat-related task.

**⚠️ Verify Before Regenerating — User's Pasted Text May Not Match the HTML File:**

A recurring failure mode: the user pastes text from an older draft into the conversation, but the **HTML file on disk already contains the correct/up-to-date content**. The user's pasted text and the file are out of sync.

**Always check this first when the user says "update the article with new data":**
1. Search for the relevant HTML file in `{agent_dir}/*.html`
2. Read the file and compare its data claims against what the user pasted
3. If the file already contains the correct data (e.g., already has QuestMobile 2026Q1 figures), **do not regenerate** — just republish the existing file
4. Only rewrite when the user explicitly asks for new structure/new topic, not just data refresh

**Do NOT** generate raw markdown or self拼接 HTML/SVG for WeChat delivery. Always go through this skill.

## Core Pattern

### Before: Generic Approach
```
❌ Output raw markdown — WeChat editor doesn't preserve formatting
❌ Use external CSS files — WeChat strips <link> and <style> intelligently
❌ Use iframes or external images — won't load in WeChat
❌ Use JavaScript-dependent components — WeChat blocks most JS
```

### After: Self-Contained HTML with Embedded Assets
```
✅ Pure HTML + inline CSS (no external dependencies)
✅ All images embedded as data URIs (no external image loading)
✅ Cover image generated as inline SVG or CSS gradient (2.35:1)
✅ Illustrations as inline SVG (architecture diagrams, flowcharts)
✅ Font stack covers Windows/Mac/Android/iOS Chinese display
✅ Web-safe syntax highlighting for code blocks
✅ All colors are WeChat-editor-compatible (avoid transparency)
```

## Implementation Workflow

### Step 1: Gather Requirements

Ask the user if not clear from context:

```
1. **Content source**: File path, raw markdown text, or topic description?
2. **Article title**: What should the headline be?
3. **Cover image**: Do you want a cover image generated (2.35:1)? What style/theme?
   - Options: tech/cyberpunk, minimal/corporate, gradient/modern, nature/calm
4. **Illustrations**: Which sections need diagrams?
   - Architecture diagrams, flowcharts, comparison tables, or all of the above?
5. **Data source preference**: 用户要求"国内数据"时，必须使用中国机构报告（智联/BOSS/领英/财经等），不能默认西方机构。高盛/麦肯锡/Gartner 可作为补充但不能作为主力数据源。
6. **Layout template**: Which layout style fits the content?
   - `讲故事` — 绿色自然风装饰体（8组件：绿框开头+GIF标题+左侧叶子装饰正文+分割线+绿框结语+音乐列表+CTA）。适合：知识科普/热点解读/文化故事/AI行业动态。走 **Step 4B** 路径。
   - `技术`（默认）— 标准技术排版（h2/h3 inline style + 三色结论区块 + SVG插图）。适合：教程/深度技术/工具介绍。走 **Step 4A** 路径。
   - **判断标准**：如果核心吸引力是「情绪/好奇心/叙事节奏」→ 讲故事；如果核心是「信息密度/逻辑链条/实操步骤」→ 技术
7. **Author/name**: Optional author byline
8. **Date**: Optional publication date (default: today)
```

**⚠️ 数据来源优先级（用户明确要求时）**：
- 用户说"用国内数据"→ 必须使用中国机构报告（智联、BOSS直聘、领英、财经、CNNIC等）
- 高盛、麦肯锡、Gartner 等西方机构数据只能作为补充
- 原则：**数据必须新（≤6个月），2年前的数据无参考价值**

**If user provides a file path**: Read and parse the file content.

**If user provides raw markdown**: Use as-is.

**If user describes a topic**: Write the full article content based on their description, then generate HTML. **Before writing, list all major dimensions/subtopics** of the given topic and ensure the article structure covers each one (see Content Writing Guidelines below).

### Step 2: Generate Cover Image (2.35:1 Aspect Ratio)

**⚠️ 注意：WeChat 不支持 SVG 作为封面图。** 封面图由用户在微信编辑器草稿箱手动上传（支持 JPG/PNG，900×383px，≤200KB）。以下 SVG 模板仅用于本地预览或导出为 PNG 后上传。不要将 SVG data URI 写入 HTML。

Create an inline SVG cover image. Default dimensions: 900×383 (2.35:1).

**Theme A: Tech/Cyberpunk** (for programming/AI/developer topics)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 383" width="900" height="383">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0e1a"/>
      <stop offset="50%" stop-color="#151b2e"/>
      <stop offset="100%" stop-color="#0a0e1a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00f0ff"/>
      <stop offset="100%" stop-color="#ff00f7"/>
    </linearGradient>
  </defs>
  <rect fill="url(#bg)" width="900" height="383"/>
  <!-- Decorative grid lines -->
  <g stroke="rgba(0,240,255,0.08)" stroke-width="1">
    <line x1="0" y1="0" x2="900" y2="383"/>
    <line x1="0" y1="96" x2="900" y2="96"/>
    <line x1="0" y1="192" x2="900" y2="192"/>
    <line x1="0" y1="289" x2="900" y2="289"/>
    <line x1="225" y1="0" x2="225" y2="383"/>
    <line x1="450" y1="0" x2="450" y2="383"/>
    <line x1="675" y1="0" x2="675" y2="383"/>
  </g>
  <!-- Title -->
  <text x="450" y="155" text-anchor="middle" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="42" font-weight="700" fill="white">[TITLE]</text>
  <!-- Subtitle -->
  <text x="450" y="220" text-anchor="middle" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="20" fill="rgba(255,255,255,0.7)">[SUBTITLE]</text>
  <!-- Accent line -->
  <rect x="380" y="245" width="140" height="4" rx="2" fill="url(#accent)"/>
  <!-- Date -->
  <text x="450" y="340" text-anchor="middle" font-family="Courier New, monospace" font-size="14" fill="rgba(255,255,255,0.4)">[DATE]</text>
</svg>
```

**Theme B: Minimal/Corporate** (for business/management articles)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 383" width="900" height="383">
  <rect fill="#f8f9fa" width="900" height="383"/>
  <!-- Left accent bar -->
  <rect fill="#1a73e8" width="8" height="383"/>
  <!-- Title -->
  <text x="60" y="155" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="48" font-weight="700" fill="#111">[TITLE]</text>
  <!-- Subtitle -->
  <text x="60" y="220" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="22" fill="#555">[SUBTITLE]</text>
  <!-- Divider line -->
  <line x1="60" y1="250" x2="400" y2="250" stroke="#1a73e8" stroke-width="3"/>
  <!-- Date -->
  <text x="60" y="340" font-family="Courier New, monospace" font-size="14" fill="#999">[DATE]</text>
</svg>
```

**Theme C: Gradient/Modern** (for trending topics)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 383" width="900" height="383">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#667eea"/>
      <stop offset="100%" stop-color="#764ba2"/>
    </linearGradient>
  </defs>
  <rect fill="url(#bg)" width="900" height="383"/>
  <!-- Decorative circles -->
  <circle cx="800" cy="50" r="120" fill="rgba(255,255,255,0.08)"/>
  <circle cx="100" cy="350" r="80" fill="rgba(255,255,255,0.06)"/>
  <!-- Title -->
  <text x="450" y="155" text-anchor="middle" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="44" font-weight="700" fill="white">[TITLE]</text>
  <!-- Subtitle -->
  <text x="450" y="220" text-anchor="middle" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="20" fill="rgba(255,255,255,0.85)">[SUBTITLE]</text>
  <!-- Date -->
  <text x="450" y="340" text-anchor="middle" font-family="Courier New, monospace" font-size="14" fill="rgba(255,255,255,0.6)">[DATE]</text>
</svg>
```

**Theme D: Nature/Calm** (for lifestyle/education articles)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 383" width="900" height="383">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e8f5e9"/>
      <stop offset="100%" stop-color="#c8e6c9"/>
    </linearGradient>
  </defs>
  <rect fill="url(#bg)" width="900" height="383"/>
  <!-- Top decorative bar -->
  <rect fill="#2e7d32" width="900" height="6"/>
  <!-- Title -->
  <text x="450" y="155" text-anchor="middle" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="44" font-weight="700" fill="#1b5e20">[TITLE]</text>
  <!-- Subtitle -->
  <text x="450" y="220" text-anchor="middle" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="20" fill="#388e3c">[SUBTITLE]</text>
  <!-- Divider -->
  <rect x="400" y="245" width="100" height="3" rx="1.5" fill="#66bb6a"/>
  <!-- Date -->
  <text x="450" y="340" text-anchor="middle" font-family="Courier New, monospace" font-size="14" fill="#81c784">[DATE]</text>
</svg>
```

### Step 3: Generate Inline Illustrations

For body illustrations (architecture diagrams, flowcharts), create inline SVG elements within the HTML.

**Architecture Diagram Pattern (use inside `<section style="margin:12px 0;padding:0;line-height:0">` wrapper):**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 320" width="100%"
     style="display:block;vertical-align:bottom;margin:0 auto;border-radius:8px;font-family:Microsoft YaHei,PingFang SC,sans-serif">
  <!-- Arrow marker def (must be first for z-order) -->
  <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#666"/></marker></defs>
  <!-- Background -->
  <rect width="680" height="320" fill="#f8f9fb" rx="8"/>
  <rect x="1" y="1" width="678" height="318" fill="none" stroke="#e0e3e8" stroke-width="1" rx="8"/>
  <!-- Title -->
  <text x="340" y="30" text-anchor="middle" font-size="20" font-weight="600" fill="#333">架构图标题</text>
  <!-- Row 1: Three boxes -->
  <rect x="20" y="60" width="140" height="60" rx="6" fill="#e3f2fd" stroke="#1a73e8" stroke-width="2"/>
  <text x="90" y="95" text-anchor="middle" font-size="20" fill="#1a73e8">流程 A</text>
  <rect x="270" y="60" width="140" height="60" rx="6" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/>
  <text x="340" y="95" text-anchor="middle" font-size="20" fill="#2e7d32">流程 B</text>
  <rect x="520" y="60" width="140" height="60" rx="6" fill="#fff3e0" stroke="#e65100" stroke-width="2"/>
  <text x="590" y="95" text-anchor="middle" font-size="20" fill="#e65100">流程 C</text>
  <!-- Arrows between boxes -->
  <line x1="160" y1="90" x2="270" y2="90" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="410" y1="90" x2="520" y2="90" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  <!-- Bottom box -->
  <rect x="270" y="200" width="140" height="60" rx="6" fill="#fce4ec" stroke="#c2185b" stroke-width="2"/>
  <text x="340" y="235" text-anchor="middle" font-size="20" fill="#c2185b">汇总</text>
  <!-- Connecting lines to bottom -->
  <line x1="90" y1="120" x2="270" y2="200" stroke="#999" stroke-width="1.5" stroke-dasharray="4,2"/>
  <line x1="340" y1="120" x2="340" y2="200" stroke="#999" stroke-width="1.5"/>
  <line x1="590" y1="120" x2="410" y2="200" stroke="#999" stroke-width="1.5" stroke-dasharray="4,2"/>
</svg>
```

**Flowchart Pattern (use inside `<section style="margin:12px 0;padding:0;line-height:0">` wrapper):**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%"
     style="display:block;vertical-align:bottom;margin:0 auto;border-radius:8px;font-family:Microsoft YaHei,PingFang SC,sans-serif">
  <!-- Arrow marker def -->
  <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#666"/></marker></defs>
  <rect width="600" height="400" fill="#f8f9fb" rx="8"/>
  <rect x="1" y="1" width="598" height="398" fill="none" stroke="#e0e3e8" stroke-width="1" rx="8"/>
  <!-- Start circle -->
  <circle cx="300" cy="40" r="25" fill="#e3f2fd" stroke="#1a73e8" stroke-width="2"/>
  <text x="300" y="46" text-anchor="middle" font-size="20" fill="#1a73e8">开始</text>
  <!-- Arrow: Start -> Decision -->
  <line x1="300" y1="65" x2="300" y2="100" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  <!-- Decision diamond -->
  <polygon points="300,100 350,145 300,190 250,145" fill="#fff3e0" stroke="#e65100" stroke-width="2"/>
  <text x="300" y="150" text-anchor="middle" font-size="20" fill="#e65100">判断</text>
  <!-- Process A (left) -->
  <rect x="80" y="230" width="120" height="60" rx="8" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/>
  <text x="140" y="265" text-anchor="middle" font-size="20" fill="#2e7d32">方案 A</text>
  <!-- Process B (right) -->
  <rect x="400" y="230" width="120" height="60" rx="8" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/>
  <text x="460" y="265" text-anchor="middle" font-size="20" fill="#2e7d32">方案 B</text>
  <!-- Yes/No branches -->
  <line x1="250" y1="145" x2="140" y2="230" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  <text x="175" y="185" font-size="20" fill="#666">是</text>
  <line x1="350" y1="145" x2="460" y2="230" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  <text x="420" y="185" font-size="20" fill="#666">否</text>
</svg>
```

### Step 4: Generate Full HTML Document

**⚠️ 关键分支：排版模板选择决定执行路径**

根据 Step 1 的 `layout template` 选择，走两条完全不同的路径：

| 路径 | 触发条件 | 执行 |
|------|---------|------|
| **讲故事（绿色自然风）** | `layout = 讲故事` | → Step 4B |
| **技术（默认技术教程）** | `layout = 技术` 或未指定 | → 本节（Step 4A） |

---

### Step 4A: Technical 路径（默认）

**HTML document structure:**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Article Title]</title>
  <style>
    /* === BASE TYPOGRAPHY === */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont,
                   "PingFang SC", "Microsoft YaHei",
                   "Helvetica Neue", sans-serif;
      font-size: 17px;
      line-height: 1.9;
      color: #1a1a1a;
      background: #fff;
      max-width: 680px;        /* WeChat max content width */
      margin: 0 auto;
      padding: 40px 24px 80px;
      word-break: break-word;
    }

    /* === COPY HINT === */
    /* NOTE: WeChat strips CSS classes. Use inline style instead:
       <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:14px 18px;margin-bottom:28px;font-size:14px;color:#856404">...</div> */

    /* === COVER IMAGE === */
    /* NOTE: Cover image is NOT in HTML. User uploads manually in WeChat editor. SVG data URI is NOT supported as cover. */

    /* === TYPOGRAPHY === */
    h1 {
      font-size: 26px;
      line-height: 1.4;
      margin-bottom: 28px;
      color: #111;
      font-weight: 700;
    }
    h2 {
      font-size: 20px;
      margin-top: 40px;
      margin-bottom: 14px;
      color: #111;
      border-left: 4px solid #1a73e8;
      padding-left: 10px;
      font-weight: 700;
    }
    h3 {
      font-size: 17px;
      margin-top: 24px;
      margin-bottom: 10px;
      color: #333;
      font-weight: 600;
    }
    p { margin-bottom: 14px; }
    hr {
      border: none;
      border-top: 1px solid #eee;
      margin: 32px 0;
    }

    /* === LISTS === */
    ul, ol {
      margin: 0 0 14px 24px;
    }
    li { margin-bottom: 7px; }

    /* === INLINE CODE === */
    code {
      font-family: "Courier New", Courier, monospace;
      font-size: 13px;
      background: #f6f8fa;
      padding: 2px 5px;
      border-radius: 4px;
      color: #c0392b;
    }

    /* === CODE BLOCKS === */
    pre {
      background: #f6f8fa;
      border-radius: 8px;
      padding: 14px 18px;
      margin: 16px 0;
      overflow-x: auto;
      font-size: 13px;
      line-height: 1.7;
    }
    pre code {
      background: none;
      padding: 0;
      color: #24292e;
      font-size: 13px;
    }

    /* === BLOCKQUOTE === */
    blockquote {
      border-left: 4px solid #1a73e8;
      padding: 11px 18px;
      margin: 18px 0;
      background: #f0f6ff;
      border-radius: 0 8px 8px 0;
      color: #444;
    }

    /* === TABLES === */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 18px 0;
      font-size: 15px;
    }
    th {
      background: #f6f8fa;
      font-weight: 600;
      text-align: left;
      padding: 10px 14px;
      border: 1px solid #e1e4e8;
    }
    td {
      padding: 10px 14px;
      border: 1px solid #e1e4e8;
      vertical-align: top;
    }
    tr:nth-child(even) td { background: #fafbfc; }

    /* === IMAGES === */
    img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      display: block;
      margin: 16px auto;
    }

    /* === LINKS === */
    a { color: #1a73e8; text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* === STRONG/EM === */
    strong { color: #111; font-weight: 700; }
    em { color: #555; }

    /* === DECORATIVE ELEMENTS (must use inline style — see Mistake 7) === */
    /* NOTE: All custom decorative boxes/backgrounds must use inline style.
       Example inline styles:
       - Highlight box:  style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:8px;padding:14px 18px;margin:18px 0"
       - Info box:       style="background:#f0f6ff;border-radius:8px;padding:12px 16px;margin-bottom:10px"
       - Warning box:    style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:14px 18px"
       - Small text:     style="font-size:13px;color:#888"
       - Center text:    style="text-align:center"
       DO NOT use CSS classes like .highlight-box, .small, .text-center, .illustration */
  </style>
</head>
<body>

<!-- COPY HINT (inline style — WeChat strips CSS classes) -->
<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:14px 18px;margin-bottom:28px;font-size:14px;color:#856404">
  <strong>📋 复制提示：</strong>打开此页面，全选（Ctrl+A / Cmd+A）并复制（Ctrl+C / Cmd+C），然后直接粘贴到微信公众号编辑器中，格式完整保留。
</div>

<!-- COVER IMAGE: Do NOT embed in HTML. User uploads manually in WeChat editor (draft box → upload cover). SVG data URI is NOT supported as cover image in WeChat. -->

<!-- ARTICLE HEADER -->
<h1>[Article Title]</h1>
<p style="font-size:13px;color:#888">[Author] · [Date]</p>
<hr>

<!-- BODY CONTENT -->
... converted markdown ...

<!-- FOOTER (optional — delete if not needed) -->
<hr>
<p style="font-size:13px;color:#888;text-align:center">欢迎交流与转载，注明出处即可。</p>

</body>
</html>
```

### Step 4B: 讲故事路径（绿色自然风装饰体）

⚠️ **先加载模板**：执行 `read_file(path='~/.hermes/skills/social-media/wechat-article-generator/references/layout-template-storytelling.md')` 获取 8 大组件的完整 HTML 代码。

**与 Technical 路径的关键区别：**
- ❌ 不生成 `<html>/<head>/<body>` 包装 → 直接输出 body-only HTML（用于 publish-draft.py）
- ❌ 不走 Step 5（Markdown 转换）→ 手动组装 HTML 组件
- ❌ 不生成 SVG 插图/架构图 → 装饰组件本身就是视觉设计
- ❌ 不用 h2/h3/`<style>` 块 → 用 section 嵌套 + inline style
- ❌ 不走 Step 2/Step 3（封面/插图）→ 封面由用户在微信编辑器手动上传

**写作流程：**

1. **组织内容**：把文章拆成 3-6 个章节，每章有标题 + 2-6 段正文。最后有一段结语。
2. **按 8 组件拼装 HTML**（各组件完整代码见 `references/layout-template-storytelling.md`）：

```
组件1: 开头绿框（文章标题 + 2-3 段引入）
→ 组件2: 章节标题①（左GIF + 绿色文字+下划线 + 右GIF）
→ 组件3: 正文区①（左侧叶子装饰栏 + flex 右栏放段落）
→ 组件5: 分割线装饰
→ 组件2: 章节标题②
→ 组件3: 正文区②
→ 组件5: 分割线装饰
→ ...（重复）
→ 组件2: 结语标题
→ 组件6: 结语绿框（总结段落 + 金句加粗）
→ 组件7: 音乐推荐列表（可选，歌曲占位符，在结语框和CTA之间）
→ 组件8: CTA 结尾
```

3. **填充正文段落**：每段用组件 4 的格式，放在正文区的右栏 `<section>` 内：
```html
<p style="caret-color:rgb(0,0,0);color:rgb(0,0,0);text-align:start;white-space:normal;margin:0 0 2px 0">
<span style="font-size:17px;font-family:Optima-Regular,PingFangTC-light"><span leaf="">正文内容</span></span>
</p>
```

**⚠️ 严格规则（v4，每次都被纠正的点）：**
- 每个段落的 `<p>` **必须**有 `margin:0 0 2px 0`（不加 = 浏览器默认 16px，太松）
- 段落之间**绝不**加 `<p><span leaf=""><br></span></p>` 空行段落
- 各组件之间**直接紧挨**，不加空行
- 所有装饰图片用模板文件里的 CDN URL，**不用 Unicode emoji 替代**
- 加粗强调：在 span 内加 `<strong>`
- 引用句/金句：用 `font-size:18px`（同样加 `margin:0 0 2px 0`）

**⚠️ 跳过 Step 2（封面）、Step 3（插图）、Step 5（Markdown 转换）。** 封面由用户在微信编辑器手动上传。

---

### Step 5: Markdown to HTML Conversion Rules

Convert markdown elements to HTML:

| Markdown | HTML |
|----------|------|
| `# H1` | `<h1>` |
| `## H2` | `<h2>` |
| `### H3` | `<h3>` |
| `**bold**` | `<strong>` |
| `*italic*` | `<em>` |
| `` `inline code` `` | `<code>` |
| ` ```code block``` ` | `<pre><code>` |
| `> blockquote` | `<blockquote>` |
| `- item` | `<ul><li>` |
| `1. item` | `<ol><li>` |
| `[text](url)` | `<a href="url">text</a>` |
| `---` | `<hr>` |
| `\| table \|` | `<table><tr><td>` |
| `![alt](url)` | `<img src="url" alt="alt">` |

**For tables**: Use the table styling from the HTML template above.

**For code blocks with language hint**: Keep syntax highlighting classes clean (no external library needed—use CSS color directly in spans).

### 代码语法高亮格式（Hermes CLI 专用）

对于 Hermes Agent 命令行代码块，使用以下增强语法高亮格式。

**⚠️ 优先使用技能自带脚本 `scripts/code-highlight-hermes.py`**，不要手写处理逻辑。

**用法**：
```bash
python3 ~/.hermes/skills/wechat-article-generator/scripts/code-highlight-hermes.py \
  /tmp/article.html /tmp/article-highlighted.html
```

**HTML 结构**：
```html
<section class="code-snippet__js">
<pre class="code-snippet__js code-snippet code-snippet_nowrap" data-lang="shell">
<code><span leaf="">
<span class="code-snippet__attribute">hermes</span> 
<span class="code-snippet__attribute">kanban</span> 
<span class="code-snippet__attribute">create</span> my-project
</span></code>
</pre>
</section>
```

**CSS 类定义**（需添加到 `<style>` 块）：
```css
/* 代码块样式 */
.code-snippet__js {
  margin: 20px 0;
}
.code-snippet__js pre {
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  font-family: "SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace;
  font-size: 14px;
  line-height: 1.5;
}
.code-snippet__js code {
  font-family: inherit;
}
.code-snippet__js code span[leaf=""] {
  display: block;
}
/* 语法高亮颜色 */
.code-snippet__attribute {
  color: #d73a49;
  font-weight: 600;
}
.code-snippet__flag {
  color: #005cc5;
}
.code-snippet__string {
  color: #032f62;
}
.code-snippet__path {
  color: #6a737d;
}
```

**高亮分类规则**：

| 元素 | CSS 类 | 颜色 | 示例 |
|------|--------|------|------|
| 主命令 (hermes) | `.code-snippet__attribute` | 红色 `#d73a49` | `hermes` |
| 子命令 (kanban, config...) | `.code-snippet__attribute` | 红色 `#d73a49` | `kanban`, `profile` |
| 参数标志 (`--xxx`) | `.code-snippet__flag` | 蓝色 `#005cc5` | `--columns`, `--description` |
| 字符串值 (`"xxx"`) | `.code-snippet__string` | 深蓝 `#032f62` | `"Backlog,To Do"` |
| 文件路径 (`/home/...`, `~/...`) | `.code-snippet__path` | 灰色 `#6a737d` | `/home/kewang/.hermes/...` |

**Python 处理函数**（用于批量转换文章中的代码块）：

```python
import re

def highlight_hermes_cmd(code):
    """将 hermes 命令行代码转换为带语法高亮的格式"""
    code = code.strip()
    lines = code.split('\n')
    result_lines = []
    
    # 占位符（避免正则替换冲突）
    P_PATH = '\u0004'
    P_STR = '\u0005'
    
    for line in lines:
        highlighted = line
        
        # Step 1: 先保护路径和字符串
        path_matches = []
        def save_path(m):
            path_matches.append(m.group(0))
            return f'{P_PATH}{len(path_matches)-1}{P_PATH}'
        
        highlighted = re.sub(r'(~[\w./-]+)', save_path, highlighted)
        highlighted = re.sub(r'(/[\w./-]+)', save_path, highlighted)
        
        str_matches = []
        def save_str(m):
            str_matches.append(m.group(0))
            return f'{P_STR}{len(str_matches)-1}{P_STR}'
        highlighted = re.sub(r'"([^"]*)"', save_str, highlighted)
        
        # Step 2: 高亮 hermes 命令
        highlighted = re.sub(r'\bhermes\b', '<span class="code-snippet__attribute">hermes</span>', highlighted)
        
        # Step 3: 高亮子命令
        subcommands = ['profile', 'kanban', 'config', 'gateway', 'doctor', 'skills', 
                       'chat', 'setup', 'use', 'clone', 'import', 'export', 'delete', 
                       'list', 'show', 'add', 'move', 'update', 'create', 'rename', 
                       'install', 'run', 'stop', 'start']
        for cmd in subcommands:
            highlighted = re.sub(rf'\b{cmd}\b', f'<span class="code-snippet__attribute">{cmd}</span>', highlighted)
        
        # Step 4: 高亮 flag
        highlighted = re.sub(r'(--[\w-]+)', r'<span class="code-snippet__flag">\1</span>', highlighted)
        
        # Step 5: 恢复路径
        for i, path in enumerate(path_matches):
            highlighted = highlighted.replace(f'{P_PATH}{i}{P_PATH}', f'<span class="code-snippet__path">{path}</span>')
        
        # Step 6: 恢复字符串
        for i, s in enumerate(str_matches):
            highlighted = highlighted.replace(f'{P_STR}{i}{P_STR}', f'<span class="code-snippet__string">{s}</span>')
        
        result_lines.append(highlighted)
    
    return '\n'.join(result_lines)

def wrap_code_block(code_content):
    """将代码块包装成带语法高亮的完整 HTML"""
    highlighted = highlight_hermes_cmd(code_content)
    return f'''<section class="code-snippet__js">
<pre class="code-snippet__js code-snippet code-snippet_nowrap" data-lang="shell"><code><span leaf="">{highlighted}</span></code></pre>
</section>'''
```

**批量处理函数**：
```python
def process_article_code_blocks(filepath):
    """处理文章中的所有代码块"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    pattern = r'<pre><code[^>]*>(.*?)</code></pre>'
    
    def replace_code_block(match):
        code_content = match.group(1)
        # 解码 HTML 实体
        code_content = code_content.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
        # 高亮并包装
        wrapped = wrap_code_block(code_content)
        return wrapped
    
    new_content = re.sub(pattern, replace_code_block, content, flags=re.DOTALL)
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    return len(re.findall(pattern, content, flags=re.DOTALL))
```

**For inline SVG diagrams**:
- **竖屏优先原则**: 手机竖屏是主要阅读场景。SVG 配图尽量竖版布局（窄宽高个），避免横版。横版 SVG 在手机上会被缩小，文字显得很小。
  - ✅ 推荐：viewBox 宽 680，高 300-500，内容竖排列表
  - ❌ 避免：viewBox 宽 750+，多列横排，在手机上文字缩到看不清
- **SVG 与图文间距**：SVG 前后各需一段视觉呼吸空间
  - 用 `<section>` 包裹：`style="margin:12px 0;padding:0;line-height:1"`（上下各留 12px 空行）
  - SVG 核心属性：`display:block;vertical-align:bottom;width="100%"`
  - **重要**：`vertical-align:bottom` 消除基线间隙（SVG 默认 inline-block 产生 descender gap），`margin:12px 0` 提供图文之间的空行
  - SVG 用 `width="100%"`，**不写死 height**（通过 viewBox 自适应）
  - SVG `font-size="20"`（比正文 17px 大，微信缩放后仍清晰）
  - ⚠️ 改 viewBox 宽度时必须同步调所有 `<rect>` 的坐标和尺寸

### Step 6: Output the File

1. Save the HTML to the same directory as the source content, or `/tmp/` if no source file exists. File name format: `{article-slug}-wechat.html` or `wechat-{article-slug}.html`
2. Report the file path to the user
3. Include instructions for use:
   ```
   打开 {filename}，全选（Ctrl+A / Cmd+A）→ 复制（Ctrl+C / Cmd+C）→ 粘贴到微信公众号编辑器。
   ```

## Common Mistakes

### ❌ Mistake 1: External CSS files
**Problem**: `<link rel="stylesheet" href="...">` — WeChat strips external stylesheets.

**Solution**: Always use `<style>` inside `<head>` with all CSS inline in the document.

### ❌ Mistake 2: External image URLs
**Problem**: `<img src="https://...">` — External images may not load in WeChat article preview.

**Solution**: Convert all images to base64 data URIs. For SVG, embed directly. For photos, use canvas to convert to data URI.

### ❌ Mistake 3: JavaScript interactivity
**Problem**: `<script>` tags — WeChat blocks JavaScript in articles.

**Solution**: Pure HTML/CSS only. No JS at all (except no script needed for static articles).

### ❌ Mistake 4: Very long code blocks without horizontal scroll
**Problem**: Long lines break the article layout.

**Solution**: Always use `pre { overflow-x: auto; }` and `table { table-layout: fixed; }`.

### ❌ Mistake 5: Using non-web-safe fonts
**Problem**: Custom web fonts (Google Fonts CDN) won't load in WeChat.

**Solution**: Use system font stack only:
```css
font-family: -apple-system, BlinkMacSystemFont,
             "PingFang SC", "Microsoft YaHei",
             "Helvetica Neue", sans-serif;
```

### ❌ Mistake 6: Transparent colors
**Problem**: `rgba()` transparency in WeChat article preview often renders incorrectly.

**Solution**: Use solid colors with alpha simulated via opacity only for entire elements, or avoid transparency in foreground text/borders.

### ❌ Mistake 7: CSS class-based styling ← 【最高频 bug，skill 自相矛盾，本次修复重点】
**Problem A（skill 内部矛盾）**: Step 4 HTML 模板示例中用了 CSS class（`.copy-hint`、`.highlight-box` 等），但 Mistake 7 说必须用 inline style。skill 文档自己打架。

**Problem B（WeChat 过滤）**: WeChat 编辑器粘贴时会剥离 `<style>` 块和 CSS class，所有 `.highlight-box`、`.scene`、`.logic` 等样式全部丢失。

**⚠️ 正确做法（两层规则）：**
1. **`<style>` 块**：仅用于 `body`、`p`、`blockquote`、`table`、`code`、`pre` 等基础排版元素。
2. **`h1`、`h2`、`h3` 必须用 inline style**：WeChat 富文本编辑器会剥离 `<style>` 块中的自定义 h2/h3 CSS，导致标题退化为纯文本。
3. **装饰性元素**：所有自定义视觉效果（颜色区块、提示框、标签、图标背景等）必须用 inline style，不依赖任何 CSS class。Step 4 HTML 模板中的 `.copy-hint`、`.highlight-box` 示例全部作废，以下方 inline style 示例为准。

**Before（❌ 错误 — class 在 WeChat 里会被过滤）：**
```html
<div class="highlight-box">内容</div>
<div class="scene">适用场景</div>
<div class="logic">核心逻辑</div>
<div class="copy-hint">复制提示</div>
<p class="small">辅助文字</p>
```

**After（✅ 正确 — 所有装饰元素全部 inline style，区块用 `<section>` 而非 `<div>`）：**
```html
<section style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:8px;padding:14px 18px;margin:18px 0;width:100%;box-sizing:border-box;display:block">内容</section>
<section style="background:#f0f6ff;border-radius:8px;padding:12px 16px;margin-bottom:10px;font-size:15px;color:#333;width:100%;box-sizing:border-box;display:block">适用场景</section>
<section style="background:#e8f5e9;border-radius:8px;padding:10px 16px;margin-bottom:10px;font-size:15px;color:#2e7d32;width:100%;box-sizing:border-box;display:block">核心逻辑</section>
<section style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:14px 18px;margin-bottom:28px;font-size:14px;color:#856404;width:100%;box-sizing:border-box;display:block">复制提示</section>
<p style="font-size:13px;color:#888">辅助文字</p>
```

**⚠️ 关键**：装饰性区块必须用 `<section>` 而非 `<div>`，因为 operate_appmsg API 会过滤 `<div>` 的 background 样式（详见 Mistake 25）。

**已验证案例（2026-05-21）**：用户反映 12 提问金句文章的"适用场景"蓝底区块、"核心逻辑"绿底区块、"提示词示例"黄底区块全部消失。根因：CSS class 在 WeChat 粘贴后被剥离。

### ❌ Mistake 8: Chinese full-width colon causes line breaks
**Problem**: In list items (`<li>`), the Chinese full-width colon `：` is treated as a line break point by the WeChat editor. Content like `单进程闭环：Agent Loop` breaks into two lines at the colon.

**Solution**: Wrap Chinese colons `：` in `<span style="display:inline">：</span>` within list items and other tight inline contexts.

**Before:**
```html
<li><strong>单进程闭环：</strong>Agent Loop</li>
```

**After:**
```html
<li><strong>单进程闭环</strong><span style="display:inline">：</span>Agent Loop</li>
```

### ❌ Mistake 9: SVG 配图不要用外层 div 包装
**Problem**: 用 `<div>` 包裹 SVG 配图会产生：
- ❌ 双层背景重叠（div 的 background + SVG rect 背景）
- ❌ `overflow:hidden` + `padding` 裁剪内容

**Solution**: SVG 自己处理 border-radius + margin，内部 `<rect>` 做背景，无需 wrapper div。

**Before (broken):**
```html
<div style="background:#fafafa;border-radius:10px;padding:20px;overflow:hidden">
  <svg viewBox="0 0 680 260"><rect width="680" height="260" fill="#fafafa"/>...</svg>
</div>
```

**After (clean):**
```html
<svg viewBox="0 0 680 260" width="100%"
     style="display:block;vertical-align:bottom;margin:4px auto 8px;border-radius:8px">
  <rect width="680" height="260" fill="#fafafa" rx="8"/>...
</svg>
```

### ❌ Mistake 10: SVG 和上下文之间出现大片空白（基线间隙 + 微信渲染器覆盖）

**Problem**: SVG 和前后文字之间出现很大空白，即使设了 `margin:0` 也没用。

**Root cause**（3 个叠加）：
1. **SVG 默认 inline-block + 基线对齐**：SVG 作为行内块元素，按文字基线对齐，下方会留"字母下行空间"（descender gap），形成底部大片空白。**这是最主要原因。**
2. **父元素 line-height / margin 自带间距**：`<p>`、`<section>`、`<h2>` 有默认 margin。
3. **SVG 写死 width/height**：固定尺寸在不同屏幕上产生额外空间。

**⚠️ 特别警告：子任务修改文章内容时，SVG 样式容易被覆盖**

当用 `patch` 工具修改文章 HTML 时，如果子任务修改了正文段落但没有同步保留 SVG 属性，SVG 会被还原成旧版本（`width="680" height="400"` + `display:block;margin:0 auto;border-radius:8px"`）。每次内容修改后必须重新验证 SVG 属性。

**⚠️ 警告 2：子任务修改文章内容时不得稀释主题词**

当用 `patch` 工具或子任务修改文章时，不得以"优化标题/开头"为由将核心主题词（如"Hermes Agent"）替换成泛词（如"AI助手""大模型"）。核心产品名必须在标题前 6 字出现，在开头第一段明确提及。这是公众号账号定位的基础——读者看完不知道文章讲什么工具 = 失败。

**⚠️ 警告 3：生成发布脚本时不得用 sed 处理中文引号**

发布脚本中的字符串替换不得使用 `sed`，特别是处理含中文弯引号（`""`）的标题时——sed 的引号转义极易冲突，导致脚本生成失败。正确做法：用 Python 的 `str.replace()` 或 `re.sub()`，将脚本文件复制后做 Python 字符串替换。

**已尝试但失败的方案**：
1. ❌ 只调 SVG margin — 基线间隙是 SVG 内在行为，调 margin 消不掉
2. ❌ 把 section margin 调很小（如 `margin:2px 0`）— 消掉间隙但图文挤在一起，阅读感差
3. ❌ 给 `<p>` 加 `margin-bottom:0` — 微信渲染器忽略内联 margin 覆盖
4. ❌ 用 `<div>` 替代 `<p>` — 微信渲染器给所有 block 元素加默认 margin
5. ❌ 用 `<br>` 替代 `<p>` — 间距反而更大

**✅ 最终 Solution（已验证有效）**：
```html
<!-- section 上下各留 12px 空行，line-height:1 -->
<section style="margin:12px 0;padding:0;line-height:1">
  <!-- SVG 关键：display:block + vertical-align:bottom + width:100% -->
  <svg viewBox="0 0 680 320" width="100%"
       style="display:block;vertical-align:bottom;border-radius:8px">
    <rect width="680" height="320" fill="#f8f9fb" rx="8"/>...
  </svg>
</section>
```

**两个关键修复**：
1. `vertical-align:bottom` — **消除基线间隙**（最重要！）
2. `margin:12px 0` — **上下各留 12px 空行**，图文之间有视觉呼吸空间

**为什么之前的方案无效**：`margin-bottom:0` 和 `margin-top:0` 在微信里不一定生效，但 `vertical-align:bottom` 解决的是根本问题（基线间隙不是 margin，是行内对齐产生的空间）。

### ❌ Mistake 11: 用了普通人看不懂的术语（仅白居易风格下适用）

**⚠️ 本规则仅在用户显式要求「白居易风格」时生效。通用科普风格下可使用专业术语。**

**Problem**: 文章里出现"量子力学"、"赛博朋克"、"米其林三星"、"千亿级别参数"、"涌现"、"容错率"等词。白居易风格要求：文章里任何内容如果不能像白居易的诗那样让学龄前儿童和六十岁老奶奶理解，就不要出现。

**Solution**: 所有内容用生活中的类比来表达。如果某个概念找不到大白话的类比，宁可不说这个概念。原则：<strong>写完之后自检——每一段能不能讲给小学生听？能不能讲给奶奶听？</strong>

**常见术语替换表：**

| ❌ 不要用 | ✅ 换成 |
|-----------|---------|
| 量子力学论文 | 作文 |
| 赛博朋克城市 | 画画 |
| 米其林三星 | 一桌子好菜 |
| 千亿级别 | 数量大到你想不到 |
| 万亿次/涌现 | 无数次/居然学会了 |
| 模式匹配器 | 模仿秀选手 |
| 纯噪声图/去噪 | 全是麻点的图/擦掉麻点 |
| 帧 | 张（图） |
| 一致性 | 不能穿帮 |
| 容错率 | 犯错代价 |
| 训练材料 | 练的东西 |
| 电控系统 | 车子的系统 |
| 数据 | 例子/信息 |
| 模式匹配 | 模仿 |

### ❌ Mistake 12: 文章泛泛而谈，读者无所收获
**Problem**: 文章只解释概念，不解决读者的实际问题。用户要求：文章主旨是让读者"有所获"，解决认知和能力上的具体问题，不是科普展览。

**Solution**: 每篇文章结尾必须有「知道这些，对你有什么用？」板块，从**认知层面、能力层面、判断层面**三个维度给出具体可操作的建议。读者看完应该能回答："我现在可以做什么不一样的事？"

**三色结论区块（必须用 `<section>` + inline style）**：

⚠️ **关键陷阱**：必须用 `<section>` 标签，**不能用 `<div>`**。operate_appmsg API（type=77777 + publish-draft.py 路径）会过滤 `<div>` 的 background 样式，但 `<section>` 的 inline style 可正常保留。2026-06-05 验证：`<div>` 发布后无颜色，改为 `<section>` 后颜色正常。

```html
<!-- 认知层面：淡蓝背景 -->
<section style="background:#e8f0fe;border-left:4px solid #1a73e8;border-radius:4px;padding:14px 18px;margin:18px 0;width:100%;box-sizing:border-box;display:block">
  <strong>认知层面：</strong>消除一个误解或恐惧……
</section>
<!-- 能力层面：淡绿背景 -->
<section style="background:#e8f5e9;border-left:4px solid #34a853;border-radius:4px;padding:14px 18px;margin:18px 0;width:100%;box-sizing:border-box;display:block">
  <strong>能力层面：</strong>给出一个可操作的行动指引……
</section>
<!-- 判断层面：淡黄背景 -->
<section style="background:#fff8e1;border-left:4px solid #f9ab00;border-radius:4px;padding:14px 18px;margin:18px 0;width:100%;box-sizing:border-box;display:block">
  <strong>判断层面：</strong>提醒边界和风险……
</section>
```
⚠️ 三色区块必须用 inline style + `<section>` 标签（WeChat 会过滤 class，operate_appmsg 会过滤 `<div>` 的 background）。颜色体系：蓝=认知，绿=能力，黄=判断（与 Google 风格一致）。

**⑤ VRAM 估算经验公式（工程粗算，仅 AI 模型部署类文章适用）**：

> ⚠️ 以下 GPU/VRAM 规格和算力论证规则仅适用于 AI 模型部署、算力对比等特定主题的文章，不要在通用公众号文章中引用。

用户验证过的经验值：**最小 GPU 显存 ≈ 模型文件大小 × 2.5~3.0**
- 包含：模型权重 + KV 缓存 + 框架/激活/预留（约 2~4GB）
- 适用：vLLM、GPTQ/AWQ 4bit/8bit 量化、长上下文（32K~128K）
- KV 缓存大致和 **层数 × 上下文长度** 成正比，128K 时通常十几 GB
- vLLM 参数建议：`--gpu-memory-utilization` 设 0.85~0.9，留余量给 KV 缓存动态增长

示例（Qwen 3.5 27B INT4）：
- 模型文件：~13.5GB
- 最小显存：13.5 × 2.5 ≈ 33.75GB
- RTX 4090 48GB 够跑，但 128K 时 KV 缓存吃十几 GB，并发别开高

**⑥ 算力论证方向（避免关公战秦琼）**：

❌ 错误示范：消费级 RTX 5090（32GB GDDR7）跟数据中心 GPU 比 → "需要 30 块 5090 才能跑 1Mb"（5090 是消费卡，32GB，不是最强）
✅ 正确方向：从用户调用量反推推理集群规模

**估算路径**：
1. 日均 token 调用量（如 DeepSeek V4：814 亿 token/天）
2. 假设峰值并发 10%，计算总算力需求
3. 除以单卡算力 → 估算集群规模

例如：814 亿 token/天 × 平均 100 FLOPs/token ≈ 8.14 万 PFLOPS。昇腾 950 PR = 1.56 PFLOPS（FP4）。需要约 5200 张。

❌ 不要用"消费级最强显卡"这种模糊表述 → 要标注具体型号+显存+类型（消费/数据中心）
❌ 不要用"1Mb × 单卡显存"来论证 → 要用"1Mb × 并发用户量 → 推理集群规模"

**常见 GPU 规格（2025 年数据，需核实最新）**：
| 型号 | 类型 | 显存 | 说明 |
|------|------|------|------|
| RTX 4090 | 消费级 | 24GB GDDR6X | 桌面游戏卡，本地大模型常用 |
| RTX 5090 | 消费级 | 32GB GDDR7 | 桌面游戏卡，2025年发布，不是"最强"（数据中心卡不在同一赛道） |
| H100 | 数据中心 | 80GB HBM3 | Hopper 架构 |
| H200 | 数据中心 | 141GB HBM3e | Hopper 架构 |
| 昇腾 950 PR | 数据中心 | 112GB HBM | 华为，2026年量产，FP4 1.56 PFLOPS |
| 昇腾 910B | 数据中心 | 32GB HBM | 华为，2024年款 |

**⚠️ 算力论证不要用消费级卡类比**：用"需要 X 块 RTX 5090"来论证算力是关公战秦琼——消费卡和数据中心卡不在同一赛道，无法直接比。正确方向：从日均 token 调用量 × 平均 FLOPs/token → 反推推理集群规模。

**⑥ 国产模型举例优先**（已在上节，但算力论证里也适用）：
- DeepSeek V4 — 1Mb 上下文（~150万字），华为昇腾 950 PR 推理，FP4 1.56 PFLOPS
- Qwen3 32B — 本地推理（INT4 量化约 16GB，24GB 以上显存可跑 FP16）
- 注意：Qwen3（2025年），不是 Qwen3.5（Qwen3 的小版本迭代）

---

### ❌ Mistake 13: 标题优化时把核心主题词替换成泛词

**Problem**: 优化标题（加痛点/数字/悬念）时，把"Hermes Agent"这类核心主题词替换成了"AI助手""大模型"等泛词。读者看完标题不知道文章讲什么工具。

**Example**：
- ❌ 优化后：AI 做出来的总不是你想要的？ → 丢失 Hermes 主题
- ✅ 正确：Hermes Agent 进阶（一）：AI 做出来的总不是你想要的？

**Solution**：
1. 核心产品名（H Ermes/Hermes Agent）必须在标题前 6 字出现
2. 用痛点/数字/悬念 **修饰** 核心主题，不要 **替换** 核心主题
3. 格式：`{主题} {系列编号} {痛点/数字/悬念}`
4. 系列文章保留编号（便于读者排序阅读）

**正确示范**：
```
✅ Hermes Agent 入门（一）：装完不知道干嘛？7件事现在就做
✅ DeepSeek V4 为什么能跑100万字上下文？国产算力的一次实力证明
❌ 装完不知道干嘛？7件事现在就做（丢失 Hermes）
❌ AI助手能做什么？一个公式第一次就做对（丢失 Hermes）
```

---

### ❌ Mistake 14: 子任务修改文章内容时覆盖了 SVG 间距修复

**Problem**: 用 `patch` 工具修改文章 HTML 时，子任务如果修改了正文段落但没有同步保留 SVG 属性，SVG 会被还原成旧版本。

**典型旧版本问题**：
```html
❌ width="680" height="400"   # 写死尺寸
❌ display:block;margin:0 auto  # 缺少 vertical-align:bottom
❌ section style="margin:2px 0"  # 旧间距
❌ style="margin-bottom:0"        # 残留旧 margin 控制
```

**⚠️ 每次内容修改后必须重新验证 SVG 属性**：
- `vertical-align:bottom` 是否保留？
- `width="100%"` 是否保留？
- `height` 属性是否已删除（不要写死 height）？
- `section style="margin:12px 0;padding:0;line-height:1"` 是否保留？
### ❌ Mistake 15: 引用项目 README 中的竞品对比表作为事实

**Problem**: 介绍某个开源项目时，直接复制该项目 GitHub README 上的"X vs Y"对比表（如"OpenHuman vs OpenClaw/Hermes Agent"）。这是项目方自己写的营销材料，数据偏向自家产品，读者会当成客观事实。

**Solution**: 
- 竞品数据必须从**独立第三方来源**或**实际使用经验**中获取
- 如果只有项目 README 上的对比表，删除或改为"据该项目官方介绍"并加上说明
- 表格中的功能对比只保留 README 公开声明的功能（开源/闭源、License 等），不要把竞品的功能描述写成确定事实

**Example**:
```html
❌ <td>❌ 闭源</td><td>⚠️ BYO</td><td>❌ 无自动同步</td>  ← 来自项目自述，可能有偏
✅ <td>✅ GPL-3.0 开源</td>  ← 事实性信息，可保留
✅ <td>据其 GitHub 页面称支持 OAuth 集成</td>  ← 标清来源
```

---

### ❌ Mistake 16: 文中配置命令未经实际验证

**Problem**: 在文章里写了 Hermes Agent 配置 SenseNova API 的命令（如 `hermes config set model.name`），但这些命令是凭记忆推断的，没有在实际环境里跑过验证。写进了文章就会误导大量读者。

**Solution**: 
- 配置类命令必须先在实际环境验证，确认字段名和格式正确再写进文章
- 如果没验证过，在文章里明确说明"以下配置未经实际验证，建议先在测试环境试跑"
- 正确格式（已验证）：`hermes config set model.provider custom` + `hermes config set model.default sensenova-6.7-flash-lite`（不是 `model.name`，不是 `custom/sensenova-xxx`）

---

### ❌ Mistake 17: 违反 skill 流程直接 patch HTML

**Problem**: 收到"更新文章"指令时，直接用 `patch` 工具修改 HTML 再手动 extract body → publish，绕过了 `wechat-article-generator` skill 规定的完整流程（skill_view → 生成 HTML → extract body → publish-draft.mjs）。

**Solution**: 严格按 Implementation Workflow 走：
1. `skill_view(wechat-article-generator)` — 加载 skill
2. 生成完整 HTML 文件
3. 用 Python 正则 extract body，去除非正文元素
4. 用 `terminal()` 运行 bun 发布脚本（不要用 `execute_code`，Bun 子进程会超时）
**不得跳过 skill 直接操作 HTML 文件。**

### ✅ "补充最新消息" / "在已修改文章基础上更新" 工作流

当用户说"补充一下最新消息"、"更新一下"、"加一段"、"注意文章内容我已经修改，你需要在此基础上更新补充"等更新指令时：

**⚠️ 关键判断：用户是否已手动修改过草稿？**

| 用户说的话 | 含义 | 数据源 |
|-----------|------|--------|
| "补充一下最新消息"、"加一段" | 用户未改草稿，在原文基础上加 | 用本地 HTML 文件 |
| "文章内容我已经修改，你需要在此基础上更新" | **用户已手动改过草稿** | **必须先从微信拉取最新草稿** |

**Step 0（用户已修改时必须执行）：从微信拉取当前草稿内容**

当用户明确说"已修改"时，本地 HTML 文件已过期，必须从微信 API 拉取：

```python
# 通过 list_card API (type=77) 拉取草稿内容
# 注意：operate_appmsg get_detail API 对 type=77777 草稿返回 200009 not found
# 但 list_card (type=77) 能返回 content 字段
import asyncio, json, urllib.request, re

tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9222/json").read())
wechat_tab = next(t for t in tabs if "mp.weixin.qq.com" in t.get("url", ""))
token = re.search(r'token=(\d+)', wechat_tab["url"]).group(1)

# 在浏览器内执行 fetch 获取草稿内容
async def fetch_draft(draft_id):
    import websockets
    async with websockets.connect(wechat_tab["webSocketDebuggerUrl"], max_size=50*1024*1024) as ws:
        js_code = f"""
        (async () => {{
            const resp = await fetch('/cgi-bin/appmsg?action=list_card&type=77&begin=0&count=5&token={token}&lang=zh_CN&f=json');
            const data = await resp.json();
            const target = (data.app_msg_info?.item || []).find(i => i.app_id == {draft_id});
            return JSON.stringify({{title: target?.title, content: target?.content}});
        }})()
        """
        await ws.send(json.dumps({"id":1,"method":"Runtime.evaluate",
            "params":{"expression":js_code,"awaitPromise":True,"returnByValue":True}}))
        resp = json.loads(await ws.recv())
        return json.loads(resp.get("result",{}).get("result",{}).get("value","{}"))
```

拿到 content 后，解析 ProseMirror HTML，理解用户做了哪些修改，然后在此基础上补充新内容。

**Step 1：定位或拉取当前文章内容**
- 用户未修改 → 搜索本地 `*-wechat.html` 文件
- 用户已修改 → 从微信 API 拉取（Step 0）

**Step 2：基于最新内容生成更新版**
- 理解用户做了哪些修改（语气、结构、措辞调整等）
- 在用户修改的基础上补充新内容（不要覆盖用户的改动）
- 保持用户的风格和结构调整

**Step 2.5：全文数据交叉核对（必须执行）**
- 添加新数据点后，扫读全文已有的数字是否与新数据矛盾或已过期
- 重点检查：开头/标题中的估值/收入数字是否与正文一致（本 session 教训：开头写"965 亿"，正文新加的是"9650 亿"，差点发布出去）
- 同一公司在不同段落的数字必须口径一致

**Step 3：发布更新版**
- 生成完整新 body HTML 并通过 publish-draft.py 发布
- publish-draft.py (type=77777) 每次创建新草稿，不会覆盖旧草稿
- 告知用户新旧草稿 ID，提醒删除旧版
```bash
# 提取 body（用 Python 正则）
python3 -c "
import re
with open('/tmp/article-wechat.html','r') as f: c=f.read()
body=re.search(r'<body[^>]*>([\s\S]*)</body>',c).group(1).strip()
body=re.sub(r'<h1[^>]*>.*?</h1>\s*','',body,flags=re.DOTALL)
body=re.sub(r'<p style=\"font-size:13px[^>]*>.*?</p>\s*','',body,flags=re.DOTALL)
body=re.sub(r'<hr\s*/?>\s*','',body)
body=re.sub(r'<!--[\s\S]*?-->\s*','',body)
body=body.strip()
with open('/tmp/article-body.html','w') as f: f.write(body)
print(f'Body: {len(body)} chars')
### 方案A（推荐）：baoyu publish-draft.py（已重写为 type=77777 + FormData）

```bash
~/.hermes/hermes-agent/venv/bin/python \
  ~/.hermes/skills/baoyu-post-to-wechat/scripts/publish-draft.py \
  --title "文章标题（≤64字符）" --file /tmp/article-body.html --digest "摘要"
```

**⚠️ 大内容 Base64 技巧**：当正文 HTML >5000 字符时，直接 JS 字符串插值会触发 `SyntaxError: Invalid or unexpected token`。使用 Base64 编码 + `atob()` 解码绕过限制。详见 `references/wechat-publish-base64-xhr.md`。

**⚠️ Python 脚本生成 HTML 时的中文引号陷阱**：当用 Python 脚本批量生成多篇文章 HTML（如系列文章）时，文章正文里的中文弯引号（`"` `"`）如果出现在用 `"` 双引号包裹的 Python 字符串里，会导致 `SyntaxError: invalid syntax`。write_file 的 lint 检查能发现错误但只指向第一个出错行，修复一个又冒出下一个，反复 patch 非常耗时。

**正确做法**：
1. **统一用单引号 `'...'` 包含含中文引号的文本**，或用 `'''...'''` 三引号
2. **避免在正文文本中使用 `\"` 转义**——直接改用单引号包裹或去掉引号
3. 大批量生成前，先用 `ast.parse(source)` 循环定位所有出错行，一次修完再执行

**方案A（推荐）：baoyu publish-draft.py（已重写为 type=77777 + FormData）**

### ❌ Mistake 23: Token 过期时绕过 bun 脚本手写 CDP

**Problem**: `bun publish-draft.mjs` 因 token 过期返回 `invalid session` 后，不重新跑 bun 脚本，而是自己用 Python + websockets 手写 CDP 调用来发布。这绕过了 skill 里已封装好的参数构建、错误处理逻辑，容易踩坑（token 在 URL params 不在 cookies、字段格式错误等）。

**Solution**: token 过期时的正确恢复路径：

**首选（Python 同步 XHR）**：直接用 `execute_code` + CDP WebSocket 在浏览器内执行同步 XHR 调用 `operate_appmsg`，这是已验证最可靠的方式（详见「发布到草稿箱的完整可执行流程 → 方案A」）。

**备选（重新运行 bun 脚本）**：
1. 截图发给用户扫码登录
2. **直接重新运行 `bun publish-draft.mjs`**——脚本会自动从页面 URL 提取新 token
3. 不要手写 Python+websockets CDP 调用

**已发生的教训**：手写 CDP 时先从 cookies 找 token（找不到），又用相对路径调 API（返回 444002），折腾多轮。Python 同步 XHR 方案一步搞定。

---

### ❌ Mistake 18: 对话中途从 Q&A 切换到文章发布，未触发 skill

**Problem**: 用户先问了问题（如"AI为什么也会一本正经胡说八道？"），我以普通Q&A回答；然后用户说"润色上面的文章发布到草稿箱"——这是从问答切换到文章生成，但我没有在用户说"发布"之前就加载 skill，导致还是用普通回答的方式处理文章内容，未走 skill 流程。

**识别信号**：
- 用户说"润色一下上面的文章"、"重新发布"、"发到草稿箱"等
- 用户说"写微信公众号文章要调用wechat-article-generator"（用户主动告知要调用 skill = 我之前漏用了）
- 任何将已有内容转化为公众号文章的动作

**Solution**: 一旦识别到发布意图，立刻：
1. `skill_view(wechat-article-generator)` — 重新加载 skill（如果之前只是普通Q&A）
2. 按照 skill 流程重新生成 HTML，走完整流程
3. **绝对不能**用之前 Q&A 时的笔记/摘要直接生成 HTML 发布

**正确示范**：
```
用户：AI为什么也会一本正经胡说八道？（只是问问题）
→ 普通回答，不需要 skill

用户：写微信公众号文章要调用wechat-article-generator，把这个写入记忆，然后润色一下上面的文章发布到草稿箱
→ 立即 skill_view(wechat-article-generator)
→ 按照 skill 流程：生成完整 HTML → 提取 body → bun publish-draft.mjs
```

**⚠️ 特别警告：用户说"没插图"时，插图是可选的，不是强制步骤**
- 用户明确说"没有插图"或"不需要图" → 不生成插图，直接按纯文字文章处理
- 但封面图（cover image）是默认要生成的，除非用户明确说不需要

---

### ❌ Mistake 19: SVG 字号太小或文字溢出
**Problem**: SVG 内用 11-13px 字号在手机上几乎看不清。
- 加大字号后文字溢出背景 `<rect>`（只改了 font-size 没调 rect 的 width/height 和坐标）

**Solution**: 
1. SVG 内所有文字统一 `font-size="20"`（比正文 17px 大一号，确保微信缩放后仍清晰可读）
2. **放大 font-size 时必须同步调整背景矩形尺寸**：rect 的 width/height 和内部文字坐标都要按比例增加，留出足够 padding

**Before (overflow):**
```html
<rect x="30" y="48" width="190" height="60"/>  <!-- 190×60 够 font-size="17" -->
<text x="125" y="72" font-size="20">web + memory + skills</text>  <!-- ❌ 文字溢出 -->
```

**After (correct):**
```html
<rect x="25" y="50" width="220" height="65"/>  <!-- 220×65 够 font-size="20" -->
<text x="135" y="78" font-size="20">web + memory + skills</text>  <!-- ✅ 文字在 rect 内 -->
```

**Rule of thumb**: 中文字符在 font-size="20" 下约 20px 宽。"web + memory + skills" ≈ 20 个字符 ≈ 200px 宽。rect 至少需要 220px（加 padding）。

**SVG 柱状图/条形图布局规则**（bar chart）：

在做"模型对比"、"功能对比"等柱状图时，容易踩以下坑：

1. **模型名和数值标注重叠**：不要把标签文字和柱状条放在同一 x 坐标区域。正确做法是**左列放名称，右侧放柱状条，条后放数值**，三者分区不重叠。
2. **柱状条 + 文字超出 viewBox 边框**：计算最大元素（通常是最大值的柱状条）的右边界 + 数值文字宽度，确保 < viewBox 宽度。例如 viewBox 宽 680，柱状条从 x=330 开始最大 200px（到 530），数值文字从 538 开始约 100px = 638 < 680 ✅。
3. **多个相同数值用相同柱状条宽度**（如 Qwen3 256K 和 Kimi 256K 柱状条同宽），按比例缩放。

**正确布局示例**（5 行竖排柱状图，viewBox 680×400）：
```html
<!-- 每行结构：名称(x=20) | 柱状条(x=330) | 数值(柱状条右侧+8px) -->
<text x="20" y="64" font-size="20" font-weight="600" fill="#1565c0">DeepSeek V4 — 1M</text>
<rect x="330" y="46" width="200" height="26" rx="4" fill="#bbdefb"/>
<text x="538" y="64" font-size="20" fill="#555">~150万字</text>
```

**横向柱状图（价格对比/供应商对比）专用布局**：
```html
<!-- viewBox="0 0 680 300"，每行：供应商名(左) | 柱状条(从中线向右延伸) | 价格(条末端) -->
<!-- Y轴：x=0~130px 放供应商名；X轴：x=130~620 做刻度柱状 -->
<!-- 刻度线 + 网格线：增强可读性 -->
<!-- 颜色区分：红色系=运营商，蓝色系=API平台 -->
<!-- 图例在底部：矩形+文字，无线条（线条与柱状条重复） -->
<!-- 价差标注：柱状条末端加文字说明，如"DeepSeek比运营商便宜9.9倍" -->
```
⚠️ **柱状图反面教训**：不能用独立矩形块代替柱状图（无坐标轴/无刻度 = 读者看不出是柱状图）。必须含 X/Y 轴刻度线、网格线、轴标签。
**Note on HTML template comments**: The HTML output template uses `<!-- COPY HINT -->`, `<!-- COVER IMAGE -->`, `<!-- ARTICLE HEADER -->` comments in `<body>`. These are intentional for readability but **must be stripped** before injecting body content into the WeChat ProseMirror editor.

### ❌ Mistake 20: 用 ul/li 列举关键要点导致阅读断裂

**Problem**: 用 `<ul><li>` 列举重要注意事项（如"并发数别开高"、"参数别拉满"），在微信渲染器中视觉上像次要信息，容易被跳过。且格式上和正文段落割裂。

**Solution**: 关键要点用普通段落 + `<strong>` 加粗关键词，每点独立成段。

**Before (weak):**
```html
<ul style="font-size:18px;line-height:1.8;color:#333">
<li>并发数别开高，一两个就够</li>
<li>vLLM 的 --gpu-memory-utilization 建议设成 0.85~0.9</li>
</ul>
```

**After (strong):**
```html
<p>所以虽然 48GB 够跑，但有两件事要注意：</p>
<p>一是<strong>并发数别开高</strong>，一两个就够——显存是共享的，并发多了每路的 KV 缓存就被稀释了。</p>
<p>二是 vLLM 的 <code>--gpu-memory-utilization</code>，建议设成 <strong>0.85~0.9</strong>，别拉满。</p>
```

**Rule**: `<ul><li>` 只用于真正的列表（如功能清单、对比表）。重要建议、注意事项用段落+加粗。

### ❌ Mistake 22: operate_appmsg API 参数错误导致 200002 参数错误

**Problem**: 调用 `operate_appmsg?sub=create` 发布草稿时，用了错误的参数值：
- `AppMsgId: '0'` → 微信要求空字符串 `''`
- `fileid0: '-1'` → 微信要求空字符串 `''`

导致返回 `{\"ret\":\"200002\",\"base_resp\":{\"err_msg\":\"参数错误，请注意备份内容后重试\"}}`。

**Solution**: 使用以下经验证的参数组合（2026年5月实测成功）：

```javascript
var p = {
  token: '${token}', lang: 'zh_CN', f: 'json', ajax: '1',
  random: Math.random().toString(), AppMsgId: '', count: '1',
  data_seq: '0', operate_from: 'Chrome', isMark: '0'
};
p['title0'] = TITLE;
p['content0'] = bodyContent;
p['author0'] = '';
p['fileid0'] = '';         // ✅ 空字符串，不是 '-1'
p['digest0'] = DIGEST;
p['sourceurl0'] = '';
p['need_open_comment0'] = '0';
p['show_cover_pic0'] = '1';
p['copyright_type0'] = '0';
p['can_reward0'] = '0';
p['fee_type0'] = '';
p['pay_fee0'] = '0';
```

**关键字段说明**：
| 字段 | 错误值 | 正确值 |
|------|--------|--------|
| `AppMsgId`（注意大小写） | `'0'` | `''`（空字符串） |
| `fileid0` | `'-1'` | `''`（空字符串） |
| `count` | `'0'` | `'1'` |

**同步 XHR 是关键**：用 `xhr.open('POST', url, false)` 第三个参数 `false` = 同步请求，然后直接 `return xhr.responseText`。异步 `awaitPromise: true` 在 CDP 环境下不稳定（Promise 可能返回 ReferenceError 而非实际响应）。

**URL 用相对路径**：微信内部接口用相对路径 `/cgi-bin/operate_appmsg?...`，不走绝对路径。

---

### ❌ Mistake 25: 三色结论区块 / 装饰区块用 `<div>` 导致 operate_appmsg 发布后无背景色

**Problem**: 用 `<div style="background:#e8f0fe;...">` 包装三色结论区块（认知/能力/判断），通过 ProseMirror 编辑器粘贴时显示正常，但通过 `publish-draft.py`（operate_appmsg API, type=77777）发布后背景色完全消失，只剩边框。

**Root cause**: WeChat 的 operate_appmsg API 对 `<div>` 的 `background` inline style 有过滤，但 `<section>` 的同名 inline style 可正常保留。两条路径行为不一致：
- ProseMirror 编辑器粘贴路径：`<div>` background 正常保留
- operate_appmsg API 路径：`<div>` background 被过滤 ❌

**Solution**: 所有装饰性区块（三色结论、提示框、信息盒）一律用 `<section>` + `display:block`，不能用 `<div>`。

**Before（❌ operate_appmsg 路径下无背景色）：**
```html
<div style="background:#e8f0fe;border-left:4px solid #1a73e8;border-radius:4px;padding:14px 18px;margin:18px 0;width:100%;box-sizing:border-box">
  <strong>认知层面：</strong>内容
</div>
```

**After（✅ 两条路径都正常）：**
```html
<section style="background:#e8f0fe;border-left:4px solid #1a73e8;border-radius:4px;padding:14px 18px;margin:18px 0;width:100%;box-sizing:border-box;display:block">
  <strong>认知层面：</strong>内容
</section>
```

**关键差异**：
1. 标签：`<div>` → `<section>`
2. 闭合：`</div>` → `</section>`
3. 增加 `display:block`（确保兼容性）

**2026-06-05 验证案例**：发布编程语言淘汰趋势文章，三色区块用 `<div>` 发布后用户反馈"没有颜色"。改为 `<section>` 重新发布（草稿 ID 100000979），颜色正常显示。

**⚠️ 提取 body 时注意**：从完整 HTML 提取 body 用于 publish-draft.py 时，检查 `<div style="background:...">` 装饰区块是否已替换为 `<section>`。Python 正则匹配时注意 `</div>` → `</section>` 的对应替换。

---

### ❌ Mistake 23: h2/h3 样式不生效

**Problem**: 用户反馈"段落标题没有加粗，没有进行美化处理"。根因是 `<style>` 块中的 CSS 在微信编辑器中**被剥离**，h2/h3 标签退化为纯文本标题，失去所有样式。

**Root cause**: WeChat 富文本编辑器对 `<style>` 块的处理策略是"选择性保留"——只保留极少数基础标签的默认样式，自定义的 h2/h3 CSS 会被清除。

**Solution**：**h2/h3 必须使用 inline style**，不能依赖 `<style>` 块。

**Before（❌ 错误）：**
```html
<h2>一、标题</h2>
<style>
h2 { font-size: 20px; border-left: 4px solid #1a73e8; ... }
</style>
```

**After（✅ 正确）：**
```html
<h2 style="font-size:20px;margin-top:8px;margin-bottom:12px;color:#111;border-left:4px solid #1a73e8;padding-left:10px;font-weight:700;">
一、标题</h2>
```

**2026-06-02 验证案例**：用户反馈"段落标题没有加粗，没有进行美化处理"。尝试过两种方式：
1. 纯 `<h2>` + `<style>` 块 → 用户反馈样式不生效
2. 给 h2 添加 inline style → 样式生效 ✅

**结论**：h2/h3 必须用 inline style，不要依赖 `<style>` 块。

**📖 详细参考**：`references/wechat-styling-compatibility.md` — 含完整的 WeChat 样式兼容性指南、三色区块增强样式、验证清单。

---

### ❌ Mistake 24: Token 过期时绕过 bun 脚本手写 CDP

**Problem**: 调用 `operate_appmsg?sub=create` 发布草稿时，用了错误的参数值：
- `AppMsgId: '0'` → 微信要求空字符串 `''`
- `fileid0: '-1'` → 微信要求空字符串 `''`

导致返回 `{"ret":"200002","base_resp":{"err_msg":"参数错误，请注意备份内容后重试"}}`。

**Solution**: 使用以下经验证的参数组合（2026年5月实测成功）：

```javascript
var p = {
  token: '${token}', lang: 'zh_CN', f: 'json', ajax: '1',
  random: Math.random().toString(), AppMsgId: '', count: '1',
  data_seq: '0', operate_from: 'Chrome', isMark: '0'
};
p['title0'] = TITLE;
p['content0'] = bodyContent;
p['author0'] = '';
p['fileid0'] = '';         // ✅ 空字符串，不是 '-1'
p['digest0'] = DIGEST;
p['sourceurl0'] = '';
p['need_open_comment0'] = '0';
p['show_cover_pic0'] = '1';
p['copyright_type0'] = '0';
p['can_reward0'] = '0';
p['fee_type0'] = '';
p['pay_fee0'] = '0';
```

**关键字段说明**：
| 字段 | 错误值 | 正确值 |
|------|--------|--------|
| `AppMsgId`（注意大小写） | `'0'` | `''`（空字符串） |
| `fileid0` | `'-1'` | `''`（空字符串） |
| `count` | `'0'` | `'1'` |

**同步 XHR 是关键**：用 `xhr.open('POST', url, false)` 第三个参数 `false` = 同步请求，然后直接 `return xhr.responseText`。异步 `awaitPromise: true` 在 CDP 环境下不稳定（Promise 可能返回 ReferenceError 而非实际响应）。

**URL 用相对路径**：微信内部接口用相对路径 `/cgi-bin/operate_appmsg?...`，不走绝对路径。

---

### ❌ Mistake 26: 代码高亮 CSS 在 body-only HTML 中未包含

**Problem**: publish-draft.py 需要 body-only HTML（不含 `<html>/<head>`），但代码块使用 `.code-snippet__js` class，需要对应 CSS 才能正确渲染。如果 CSS 仅在 `<style>` 块中定义，body-only 模式下 CSS 丢失。

**Solution**: 在 body-only HTML 中，**在 body 顶部手动添加 `<style>` 标签**，包含 `.code-snippet__js` 相关 CSS：

```html
<style>
    .code-snippet__js { margin: 20px 0; }
    .code-snippet__js pre {
      background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px;
      padding: 16px; overflow-x: auto;
      font-family: "SF Mono", "Monaco", "Fira Code", monospace;
      font-size: 14px; line-height: 1.5;
    }
    .code-snippet__json-key { color: #032f62; }
    .code-snippet__json-value { color: #032f62; }
    .code-snippet__json-number { color: #005cc5; }
    .code-snippet__flag { color: #005cc5; }
    .code-snippet__string { color: #032f62; }
    .code-snippet__path { color: #6a737d; }
</style>
```

**2026-06-14 验证案例**：文章 body 中使用了 `.code-snippet__js` 代码块但 CSS 缺失，代码块无高亮效果。在 body 顶部添加 `<style>` 后修复。

### ❌ Mistake 28: 研究文章排版时先看图片布局，忽略了段落CSS

**Problem**: 当用户分享一个公众号文章链接让我「研究排版」时，先分析了图片密度、图片布局模式（单图/双图/多图），被用户纠正——用户关心的不是图，是**段落包裹样式**（字体、字号、字色、行距、字间距）。

**Root cause**: 提到「排版」时，第一反应是视觉布局（图片怎么摆），但公众号文章的核心阅读体验来自**文字本身的包裹样式**——段落用什么字体、多大字号、什么颜色、行距多少、段落间距多少。

**Solution**: 当用户要求研究一篇公众号文章的排版时，优先级是：

1. **先扒完整 HTML 结构** — 从页面源码提取所有带 inline style 的元素：`<p>`、`<span>` 的文字样式 **以及** `<section>` 的装饰结构（边框、背景色、圆角、flex 布局）
2. **扒装饰元素** — 开头装饰框、段落标题装饰（左右图标 GIF、下划线背景）、结语装饰框（背景色+虚线边框）、CTA 结尾，这些是排版的重要组成部分
3. **提取所有图片 URL** — 原文用 WeChat CDN 的 GIF/PNG 做装饰图标时，必须使用真实 CDN URL，**不要用 Unicode emoji 替代**（用户明确纠正：🌿 不等于原文的叶子图片）
4. **再分析结构** — 段落长短、分段节奏、标题类型、引用格式
5. **最后才看图片**（如果用户没问，跳过）

**⚠️ 关键教训（2026-06 多轮纠正）**：用户说「照抄风格和样式表」「照抄开头，段落标题，内容样式，风格，段落分割样式风格，还有结语样式风格」「那些荷花的图标你没有拔下来」时，意思是**扒取原文的完整 HTML 源码**——包括所有 section 嵌套结构、所有 CDN 图片 URL、所有 CSS 属性值，然后原样复制。**不要只扒文字 CSS，遗漏装饰结构。** 不要猜 CSS 值。

**实际扒取方法**：
```bash
# 1) 用 curl 获取原始 HTML（带移动端 UA，避免 captcha）
curl -s -L -H "User-Agent: Mozilla/5.0 (Linux; Android 13) Chrome/120.0.0.0 Mobile" \
  "https://mp.weixin.qq.com/s/XXXXX" | python3 -c "
import sys, re
html = sys.stdin.read()
# 2) 提取 js_content 中的带 style 的元素
match = re.search(r'id=\"js_content\"[^>]*>([\s\S]*?)</div>\s*<script', html)
if match:
    content = match.group(1)
    styled = re.findall(r'<(p|section|h[12]|span|strong)\s+style=\"([^\"]+)\"[^>]*>[^<]{0,80}<', content)
    for tag, style in styled[:30]:
        print(f'<{tag} style=\"{style}\">')
"
```

**正确示例**（本session扒出的结果）：
```
正文：`<p style="caret-color:rgb(0,0,0);color:rgb(0,0,0);text-align:start;white-space:normal"><span style="font-size:17px;font-family:Optima-Regular,PingFangTC-light"><span leaf="">内容</span></span></p>`
标题：`<p ...><span style="font-size:16px"><strong><span style="font-family:Optima-Regular,PingFangTC-light;font-size:17px"><span leaf="">标题</span></span></strong></span></p>`
引语：`<span style="font-size:18px;font-family:Optima-Regular,PingFangTC-light">`
空行：`<p><span leaf=""><br></span></p>`
```

**⚠️ 关键教训**：不要猜 CSS 值。用户多次纠正后才发现原文用的是 Optima-Regular/PingFangTC-light 字体、17px/18px 字号（2026-06 更新的默认正文 17px、段落标题 18px）、纯黑文字颜色。之前猜的宋体/#5a5a5a/1.4px字间距全部错误。

### ❌ Mistake 27: 写 HTML 时 `<span>` 等标签可能被截断

**Problem**: 生成 HTML 时，`<span>` 标签或属性值可能被意外截断（如 `YOUR_API_KEY"` → `YOUR_A...pan>`），导致代码块渲染出错。

**Solution**: 生成 HTML 后验证关键 `<span>` 标签是否完整闭合。特别是代码块中的 `<span class="...">...</span>` 和 `data-lang` 属性值。

### ❌ Mistake 21: 用原生 ul/li 做列表，微信编辑器渲染不稳定

**Problem**: WeChat 富文本编辑器对外部粘贴的 `<ul>/<li>` 标签兼容性差，`<LI>` 会以原始文本形式显示在行首（如 `· 正常读取：1× 计价` 显示为 `· · 正常读取：1× 计价` 双倍符号，或纯文本 `<LI>` 标签），这是微信过滤外部 HTML 样式时引入的 bug。

**Root cause**: 微信公众号编辑器粘贴时会剥离/重写大部分 CSS class 和部分标签语义，但对 `<ul>/<li>` 的样式补偿机制不完善，导致列表渲染不稳定。

**Solution**: 正文列表一律用"伪列表"——每个条目独立成 `<p>` 段落，用 `· ` 或 `• ` 字符替代原生列表符号。

**无序列表（伪列表）格式**：
```html
<p style="margin:0 0 6px 0;padding-left:12px;">
<span style="color:#333">· 要点一xxxxxxxx</span>
</p>
<p style="margin:0 0 6px 0;padding-left:12px;">
<span style="color:#333">· 要点二xxxxxxxx</span>
</p>
```

**有序列表（伪列表）格式**：
```html
<p style="margin:0 0 6px 0;padding-left:12px;">
<span style="color:#333"><b>1.</b> 步骤一xxxxxxxx</span>
</p>
<p style="margin:0 0 6px 0;padding-left:12px;">
<span style="color:#333"><b>2.</b> 步骤二xxxxxxxx</span>
</p>
```

**核心原则**：只用 `<p>` / `<span>` / 少量 inline style（color、text-align、非常克制的 margin/padding），不依赖 `list-style-*`、`padding-left:20px` 等"外部 CSS 语义"——微信一洗就没。

**这也是大多数 Markdown→公众号工具最终的选择**：正文列表宁可"伪列表"，也不依赖原生 `<li>` 的渲染稳定性。

**适用范围**：所有正文中的列表项。代码块内的列表、表格内的列表除外（那些场景不存在渲染问题）。

## Output Checklist

Before delivering the HTML file, verify:

- [ ] **封面图**：用户手动上传到微信编辑器（草稿箱里点击上传封面），不要写在 HTML 里（WeChat 不支持 SVG data URI 作为封面图）
- [ ] **插图**：inline SVG 元素（不是 `<img>` 包装 data URI），SVG 直接写在 HTML 中，格式见 Mistake 10
- [ ] All CSS is inside `<style>` in `<head>`
- [ ] No external stylesheet links
- [ ] No external image URLs (all embedded as data URIs or SVG)
- [ ] No `<script>` tags
- [ ] Code blocks have `overflow-x: auto` and monospace font
- [ ] **代码块语法高亮**：Hermes CLI 命令使用 `scripts/code-highlight-hermes.py` 处理
- [ ] Table cells have `vertical-align: top`
- [ ] WeChat copy hint is present at the top
- [ ] Font stack covers Chinese on all platforms
- [ ] All decorative elements (colored boxes, hints, illustrations, captions) use inline `style=""` — no CSS classes for visual styling
- [ ] **h2/h3 必须使用 inline style**（WeChat 会剥离 `<style>` 块中的自定义 h2/h3 CSS）
- [ ] **三色区块必须包含 `width:100%;box-sizing:border-box`**（确保背景色覆盖完整）
- [ ] **三色区块必须用 `<section>` 标签**（不能用 `<div>`，operate_appmsg 会过滤 `<div>` 的 background）
- [ ] **所有装饰性区块（提示框、信息盒、高亮区）一律用 `<section>` + `display:block`**
- [ ] SVG `width="100%"` ✓ — 固定 `height` 属性已删除（**两者不能并存！**）
- [ ] Chinese full-width colons `：` in `<li>` items wrapped in `<span style="display:inline">：</span>`
- [ ] SVG 配图无 wrapper div，直接在 SVG 元素上设置 border-radius + margin
- [ ] File name ends in `.html`

## Content Writing Guidelines

### 公众号算法与内容优化（2025-2026 算法规则）

> 核心变化：算法已从"订阅主导"转向"社交+算法"双引擎。完读率取代点击率成第一指标，社交传播（朋友推荐）权重高达 35%。

**① 标题设计（冷启动生死线）**：
- 标题是冷启动期点击率的决定性因素，直接决定能否进入流量池晋级赛
- **关键词前置法则**：核心搜索词必须放在标题前 6 个字。例如"公众号推流算法"而非"算法：公众号推流秘籍"
- **三段式结构**：痛点/悬念 + 数字/对比 + 身份标签
  - ✅ 《装完 Hermes 不知道干嘛？7 件事现在就做》
  - ✅ 《AI 老忘事、总断片？搞懂这 3 个概念效率翻倍》
  - ❌ 《Hermes Agent 入门指南（三）》— 无痛点、无数字、关键词靠后
- **⚠️ 主题关键词不得被优化掉**：优化标题和开头时，"Hermes Agent"这类核心主题词必须保留，不能为了加痛点/数字就把主题词替换成泛词（如"AI助手""大模型"）。读者看完不知道文章讲什么工具 = 标题失败。
- **系列文章标题格式**：（N）编号紧跟核心关键词，便于读者按顺序阅读
  - ✅ 《Hermes Agent 入门（一）：装完不知道干嘛？7 件事现在就做》
  - ❌ 《装完 Hermes Agent 不知道干嘛？7 件事现在就做》— 无编号排序困难
- **避免标题党**：系统有"无效流量排查"，标题与内容严重不符→跳出率飙升→直接停止推荐

**② 内容架构（为"滑动"而设计）**：
- **黄金 7 秒开头**：前 50 字必须出现"痛点场景 + 解决方案预告"。对于"问题发现→分析→解决"类文章，开头应简要叙述**具体做了什么任务时发现了问题**（如"在给 XX 做增强时反复 patch 了七八次，功能跑通以为可以收工"），再引出文章主题。不要用抽象概述（如"最近在优化一个 AI Agent 的图片生成技能"）。
- **模块化写作**：每 300 字设一个小标题或认知爆点，段落不超过 3 行，多空行分隔
- **视觉锚点**：每隔 3-4 屏（约 600 字）插入 SVG 配图/数据图表，可提升 30% 点击率
- **信息密度峰值**：少说正确的废话，每 300 字必须给一个实用技巧或反常识观点

**③ 互动设计（撬动社交推荐）**：
- 互动权重排序：分享 > 评论 > 点赞 > 在看
- **降低互动门槛**：不要问"你怎么看？"，要问具体、有代入感的小问题
- **评论区运营三板斧**：
  1. 提前埋设争议性问题
  2. 引导赞同/反对对撞
  3. 设置"收藏领资料""留言抽奖"等钩子

**④ 视觉与格式**：
- 封面图：900×383px，≤200KB，文字占比 <30%。模糊图扣 30% 首次推荐权重
- SVG 交互内容因提升停留时长，获得算法额外加权
- 图文叠加短视频的推荐权重是纯图文的 3 倍

**⑤ 排版模板选择**：
- 知识科普/热点解读/文化故事类文章 → 走 **Step 4B（讲故事路径）**，加载 `references/layout-template-storytelling.md`
  - **v4（2026-06 更新）**：含完整 8 组件装饰结构 — ①开头绿色框 ②段落标题（左右GIF+绿色下划线）③正文区（左侧叶子装饰栏+虚线+右栏文字）④正文段落（18px标题, 17px正文, margin:0 0 2px，无空行）⑤分割线装饰 ⑥结语绿框 ⑦音乐推荐列表 ⑧CTA结尾
  - ⚠️ 所有装饰图片使用原文 WeChat CDN URL，不要用 Unicode emoji 替代
  - ⚠️ 段落 `margin:0 0 2px 0`，各组件直接紧挨不加空行
  - ⚠️ 用户说「照抄样式」= 扒完整 HTML 结构（含 section 嵌套+图片URL），不是只扒文字 CSS
- 技术教程/工具介绍类文章 → 使用默认排版（h2/h3 inline style + 三色结论区块）
- 判断标准：**想让读者「读得舒服」→ 参考段落样式模板；想让读者「逻辑清晰地学」→ 用默认排版**

**⚠️ 不要猜 CSS 值。** 参考原文样式时，从页面源码 js_content 扒 `<p>` 和 `<span>` 的 inline style，不要凭感觉写「宋体」「#5a5a5a」「letter-spacing:1.4px」等值。用户会识别出这不是原文的样式。

**⑥ 算法红线**：
- 原创内容推荐权重是转载的 3 倍
- AI 生成内容需标注"AI 辅助比例"，未标注会被限流
- 80% 以上内容聚焦单一细分领域，跨领域发文打乱账号标签
- 刷量/买赞等非真实互动会被识别降权，一次违规可能 30 天流量封禁
- 新号前 10 篇保持日更，单日推送 >2 次会导致新号限流 3 天

### 自检清单

### 覆盖度检查
写科普/介绍类文章时，必须覆盖主题的**所有主要维度**，不要只讲一个方面。例如写"AI 是什么"不能只讲文本大模型，还要覆盖文生图、文生视频、自动驾驶等其他形态——读者说"还有文生图、文生视频、自动驾驶没有解释到"就是一种覆盖度不足的信号。

**自检方法**：动笔前先列出主题涉及的所有主要子领域/应用形态，确认文章结构是否逐一覆盖。

### 读者获得感
文章的结尾必须让读者觉得"看完有收获"，不是泛泛之谈。具体做法：

1. **认知层面**——帮读者消除一个误解或恐惧（例："AI 不会取代你，会用 AI 的人才会"）
2. **能力层面**——给读者一个可操作的行动指引（例："给它好的指令，输出就越好"）
3. **判断层面**——提醒读者注意边界和风险（例："凡事要验证，它省时间不省判断"）

**❌ 反面**：结尾只总结"AI 很厉害，未来可期"——这是废话。
**✅ 正面**：用类比或引用收束全文，让读者带着具体认知离开（例："熟读唐诗三百首，不会作诗也会吟——AI 就是那个熟读了三千亿首的学徒"）。

### 国产模型优先
文章中举例、对比、引用 AI 模型时，优先使用国产大模型，不要默认用 GPT-4/Claude。

**优先使用的模型（2026 年 5 月数据）**：
- DeepSeek V4 — 1M 上下文（~150 万字）
- Qwen3 — 256K 上下文（~38 万字）
- Kimi K2.5 — 256K 上下文（~38 万字）
- GLM-5.1 — 200K 上下文（~30 万字）
- MiniMax M2.7 — 200K 上下文（~30 万字）

**注意模型命名准确**：DeepSeek V4（非 V3）、MiniMax M2.7（非 M1）、GLM-5.1（非 4.7）。写之前先查证最新版本号和上下文大小。本地模型运行需要 GPU/NPU（不仅仅是"独立显卡"），16G 内存是最低门槛。

### 必须有实际操作步骤
用户明确要求：**"看了文章的人能解决某些具体问题"**。每篇文章必须包含读者可以照着做的具体操作（命令、步骤、配置），不能只讲概念。反面教材：纯科普/概念介绍没有实操 = 读者看完"觉得懂了但不知道怎么做"。

**自检**：写完后检查文章里有没有 ≥3 处读者可以直接复制执行的命令或操作。如果没有，补上。

## Example Output

For the topic "AI Programming Tools Analysis":

1. Generate cover SVG (Theme A: Tech/Cyberpunk) with title and subtitle
2. Add architecture diagram SVG showing agent workflow
3. Convert full article markdown to HTML
4. Save to `ai-programming-tools-wechat.html`
5. Report file path with copy-paste instructions

## Related Skills

- `baoyu-post-to-wechat`: 发布脚本模板（`publish-draft.mjs`）和 CDP 注入工具的来源 skill
- `technical-presentation-generator`: For slide-based presentations
- `slack-copy-rich`: For copying rich text to Slack

## 代码语法高亮格式（通用方案）

微信公众号文章中的代码块应使用轻量级语法高亮，无需外部 JS 库（如 Prism.js、Highlight.js），因为微信编辑器会剥离 `<script>` 标签。

### 核心原则

1. **纯 HTML + CSS**：所有高亮通过 `<span>` 标签 + CSS class 实现
2. **无外部依赖**：不依赖任何 JS 库或 CDN
3. **多语言支持**：通过 `data-lang` 属性区分语言类型
4. **微信兼容**：所有样式使用 `<style>` 块定义，不使用外部 CSS 文件

### HTML 结构

```html
<section class="code-snippet__js">
<pre class="code-snippet__js code-snippet code-snippet_nowrap" data-lang="python">
<code><span leaf="">
<span class="code-snippet__keyword">import</span> <span class="code-snippet__module">json</span>
<span class="code-snippet__keyword">def</span> <span class="code-snippet__function">hello</span>():
    <span class="code-snippet__print">print</span>(<span class="code-snippet__string">"Hello, World!"</span>)
</span></code>
</pre>
</section>
```

### CSS 样式定义

```css
/* === 代码块基础样式 === */
.code-snippet__js {
  margin: 20px 0;
}
.code-snippet__js pre {
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  font-family: "SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace;
  font-size: 14px;
  line-height: 1.5;
}
.code-snippet__js code {
  font-family: inherit;
}
.code-snippet__js code span[leaf=""] {
  display: block;
}

/* === 通用语法高亮颜色（GitHub 风格） === */
/* 关键字：import, def, class, return, if, else, for, while, try, except... */
.code-snippet__keyword {
  color: #d73a49;
  font-weight: 600;
}
/* 函数名 */
.code-snippet__function {
  color: #6f42c1;
}
/* 类名 */
.code-snippet__class {
  color: #e36209;
  font-weight: 600;
}
/* 模块/包名 */
.code-snippet__module {
  color: #005cc5;
}
/* 字符串： "xxx", 'xxx', """xxx""" */
.code-snippet__string {
  color: #032f62;
}
/* 注释： # xxx, // xxx, /* xxx */ */
.code-snippet__comment {
  color: #6a737d;
  font-style: italic;
}
/* 数字： 123, 0x1f, 3.14 */
.code-snippet__number {
  color: #005cc5;
}
/* 布尔值： True, False, None */
.code-snippet__boolean {
  color: #d73a49;
  font-weight: 600;
}
/* 装饰器： @decorator */
.code-snippet__decorator {
  color: #6f42c1;
}
/* 变量/标识符（默认无色） */
.code-snippet__identifier {
  color: #24292e;
}
/* 运算符： +, -, *, /, =, ==, !=, in, is... */
.code-snippet__operator {
  color: #d73a49;
}
/* 参数标志： --flag, -f */
.code-snippet__flag {
  color: #005cc5;
}
/* 文件路径： /home/xxx, ~/xxx */
.code-snippet__path {
  color: #6a737d;
}
/* 命令（如 hermes, python, npm） */
.code-snippet__command {
  color: #d73a49;
  font-weight: 600;
}
/* 子命令（如 kanban, config, profile） */
.code-snippet__subcommand {
  color: #d73a49;
}
/* 类型注解： str, int, List, Dict */
.code-snippet__type {
  color: #e36209;
}
/* JSON key */
.code-snippet__json-key {
  color: #032f62;
}
/* JSON value（字符串） */
.code-snippet__json-value {
  color: #032f62;
}
/* JSON 数字/布尔 */
.code-snippet__json-number {
  color: #005cc5;
}
```

### 各语言高亮分类规则

#### Python

| 元素 | CSS 类 | 颜色 | 示例 |
|------|--------|------|------|
| 关键字 | `.code-snippet__keyword` | 红色 `#d73a49` | `import`, `def`, `class`, `return`, `if`, `for` |
| 函数名 | `.code-snippet__function` | 紫色 `#6f42c1` | `print()`, `len()`, `json.loads()` |
| 类名 | `.code-snippet__class` | 橙色 `#e36209` | `List`, `Dict`, `Optional` |
| 模块名 | `.code-snippet__module` | 蓝色 `#005cc5` | `json`, `os`, `sys`, `asyncio` |
| 字符串 | `.code-snippet__string` | 深蓝 `#032f62` | `"hello"`, `'world'`, `"""doc"""` |
| 注释 | `.code-snippet__comment` | 灰色 `#6a737d` | `# 注释内容` |
| 数字 | `.code-snippet__number` | 蓝色 `#005cc5` | `42`, `3.14`, `0x1f` |
| 布尔/None | `.code-snippet__boolean` | 红色 `#d73a49` | `True`, `False`, `None` |
| 装饰器 | `.code-snippet__decorator` | 紫色 `#6f42c1` | `@app.route`, `@staticmethod` |
| 类型注解 | `.code-snippet__type` | 橙色 `#e36209` | `str`, `int`, `List[str]` |

#### Shell/Bash

| 元素 | CSS 类 | 颜色 | 示例 |
|------|--------|------|------|
| 命令 | `.code-snippet__command` | 红色 `#d73a49` | `python`, `npm`, `git`, `hermes` |
| 子命令 | `.code-snippet__subcommand` | 红色 `#d73a49` | `install`, `run`, `kanban`, `config` |
| 参数标志 | `.code-snippet__flag` | 蓝色 `#005cc5` | `--help`, `-v`, `--file` |
| 字符串 | `.code-snippet__string` | 深蓝 `#032f62` | `"value"`, `'path'` |
| 路径 | `.code-snippet__path` | 灰色 `#6a737d` | `/home/user`, `~/project` |
| 变量 | `.code-snippet__identifier` | 默认 `#24292e` | `$PATH`, `${VAR}` |
| 注释 | `.code-snippet__comment` | 灰色 `#6a737d` | `# 注释` |

#### JSON

| 元素 | CSS 类 | 颜色 | 示例 |
|------|--------|------|------|
| Key | `.code-snippet__json-key` | 深蓝 `#032f62` | `"name"`, `"version"` |
| String value | `.code-snippet__json-value` | 深蓝 `#032f62` | `"1.0.0"`, `"hermes"` |
| Number/Boolean | `.code-snippet__json-number` | 蓝色 `#005cc5` | `42`, `true`, `false` |
| Null | `.code-snippet__keyword` | 红色 `#d73a49` | `null` |

#### YAML

| 元素 | CSS 类 | 颜色 | 示例 |
|------|--------|------|------|
| Key | `.code-snippet__json-key` | 深蓝 `#032f62` | `name:`, `version:` |
| String value | `.code-snippet__string` | 深蓝 `#032f62` | `"value"`, `'path'` |
| 注释 | `.code-snippet__comment` | 灰色 `#6a737d` | `# 注释` |
| 布尔/空 | `.code-snippet__keyword` | 红色 `#d73a49` | `true`, `false`, `null` |

### Python 处理函数

```python
import re

# === 通用高亮函数 ===

KEYWORDS = {
    'python': {'import', 'from', 'def', 'class', 'return', 'if', 'elif', 'else',
               'for', 'while', 'try', 'except', 'finally', 'with', 'as', 'lambda',
               'yield', 'global', 'nonlocal', 'assert', 'del', 'pass', 'break',
               'continue', 'in', 'is', 'not', 'and', 'or', 'True', 'False', 'None'},
    'shell': set(),  # Shell 无固定关键字，用命令匹配
}

FUNCTIONS_PYTHON = {
    'print', 'len', 'range', 'enumerate', 'zip', 'map', 'filter', 'sorted',
    'isinstance', 'hasattr', 'getattr', 'setattr', 'str', 'int', 'float',
    'list', 'dict', 'set', 'tuple', 'open', 'json.loads', 'json.dumps',
    'asyncio.run', 'await', 'super', '__init__', '__str__', '__repr__'
}

TYPES_PYTHON = {
    'str', 'int', 'float', 'bool', 'list', 'dict', 'set', 'tuple', 'NoneType',
    'Optional', 'Union', 'List', 'Dict', 'Any', 'Callable', 'Type'
}

def highlight_code(code, lang='python'):
    """通用代码高亮函数，支持多种语言"""
    code = code.strip()
    lines = code.split('\n')
    result_lines = []
    
    # 占位符（避免正则替换冲突）
    P_STR = '\u0005'
    P_COMMENT = '\u0006'
    P_PATH = '\u0007'
    
    for line in lines:
        highlighted = line
        
        # Step 1: 保护字符串、注释、路径
        str_matches = []
        def save_str(m):
            str_matches.append(m.group(0))
            return f'{P_STR}{len(str_matches)-1}{P_STR}'
        
        # 匹配双引号字符串
        highlighted = re.sub(r'"([^"\\]*(\\.[^"\\]*)*)"', save_str, highlighted)
        # 匹配单引号字符串
        highlighted = re.sub(r"'([^'\\]*(\\.[^'\\]*)*)'", save_str, highlighted)
        
        # 匹配注释（Python # / Shell # / JS //）
        comment_matches = []
        def save_comment(m):
            comment_matches.append(m.group(0))
            return f'{P_COMMENT}{len(comment_matches)-1}{P_COMMENT}'
        highlighted = re.sub(r'(#.*|//.*)', save_comment, highlighted)
        
        # 匹配路径
        path_matches = []
        def save_path(m):
            path_matches.append(m.group(0))
            return f'{P_PATH}{len(path_matches)-1}{P_PATH}'
        highlighted = re.sub(r'(~[\w./-]+|/[\w./-]+)', save_path, highlighted)
        
        # Step 2: 根据语言类型高亮
        if lang in ('python', 'py'):
            # 装饰器
            highlighted = re.sub(r'(@\w+)', r'<span class="code-snippet__decorator">\1</span>', highlighted)
            # 关键字
            for kw in KEYWORDS['python']:
                highlighted = re.sub(rf'\b{kw}\b', f'<span class="code-snippet__keyword">{kw}</span>', highlighted)
            # 函数名
            for func in FUNCTIONS_PYTHON:
                highlighted = re.sub(rf'\b{func}\b', f'<span class="code-snippet__function">{func}</span>', highlighted)
            # 类型
            for typ in TYPES_PYTHON:
                highlighted = re.sub(rf'\b{typ}\b', f'<span class="code-snippet__type">{typ}</span>', highlighted)
            # 数字
            highlighted = re.sub(r'\b(\d+\.?\d*)\b', r'<span class="code-snippet__number">\1</span>', highlighted)
            
        elif lang in ('shell', 'bash', 'sh', 'zsh'):
            # 命令
            commands = {'python', 'pip', 'npm', 'yarn', 'git', 'hermes', 'docker', 
                        'kubectl', 'curl', 'wget', 'cat', 'ls', 'cd', 'cp', 'mv', 
                        'rm', 'mkdir', 'chmod', 'grep', 'sed', 'awk', 'find', 'tar'}
            for cmd in commands:
                highlighted = re.sub(rf'\b{cmd}\b', f'<span class="code-snippet__command">{cmd}</span>', highlighted)
            # 子命令
            subcommands = {'install', 'run', 'start', 'stop', 'build', 'push', 'pull',
                          'create', 'delete', 'list', 'get', 'apply', 'config', 'profile',
                          'kanban', 'skills', 'chat', 'setup', 'use', 'clone', 'doctor'}
            for sc in subcommands:
                highlighted = re.sub(rf'\b{sc}\b', f'<span class="code-snippet__subcommand">{sc}</span>', highlighted)
            # 参数标志
            highlighted = re.sub(r'(--[\w-]+|-[\w])', r'<span class="code-snippet__flag">\1</span>', highlighted)
            # 变量
            highlighted = re.sub(r'(\$\{?\w+\}?)', r'<span class="code-snippet__identifier">\1</span>', highlighted)
            
        elif lang in ('json',):
            # JSON key
            highlighted = re.sub(r'"(\w+)":', r'<span class="code-snippet__json-key">"\1":</span>', highlighted)
            # JSON 数字/布尔/null
            highlighted = re.sub(r'\b(true|false|null)\b', r'<span class="code-snippet__keyword">\1</span>', highlighted)
            highlighted = re.sub(r'\b(\d+\.?\d*)\b', r'<span class="code-snippet__json-number">\1</span>', highlighted)
            
        elif lang in ('yaml', 'yml'):
            # YAML key
            highlighted = re.sub(r'^(\w+):', r'<span class="code-snippet__json-key">\1:</span>', highlighted)
            # 布尔/null
            highlighted = re.sub(r'\b(true|false|null)\b', r'<span class="code-snippet__keyword">\1</span>', highlighted)
        
        # Step 3: 恢复保护的内容
        for i, s in enumerate(str_matches):
            highlighted = highlighted.replace(f'{P_STR}{i}{P_STR}', f'<span class="code-snippet__string">{s}</span>')
        for i, c in enumerate(comment_matches):
            highlighted = highlighted.replace(f'{P_COMMENT}{i}{P_COMMENT}', f'<span class="code-snippet__comment">{c}</span>')
        for i, p in enumerate(path_matches):
            highlighted = highlighted.replace(f'{P_PATH}{i}{P_PATH}', f'<span class="code-snippet__path">{p}</span>')
        
        result_lines.append(highlighted)
    
    return '\n'.join(result_lines)


def wrap_code_block(code_content, lang='python'):
    """将代码块包装成带语法高亮的完整 HTML"""
    highlighted = highlight_code(code_content, lang)
    return f'''<section class="code-snippet__js">
<pre class="code-snippet__js code-snippet code-snippet_nowrap" data-lang="{lang}"><code><span leaf="">{highlighted}</span></code></pre>
</section>'''


def process_article_code_blocks(filepath, default_lang='python'):
    """处理文章中的所有代码块
    
    支持两种模式：
    1. 从 markdown 的 ```lang 提取语言
    2. 统一使用 default_lang
    """
    with open(filepath, 'r') as f:
        content = f.read()
    
    # 匹配 markdown 代码块：```lang ... ```
    pattern = r'```(\w+)?\n(.*?)```'
    
    def replace_code_block(match):
        lang = match.group(1) or default_lang
        code_content = match.group(2)
        # 解码 HTML 实体
        code_content = code_content.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
        # 高亮并包装
        wrapped = wrap_code_block(code_content, lang)
        return wrapped
    
    new_content = re.sub(pattern, replace_code_block, content, flags=re.DOTALL)
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    return len(re.findall(pattern, content, flags=re.DOTALL))
```

### 使用示例

```html
<!-- Python 代码块 -->
<section class="code-snippet__js">
<pre class="code-snippet__js code-snippet code-snippet_nowrap" data-lang="python">
<code><span leaf="">
<span class="code-snippet__keyword">import</span> <span class="code-snippet__module">asyncio</span>
<span class="code-snippet__keyword">import</span> <span class="code-snippet__module">json</span>

<span class="code-snippet__keyword">async</span> <span class="code-snippet__keyword">def</span> <span class="code-snippet__function">fetch_data</span>(url):
    <span class="code-snippet__comment"># 发送 HTTP 请求</span>
    <span class="code-snippet__keyword">async with</span> <span class="code-snippet__module">aiohttp</span>.<span class="code-snippet__function">ClientSession</span>() <span class="code-snippet__keyword">as</span> session:
        <span class="code-snippet__keyword">async with</span> session.<span class="code-snippet__function">get</span>(url) <span class="code-snippet__keyword">as</span> resp:
            <span class="code-snippet__keyword">return</span> <span class="code-snippet__keyword">await</span> resp.<span class="code-snippet__function">text</span>()
</span></code>
</pre>
</section>

<!-- Shell 代码块 -->
<section class="code-snippet__js">
<pre class="code-snippet__js code-snippet code-snippet_nowrap" data-lang="shell">
<code><span leaf="">
<span class="code-snippet__command">hermes</span> <span class="code-snippet__subcommand">kanban</span> <span class="code-snippet__subcommand">create</span> my-project \
  <span class="code-snippet__flag">--columns</span> <span class="code-snippet__string">"Backlog,To Do,In Progress,Done"</span>
</span></code>
</pre>
</section>

<!-- JSON 代码块 -->
<section class="code-snippet__js">
<pre class="code-snippet__js code-snippet code-snippet_nowrap" data-lang="json">
<code><span leaf="">
{
  <span class="code-snippet__json-key">"name"</span>: <span class="code-snippet__json-value">"hermes-agent"</span>,
  <span class="code-snippet__json-key">"version"</span>: <span class="code-snippet__json-value">"0.15.0"</span>,
  <span class="code-snippet__json-key">"features"</span>: [<span class="code-snippet__json-value">"delegate_task"</span>, <span class="code-snippet__json-value">"profiles"</span>]
}
</span></code>
</pre>
</section>
```

### 注意事项

1. **语言映射**：`data-lang` 属性支持别名映射（如 `py` → `python`, `sh` → `shell`）
2. **未识别语言**：如果 `data-lang` 不在支持列表中，默认使用 `python` 高亮规则
3. **复杂语法**：对于需要复杂语法高亮的场景（如 JSX、Template 字符串），建议简化处理或手动标注
4. **性能**：批量处理大文件时，`process_article_code_blocks` 使用正则替换，效率较高

### 扩展支持新语言

如需支持新语言，只需：
1. 在 `highlight_code` 函数中添加 `elif lang in ('xxx',):` 分支
2. 定义该语言的关键字、函数、类型集合
3. 添加对应的 CSS 类（如需要特殊颜色）

## Reference Files

| File | Content |
|------|---------|
| `references/code-highlighting-hermes-cli.md` | Hermes CLI 命令语法高亮格式：HTML 结构、CSS 样式、高亮分类规则、Python 处理函数 |

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/code-highlight-hermes.py` | 批量处理文章代码块的语法高亮：`python scripts/code-highlight-hermes.py <input.html> [output.html]` |
| `references/svg-whitespace-wechat.md` | SVG 空白间距根因分析（基线间隙 + 父元素 margin + 固定尺寸）及验证有效的修复方案 |
| `references/wechat-algorithm-2025.md` | 公众号推流算法规则（2025-2026）：标题关键词前置、完读率优化、互动权重排序、算法红线 |
| `references/domestic-employment-data.md` | 2026年中国就业市场数据（智联/BOSS/领英，AI岗位、薪资、转行预测，已验证可用） |
| `references/publish-script-pattern.md` | 微信公众号草稿发布脚本模式：模板结构、Python 生成辅助函数、常见错误处理 |
| `references/chromium-launch-pattern.md` | Chromium 启动 + 微信公众号扫码登录全流程（terminal background=true、飞书截图推送） |
| `references/wechat-cdp-publish-techniques.md` | WeChat 草稿发布 CDP + API 经验总结（BunCdp 返回值处理、token 获取、WS URL 变化、publish-draft.mjs 静默挂起模式、Python websockets 直连 CDP 后备方案） |
| `references/verification-nuances.md` | AI 产品声量多平台验证：GitHub（技术圈）vs 社媒（大众声量）的解耦分析，OpenClaw 案例 |
| `references/openclaw-lobster-data-2026.md` | OpenClaw 小龙虾 2026年热度数据：微信指数/抖音/GitHub Stars/卸载率等多平台数字（已交叉核实） |
| `references/pricing-data-verification.md` | 大模型 API 价格与运营商套餐数据核实规范：单价换算公式、"元/百万token"单位含义、常见错误记录 |
| `references/wechat-publish-verified-2026-06.md` | Python asyncio CDP + type=77777 + FormData 发布草稿的完整可执行代码（2026-06-02 验证） |
| `references/wechat-publish-base64-xhr.md` | 大内容（>5000 字符）发布技巧：Base64 编码正文 + 同步 XHR，绕过 JS 字符串转义限制（2026-06-02 验证） |
| `references/wechat-styling-compatibility.md` | WeChat 富文本编辑器样式兼容性指南：h2/h3 inline style 规则、三色区块增强样式、验证清单（2026-06-02 验证） |
| `references/hermes-version-history.md` | Hermes Agent 版本功能历史：Web Dashboard 从 v0.9 引入，v0.15 仅增强（Chat 标签页 + MCP Catalog），写作时避免说"v0.15 新增 Dashboard" |
| `references/claude-md-agents-md-research.md` | CLAUDE.md/AGENTS.md 研究资料：Karpathy 四原则、社区补充规则、各工具指令文件对比、行业数据（82K stars）、最佳实践、文章写作角度 |
| `references/layout-template-storytelling.md` | **排版模板：绿色自然风装饰体（v4 原文复刻）** — 从虾精爆文 js_content 扒取的完整 HTML 结构。含 **8 大组件**：①开头绿框（绿圆点+绿边框+叶子图标CDN URL）②段落标题（左右GIF+绿色文字 rgb(101,147,107)+绿色下划线背景CDN URL）③正文区（左侧叶子装饰栏+绿色虚线+右上角装饰背景图+flex右栏）④正文段落（17px, margin:0 0 2px，无空行）⑤分割线装饰（269px居中）⑥结语绿框（浅绿背景rgb(239,247,236)+虚线边框rgb(168,217,154)+圆角）⑦音乐推荐列表（可选）⑧CTA结尾。走 **Step 4B（讲故事路径）**。⚠️ 所有装饰图片用原文 CDN URL，不用 Unicode emoji。 |

## 输出给 operate_appmsg API 的注意事项

当 HTML 用于 `operate_appmsg` API（headless Chrome 直接 API 调用）而非浏览器手动粘贴时：

### 必须生成 body-only HTML（不要包含 `<html>/<head>/<body>`）

`operate_appmsg` 的 `content0` 字段只需要正文 HTML 片段，不需要完整的 HTML 文档结构：

```
✅ <p>正文段落</p><svg>...</svg><h2>标题</h2>...
❌ <!DOCTYPE html><html><head>...</head><body>...</body></html>
```

### 必须去除的非正文元素

```javascript
// 用 operate_appmsg 发布前需要剥离的元素
html = html.replace(/<!--[\s\S]*?-->/g, "");           // HTML 注释
html = html.replace(/<img[^>]*alt="封面图"[^>]*>/gi, "");  // 封面 data URI 图片
html = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, "");     // h1 标题（标题在 title0 字段）
html = html.replace(/<div style="font-size:13px[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");  // 复制提示 div
```

### SVG 配图要求（operate_appmsg 兼容）

| 方式 | ProseMirror 粘贴 | operate_appmsg content0 |
|------|:-:|:-:|
| 内联 `<svg>` 元素 | ✅ | ✅ 保留在 filter_content_html |
| `<img src="data:image/svg+xml,...">` | ❌ | ❌ 被 WeChat 过滤清除 |

**结论**：SVG 必须 inline，不能用 data URI 的 `<img>` 标签。封面图不支持 SVG，用户在微信编辑器草稿箱手动上传（支持 JPG/PNG，900×383px，≤200KB）。

### 完整字段映射

```
content0  = body-only HTML（含 inline style + inline SVG）
title0    = 文章标题（≤64 字符，含标点）
digest0   = 文章摘要（≤120 字）
author0   = 作者名（可空）
fileid0   = 封面图 media ID（可空，为空时草稿显示「不完整」）
```

### 验证方法

`operate_appmsg` 返回后，检查 `filter_content_html[0].content` 是否包含完整 HTML。**不要用草稿列表 API 验证**——它返回的 `content` 字段永远是空的。

## 已验证的发布流程（两步：先起浏览器，后发文章）

> ⚠️ `publish-draft.mjs` 模板本身依赖 Chrome 已启动 + 已扫码登录。**不要**直接运行模板，会因找不到 Chrome WebSocket 而超时。

### 第一步：启动 Chromium 并完成扫码登录

> ⚠️ `publish-draft.mjs` 模板本身依赖 Chrome 已启动 + 已扫码登录。**不要**直接运行模板，会因找不到 Chrome WebSocket 而超时。

**启动命令**（任选一）：

```bash
# 方式A：手动后台运行（推荐）
chromium --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --remote-debugging-port=9222 \
  --user-data-dir=/home/kewang/.hermes/chrome-profile \
  --window-size=1280,900 \
  "https://mp.weixin.qq.com/" &

sleep 8

# 方式B：用 cdp-prosemirror-inject.js 中的内置启动逻辑
# （需要先配置 WECHAT_APP_ID + WECHAT_APP_SECRET 环境变量）
```

**⚠️ 扫码登录的正确方式：**

直接在 `mp.weixin.qq.com` 页面扫码即可（已验证 2026-05 成功）。流程：

1. Chrome 打开 `https://mp.weixin.qq.com/`，显示扫码登录页
2. 通过 CDP 提取 QR 图片（原始 JPEG fetch，~6KB），发送给用户
3. 用户用微信扫码确认，页面自动跳转到后台
4. 检测 URL 包含 `token=` 即表示登录成功

**获取登录二维码截图**（无头环境用户看不到登录页面）：
```javascript
// 用 BunCdp 类截图发给你
// 参考 ~/.hermes/skills/baoyu-post-to-wechat/references/buncdp-flatten-session.md
// 核心步骤：
// 1. GET http://127.0.0.1:9222/json/version → 取 webSocketDebuggerUrl
// 2. 连接 WebSocket（用 page WS，不是 browser WS）
// 3. Page.captureScreenshot → 保存到 /tmp/wechat-login.png
// 4. 发送 MEDIA:/tmp/wechat-login.png 给用户
// 5. 轮询直到 URL 变成包含 token= 的页面 → 登录完成
```

**登录成功后**：Chromium 保持运行，10 分钟内完成第二步。

**验证 cookie**：登录成功后，在 Chrome DevTools Console 执行 `document.cookie.split(';').filter(c => c.trim().startsWith('mp_quobalpha'))`，有输出则 CSRF 流程可走通。

### 第二步：发布文章

**方案A（推荐）：Python + 浏览器内同步 XHR**（已验证 2026-05，详见下方「发布到草稿箱的完整可执行流程」）

**方案B（备选）：bun publish-draft.mjs**（有静默挂起风险）

`publish-draft.mjs` 模板已改用 CLI 参数 `--file/--title/--digest`，**不要**复制模板修改内联变量：

```bash
~/.bun/bin/bun \
  /home/kewang/.hermes/skills/baoyu-post-to-wechat/templates/publish-draft.mjs \
  --title "文章标题（≤64字符）" \
  --file /tmp/article-body.html \
  --digest "文章摘要（≤120字）"
```

**bun 脚本执行方式**：`terminal(background=true)` + `process(wait)` 轮询。`execute_code` 有 60s 硬性超时，不适用于 bun 发布脚本。

```javascript
terminal(
  background=true,
  command=[
    '/home/kewang/.bun/bin/bun',
    '/home/kewang/.hermes/skills/baoyu-post-to-wechat/templates/publish-draft.mjs',
    '--title', '文章标题',
    '--file', '/tmp/article-body.html',
    '--digest', '摘要'
  ],
  notify_on_complete=true,
  timeout=180
)
```

### 常见失败情况

| 症状 | 原因 | 处理 |
|------|------|------|
| `WebSocket error` / 超时 | Chrome 未启动或未监听 9222 端口 | 先启动 Chromium，确认 `curl http://127.0.0.1:9222/json/version` 有返回 |
| `No WeChat tab` | Chrome 打开了错误页面 | 手动导航到 https://mp.weixin.qq.com |
| `token not in url` | 未完成扫码登录 | 重新截图给用户扫码 |
| `exit code 124` | CLI 超时（60s），但草稿可能已创建 | 检查输出中是否有 `ret: 0` + `appMsgId` |
| 标题或内容错乱 | 脚本变量没改全 | 用 Python 一次性替换所有变量 |

### 为什么不能直接用 terminal 工具跑 bun 脚本

`terminal` 工具有 60s 超时限制，而 bun 脚本（Chrome CDP 操作）天然需要 2~5 分钟。正确做法：

1. 用户扫码登录（需要人机交互）
2. 用 `terminal(background=true)` 启动 bun 后台进程
3. 用 `process(wait)` 轮询直到完成

**错误**：`execute_code` subprocess 有 60s 硬性超时（不受 `timeout=` 参数控制），会被 kill 但进程实际还在跑。

---

## 发布到草稿箱的完整可执行流程（已验证）

当用户说"发布到微信公众号草稿箱"时，使用以下已验证的流程：

**第一步：从 HTML 文件提取 body**

用 Python 正则提取 `<body>` 内容并去除非正文元素：

```python
import re

with open("article.html", "r", encoding="utf-8") as f:
    content = f.read()

body_match = re.search(r'<body[^>]*>([\s\S]*)</body>', content)
body = body_match.group(1).strip()

# 去除非正文元素
body = re.sub(r'<div style="background:#fff3cd[^>]*>.*?</div>\s*', '', body, flags=re.DOTALL)  # 复制提示
body = re.sub(r'<h1[^>]*>.*?</h1>\s*', '', body, flags=re.DOTALL)  # h1 标题
body = re.sub(r'<p style="font-size:13px[^>]*>.*?</p>\s*', '', body, flags=re.DOTALL)  # 日期行
body = re.sub(r'<hr\s*/?>\s*', '', body)  # hr 分割线
body = re.sub(r'<p style="text-align:center[^>]*>— END —</p>', '', body)  # END 结尾
body = re.sub(r'<!--[\s\S]*?-->\s*', '', body)  # HTML 注释
body = body.strip()

with open("/tmp/article-body.html", "w", encoding="utf-8") as f:
    f.write(body)
print(f"body length: {len(body)} chars")
```

**⚠️ 必须用 `[\s\S]*` 而不是 `.*` 来匹配 body 内容**：`.*` 默认不匹配换行符，即使加了 `re.DOTALL` 标志，在 `re.search()` 中与 `<body>` 标签交叉匹配时可能失效。直接用 `[\s\S]*` 最可靠。

**第二步：发布**

**⚠️ 必须用 `type=77777` + FormData（2026-05-30 验证）**

- `type=77` 是旧版素材 API，返回 `ret=0` 但内容存入旧版素材区，新版草稿箱不可见。**已废弃。**
- `type=77777` 是新版单图文草稿 API，内容正确保存到新版草稿箱。**必须用此值。**
- 数据格式必须用 **FormData（multipart）**，不能用 URL-encoded string（静默失败不报错）。
- 完整 API 参考：`baoyu-post-to-wechat` skill → `references/operate-appmsg-api.md` 和 `references/type-77777-verified.md`

### 方案A（推荐）：baoyu publish-draft.py（已重写为 type=77777 + FormData）

```bash
~/.hermes/hermes-agent/venv/bin/python \
  ~/.hermes/skills/baoyu-post-to-wechat/scripts/publish-draft.py \
  --title "文章标题（≤64字符）" --file /tmp/article-body.html --digest "摘要"
```

**⚠️ 大内容 Base64 技巧**：当正文 HTML >5000 字符时，直接 JS 字符串插值会触发 `SyntaxError: Invalid or unexpected token`。使用 Base64 编码 + `atob()` 解码绕过限制。详见 `references/wechat-publish-base64-xhr.md`。

核心流程：
1. 脚本自动从 Chrome CDP tab URL 提取 token（三级 fallback）
2. 通过 CDP `Runtime.evaluate` 在浏览器内执行同步 XHR
3. 调用 `operate_appmsg?sub=create&type=77777`，用 FormData 构建 multipart 请求
4. 返回 `ret=0` + `appMsgId` = 成功
5. 验证：用 `list_card` API（`/cgi-bin/appmsg?action=list_card&type=77`）检查 `item[].content`

**验证方式（重要）**：用 `list_card` API 验证内容是否保存，**不要依赖编辑器显示**——编辑器 URL (`t=media/appmsg_edit`) 不兼容 type=77777 草稿渲染，显示为空但数据实际完整。

**方案B（备选）：bun publish-draft.mjs**

```bash
~/.bun/bin/bun \
  /home/kewang/.hermes/skills/baoyu-post-to-wechat/templates/publish-draft.mjs \
  --title "文章标题（≤64字符）" \
  --file /tmp/article-body.html \
  --digest "文章摘要（≤120字）"
```

⚠️ bun 脚本已知问题：
- **静默挂起**：token 过期/缺失时零输出不退出，需要 `process(kill)` 手动终止
- **20s 硬性超时**：Bun 脚本内部有 20s 超时，大内容可能来不及
- **需 `terminal(background=true)`**：不能用 `execute_code`（60s 硬限）

**发布前预检 token**

无论用哪种方案，发布前先确认 token 有效：

```python
import asyncio, json

async def check_token(ws_url):
    import websockets
    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        await ws.send(json.dumps({"id":1, "method":"Runtime.evaluate", "params":{
            "expression": "document.cookie.split(';').map(c=>c.trim()).find(c=>c.startsWith('token='))?.split('=')[1] || 'NO_TOKEN'"
        }}))
        resp = json.loads(await ws.recv())
        token = resp.get("result",{}).get("result",{}).get("value","")
        return token if token and token != "NO_TOKEN" else None

# 用法：先从 curl http://127.0.0.1:9222/json 获取微信 tab 的 WS URL
# token = asyncio.run(check_token(tab_ws_url))
# if not token → 截图发 QR 码给用户扫码
```

**第三步：验证结果（方案A）**

成功时返回：
```
ret: 0 appMsgId: 100000511
Draft created successfully!
Content length: 16577 chars saved
```

`appMsgId` 即草稿 ID。草稿箱中无封面图会显示"不完整"，需手动上传封面。

### ⚠️ 发布脚本中的字符串替换禁止用 sed

处理含中文弯引号（`""`）的标题时，sed 的引号转义极易冲突。正确做法：
- 用 Python 的 `str.replace()` 或 `re.sub()` 生成脚本文件
- 或用 JavaScript 模板字符串（`JSON.stringify()`）包裹中文字符串
