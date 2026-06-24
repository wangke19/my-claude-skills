# Bun CDP Injection — WeChat Article Posting

## The Problem: baoyu-chrome-cdp + Bun Incompatibility

`baoyu-chrome-cdp`'s `CdpConnection` uses Node.js `net.Socket` internally (via the `ws` npm package compiled for Node). When run under Bun, the WebSocket constructor is Bun's native implementation — `this.ws.addEventListener` is invalid because Bun's WS uses `addEventListener` but the internal `connect()` call wires up a Node `socket` object instead.

**Symptom:**
```
❌ Error: this.ws.addEventListener is not a function
```

**Affected code pattern:**
```typescript
// ❌ Breaks under Bun — baoyu-chrome-cdp uses Node net.Socket
import { CdpConnection } from 'baoyu-chrome-cdp';
const cdp = new CdpConnection(9222);
await cdp.connect();
```

**Workaround:** Use Bun's native `WebSocket` API directly. A minimal `BunCdp` class is shown below.

---

## Working BunCdp Implementation

```javascript
// === BunCdp — Bun-native CDP client for WeChat article injection ===
// Replaces baoyu-chrome-cdp when running under Bun (bun run /tmp/inject.mjs)

class BunCdp {
  ws = null;
  pending = new Map();
  eventHandlers = new Map();
  nextId = 1;
  sessionId = null;

  // wsUrl: Chrome's webSocketDebuggerUrl from http://127.0.0.1:9222/json
  connect(wsUrl) {
    const self = this;
    return new Promise(function(resolve, reject) {
      const timer = setTimeout(() => reject(new Error('WS connect timeout')), 15000);
      self.ws = new WebSocket(wsUrl);
      self.ws.addEventListener('open', function() { clearTimeout(timer); resolve(); });
      self.ws.addEventListener('message', function(evt) {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.method) {
            const handlers = self.eventHandlers.get(msg.method);
            if (handlers) handlers.forEach(h => h(msg.params));
          }
          if (msg.id) {
            const p = self.pending.get(msg.id);
            if (p) { self.pending.delete(msg.id); clearTimeout(p.timer); p.resolve(msg.result); }
          }
        } catch {}
      });
      self.ws.addEventListener('error', function() { clearTimeout(timer); reject(new Error('WS error')); });
    });
  }

  send(method, params) {
    const self = this;
    params = params || {};
    return new Promise(function(resolve, reject) {
      if (!self.ws) { reject(new Error('not connected')); return; }
      const id = self.nextId++;
      const timer = setTimeout(() => { self.pending.delete(id); reject(new Error('CDP ' + method + ' timeout')); }, 20000);
      self.pending.set(id, { resolve, reject, timer });
      self.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, handler) {
    if (!this.eventHandlers.has(method)) this.eventHandlers.set(method, []);
    this.eventHandlers.get(method).push(handler);
  }
}
```

---

## Complete WeChat Article Injection Workflow

```javascript
// /tmp/inject-article.mjs — Bun-native CDP injection for WeChat draft posting
// Run: ~/.bun/bin/bun /tmp/inject-article.mjs

const HTML_FILE = '/path/to/article.html'; // Self-contained HTML from wechat-article-generator
const ARTICLE_TITLE = '...';
const ARTICLE_SUMMARY = '...';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const { readFileSync, writeFileSync } = await import('fs');
  const htmlContent = readFileSync(HTML_FILE, 'utf-8');

  // === Extract body, strip cover/header ===
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyHtml = bodyMatch[1]
    .replace(/<div style="background:#fff3cd[^"]*"[^>]*>[\s\S]*?<\/div>\n?/gi, '')
    .replace(/<img style="width:100%[^"]*"[^>]*alt="封面图"[^>]*>\n?/gi, '')
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>\n?/gi, '')
    .replace(/<div style="font-size:13px[^"]*"[^>]*>[\s\S]*?<\/div>\n?/gi, '')
    .replace(/<hr[^>]*>\n?/gi, '')
    .replace(/WECHATIMGPH_\d+/g, '')
    .replace(/<img[^>]*data:image\/[^>]*>/gi, ''); // Strip base64 imgs

  // === Connect to existing Chrome (port 9222) ===
  const tabsResp = await fetch('http://127.0.0.1:9222/json');
  const tabs = await tabsResp.json();

  const homeTab = tabs.find(t => t.url.includes('/cgi-bin/home') && t.url.includes('token='));
  if (!homeTab) throw new Error('No home tab with token');

  const token = homeTab.url.match(/[?&]token=([^&]+)/)?.[1];
  if (!token) throw new Error('No token');

  // === Close stale editor tabs ===
  for (const t of tabs) {
    if (t.url.includes('/cgi-bin/appmsg') && t.url.includes('type=77') && t.id !== homeTab.id) {
      const c = new BunCdp();
      await c.connect(t.webSocketDebuggerUrl);
      await c.send('Target.closeTarget', { targetId: t.id });
      await sleep(500);
    }
  }

  // === Create new editor tab with token (critical: token must be in URL) ===
  const homeCdp = new BunCdp();
  await homeCdp.connect(homeTab.webSocketDebuggerUrl);

  const newTarget = await homeCdp.send('Target.createTarget', {
    url: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=77&token=${token}&lang=zh_CN`
  });

  await sleep(4000); // Wait for tab to initialize

  // === Attach to the new editor tab ===
  const tabs2Resp = await fetch('http://127.0.0.1:9222/json');
  const tabs2 = await tabs2Resp.json();
  const editorTab = tabs2.find(t => t.id === newTarget.targetId);

  const edCdp = new BunCdp();
  await edCdp.connect(editorTab.webSocketDebuggerUrl);
  const attachResult = await edCdp.send('Target.attachToTarget', { targetId: newTarget.targetId, flatten: true });
  edCdp.sessionId = attachResult.sessionId;

  await edCdp.send('Page.enable', {});
  await edCdp.send('Runtime.enable', {});
  await edCdp.send('DOM.enable', {});

  // === Wait for Page.loadEventFired ===
  await new Promise(r => { edCdp.on('Page.loadEventFired', r); setTimeout(r, 15000); });
  await sleep(2000);

  // === Fill title (#title is <textarea>, NOT <input>) ===
  await edCdp.send('Runtime.evaluate', {
    expression: `(function(){
      var inp = document.querySelector('#title');
      if (!inp) return 'no title';
      // CRITICAL: #title is <textarea> — HTMLInputElement setter is wrong prototype
      var setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(inp, ${JSON.stringify(ARTICLE_TITLE)});
      inp.dispatchEvent(new InputEvent('input', {bubbles:true, inputType:'insertText', data: ${JSON.stringify(ARTICLE_TITLE)}}));
      inp.dispatchEvent(new Event('change', {bubbles:true}));
      return inp.value;
    })()`,
    returnByValue: true,
  });

  // === Fill summary (#js_description, NOT #summary) ===
  await edCdp.send('Runtime.evaluate', {
    expression: `(function(){
      var inp = document.querySelector('#js_description');
      if (!inp) return 'no #js_description';
      var setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(inp, ${JSON.stringify(ARTICLE_SUMMARY)});
      inp.dispatchEvent(new InputEvent('input', {bubbles:true, inputType:'insertText', data: ${JSON.stringify(ARTICLE_SUMMARY)}}));
      return inp.value.substring(0, 30);
    })()`,
    returnByValue: true,
  });

  // === Clear and inject ProseMirror content ===
  await edCdp.send('Runtime.evaluate', {
    expression: `(function(){
      var ed = document.querySelector('.ProseMirror');
      if (!ed) return 'no PM';
      ed.focus();
      document.execCommand('selectAll');
      document.execCommand('delete');
      return 'cleared';
    })()`,
    returnByValue: true,
  });
  await sleep(500);

  // Try ClipboardEvent paste first
  const pasteResult = await edCdp.send('Runtime.evaluate', {
    expression: `(function(){
      var ed = document.querySelector('.ProseMirror');
      if (!ed) return {ok:false, len:0};
      var dt = new DataTransfer();
      dt.setData('text/html', ${JSON.stringify(bodyHtml)});
      var evt = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt });
      ed.dispatchEvent(evt);
      return { ok: true, len: ed.textContent ? ed.textContent.length : 0 };
    })()`,
    returnByValue: true,
  });

  // Fallback: innerHTML if paste didn't work
  if ((pasteResult.len || 0) < 100) {
    await edCdp.send('Runtime.evaluate', {
      expression: `(function(){
        var ed = document.querySelector('.ProseMirror');
        if (!ed) return;
        ed.innerHTML = ${JSON.stringify(bodyHtml)};
        ed.dispatchEvent(new Event('input', { bubbles: true }));
      })()`,
      returnByValue: true,
    });
  }

  // === Save ===
  await edCdp.send('Runtime.evaluate', {
    expression: `(function(){
      var btns = document.querySelectorAll('span.btn');
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].textContent.indexOf('保存') >= 0 || btns[i].textContent.indexOf('save') >= 0) {
          btns[i].click(); return true;
        }
      }
      return false;
    })()`,
    returnByValue: true,
  });

  await sleep(3000);

  const tips = await edCdp.send('Runtime.evaluate', {
    expression: `(document.querySelector('.page_tips') || {}).textContent || ''`,
    returnByValue: true,
  });
  console.log('Tips:', JSON.stringify(tips));

  // Optional: screenshot for debugging
  const screenshot = await edCdp.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('/tmp/editor-screenshot.png', Buffer.from(screenshot.data, 'base64'));
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
```

---

## Key Pitfalls

1. **Token in URL is mandatory** — `Target.createTarget` creates a new tab with a fresh profile context. Without `token=` in the URL, the tab redirects to login. Old editor tabs opened without a token cannot be reused.
2. **`#title` is `<textarea>`, not `<input>`** — Using `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')` silently fails. Must use `HTMLTextAreaElement.prototype` for both title and summary fields.
3. **Summary field is `#js_description`, not `#summary` or `#digest`** — Query `document.querySelector('#js_description')` instead.
4. **React 18 state sync requires `InputEvent` with `inputType`** — A plain `new Event('input')` does not trigger React's `onChange`. Use `new InputEvent('input', {bubbles:true, inputType:'insertText', data: '...'})` after the value setter.
5. **Wait for `Page.loadEventFired`** — `Target.createTarget` returns immediately, but the page is still loading. Use the event listener or `sleep(4000)` minimum before attaching.
6. **Strip base64 images before injection** — `<img src="data:image/...">` are stripped by ProseMirror's paste filter. Use `wechat-article-generator` for SVG illustrations instead.
7. **ClipboardEvent paste works, innerHTML is fallback** — ClipboardEvent respects ProseMirror's sanitization and is the preferred injection method. innerHTML bypasses sanitization but risks being stripped on save.
8. **Verify saved content via API, not editor DOM** — After saving, the editor DOM may show stale React state. Call the draft list API directly to confirm `title` and `digest` were actually saved:
   ```
   GET https://mp.weixin.qq.com/cgi-bin/appmsg?action=list_ex&begin=0&count=5&type=77&token={TOKEN}&lang=zh_CN&f=json&ajax=1
   ```

## ⚠️ ALL CDP Content Injection Methods Fail — Content Does NOT Persist

**Critical finding (2026-05-11, confirmed across multiple sessions):**

Every CDP-based method for injecting content into WeChat's ProseMirror editor **modifies the DOM successfully** but the content does **NOT persist** after save. WeChat's React/ProseMirror stack is completely decoupled from DOM mutations.

**Network evidence:** Clicking "保存为草稿" via CDP `mousePressed`/`mouseReleased` shows "已保存" toast but sends **zero** `operate_appmsg` API requests — only `masssend?action=check_music` and JS monitor pings. The save never reaches the backend.

**What was tried and ALL FAILED:**
| Method | DOM shows content? | Save sends API? | Draft has content? |
|--------|:--:|:--:|:--:|
| `innerHTML` + `Event('input')` | ✅ | ❌ | ❌ |
| `execCommand('insertHTML')` | ✅ | ❌ | ❌ |
| `ClipboardEvent('paste')` + DataTransfer | ❌ (silent drop) | ❌ | ❌ |
| `Input.insertText` (per-paragraph typing) | ✅ | ❌ | ❌ |
| `navigator.clipboard.write()` + Ctrl+V key event | ❌ (clipboard empty in CDP) | ❌ | ❌ |
| `document.execCommand('paste')` | ❌ (returns false) | ❌ | ❌ |
| `xdotool` Ctrl+C / Ctrl+V | N/A — requires X11 display | — | — |
| Mouse click on "保存为草稿" button | — | ❌ (no operate_appmsg) | ❌ |

**The only working approach for headless environments:**
Call `operate_appmsg` API directly via browser XHR. See `references/operate-appmsg-api.md` for the full pattern.

**For non-headless environments (with display):**
The `wechat-article.ts` script uses OS-level clipboard paste which works because it goes through the real paste pipeline, not CDP simulation.

## HTML Body Extraction — Comment Stripping Pattern

The `wechat-article-generator` HTML template includes `<body>` content with HTML comments:
```html
<!-- COPY HINT -->
<div style="background:#fff3cd...">...</div>
<!-- COVER IMAGE -->
<img ... alt="封面图">
<!-- ARTICLE HEADER -->
<h1>Title</h1>
<!-- BODY -->
<p>Content...</p>
```

When extracting body content for injection, the naive `/<!--[\s\S]*?-->/g` approach can break when comments are adjacent to other tags (JSON.stringify handles `\s\S` correctly, but Python `re.sub` with `re.DOTALL` handles it correctly too).

**Robust extraction order:**
```javascript
// 1. Remove each comment block with its associated element in one pass
body = body.replace(/<!--COPY HINT-->[\s\S]*?<div style="background:#fff3cd[^>]*>[\s\S]*?<\/div>/g, "");
body = body.replace(/<!--COVER IMAGE-->[\s\S]*?<img[^>]*alt="封面图"[^>]*>/g, "");
body = body.replace(/<!--ARTICLE HEADER-->[\s\S]*?<h1[^>]*>[\s\S]*?<\/h1>/g, "");
// 2. Then remove any remaining single-line comments
body = body.replace(/<!--[\s\S]*?-->/g, "");
// 3. Remove other noise
body = body.replace(/<img[^>]*alt="封面图"[^>]*>\n?/gi, "");
body = body.replace(/<h1[^>]*>[\s\S]*?<\/h1>\n?/gi, "");
body = body.replace(/<div style="font-size:13px[^"]*"[^>]*>[\s\S]*?<\/div>\n?/gi, "");
body = body.replace(/<hr[^>]*>\n?/gi, "");
body = body.replace(/WECHATIMGPH_\d+/g, "");
body = body.replace(/<img[^>]*data:image\/[^>]*>/gi, "");
```

## Method Comparison

| Factor | BunCdp Injection | operate_appmsg API | wechat-api.ts |
|--------|-----------------|---------------------|---------------|
| Runtime | Bun | Bun | Bun (or Node) |
| Dependencies | None (pure WS) | None (pure WS) | WeChat API token |
| API credentials | Not needed | Not needed | Required |
| Content persistence | ❌ ProseMirror discards | ✅ Direct backend save | ✅ Official API |
| Best for | Title/summary fix only | Headless article creation | Automated pipelines |
| Cover image | N/A | Needs fileid (media upload) | Needs thumb_media_id |
