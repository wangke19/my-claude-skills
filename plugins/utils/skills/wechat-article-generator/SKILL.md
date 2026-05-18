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

**Architecture Diagram Pattern:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 320" width="680" height="320"
     style="background:#fafafa;border-radius:10px;border:1px solid #e8e8e8;display:block;margin:20px auto;font-family:Microsoft YaHei,PingFang SC,sans-serif">
  <!-- Title -->
  <text x="340" y="30" text-anchor="middle" font-size="16" font-weight="600" fill="#333">架构图标题</text>
  <!-- Boxes -->
  <rect x="20" y="60" width="140" height="60" rx="6" fill="#e3f2fd" stroke="#1a73e8" stroke-width="2"/>
  <text x="90" y="95" text-anchor="middle" font-size="13" fill="#1565c0">模块 A</text>
  <rect x="270" y="60" width="140" height="60" rx="6" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/>
  <text x="340" y="95" text-anchor="middle" font-size="13" fill="#2e7d32">模块 B</text>
  <rect x="520" y="60" width="140" height="60" rx="6" fill="#fff3e0" stroke="#e65100" stroke-width="2"/>
  <text x="590" y="95" text-anchor="middle" font-size="13" fill="#e65100">模块 C</text>
  <!-- Arrows -->
  <line x1="160" y1="90" x2="270" y2="90" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="410" y1="90" x2="520" y2="90" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  <!-- Arrow marker def -->
  <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#666"/></marker></defs>
  <!-- Bottom box -->
  <rect x="270" y="200" width="140" height="60" rx="6" fill="#fce4ec" stroke="#c2185b" stroke-width="2"/>
  <text x="340" y="235" text-anchor="middle" font-size="13" fill="#c2185b">数据库</text>
  <!-- Connecting lines to bottom -->
  <line x1="90" y1="120" x2="90" y2="200" stroke="#999" stroke-width="1.5" stroke-dasharray="4,2"/>
  <line x1="340" y1="120" x2="340" y2="200" stroke="#999" stroke-width="1.5"/>
  <line x1="590" y1="120" x2="590" y2="200" stroke="#999" stroke-width="1.5" stroke-dasharray="4,2"/>
</svg>
```

**Flowchart Pattern (for process diagrams):**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400"
     style="background:#fafafa;border-radius:10px;border:1px solid #e8e8e8;display:block;margin:20px auto">
  <!-- Nodes: rounded rectangles for processes, diamonds for decisions -->
  <!-- Example: Start -> Decision -> Process A / Process B -> End -->
  <circle cx="300" cy="40" r="25" fill="#e3f2fd" stroke="#1a73e8" stroke-width="2"/>
  <text x="300" y="46" text-anchor="middle" font-size="14" fill="#1565c0">开始</text>
  <!-- Decision diamond -->
  <polygon points="300,100 350,145 300,190 250,145" fill="#fff3e0" stroke="#e65100" stroke-width="2"/>
  <text x="300" y="150" text-anchor="middle" font-size="12" fill="#e65100">判断</text>
  <!-- Process boxes -->
  <rect x="80" y="230" width="120" height="60" rx="8" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/>
  <text x="140" y="265" text-anchor="middle" font-size="13" fill="#2e7d32">流程 A</text>
  <rect x="400" y="230" width="120" height="60" rx="8" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/>
  <text x="460" y="265" text-anchor="middle" font-size="13" fill="#2e7d32">流程 B</text>
  <!-- Arrows with labels -->
  <line x1="300" y1="65" x2="300" y2="100" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/>
  <!-- Yes/No branches -->
  <line x1="250" y1="145" x2="140" y2="200" stroke="#666" stroke-width="2"/>
  <text x="180" y="175" font-size="11" fill="#666">是</text>
  <line x1="350" y1="145" x2="460" y2="200" stroke="#666" stroke-width="2"/>
  <text x="420" y="175" font-size="11" fill="#666">否</text>
  <!-- Arrow marker def -->
  <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#666"/></marker></defs>
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

<!-- COPY HINT -->
<div class="copy-hint">
  <strong>📋 复制提示：</strong>打开此页面，全选（Ctrl+A / Cmd+A）并复制（Ctrl+C / Cmd+C），然后直接粘贴到微信公众号编辑器中，格式完整保留。
</div>

<!-- COVER IMAGE (data URI from SVG) -->
<img class="cover-image" src="data:image/svg+xml,[SVG_CONTENT]" alt="封面图">

<!-- ARTICLE HEADER -->
<h1>[Article Title]</h1>
<p class="small">[Author] · [Date]</p>
<hr>

<!-- BODY CONTENT -->
... converted markdown ...

<!-- FOOTER -->
<hr>
<p class="text-center">
  <strong>项目地址</strong>：<a href="...">...</a>
</p>
<p class="text-center small">欢迎交流与转载，注明出处即可。</p>

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

**For inline SVG diagrams**: Place inside `<div class="illustration">...</div>` with optional `<p class="illustration-caption">图注</p>`.

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