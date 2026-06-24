# WeChat Publishing - CDP Troubleshooting Notes

## Xvfb + Headless Chromium Screenshot Limitation

**Problem**: `Page.captureScreenshot` returns 0 bytes when Chromium runs under Xvfb virtual display without real GPU.

**Environment**: Orange Pi 5 / Debian Bullseye / aarch64 / Intel/AMD GPU
```
$ chromium --headless --disable-gpu --remote-debugging-port=9222
```
`captureScreenshot` → `data:,...` (0 bytes)

**Workaround**: 
1. Run Chromium with a real display (non-headless, use Xvfb but WITH GPU acceleration if available)
2. Or use `screenshot` tool from `sn-da-image-caption` skill instead of CDP screenshot
3. Or pipe the QR code image URL to an external downloader

**Root cause**: Chromium's headless mode uses SKIA GPU for rendering which requires proper GPU context. In Xvfb virtual framebuffer without real GPU, the compositor fails silently.

---

## Token Extraction (flatten-session Pattern)

WeChat's token appears in the URL as `token=***` (masked) but the masked value IS the actual valid token for API calls.

**How to extract**:
```javascript
// From CDP JSON tabs list:
const tabs = await fetch("http://127.0.0.1:9222/json").then(r => r.json());
const wxTab = tabs.find(t => t.url && t.url.includes("mp.weixin.qq.com"));
const token = wxTab.url.match(/token=([^&]+)/)[1]; // works even with ***

// Attach and use in XHR:
const formData = new FormData();
formData.append('token', token); // use extracted token, NOT the literal ***
```

**Verified**: `token=***` in URL is NOT a placeholder — it's the actual session token with display masking. Using it directly in API calls succeeds.

---

## QR Code Image URL

WeChat login QR code URL format:
```
https://mp.weixin.qq.com/cgi-bin/scanloginqrcode?action=getqrcode&random=<TIMESTAMP>&login_appid=
```

**Limitation**: This URL is session-bound. Direct download (curl/fetch) returns 0 bytes due to anti-bot protection. The QR code can only be displayed in a live browser session.

**Workaround**: 
- For screenshot: use the `screenshot` tool from `sn-da-image-caption` skill on the actual Chrome instance running with a real display
- For publishing: ask user to log in via their own browser, then detect the session

---

## Session Expiry Behavior

When WeChat session expires:
- URL shows `token=***` but API calls return `ret: 200040 "invalid csrf token"`
- `document.cookie` shows tracking cookies only (ua_id, wxuin) — auth cookies (data_ticket, slave_sid) are HttpOnly and not exposed
- Page content shows "微信公众平台" but XHR to `operate_appmsg` fails

**Correct approach for QR extraction in headless mode** (canvas toDataURL — verified 2026-05):

⚠️ **Do NOT use `browser_vision` for QR screenshots** — it produces truncated/broken images that users scan but silently fail (no error, no login). Also do NOT use `curl` to download the QR URL (returns 0 bytes without session cookies).

1. Navigate CDP Chrome to `mp.weixin.qq.com` (login page with QR visible)
2. Via CDP `Runtime.evaluate`, draw QR to canvas and store as data URL:
   ```javascript
   const img = document.querySelector('.login__type__container__scan img');
   const c = document.createElement('canvas');
   c.width = img.naturalWidth; c.height = img.naturalHeight;
   c.getContext('2d').drawImage(img, 0, 0);
   window.__qrDataUrl = c.toDataURL('image/png');
   ```
3. **Read in chunks** (WebSocket frame limit truncates large responses):
   - Get total length: `Runtime.evaluate('window.__qrDataUrl.length')` → ~67000
   - Read 8KB chunks: `Runtime.evaluate('window.__qrDataUrl.substring(START, END)')`
   - Reassemble in Python, extract base64 after `data:image/png;base64,`, decode, save to `/tmp/wx_qr.png`
4. Send via `send_message(message='MEDIA:/tmp/wx_qr.png')` to Feishu
5. User scans the image with WeChat app

Produces ~20KB 472×472 PNG that scans reliably.

**Recovery**: User must re-scan the QR code to get a fresh session. No programmatic way to extend/refresh the session.

---

## Last Working Session Cookies (2025-05)

These are EXPIRED — for reference only:
```
wxuin=78454872515102
slave_bizuin=3701214995
bizuin=3701214995
slave_user=gh_6f9fedbe0df9
```

## Terminal Blocked: Pure Python CDP for Diagnostics

When `terminal` tool is session-blocked (all commands timeout even trivial ones), but `execute_code` subprocess still works, use Python's stdlib for CDP read-only operations:

```python
import subprocess, json
# Get WS URL and tab list
r = subprocess.run(["curl", "-s", "http://127.0.0.1:9222/json/version"], capture_output=True, text=True)
r2 = subprocess.run(["curl", "-s", "http://127.0.0.1:9222/json/list"], capture_output=True, text=True)
```

For actual publish flow: BunCDP is required (Python stdlib has no WebSocket client). If terminal is blocked, fall back to asking user to copy-paste article HTML manually.
