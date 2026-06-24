# Headless Linux Setup & Pitfalls

## Environment

Tested on: Debian Bullseye (aarch64), Chromium 120, no X11/Wayland display.

## Chromium Installation

Debian 11 (Bullseye) doesn't include Chromium in the default repos. Use backports:

```bash
echo "deb http://mirrors.tuna.tsinghua.edu.cn/debian bullseye-backports main contrib non-free" | sudo tee /etc/apt/sources.list.d/backports.list
sudo apt-get update && sudo apt-get install -y -t bullseye-backports chromium
```

## Script Patches Applied

Several fixes were needed for the scripts to work on minimal headless Linux:

### 1. cdp.ts — Headless flags

Added to `extraArgs` in `launchChrome()`:
```typescript
extraArgs: ['--disable-blink-features=AutomationControlled', '--start-maximized', '--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
```

### 2. wechat-article.ts — Replace npx with direct bun

The scripts used `spawnSync('npx', ['-y', 'bun', script, ...])` which fails on minimal Debian where npm is broken (`Cannot find module '@npmcli/config'`).

Fix: Replace with direct bun binary path:
```typescript
// Before
const result = spawnSync('npx', ['-y', 'bun', mdToWechatScript, markdownPath], ...);

// After
const result = spawnSync('/home/kewang/.bun/bin/bun', [mdToWechatScript, markdownPath], ...);
```

Also remove `'-y', 'bun'` from the args array when using direct bun invocation.

### 3. copy-to-clipboard.ts — Same npx fix

Same pattern: `spawnSync('npx', ['-y', 'bun', copyScript, ...])` → `spawnSync(bunPath, [copyScript, ...])`

## Login Flow (No GUI)

On headless systems the QR code is invisible. To present it to the user:

1. After Chromium starts and navigates to mp.weixin.qq.com, take a screenshot via CDP:
   ```
   Page.captureScreenshot → save base64 to /tmp/wechat-login.png
   ```
2. Send the image to the user (MEDIA: path or inline)
3. The script's `waitForLogin()` polls for 600 seconds (10 min, increased from original 120s) — user must scan within that window. Both `wechat-article.ts` and `wechat-browser.ts` were patched: `timeoutMs = 600_000`
4. After scanning, the page redirects to `/cgi-bin/home` and the script continues automatically

## Session Management

WeChat browser sessions expire approximately **30-60 minutes** after login. Key implications:

- Plan all operations (publish, delete drafts, manage content) within one session window
- If navigating to a new page shows "请重新登录", the session has expired
- Must kill Chromium, clear cookies, and re-scan QR code to re-authenticate
- Cookie files to clear on expiry: `chrome-profile/Default/Cookies`, `chrome-profile/Default/Login Data`
- For long operations, prioritize the most important action first

## Clipboard Handling

Without X11/Wayland, `xdotool` and `osascript` don't work. The scripts have a CDP fallback path:

```typescript
// From sendCopy/sendPaste in wechat-article.ts
if (cdp && sessionId) {
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'v', code: 'KeyV', modifiers: 2, windowsVirtualKeyCode: 86 }, { sessionId });
  await sleep(50);
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'v', code: 'KeyV', modifiers: 2, windowsVirtualKeyCode: 86 }, { sessionId });
}
```

This works correctly in headless Chromium — no `xdotool` needed.

## Bun Installation

```bash
curl -fsSL https://bun.sh/install | bash
# Add to PATH
export PATH="$HOME/.bun/bin:$PATH"
```

After installing bun, run `bun install` in the scripts directory to fetch dependencies.

## CdpConnection WebSocket — Correct Pattern (Bun)

`baoyu-chrome-cdp`'s `CdpConnection` has a Bun-specific WebSocket compatibility issue. When writing standalone scripts:

```typescript
// ❌ Wrong — times out in Bun with "addEventListener is not a function"
const cdp = new CdpConnection(`ws://127.0.0.1:9222`);
await cdp.connect();

// ✅ Correct — use static connect() with browser WS URL from HTTP endpoint
const resp = await fetch("http://127.0.0.1:9222/json/version");
const { webSocketDebuggerUrl } = await resp.json();
const cdp = await CdpConnection.connect(webSocketDebuggerUrl, 10_000);
```

Or using the helper (also works in Bun):
```typescript
const { waitForChromeDebugPort } = await import('baoyu-chrome-cdp');
const browserWsUrl = await waitForChromeDebugPort(CDP_PORT, 5000);
const cdp = await CdpConnection.connect(browserWsUrl, 10_000);
```

After connecting to the browser, attach to a specific page tab:
```typescript
const tabsResp = await fetch(`http://${host}:${port}/json`);
const tabs = await tabsResp.json();
const { sessionId } = await cdp.send("Target.attachToTarget", {
  targetId: tabs[0].id,
  flatten: true,
});
```

## Capturing Login QR Code — Verified Working Pattern

**⚠️ `scripts/open-login.mjs` is NOT reliably Bun-compatible.** It calls `CdpConnection.connect()` from `baoyu-chrome-cdp`, which internally uses `net.Socket` — Bun throws `addEventListener is not a function`. In practice the script times out waiting for login. Do NOT trust the "(Bun-compatible)" label.

**Verified working pattern** — use the BunCdp class from `references/buncdp-flatten-session.md`:

The flatten-session pattern uses a minimal **BunCdp** class wrapping Bun's native `WebSocket` (not `net.Socket`), which works correctly under Bun. It:
1. Fetches `http://127.0.0.1:9222/json/version` → gets `webSocketDebuggerUrl`
2. Creates a new tab pointed at the WeChat login URL
3. Takes a screenshot via CDP → saves to `/tmp/wechat-login.png`
4. Sends the image to the user (MEDIA:/tmp/wechat-login.png)
5. Polls until the tab URL changes from the login path (indicating scan succeeded)

```bash
cd /home/kewang/.hermes/skills/baoyu-post-to-wechat
~/.bun/bin/bun --bun references/buncdp-flatten-session.md
# Adapt it to open a login URL and screenshot the QR code
```

**Why `cdp.ts` doesn't work for ad-hoc scripts**: `cdp.ts` uses stdin/stdout for REPL-style communication — useful for interactive use but not for standalone scripts.

## EXTEND.md

Create at `~/.baoyu-skills/baoyu-post-to-wechat/EXTEND.md`:

```md
default_theme: default
default_color: blue
default_publish_method: browser
default_author:
need_open_comment: 1
only_fans_can_comment: 0
```

## End-to-End Flow (Confirmed Working)

1. Start Chromium headless with CDP: `chromium --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --remote-debugging-port=PORT --user-data-dir=PROFILE_DIR --window-size=1280,900 https://mp.weixin.qq.com/`
2. Wait ~8 seconds for page load
3. Take CDP screenshot (`Page.captureScreenshot`) and send to user as MEDIA: attachment
4. User scans QR code (10 min timeout)
5. Script detects redirect to `/cgi-bin/home` → logged in
6. Script fills title, author, pastes HTML content, fills summary, saves as draft
7. Browser window stays open for further operations within session window

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| No output for 30+ seconds | Chromium startup + page load | Wait — headless Chrome is slower |
| `Cannot find module '@npmcli/config'` | System npm is broken | Use `bun` directly (see patches above) |
| `Page not found: mp.weixin.qq.com` | Page not loaded yet when searched | Wait longer after launch, or check Chromium actually started |
| Chromium OOM on 2GB RAM | Headless Chrome uses ~150-300MB | Acceptable for 2GB RAM, but avoid running other heavy processes |
| `gh auth login --with-token` hangs | stdin pipe issue in non-interactive shell | Use `printf "%s\n" "$TOKEN" \| gh auth login --with-token` |

## Obscura Note

Obscura v0.1.2 was tested as a Chrome replacement but its CDP WebSocket implementation does not respond to any commands (both browser-level and page-level). Only HTTP endpoints (`/json/version`, `/json/list`) work. It cannot be used as a drop-in Chrome replacement for CDP automation.
