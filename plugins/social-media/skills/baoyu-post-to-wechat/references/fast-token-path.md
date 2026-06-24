# Fast Path: User Already Logged In Their Browser

**Triggered when**: CDP Chrome has no token, but user confirms they can see their drafts/公众号 homepage in their own browser.

**Why this matters**: Every QR scan cycle costs 3-5+ tool calls (screenshot → crop → vision verify → send_media → wait → poll token). If the user is already logged in, skip entirely.

## Procedure

1. **Confirm**: CDP Chrome has no token (check via `curl http://127.0.0.1:9222/json` → look for `token=` in URL)
2. **Ask user**: "你的浏览器 URL 里有个 `token=xxxxx`，把 x 的值发给我，我直接发布"
3. **User provides token** (typically 10 digits like `33247932`)
4. **Use token in XHR call** via CDP `Runtime.evaluate` on the logged-in browser's tab

## Example JS for User to Paste in Their Browser Console

```javascript
// Tell me what this prints:
document.location.href.match(/token=([^&]+)/)?.[1]
```

## Why This Works

The token from the browser URL works as a query parameter in `operate_appmsg` API calls. The API validates the token + session cookies sent via the browser's existing session. When the user runs the XHR from their own browser, the cookies travel with it automatically.

## When This Doesn't Work

- User's browser is logged into a **different WeChat Official Account** than expected
- The token has expired independently of the browser session
- The user cannot access their browser's DevTools console

## Comparison: Token vs QR Flow

| Step | QR Flow | Token Flow |
|------|---------|------------|
| 1 | Extract QR via screenshot | Ask for token |
| 2 | Crop QR with Pillow | User provides 10-digit number |
| 3 | Send to user via media | Takes 10 seconds |
| 4 | User scans QR | Done |
| 5 | Poll for login confirmation | Direct publish |
| **Tool calls** | 5-8+ | 2-3 |
| **Time** | 2-5 min | <30 sec |

**Token flow is 10x faster when user is already logged in.**

## ⚠️ Important

Never say "no token found" and then immediately start the QR extraction flow when the user has already confirmed login. Always offer the token option FIRST in this scenario. This is a critical efficiency win that saves time and reduces frustration.
