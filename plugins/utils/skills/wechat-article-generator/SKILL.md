---
name: wechat-article-generator
description: Generate a WeChat public account (微信公众号) article as a self-contained HTML file ready for copy-paste. Based on markdown content, file path, or topic description, generates: cover image (2.35:1), inline illustrations, formatted HTML that preserves code blocks, tables, lists, blockquotes, and typography. Triggered when user says "generate wechat article", "create wechat post", "make an article for wechat", "convert to wechat format", "微信公众号文章", or similar requests.
---

# WeChat Article Generator

## Overview

Generate a complete WeChat public account article as a self-contained HTML file. The output renders a cover image (2.35:1 aspect ratio), body content with styled illustrations, and all text formatting—ready to copy-paste directly into the WeChat editor with zero formatting loss.

## When to Use

Use this skill when:
- User provides markdown content and wants it published on WeChat
- User provides a file path containing article content
- User describes a topic and wants a full article generated
- User asks to convert existing markdown to WeChat-friendly format
- User wants a cover image and illustrations generated for their article

Don't use when:
- User wants a slide presentation (use `technical-presentation-generator`)
- User wants a raw markdown file
- User wants to actually publish via WeChat API (this only generates HTML)

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
   - Options: tech/cyberpunk, minimal/corporate, nature/calm, gradient/modern
4. **Illustrations**: Which sections need diagrams?
   - Architecture diagrams, flowcharts, comparison tables, or all of the above?
5. **Author/name**: Optional author byline
6. **Date**: Optional publication date (default: today)
```

**If user provides a file path**: Read and parse the file content.

**If user provides raw markdown**: Use as-is.

**If user describes a topic**: Write the full article content based on their description, then generate HTML.

### Step 2: Generate Cover Image (2.35:1 Aspect Ratio)

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

**Converting SVG to data URI for embedding:**
```python
import base64
svg_str = open("cover.svg").read()
# Remove newlines and whitespace for compact embedding
svg_compact = "".join(svg_str.split())
data_uri = f"data:image/svg+xml,{svg_compact}"
```

### Step 3: Generate Inline Illustrations

For body illustrations (architecture diagrams, flowcharts), create inline SVG elements within the HTML.

**⚠️ 竖屏优先原则**：手机竖屏是主要阅读场景。SVG 配图尽量用竖版布局（窄宽高个），避免横版。横版 SVG 在手机上会被缩小，文字显得很小。
- ✅ 推荐：viewBox 宽 680，高 300-500，内容竖排列表
- ❌ 避免：viewBox 宽 750+，多列横排，在手机上文字缩到看不清

**Architecture Diagram Pattern (use inside `<section style="margin:0;padding:0;line-height:1">` wrapper):**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 440" width="100%"
     style="display:block;vertical-align:bottom;margin:4px auto 8px;border-radius:8px;font-family:Microsoft YaHei,PingFang SC,sans-serif">
  <!-- Background -->
  <rect width="680" height="440" fill="#f8f9fb" rx="8"/>
  <rect x="1" y="1" width="678" height="438" fill="none" stroke="#e0e3e8" stroke-width="1" rx="8"/>
  <!-- Title (font-size="20", larger than body 17px for mobile readability) -->
  <text x="340" y="35" text-anchor="middle" font-size="20" font-weight="600" fill="#333">架构图标题</text>
  <!-- Row 1 -->
  <rect x="20" y="60" width="190" height="60" rx="6" fill="#e3f2fd" stroke="#1a73e8" stroke-width="2"/>
  <text x="115" y="95" text-anchor="middle" font-size="20" fill="#1565c0">模块 A</text>
  <!-- Arrow down from A -->
  <line x1="115" y1="120" x2="115" y2="145" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  <!-- Row 2 -->
  <rect x="20" y="150" width="190" height="60" rx="6" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/>
  <text x="115" y="185" text-anchor="middle" font-size="20" fill="#2e7d32">模块 B</text>
  <rect x="235" y="150" width="190" height="60" rx="6" fill="#fff3e0" stroke="#e65100" stroke-width="2"/>
  <text x="330" y="185" text-anchor="middle" font-size="20" fill="#e65100">模块 C</text>
  <rect x="450" y="150" width="190" height="60" rx="6" fill="#fce4ec" stroke="#c2185b" stroke-width="2"/>
  <text x="545" y="185" text-anchor="middle" font-size="20" fill="#c2185b">模块 D</text>
  <!-- Arrow marker def -->
  <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#666"/></marker></defs>
  <!-- Connecting lines row 2 to row 3 -->
  <line x1="115" y1="210" x2="115" y2="260" stroke="#999" stroke-width="1.5" stroke-dasharray="4,2"/>
  <line x1="330" y1="210" x2="330" y2="260" stroke="#999" stroke-width="1.5"/>
  <line x1="545" y1="210" x2="545" y2="260" stroke="#999" stroke-width="1.5" stroke-dasharray="4,2"/>
  <!-- Row 3 -->
  <rect x="20" y="260" width="190" height="60" rx="6" fill="#e1f5fe" stroke="#0277bd" stroke-width="2"/>
  <text x="115" y="295" text-anchor="middle" font-size="20" fill="#0277bd">模块 E</text>
  <rect x="235" y="260" width="190" height="60" rx="6" fill="#f3e5f5" stroke="#7b1fa2" stroke-width="2"/>
  <text x="330" y="295" text-anchor="middle" font-size="20" fill="#7b1fa2">模块 F</text>
  <rect x="450" y="260" width="190" height="60" rx="6" fill="#fff8e1" stroke="#f9a825" stroke-width="2"/>
  <text x="545" y="295" text-anchor="middle" font-size="20" fill="#f9a825">模块 G</text>
  <!-- Final output -->
  <line x1="115" y1="320" x2="115" y2="360" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  <rect x="20" y="360" width="640" height="60" rx="6" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/>
  <text x="340" y="395" text-anchor="middle" font-size="20" fill="#2e7d32">输出结果</text>
</svg>
```

**Flowchart Pattern (use inside `<section style="margin:0;padding:0;line-height:1">` wrapper):**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 520" width="100%"
     style="display:block;vertical-align:bottom;margin:4px auto 8px;border-radius:8px;font-family:Microsoft YaHei,PingFang SC,sans-serif">
  <rect width="680" height="520" fill="#f8f9fb" rx="8"/>
  <rect x="1" y="1" width="678" height="518" fill="none" stroke="#e0e3e8" stroke-width="1" rx="8"/>
  <!-- Start node -->
  <circle cx="340" cy="40" r="25" fill="#e3f2fd" stroke="#1a73e8" stroke-width="2"/>
  <text x="340" y="46" text-anchor="middle" font-size="20" fill="#1565c0">开始</text>
  <!-- Arrow -->
  <line x1="340" y1="65" x2="340" y2="90" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  <!-- Decision diamond -->
  <polygon points="340,95 400,145 340,195 280,145" fill="#fff3e0" stroke="#e65100" stroke-width="2"/>
  <text x="340" y="150" text-anchor="middle" font-size="20" fill="#e65100">判断</text>
  <!-- Yes branch down -->
  <line x1="340" y1="195" x2="340" y2="220" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  <!-- No branch left -->
  <line x1="280" y1="145" x2="180" y2="145" stroke="#666" stroke-width="2"/>
  <text x="215" y="135" font-size="20" fill="#666">否</text>
  <line x1="180" y1="145" x2="180" y2="220" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  <!-- Process A (yes path) -->
  <rect x="260" y="220" width="160" height="60" rx="8" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/>
  <text x="340" y="255" text-anchor="middle" font-size="20" fill="#2e7d32">流程 A</text>
  <!-- Process B (no path) -->
  <rect x="80" y="220" width="160" height="60" rx="8" fill="#e3f2fd" stroke="#1a73e8" stroke-width="2"/>
  <text x="160" y="255" text-anchor="middle" font-size="20" fill="#1565c0">流程 B</text>
  <!-- Merge back -->
  <line x1="340" y1="280" x2="340" y2="320" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="160" y1="280" x2="160" y2="320" stroke="#666" stroke-width="2"/>
  <line x1="160" y1="320" x2="340" y2="320" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  <!-- End node -->
  <rect x="260" y="320" width="160" height="60" rx="8" fill="#fce4ec" stroke="#c2185b" stroke-width="2"/>
  <text x="340" y="355" text-anchor="middle" font-size="20" fill="#c2185b">结束</text>
  <!-- Arrow marker def -->
  <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#666"/></marker></defs>
  <!-- Note below -->
  <text x="340" y="430" text-anchor="middle" font-size="16" fill="#888">* 竖屏布局适配手机阅读</text>
</svg>
```

### Step 4: Generate Full HTML Document

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
    .copy-hint {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 28px;
      font-size: 14px;
      color: #856404;
    }

    /* === COVER IMAGE === */
    .cover-image {
      width: 100%;
      height: auto;
      border-radius: 8px;
      margin-bottom: 32px;
      display: block;
    }

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
    .illustration {
      background: #fafafa;
      border: 1px solid #e8e8e8;
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .illustration-caption {
      font-size: 13px;
      color: #888;
      margin-top: 10px;
      font-style: italic;
    }

    /* === LINKS === */
    a { color: #1a73e8; text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* === STRONG/EM === */
    strong { color: #111; font-weight: 700; }
    em { color: #555; }

    /* === UTILITY === */
    .text-center { text-align: center; }
    .star { color: #f5a623; }
    .small { font-size: 13px; color: #888; }
    .highlight-box {
      background: #e8f5e9;
      border: 1px solid #a5d6a7;
      border-radius: 8px;
      padding: 14px 18px;
      margin: 18px 0;
    }
  </style>
</head>
<body>

<!-- COPY HINT (inline style — WeChat strips CSS classes) -->
<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:14px 18px;margin-bottom:28px;font-size:14px;color:#856404">
  <strong>📋 复制提示：</strong>打开此页面，全选（Ctrl+A / Cmd+A）并复制（Ctrl+C / Cmd+C），然后直接粘贴到微信公众号编辑器中，格式完整保留。
</div>

<!-- COVER IMAGE (data URI from SVG) -->
<img style="width:100%;height:auto;border-radius:8px;margin-bottom:32px;display:block" src="data:image/svg+xml,[SVG_CONTENT]" alt="封面图">

<!-- ARTICLE HEADER -->
<h1>[Article Title]</h1>
<p style="font-size:13px;color:#888">[Author] · [Date]</p>
<hr>

<!-- BODY CONTENT -->
... converted markdown ...

<!-- FOOTER -->
<hr>
<p style="text-align:center">
  <strong>项目地址</strong>：<a href="...">...</a>
</p>
<p style="text-align:center;font-size:13px;color:#888">欢迎交流与转载，注明出处即可。</p>

</body>
</html>
```

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

**For inline SVG diagrams**: Place inside `<section style="margin:0;padding:0;line-height:1">` with the SVG itself handling border-radius and background. See Mistake 9 for the complete pattern.

### Step 6: Output the File

1. Save the HTML to `{PROJECT_ROOT}/{article-slug}-wechat.html` or `{PROJECT_ROOT}/wechat-{article-slug}.html`
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

### ❌ Mistake 7: CSS class-based styling
**Problem**: WeChat editor strips `<style>` blocks and CSS classes on paste. All `.highlight-box`, `.error-box`, `.copy-hint`, `.illustration`, `.text-center`, `.small` etc. lose their visual styling — colored boxes become plain text, hints lose background, illustrations lose borders.

**Solution**: Use inline `style=""` attributes on every element that has visual styling. Never rely on CSS classes for visual presentation. Base typography (`body`, `h1`, `h2`, `p`, `code`, `pre`, `blockquote`, `table`) can use `<style>` since they're standard enough to survive, but any custom decorative element MUST use inline styles.

**Before:**
```html
<div class="highlight-box">Content</div>
<div class="copy-hint">Hint text</div>
<div class="illustration">SVG diagram</div>
<p class="small">Small text</p>
```

**After:**
```html
<div style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:8px;padding:14px 18px;margin:18px 0">Content</div>
<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:14px 18px;margin-bottom:28px;font-size:14px;color:#856404">Hint text</div>
<div style="background:#fafafa;border:1px solid #e8e8e8;border-radius:10px;padding:20px;margin:20px 0;text-align:center">SVG diagram</div>
<p style="font-size:13px;color:#888">Small text</p>
```

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

### ❌ Mistake 9: SVG 配图和上下文之间出现大片空白（基线间隙）
**Problem**: SVG 和前后文字之间出现很大空白，即使设了 `margin:0` 也没用。

**Root cause**（3 个叠加）：
1. **SVG 默认 inline-block + 基线对齐**：SVG 作为行内块元素，按文字基线对齐，下方会留"字母下行空间"（descender gap），形成底部大片空白。**这是最主要原因。调 margin 对它完全无效。**
2. **父元素 line-height / margin 自带间距**：`<p>`、`<section>`、`<h2>` 有默认 margin。
3. **SVG 写死 width/height**：固定尺寸在不同屏幕上产生额外空间。

**已尝试但失败的方案**：
| 方案 | 为什么失败 |
|------|-----------|
| `margin-bottom:0` on `<p>` | 微信渲染器忽略内联 margin 覆盖 |
| `<div>` 替代 `<p>` | 微信给所有 block 元素加默认 margin |
| 负 margin `-10px` | 在微信里无效 |
| section `margin:2px 0` | 邻居元素的默认 margin 不受影响 |

**✅ Solution（验证有效）**：
```html
<!-- section 清零 margin/padding，line-height:1 -->
<section style="margin:0;padding:0;line-height:1">
  <!-- SVG 关键：display:block + vertical-align:bottom + width="100%"（不写死 height） -->
  <svg viewBox="0 0 680 320" width="100%"
       style="display:block;vertical-align:bottom;margin:4px auto 8px;border-radius:8px">
    <rect width="680" height="320" fill="#f8f9fb" rx="8"/>...
  </svg>
</section>
```

**三个关键修复**：
1. `vertical-align:bottom` — **消除基线间隙**（最重要！）
2. `width="100%"` 不写死 height — SVG 自适应容器
3. `display:block` — 确保 SVG 是块级元素

**⚠️ 重要约束：width="100%" 和 height 不能同时写死**
```html
<!-- ✅ 正确：只有 width="100%"，没有 height 属性 -->
<svg viewBox="0 0 680 320" width="100%" ...>

<!-- ❌ 错误：同时写了 width="100%" 和 height="340" -->
<svg viewBox="0 0 680 340" width="100%" height="340" ...>
```

**⚠️ 子任务修改内容时 SVG 属性容易被覆盖**

当用 patch 工具修改文章 HTML 时，如果子任务修改了正文段落但没有同步保留 SVG 属性，SVG 会被还原成旧版本。**每次内容修改后必须重新验证 SVG 属性**：
- `vertical-align:bottom` 是否保留？
- `width="100%"` 是否保留？
- `height` 属性是否已删除？
- `section style="margin:0;padding:0;line-height:1"` 是否保留？

**快速验证正则**：
```python
import re
svg_sections = re.findall(r'<section[^>]*>.*?</section>', html, re.DOTALL)
for i, s in enumerate(svg_sections):
    has_va = 'vertical-align:bottom' in s
    has_width100 = 'width="100%"' in s
    has_section_clear = re.search(r'<section style="[^"]*margin:0[^"]*line-height:1', s)
    print(f"SVG {i+1}: va={has_va}, width100={has_width100}, section_clear={bool(has_section_clear)}")
```

### ❌ Mistake 10: SVG 字号太小或文字溢出
**Problem**: SVG 内用 11-13px 字号在手机上几乎看不清。加大字号后文字溢出背景 `<rect>`（只改了 font-size 没调 rect 的 width/height 和坐标）。

**Solution**:
1. SVG 内所有文字统一 `font-size="20"`（比正文 17px 大，确保微信缩放后仍清晰可读）
2. **放大 font-size 时必须同步调整背景矩形尺寸**：rect 的 width/height 和内部文字坐标都要按比例增加

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

### ❌ Mistake 11: SVG 配图用外层 div 包装
**Problem**: 用 `<div>` 包裹 SVG 配图会产生：
- 双层背景重叠（div 的 background + SVG rect 背景）
- `overflow:hidden` + `padding` 裁剪内容

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

## Output Checklist

Before delivering the HTML file, verify:

- [ ] Cover image is embedded as SVG data URI (2.35:1 aspect ratio, ~900×383)
- [ ] Illustrations are inline SVG with captions where applicable
- [ ] All CSS is inside `<style>` in `<head>`
- [ ] No external stylesheet links
- [ ] No external image URLs (all embedded as data URIs or SVG)
- [ ] No `<script>` tags
- [ ] Code blocks have `overflow-x: auto` and monospace font
- [ ] Table cells have `vertical-align: top`
- [ ] WeChat copy hint is present at the top
- [ ] Font stack covers Chinese on all platforms
- [ ] All decorative elements (colored boxes, hints, illustrations, captions, utility classes) use inline `style=""` — no CSS classes for visual styling
- [ ] Chinese full-width colons `：` in `<li>` items wrapped in `<span style="display:inline">：</span>`
- [ ] SVG `width="100%"` ✓ — 固定 `height` 属性已删除（**两者不能并存！**）
- [ ] SVG has `vertical-align:bottom` to eliminate baseline gap
- [ ] SVG wrapped in `<section style="margin:0;padding:0;line-height:1">`
- [ ] File name ends in `.html`

## Example Output

For the topic "AI Programming Tools Analysis":

1. Generate cover SVG (Theme A: Tech/Cyberpunk) with title and subtitle
2. Add architecture diagram SVG showing agent workflow
3. Convert full article markdown to HTML
4. Save to `ai-programming-tools-wechat.html`
5. Report file path with copy-paste instructions

## Related Skills

- `technical-presentation-generator`: For slide-based presentations
- `slack-copy-rich`: For copying rich text to Slack