# Browser Automation for WeChat Publishing

When the WeChat API returns `48001 api unauthorized` (unverified subscription accounts), browser automation can bypass API limits entirely.

## Obscura (Recommended — Rust, ~30MB RAM)

Obscura is a Rust headless browser with CDP support. Drop-in replacement for headless Chrome.

**GitHub:** https://github.com/h4ckf0r0day/obscura

### Binary Availability

| Platform | Available |
|----------|-----------|
| x86_64-linux | ✅ Pre-built |
| aarch64-macos | ✅ Pre-built |
| x86_64-windows | ✅ Pre-built |
| **aarch64-linux** | ❌ **Must compile from source** |

### Compiling for ARM64 Linux

**Requirements:** Rust 1.75+, cmake, pkg-config, libssl-dev, ~3GB disk on external storage

```bash
sudo apt-get install -y cmake pkg-config libssl-dev
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.cargo/env

# Download source (git clone unreliable on some ARM devices)
curl -sSL -o obscura.tar.gz https://github.com/h4ckf0r0day/obscura/archive/refs/tags/v0.1.2.tar.gz
tar xzf obscura.tar.gz
cd obscura-0.1.2

# Fix: switch from vendored to system OpenSSL (saves ~500MB disk during build)
# Edit Cargo.toml: native-tls-vendored → native-tls
sed -i 's/native-tls-vendored/native-tls/' Cargo.toml

# Build with external disk (internal storage too small for build artifacts)
CARGO_BUILD_JOBS=3 CARGO_TARGET_DIR=/home/kewang/tmp/obscura-build/target cargo build --release
# Takes ~24 minutes on 4-core ARM Cortex-A53

cp /home/kewang/tmp/obscura-build/target/release/obscura ~/.cargo/bin/
cp /home/kewang/tmp/obscura-build/target/release/obscura-worker ~/.cargo/bin/
rm -rf /home/kewang/tmp/obscura-build/target  # reclaim ~2.5GB
```

**⚠️ Critical for low-resource machines (2GB RAM, ARM64):**
- Use `CARGO_BUILD_JOBS=3` max (1 job per GB RAM, rounded up)
- `deno_core_icudata` produces `.rlib` > 500MB — **redirect target to external disk** via `CARGO_TARGET_DIR`
- Must switch to system OpenSSL (vendored OpenSSL compilation exhausts ~19GB internal disk)
- No `--features stealth` flag in v0.1.2
- See `rust-arm64-building` skill → `references/obscura-build-notes.md` for full details

**Cross-compilation alternative:**
```bash
# On an x86_64 machine with cross-compilation setup:
rustup target add aarch64-unknown-linux-gnu
cargo build --release --features stealth --target aarch64-unknown-linux-gnu
# Then copy binary to ARM server
```

### Usage

```bash
# Start CDP server
obscura serve -p 9222

# Fetch a page
obscura fetch https://mp.weixin.qq.com

# Connect via Puppeteer
# browser = await puppeteer.connect({ browserWSEndpoint: 'ws://127.0.0.1:9222/devtools/browser' })

# Connect via Playwright
# browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
```

### ⚠️ Obscura CDP Limitation (v0.1.2)

**As of v0.1.2, Obscura's CDP WebSocket does NOT respond to commands.** This is a critical limitation:

- HTTP endpoints work: `curl http://127.0.0.1:9222/json/version` → valid JSON
- HTTP endpoints work: `curl http://127.0.0.1:9222/json/list` → valid page list
- **WebSocket connections accept but never respond** — tested with both `/devtools/browser` and `/devtools/page/page-1` endpoints
- Commands tested (all timeout): `Runtime.enable`, `Page.enable`, `Page.navigate`, `Target.getTargets`
- Raw WebSocket test confirmed: messages sent, zero responses received within 5s timeout
- This means Obscura cannot currently be used for browser automation via CDP

**Impact:** The `cdp-obscura.ts` adapter in baoyu-post-to-wechat was written but **does not work** because Obscura never responds to CDP WebSocket commands. The `obscura fetch` and `obscura scrape` CLI commands work fine — it's only the CDP WebSocket protocol that's broken.

**Workaround options:**
1. Install `chromium` or `chromium-browser` in headless mode as CDP backend (original baoyu approach)
2. Use `obscura fetch`/`obscura scrape` CLI for read-only operations, manual WeChat posting
3. Wait for Obscura to fix CDP WebSocket support (file issue upstream)
4. Cross-compile Chromium for ARM64 headless

### WeChat Publishing Flow via Browser (requires working CDP browser)

1. Start headless browser: `chromium --headless --remote-debugging-port=9222`
2. Navigate to mp.weixin.qq.com
3. User scans QR code (first time only — session cookies persist)
4. Navigate to 创作管理 → 图文消息 → 新建
5. Inject article HTML via CDP `Runtime.evaluate`
6. Set title, add cover image
7. Save as draft

## Alternatives

### Playwright MCP
- `npx @playwright/mcp@latest` — full browser automation via MCP tools
- Uses Chromium under the hood (~200-400MB RAM)
- Heavy for low-resource ARM servers

### wechat-official-account-mcp (API wrapper)
- `npx @anthropic/wechat-official-account-mcp -a <appId> -s <appSecret>`
- 15 MCP tools covering 95% of WeChat APIs
- **Does NOT help with unverified accounts** — same 48001 error
- Only useful for verified accounts

### Installation Status (2026-05-10)

- ✅ Obscura v0.1.2 compiled and installed on ARM64 (24min build on external USB disk)
- ✅ Binaries: `obscura` (65MB) + `obscura-worker` (63MB) at `~/.cargo/bin/`
- ✅ CDP endpoint verified: `curl http://127.0.0.1:9333/json/version` returns standard CDP response
- ✅ Obscura uses `-p PORT` (not `--port`), no `--stealth` feature flag in v0.1.2

## baoyu-post-to-wechat (Chrome CDP Publishing Tool) — ✅ INSTALLED

**GitHub:** https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-post-to-wechat
**Installed at:** `~/.hermes/skills/baoyu-post-to-wechat/`
**Requires:** `bun` (installed at `~/.bun/bin/bun` v1.3.13)

Publishes articles to WeChat Official Account via CDP browser automation. Supports both API method (needs AppID/Secret) and browser method (needs CDP browser + QR scan).

### Obscura Integration (cdp-obscura.ts) — ⚠️ DOES NOT WORK

The original skill uses Chrome via `cdp.ts`. A custom adapter `cdp-obscura.ts` was created to replace Chrome with Obscura, but **Obscura v0.1.2's CDP WebSocket does not respond to commands** (see limitation above).

- `cdp-obscura.ts` exports the same API as `cdp.ts` (launchChrome, getPageSession, etc.)
- `launchChrome()` runs `obscura serve -p PORT` instead of launching Chrome
- Both `wechat-article.ts` and `wechat-browser.ts` were temporarily modified to import from `./cdp-obscura.ts` instead of `./cdp.ts`
- **Problem:** Obscura accepts WebSocket connections but never sends CDP responses → all commands timeout
- **Resolution:** Scripts reverted to import from `./cdp.ts` which launches Chromium headless. Chromium is installed via bullseye-backports.

**Additional fix applied:** The original scripts use `spawnSync('npx', ['-y', 'bun', script])` which fails when system npx is incompatible. Fixed to use bun directly:
```typescript
// Before (broken on some systems):
const args = ['-y', 'bun', mdToWechatScript, markdownPath];
const result = spawnSync('npx', args, ...);

// After (fixed):
const args = [mdToWechatScript, markdownPath];
const result = spawnSync('/home/kewang/.bun/bin/bun', args, ...);
```

### Key Features
- Markdown → WeChat HTML conversion with themes (default, grace, simple, modern)
- Auto image upload to WeChat material library (via clipboard paste + CDP)
- Article posting (文章) and image-text posting (图文, up to 9 images)
- Multi-account support
- No paid API required for browser method

### Usage

```bash
# The skill is invoked through Hermes — say "发布公众号" with a markdown file
# Or run directly:
cd ~/.hermes/skills/baoyu-post-to-wechat/scripts
bun run wechat-article.ts --markdown article.md --theme default --submit

# For image-text posts:
bun run wechat-browser.ts --markdown article.md --images ./images/
```

### Config (EXTEND.md)

**Active config:** `~/.baoyu-skills/baoyu-post-to-wechat/EXTEND.md`

```md
default_theme: default
default_color: blue
default_publish_method: browser
default_author: 
need_open_comment: 1
only_fans_can_comment: 0
```

### Alternative: wenyan-mcp (API-based, needs AppID/Secret)

**GitHub:** https://github.com/caol64/wenyan-mcp
**NPM:** `@wenyan-md/mcp`

MCP server for Markdown → WeChat publishing. Requires verified account with API access.
Good for verified accounts, NOT for unverified subscriptions (same 48001 error).

## Status (2026-05-10)

- Obscura: ✅ compiled, installed, HTTP CDP endpoints verified
- Obscura CDP WebSocket: ❌ **non-functional** — connects but never responds to commands (v0.1.2)
- Chromium headless: ✅ installed via bullseye-backports, CDP fully functional
- baoyu-post-to-wechat: ✅ **fully working** — uses cdp.ts with Chromium headless, end-to-end tested (Markdown → draft saved)
- Bun: ✅ v1.3.13 at `~/.bun/bin/bun`
- Scripts patched: cdp.ts (headless flags), wechat-article.ts + wechat-browser.ts (bun direct path, 600s login timeout)
- Session management: WeChat sessions expire ~30-60 min after login, plan operations accordingly

## Bun + baoyu-chrome-cdp Incompatibility (Important)

The `baoyu-chrome-cdp` library's `CdpConnection` uses Node.js `net.Socket` internally and **does not work under Bun**. Symptoms: `this.ws.addEventListener is not a function`. 

When writing Bun CDP scripts, use the `BunCdp` class from `references/bun-cdp-injection.md` in the `baoyu-post-to-wechat` skill — it wraps Bun's native `WebSocket` with the same CDP command/response protocol.

## ProseMirror Paste Technique (CDP Content Injection)

When baoyu-post-to-wechat's copy-paste approach fails silently (reports "Body content verified OK" but editor is empty), the WeChat editor is a **ProseMirror** instance, not UEditor. Direct `innerHTML` injection on `#edui1_contentplaceholder` is an overlay and does NOT update the real editor.

**Working approach — ClipboardEvent paste on ProseMirror:**

```javascript
// 1. Find the real editor
const pm = document.querySelector(".ProseMirror");

// 2. Focus it
pm.focus();

// 3. Create ClipboardEvent with HTML content
const clipboardData = new DataTransfer();
clipboardData.setData("text/html", htmlContent);
clipboardData.setData("text/plain", pm.innerText);

const pasteEvent = new ClipboardEvent("paste", {
  bubbles: true,
  cancelable: true,
  clipboardData: clipboardData
});

// 4. Dispatch on ProseMirror element
pm.dispatchEvent(pasteEvent);

// 5. Save: click "保存为草稿" button (span.btn or BUTTON element)
```

**Save verification:** After clicking "保存为草稿", look for `page_tips success` element with text "已保存". The toast may appear briefly and disappear.

**Key elements:**
- Real editor: `.ProseMirror` (contenteditable=true)
- Overlay (NOT the editor): `#edui1_contentplaceholder`
- Save button: `span.btn` or `BUTTON` with text "保存为草稿"
- Success toast: `.page_tips.success` with "已保存"

**Pitfalls:**
- `document.execCommand('insertHTML')` returns `false` on ProseMirror — it doesn't work
- Setting `#edui1_contentplaceholder.innerHTML` directly puts content in the overlay, not the editor — framework doesn't detect changes
- ProseMirror has `pmViewDesc` property — use this to confirm you have the right element
- The editor framework needs an `input` event after content change to trigger autosave detection

### Chunk-based CDP Injection (for large HTML content)

When HTML content exceeds ~50KB, it's too large for a single `Runtime.evaluate` argument (hits OS arg length limit). Use chunk-and-reassemble:

```javascript
// 1. Split content JSON into ~50KB chunks
const json = JSON.stringify(htmlContent);
const CHUNK = 50000;
const chunks = [];
for (let i = 0; i < json.length; i += CHUNK) {
  chunks.push(json.substring(i, i + CHUNK));
}

// 2. Send chunks to browser
await send("Runtime.evaluate", { expression: "window.__htmlParts = [];" });
for (const chunk of chunks) {
  await send("Runtime.evaluate", {
    expression: "window.__htmlParts.push(" + JSON.stringify(chunk) + ");"
  });
}

// 3. Reassemble and paste
await send("Runtime.evaluate", {
  expression: "window.__htmlContent = JSON.parse(window.__htmlParts.join(''));"
});
// Then use ClipboardEvent paste as described above
```

### Image Upload via CDP (DOM.setFileInputFiles)

ProseMirror strips base64 images from pasted HTML. To insert images into the article:

```javascript
// 1. Find the file input element (accepts image types)
const doc = await send("DOM.getDocument");
const fileInput = await send("DOM.querySelector", {
  nodeId: doc.result.root.nodeId,
  selector: "input[type=file]"  // accept="image/gif,image/jpeg,..."
});

// 2. Upload image file (server-side path)
await send("DOM.setFileInputFiles", {
  files: ["/path/to/image.png"],
  nodeId: fileInput.result.nodeId
});

// 3. Image gets uploaded to res.wx.qq.com and may appear in media library
// Note: images go to material library, not directly into editor body
// You may need to insert them from the library UI or find the uploaded URL
```

**Pitfall:** Uploaded images go to the WeChat material library pop-up, not directly inline in the editor body. You need to either:
- Accept this limitation and let user manually place images from library
- Or find the uploaded image URL and inject an `<img>` tag into ProseMirror via another paste

