---
name: wechat-publisher
description: "End-to-end WeChat Official Account (微信公众号) content creation and publishing — topic ideation, research, Chinese-first writing, quality review, formatting, and draft publishing. Human review gate before publish."
version: 2.1.0
metadata:
  hermes:
    tags: [wechat, publisher, markdown, chinese, social-media, content-creation, writing]
---

# WeChat Publisher

Create and publish WeChat Official Account articles. Full pipeline from topic ideation to draft box, with human review gate before publish.

## Compliance Note

WeChat updated its policy (2026-04) prohibiting AI-generated content from being published without human review. This skill:
- Saves articles to **draft box only** — never auto-publishes
- Enforces a **human review gate** before final publish step
- AI assists with ideation, research, drafting, and formatting — human makes final call

## Account Types & API Access

WeChat Official Account API access depends on account type:

| Account Type | Draft API | Material API | User API | Template Msg |
|---|:-:|:-:|:-:|:-:|
| Unverified subscription | **48001** | **48001** | **48001** | **48001** |
| Verified subscription | OK | OK | OK | **48001** |
| Verified service | OK | OK | OK | OK |

**Unverified subscription accounts cannot use ANY write API.** All return `errcode: 48001, api unauthorized`.

Workarounds for unverified accounts:
1. **Complete WeChat verification** (300 CNY/year) — opens all APIs, recommended
2. **Obscura headless browser** — automate mp.weixin.qq.com backend via CDP, bypasses API entirely. ~30MB RAM. Needs first-time QR code scan login. **⚠️ As of v0.1.2, Obscura's CDP WebSocket is non-functional** (accepts connections but never responds to commands). CLI `obscura fetch`/`obscura scrape` work fine. Compiled and installed at `~/.cargo/bin/obscura` (ARM64). See `references/browser-automation.md`
3. **baoyu-post-to-wechat** — ✅ **Working**. Chrome/Chromium CDP publishing tool supporting both API and browser methods. Markdown → WeChat HTML with themes, auto image upload. No paid API required for browser method. Uses Chromium headless (`/usr/bin/chromium`) as CDP backend. Installed at `~/.hermes/skills/baoyu-post-to-wechat/`. See `references/browser-automation.md`
4. **Manual copy** — AI creates content, user manually copies to WeChat backend

## Commands

When user asks to write/publish a WeChat article, follow the appropriate workflow:

### `topic <subject>`
Research trending angles for a subject and propose 3 topic options with hooks.

1. Use `web_search` or `baidu-search` skill to research the subject
2. Find 5-8 relevant sources (news, trends, discussions)
3. Propose 3 topic options, each with:
   - Title (catchy, under 30 chars)
   - Hook angle (why readers care now)
   - Key points (3-5 bullets)
   - Target audience
4. Ask user to pick one or provide direction

### `write <subject>`
Full article creation pipeline (steps 1-6 below). Writes complete article with frontmatter, ready for preview.

### `publish <file>`
Format and publish a Markdown file to WeChat draft box. Runs formatting + human preview gate.

### `preview <file>`
Render article as HTML for local preview without publishing.

---

## Full Pipeline: `write` Command

### Step 1: Research + Ideation

- Use `web_search` or `baidu-search` to find 5-8 relevant sources on the subject
- Verify sources are accessible
- Identify trending angles and reader pain points
- Load voice profile if exists (see Voice Training below)

### Step 2: Outline

Generate a structured outline:
- 6-8 sections recommended
- Opening hook (not generic — use specific data, anecdote, or question)
- Each section: heading + 2-3 key points
- Closing: call-to-action or thought-provoking ending
- Present outline to user for approval before writing

### Step 3: Write Draft

Chinese-first writing rules:
- Write in natural, conversational Chinese (not stiff/formal)
- Cite sources inline: "据XX报道..." or "[来源](url)"
- Mark unverifiable claims with `[待核实]`
- Include relevant images/figures with descriptions
- Article length: 1500-3000 chars (WeChat sweet spot)
- Break into short paragraphs (2-4 sentences each) for mobile reading

### Step 4: Self-Review

Check these 8 dimensions (score 1-5 each):

| Dimension | What to check |
|-----------|--------------|
| Hook | Opening grabs attention immediately |
| Structure | Logical flow, clear sections |
| Accuracy | Facts verified, sources cited |
| Voice | Consistent tone, not robotic |
| Clarity | Jargon explained, complex ideas simplified |
| Engagement | Questions, examples, relatable scenarios |
| Mobile-fit | Short paragraphs, scannable headings |
| CTA | Clear closing that drives action or reflection |

If any dimension scores < 3, revise that section. Max 2 revision cycles.

### Step 5: Format as Markdown

Create the article file with proper frontmatter:

```markdown
---
title: Article Title Here
cover: /path/to/cover.jpg
---

# Opening Hook

Content...

## Section Heading

Content...

![Image description](image_url)
```

Rules:
- `title` is **required** in frontmatter
- `cover` is optional (first inline image auto-used)
- Frontmatter must be at the very top
- Use `##` for section headings (not `#`, that's the title)

### Step 6: Preview + Human Gate

1. Render preview: `wenyan render -f article.md`
2. Present to user for review
3. **STOP — wait for human approval before proceeding to publish**
4. Only publish after explicit user approval

---

## Publishing: `publish` Command

### Prerequisites

1. **Node.js >= 20** (v18 fails — wenyan-cli uses `import ... with { type: "json" }` syntax)
   - Check: `node --version`
   - If too old: upgrade and symlink to `~/.local/bin/`
   - Install wenyan: `npm install -g @wenyan-md/cli --registry=https://registry.npmmirror.com`

2. **WeChat credentials** in `~/.hermes/.env`:
   ```
   WECHAT_APP_ID=wx开头的18位ID（不是gh_开头的原始ID）
   WECHAT_APP_SECRET=32位十六进制密码
   ```
   **Common mistake:** `gh_` prefix is the 公众号原始ID (original ID), not the AppID. AppID always starts with `wx`.
   Get from: mp.weixin.qq.com → 开发 → 基本配置

3. **IP whitelist** — add your server's public IPv4:
   ```bash
   # If curl returns IPv6, use python fallback:
   python3 -c "import urllib.request; print(urllib.request.urlopen('http://ipv4.icanhazip.com',timeout=10).read().decode().strip())"
   ```
   Then mp.weixin.qq.com → 开发 → 基本配置 → IP白名单

### Publish to Draft Box

**API method** (verified accounts only):
```bash
scripts/publish.sh article.md
scripts/publish.sh article.md phycat
scripts/publish.sh article.md lapis dracula
```

**Browser automation method** (all accounts):
```bash
# Step 1: Run baoyu script to render HTML and open editor
bun run --bun wechat-article.ts --markdown article.md --theme modern

# Step 2: If script's paste fails (body empty), use CDP injection:
bun run scripts/cdp-prosemirror-inject.js --title "标题" --summary "摘要" --save
```

See `scripts/cdp-prosemirror-inject.js` for the full CDP ProseMirror injection workflow.

Article goes to **draft box only** at https://mp.weixin.qq.com/
User reviews and publishes manually from WeChat backend.

### Available Themes

**wenyan CLI themes** (for verified accounts with API access):
- See `references/themes.md` for full list.
- Quick: `wenyan theme -l`

**baoyu-md themes** (for browser automation, `--theme` flag):
- Available: `default`, `modern` (recommended for tech), `grace`, `simple`, `base`
- Usage: `bun run wechat-article.ts --markdown article.md --theme modern`

**Note:** These are two different theming systems. wenyan themes are for the API publish path; baoyu-md themes are for the browser automation path.

---

## Voice Training

Analyze past articles to extract a writing style profile for consistent voice.

1. User provides 3-5 past article URLs or files
2. Extract content with `web_extract` (URLs) or `read_file` (local files)
3. Analyze for:
   - Sentence length patterns
   - Vocabulary preferences (formal/casual, technical/accessible)
   - Opening styles (data-driven, anecdotal, provocative)
   - Paragraph structure
   - Use of humor/metaphor
   - Closing patterns
4. Save profile to `references/voice-profile.md`

When writing new articles, load voice profile and match the style.

---

## Content Templates

### 技术分享 (Tech Tutorial)
```
title: "XX技术实战：从入门到避坑"
Sections: 背景 → 核心概念 → 实操步骤 → 常见问题 → 总结
```

### 行业分析 (Industry Analysis)
```
title: "XX行业2026：3个趋势和2个机会"
Sections: 现状 → 趋势1 → 趋势2 → 趋势3 → 机会分析 → 行动建议
```

### 观点评论 (Opinion/Commentary)
```
title: "关于XX，我不同意主流观点"
Sections: 主流观点 → 我的看法 → 论据1 → 论据2 → 论据3 → 结论
```

### 实用攻略 (How-to Guide)
```
title: "XX完全攻略：5步搞定XX"
Sections: 问题 → 准备 → 步骤1-5 → 进阶技巧 → 注意事项
```

---

## Image Handling

### Cover Image
- Recommended size: **1080x864px** (2.5:2 ratio)
- First inline image auto-used if no `cover` in frontmatter
- Can generate with `image_gen` tool or use free stock photos

### Inline Images
- Use markdown syntax: `![description](url_or_path)`
- wenyan handles upload to WeChat CDN
- Local paths and URLs both supported

### Generating Illustrations (No GPU)
When `image_gen` is unavailable, generate professional illustrations using HTML/CSS + Chromium headless screenshot. See `references/article-illustrations.md` for templates, sizes, and design patterns.

---

## Pitfalls

1. **Node.js >= 20 required** — wenyan-cli uses `import ... with { type: "json" }` which fails on Node < 20 with `SyntaxError: Unexpected token 'with'`. Check with `node --version`.
2. **PATH not set** — If Node is installed in /opt/node-*/bin but not in PATH, create symlinks: `ln -sf /opt/node-v22.16.0-linux-arm64/bin/{node,npm,npx,wenyan} ~/.local/bin/`
3. **AppID vs 原始ID** — AppID starts with `wx` (18 chars). The `gh_` prefix is the 公众号原始ID, NOT the AppID. Do not confuse them.
4. **AppSecret is 32 hex chars** — It is NOT the same as AppID. Must be obtained from mp.weixin.qq.com > 开发 > 基本配置 > 重置AppSecret.
5. **IPv4 on dual-stack servers** — `curl ifconfig.me` may return IPv6. Use python fallback (see Prerequisites #3). WeChat IP whitelist only accepts IPv4.
6. **Dynamic IP** — Home broadband IPs change on router restart. If `ip not in whitelist` error returns, re-check IP and update whitelist.
7. **wenyan CLI silent on success** — `wenyan publish`, `wenyan render`, `wenyan credential set` all return empty stdout on success. Check exit code ($?) to confirm. Do not interpret empty output as failure.
8. **npm registry timeout in China** — Use mirror: `npm install -g <pkg> --registry=https://registry.npmmirror.com`
9. **Missing frontmatter** — `title` field is required in YAML frontmatter or wenyan errors with "未能找到文章封面".
10. **48001 api unauthorized** — Unverified subscription accounts cannot use write APIs. See Account Types above for workarounds.
11. **npx incompatible on some ARM systems** — `npx -y bun` fails with system npx (Debian's npm too old). Fix: invoke bun directly (`~/.bun/bin/bun`) and strip `-y bun` from args arrays in spawnSync calls.
12. **Obscura CDP WebSocket non-functional (v0.1.2)** — HTTP endpoints work but WebSocket commands get no response. Cannot use for browser automation until fixed. Use `chromium --headless` as CDP backend instead (installed via bullseye-backports on Debian).
13. **WeChat browser session expires ~30-60 min** — Plan all operations within one session window. If page shows "请重新登录", must re-scan QR code. **不要随便杀 Chromium 或删 Cookie 文件**，先检查 session 是否有效（直接在 tab 上访问页面），只在确认过期后才重启。
14. **Headless QR code presentation** — Use CDP `Page.captureScreenshot` to capture login page, save as PNG, send via MEDIA: to user. Login timeout set to 600s (10 min) to allow time for this round-trip.
15. **ProseMirror editor — body content paste fails in headless** — The WeChat editor uses ProseMirror (`.ProseMirror` element), NOT UEditor. `#edui1_contentplaceholder` is just an overlay. The baoyu-post-to-wechat script's copy-paste often fails silently (title fills OK, body stays empty). **Full CDP injection workflow** — see `scripts/cdp-prosemirror-inject.js` for a reusable script. Key steps:
    - Extract body content from rendered HTML (`<div id="output">` → inner content)
    - Strip `WECHATIMGPH_\d+` placeholders and `data:image` URIs from the HTML
    - Clear editor: select all in `.ProseMirror` → `execCommand('delete')`
    - For content >50KB: chunk into 50KB parts, store in `window.__htmlParts[]`, reassemble
    - Inject: `ClipboardEvent("paste")` with `DataTransfer.setData("text/html", html)` on `.ProseMirror`
    - Set title/summary using `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set` to trigger framework change detection
    - Save: click `span.btn` with text "保存为草稿"
    - Verify: `.page_tips` with "已保存"
16. **ProseMirror filters base64 images to plain text** — Do NOT embed `data:image/png;base64,...` in pasted HTML. ProseMirror renders them as visible text strings. Strip all base64 `<img>` tags before injection. For images, use CDP `DOM.setFileInputFiles` on `<input type="file" accept="image/*">` to upload to WeChat CDN.
17. **WECHATIMGPH placeholder text must be stripped** — The md-to-wechat converter inserts `WECHATIMGPH_N` placeholders. These appear as visible text in ProseMirror if not stripped. Remove with regex: `html.replace(/WECHATIMGPH_\d+/g, '')`.
18. **Large content must be chunked for CDP** — Content >50KB exceeds CLI arg limits. Split `JSON.stringify(content)` into 50KB chunks, push to `window.__htmlParts[]`, then `JSON.parse(parts.join(''))`.
19. **NEVER kill Chromium or delete cookies just to re-acquire a QR code** — This destroys an active login session. Always check session validity first by navigating to a page and checking for "请重新登录". Only restart when confirmed expired.
20. **QR code image URL cannot be downloaded directly** — The scanloginqrcode URL requires proper referer/cookies. Use CDP `Page.captureScreenshot` instead.
21. **Chromium headless flags required on Linux** — Must pass `--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage`. Already patched in cdp.ts.
22. **Save verification** — After clicking "保存为草稿", look for `.page_tips` with "已保存". Toast may appear briefly then disappear. No URL redirect on success.
23. **Chromium `--screenshot` requires absolute path** — Relative paths silently fail or write to an unexpected directory. Always use `--screenshot=/full/path/to/output.png`. Verify file exists after rendering.

## Troubleshooting

See `references/troubleshooting.md` for common issues.
See `references/browser-automation.md` for Obscura setup when API is unavailable.

---

## Quick Start (End-to-End Example)

```
User: "帮我写一篇关于AI Agent的公众号文章"

Agent workflow:
1. topic AI Agent  →  research + propose 3 angles
2. [user picks angle]
3. Generate outline → [user approves]
4. Write full article in Chinese
5. Self-review (8 dimensions)
6. Format as Markdown with frontmatter
7. Preview: wenyan render -f article.md
8. [STOP - human review gate]
9. [user approves] → scripts/publish.sh article.md
10. Article in draft box, user publishes manually
```
