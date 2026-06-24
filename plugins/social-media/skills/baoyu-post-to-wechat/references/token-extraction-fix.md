# Token Extraction Fix for WeChat CDP Publishing

## The Problem

Chrome DevTools Protocol (CDP) always masks token values in `tab.url` from `/json` endpoint:

```
Tab URL: https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=10&token=***
```

Using `token=***` directly in `operate_appmsg` API calls returns `ret:200040 invalid csrf token`.

Additionally, the `type=10` editor URL does not work with the API — you need `type=77`.

## Root Cause Sequence

1. CDP tab list (`/json`) returns `token=***` (masked) for all WeChat tabs
2. Even after `Target.attachToTarget`, `Runtime.evaluate("window.location.href")` returns `token=***` if the page is `type=10`
3. `operate_appmsg` API rejects masked/old tokens with `invalid csrf token`

## Verified Fix (3 steps)

```javascript
// Step 1: Navigate to type=77 editor first
await cdp.send("Page.navigate", {
  url: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=77&lang=zh_CN&token=${tok}`
}, { sessionId: sid });

// Step 2: Wait for page load
await new Promise(r => setTimeout(r, 10000));

// Step 3: NOW extract the REAL token from window.location.href
const r = await cdp.send("Runtime.evaluate", {
  expression: "window.location.href",
  returnByValue: true
}, { sessionId: sid });
const realToken = r.result.value.match(/token=([^&]+)/)[1];
// realToken is now the actual numeric token (e.g. "1252627710")
```

## Why the publish-draft-wechat.mjs Template Works

The `templates/publish-draft-wechat.mjs` script gets the WebSocket URL from the CDP tab list:
```javascript
const wsUrl = t.webSocketDebuggerUrl; // real WS URL, not masked
```

Then it attaches to the tab and evaluates:
```javascript
const r = await cdp.send("Runtime.evaluate", {
  expression: expr,
  returnByValue: true
}, { sessionId: sid });
return r.result?.value; // real token value from page context
```

The key: `webSocketDebuggerUrl` is NOT masked (it's the actual WS connection string). The `token=***` only appears in the human-readable `url` field of the tab list.

## Alternative: Use operate_appmsg API Directly

If token extraction is problematic, use the browser XHR method via CDP (what `publish-draft-wechat.mjs` does internally):
```javascript
// Token from Runtime.evaluate on type=77 page — works reliably
const token = pageToken; // extracted after type=77 navigation

var xhr = new XMLHttpRequest();
xhr.open('POST', `https://mp.weixin.qq.com/cgi-bin/operate_appmsg?t=ajax-response&sub=create&type=77&token=${token}&lang=zh_CN`, false);
// ... rest of params
```

## Verified 2026-05-20

- Chrome/120.0.6099.224 headless on port 9222
- Session active ~45 min without expiry
- `operate_appmsg` with real token from `type=77` page → `ret:0, appMsgId:100000627`
- `token=0` (masked) or `type=10` token → `ret:200040`
