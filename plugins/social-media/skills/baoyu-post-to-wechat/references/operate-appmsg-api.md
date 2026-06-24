# operate_appmsg Direct API — The Reliable Headless Method

## ⚠️ Critical: Token Extraction — URL Token Works Even When Masked as `***`

**The `token=` parameter in Chrome tab URLs may be masked as EMPTY or `***` (e.g. `https://mp.weixin.qq.com/...&token=***&...`).** Despite this display, the actual token value is present and functional — API calls with it succeed (`ret: 0`).

**Do NOT extract token from localStorage** — it returns `NOT FOUND` for WeChat session tokens, which is normal behavior. Always extract from the tab URL:

```javascript
// ❌ WRONG — token from URL is masked/empty (shown as *** or empty string)
const token = tab.url.match(/[?&]token=([^&]+)/)?.[1];

// ❌ WRONG — localStorage extraction returns NOT FOUND
const tokenResult = await ev(cdp, `(function(){
  for (var k of Object.keys(localStorage||{})) {
    var v = localStorage[k]||'';
    try { var j = JSON.parse(v); if (j.token) return j.token; } catch {}
  }
  return 'NOT FOUND';
})()`, sid);

// ✅ CORRECT — URL token works despite masked display
const token = wxTab.url.match(/token=([^&]+)/)?.[1];
// Use it directly in XHR calls — it succeeds even when shown as ***
```

---

## Overview

When running Chrome in headless mode (`--headless=new --ozone-platform=headless`), **all CDP-based content injection methods into ProseMirror fail** — the DOM changes but React state discards them on save. The "保存为草稿" button click via CDP doesn't even send a backend API request.

The solution: **call WeChat's `operate_appmsg` API directly via browser XHR**, leveraging the existing session cookies from an already-logged-in Chrome tab.

## When to Use

- Headless Chrome (no display, no xdotool)
- CDP ProseMirror injection shows "已保存" but content is empty in draft list
- `wechat-api.ts` can't be used (no API credentials, or token expired)
- Need reliable article creation without manual browser interaction

## Prerequisites

- Chrome running with remote debugging on port 9222
- At least one tab logged into `mp.weixin.qq.com` with `token=` in URL
- No API credentials needed — uses browser session cookies

## API Endpoint

```
POST https://mp.weixin.qq.com/cgi-bin/operate_appmsg?t=ajax-response&sub=create&type=77&token={TOKEN}&lang=zh_CN
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
```

## Working Script Pattern

```javascript
// operate_appmsg direct API call via browser XHR (run inside Chrome via CDP Runtime.evaluate)
const apiResult = await ev(cdp, `(function(){
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://mp.weixin.qq.com/cgi-bin/operate_appmsg?t=ajax-response&sub=create&type=77&token=${token}&lang=zh_CN', false);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

  var params = {
    token: '${token}',
    lang: 'zh_CN',
    f: 'json',
    ajax: '1',
    random: Math.random().toString(),
    AppMsgId: '',
    count: '1',
    data_seq: '0',
    operate_from: 'Chrome',
    isMark: '0'
  };

  // Article fields (index 0) — field names end with index number
  params['title0'] = 'ARTICLE_TITLE';
  params['content0'] = 'CLEANED_BODY_HTML';  // Full HTML, no cover/title/comments
  params['author0'] = '';
  params['fileid0'] = '';       // Cover image media ID (empty = no cover)
  params['digest0'] = 'ARTICLE_SUMMARY';
  params['sourceurl0'] = '';
  params['need_open_comment0'] = '0';
  params['music_id0'] = '';
  params['video_id0'] = '';
  params['voteid0'] = '';
  params['voteismulti0'] = '';
  params['voteid20'] = '';
  params['show_cover_pic0'] = '1';
  params['shortvideofileid0'] = '';
  params['copyright_type0'] = '0';
  params['releasefirst0'] = '';
  params['pay_fee0'] = '0';
  params['fee_type0'] = '';
  params['pay_album_info0'] = '';
  params['appmsg_album_info0'] = '';
  params['ori_white_list0'] = '';
  params['free_content_length0'] = '';
  params['can_reward0'] = '0';
  params['related_video0'] = '';
  params['is_set_sync_to_finder0'] = '0';
  params['mediaapi_publish_status0'] = '0';

  var formData = Object.keys(params).map(function(k){
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');

  xhr.send(formData);
  return xhr.responseText;
})()`, sid);
```

## Response Format

```json
{
  "appMsgId": "100000348",
  "base_resp": { "err_msg": "", "ret": 0 },
  "ret": "0",
  "data_seq": "4511843115170938880"
}
```

- `ret: 0` = success
- `appMsgId` = the draft article ID

## Content HTML Preparation

Extract body HTML from `wechat-article-generator` output, stripping non-content elements. **Critical: handle SVG data URI cover images properly.**

```javascript
let body = bodyMatch[1];
// Strip HTML comments
body = body.replace(/<!--[\s\S]*?-->/g, "");
// ⚠️ The cover <img> tag contains an SVG data URI in src attribute.
// Quote encoding inside data URI breaks alt="封面图" matching.
// Use the full tag strip instead:
body = body.replace(/<img[^>]*>/gi, '');
// Also strip any remaining SVG elements if present
body = body.replace(/<svg[\s\S]*?<\/svg>/gi, '');
body = body.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '');
body = body.replace(/<div style="font-size:13px[^>]*>[\s\S]*?<\/div>/gi, '');
body = body.replace(/<hr[^>]*>/gi, '');
body = body.trim();
```

**Why `<img[^>]*alt="封面图"[^>]*>` fails:** the `wechat-article-generator` embeds the cover as `<img src="data:image/svg+xml,<svg...>` where `<svg>` contains double quotes. JSON.stringify escapes some but the regex pattern matching fails because the img tag spans across the data URI boundary. Always strip the entire `<img>` tag with `/<img[^>]*>/gi`.

## Verification After Save

```javascript
// Check draft list API to confirm article was saved
const verify = await ev(cdp, `(function(){
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://mp.weixin.qq.com/cgi-bin/appmsg?action=list_ex&begin=0&count=5&type=77&token=${token}&lang=zh_CN&f=json&ajax=1', false);
  xhr.send();
  var resp = JSON.parse(xhr.responseText);
  var list = resp.app_msg_list || [];
  return JSON.stringify(list.map(function(a){
    return { title: a.title, appmsgid: a.appmsgid };
  }));
})()`, sid);
```

## Updating Existing Drafts

Use `sub=modify` instead of `sub=create` and include the `AppMsgId`:

```
POST .../operate_appmsg?t=ajax-response&sub=modify&type=77&token={TOKEN}&lang=zh_CN
```

With `AppMsgId` set to the existing article ID.

## What content0 Actually Saves

The `content0` field **does save full formatted HTML** — inline styles, `<strong>`, `<code>`, `<h2>`, `<blockquote>`, `<hr>`, and `<svg>` elements are all preserved. Confirmed by inspecting `filter_content_html[0].content` in the API response, which contained the complete HTML including 3 inline SVG illustrations with all attributes intact.

**Key constraints:**
- Title (`title0`) must be ≤ 64 characters. Exceeding returns `ret: 64702` with `err_msg: "标题超出64字长度限制"`.
- `fileid0` (cover image media ID) can be empty — article shows as "incomplete" in draft list but is fully editable.
- The draft list API (`action=list_ex`) returns `content: ""` for all articles — content is only visible when opening the draft in the editor or reading `filter_content_html` from the create/modify response.

## CDP ProseMirror Injection — What Fails in Headless

All CDP-based content injection methods into WeChat's ProseMirror editor **fail to persist** in headless Chrome (`--headless=new`):

| Method | DOM Updated? | Persists on Save? | Notes |
|--------|-------------|-------------------|-------|
| `innerHTML` assignment | ✅ Yes | ❌ No | React state discards |
| `document.execCommand('insertHTML')` | ✅ Yes | ❌ No | Same React issue |
| Clipboard API + `execCommand('paste')` | ✅ Yes | ❌ No | ProseMirror ignores programmatic paste |
| CDP `Input.dispatchKeyEvent` Ctrl+V | — | ❌ No | No clipboard content in headless |
| CDP `Input.insertText` | ✅ Yes | ❌ No | Text enters PM but save button click doesn't trigger API call |
| **`operate_appmsg` API** | — | ✅ **Yes** | Only reliable method |

Additionally, clicking the "保存为草稿" button via CDP in headless mode **does not send any `operate_appmsg` API request** — no network activity is observed. The `xdotool` approach also fails because headless Chrome has no X11 display.

## Limitations

- **No cover image** unless you have a `fileid` (media ID from image upload API). Articles without cover show as "incomplete" in the draft list but are still visible and editable.
- **Inline SVG works** — the API stores SVG elements in `content0`. They appear in `filter_content_html` and are rendered when the draft is opened in the WeChat editor. Rendering in the final published article viewer needs user testing.
- **Session-dependent** — requires Chrome to maintain an active WeChat login session.

## Full End-to-End Script Pattern

The working script uses a BunCdp WebSocket class (not TCP socket — Bun doesn't support raw TCP for CDP):

```
1. Connect to Chrome: fetch http://127.0.0.1:9222/json/version → get webSocketDebuggerUrl
2. Find logged-in tab: filter tabs for url containing "mp.weixin.qq.com" with "token="
3. Extract token from tab URL: token=([^&]+)
4. Target.attachToTarget → get sessionId
5. Runtime.evaluate → XHR call to operate_appmsg with content0 = formatted HTML
6. Parse response → check ret=0, extract appMsgId
7. Verify via draft list API (action=list_ex) — note: content field is always empty in list
```

Key BunCdp implementation: use `WebSocket` (not `net.Socket`) for CDP protocol. Each command needs `{sessionId: sid}` in the message envelope for attached targets. The `ev()` helper runs `Runtime.evaluate` with `returnByValue: true` to get JS return values.

## Deleting Drafts

```
POST .../operate_appmsg?t=ajax-response&sub=del&type=77&token={TOKEN}&lang=zh_CN
Body: token={TOKEN}&lang=zh_CN&f=json&ajax=1&AppMsgId={APPMSGID}&count=1&data_seq=0
```

## Full Working Script (Bun + BunCdp)

```javascript
#!/usr/bin/env bun
const {readFileSync} = await import("fs");

class BunCdp {
  ws=null; pending=new Map(); eventHandlers=new Map(); nextId=1;
  connect(wsUrl) {
    const self=this;
    return new Promise(function(res,rej) {
      const t=setTimeout(()=>rej(new Error('timeout')),15000);
      self.ws=new WebSocket(wsUrl);
      self.ws.addEventListener('open',()=>{clearTimeout(t);res()});
      self.ws.addEventListener('message',(evt)=>{
        try{var msg=JSON.parse(evt.data);
          if(msg.method){var h=self.eventHandlers.get(msg.method);h&&h.forEach(x=>x(msg.params));}
          if(msg.id){var p=self.pending.get(msg.id);if(p){self.pending.delete(msg.id);clearTimeout(p.t);p.res(msg.result);}}
        }catch{}
      });
      self.ws.addEventListener('error',()=>{clearTimeout(t);rej(new Error('WS error'))});
    });
  }
  send(m,params,opts) {
    const self=this; params=params||{};
    var sid = opts&&opts.sessionId;
    return new Promise(function(res,rej) {
      if(!self.ws){rej(new Error('not connected'));return;}
      const id=self.nextId++;
      const t=setTimeout(()=>{self.pending.delete(id);rej(new Error(m+' timeout'))},120000);
      self.pending.set(id,{res,rej,t});
      // ⚠️ 注意三元运算符的括号！不要写成 sid?{...},{...}
      self.ws.send(JSON.stringify(sid?{id,method:m,params,sessionId:sid}:{id,method:m,params}));
    });
  }
}
async function ev(cdp,expr,sid) {
  const r = await cdp.send("Runtime.evaluate",{expression:expr,returnByValue:true},{sessionId:sid});
  return r.result?r.result.value:undefined;
}

async function main() {
  // 1. Connect
  const ver = await (await fetch("http://127.0.0.1:9222/json/version")).json();
  const cdp = new BunCdp();
  await cdp.connect(ver.webSocketDebuggerUrl);
  
  // 2. Find tab + extract token
  const tabs = await (await fetch("http://127.0.0.1:9222/json")).json();
  const tab = tabs.find(t => t.url.includes("mp.weixin.qq.com"));
  const token = tabs.find(t=>t.url.includes("token=")).url.match(/token=([^&]+)/)[1];
  const sid = (await cdp.send("Target.attachToTarget",{targetId:tab.id,flatten:true})).sessionId;
  
  // 3. Read HTML body (from wechat-article-generator output)
  const bodyHtml = readFileSync("/path/to/article.html", "utf-8").trim();
  
  // 4. Create draft via operate_appmsg
  const result = await ev(cdp, `(function(){
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://mp.weixin.qq.com/cgi-bin/operate_appmsg?t=ajax-response&sub=create&type=77&token=${token}&lang=zh_CN', false);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    var params = {
      token: '${token}', lang: 'zh_CN', f: 'json', ajax: '1',
      random: Math.random().toString(), AppMsgId: '', count: '1',
      data_seq: '0', operate_from: 'Chrome', isMark: '0'
    };
    params['title0'] = 'ARTICLE TITLE';  // ⚠️ ≤64 chars!
    params['content0'] = ${JSON.stringify(bodyHtml)};
    params['author0'] = '';
    params['fileid0'] = '';
    params['digest0'] = 'ARTICLE SUMMARY';
    params['sourceurl0'] = '';
    params['need_open_comment0'] = '0';
    params['show_cover_pic0'] = '1';
    params['copyright_type0'] = '0';
    params['can_reward0'] = '0';
    params['mediaapi_publish_status0'] = '0';
    params['fee_type0'] = '';
    params['pay_fee0'] = '0';
    params['pay_album_info0'] = '';
    params['is_set_sync_to_finder0'] = '0';
    var formData = Object.keys(params).map(function(k){
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    }).join('&');
    xhr.send(formData);
    return xhr.responseText;
  })()`, sid);
  
  const resp = JSON.parse(result);
  console.log("ret:", resp.ret, "appMsgId:", resp.appMsgId);
  
  // 5. Verify via filter_content_html (NOT draft list — content is always empty there)
  if (resp.filter_content_html && resp.filter_content_html[0]) {
    console.log("content saved, length:", resp.filter_content_html[0].content.length);
  }
}
main();
```

## BunCdp 常见 Bug

### 1. 三元运算符括号错误

```javascript
// ❌ 语法错误（Bun 报 Expected "=" but found ","）
self.ws.send(JSON.stringify(sid?{id,method:m,params,sessionId:sid},{id,method:m,params}));

// ✅ 正确写法
self.ws.send(JSON.stringify(sid?{id,method:m,params,sessionId:sid}:{id,method:m,params}));
```

### 2. 不要用 net.Socket（Bun 不兼容）

```javascript
// ❌ baoyu-chrome-cdp 的 CdpConnection 用 net.Socket，Bun 不支持
const cdp = new CdpConnection(9222);

// ✅ 用 Bun 原生 WebSocket
const cdp = new BunCdp();
await cdp.connect(ver.webSocketDebuggerUrl);
```

## 踩坑时间线（2026-05 会话实录）

### 已尝试且失败的方法

1. **innerHTML 注入（3311字符）**：DOM 更新成功，React 状态不保存，API 验证内容为空
2. **execCommand('insertHTML')**：同上，DOM 更新但保存后丢失
3. **Clipboard API + execCommand('paste')**：剪贴板写入成功，ProseMirror 不响应程序化粘贴
4. **CDP Input.dispatchKeyEvent Ctrl+V**：键盘事件触发但无剪贴板内容传入
5. **Input.insertText 逐段输入**：3166 字符成功进入 ProseMirror，但点击保存按钮不触发 API 请求
6. **xdotool key ctrl+v**：headless Chrome 无 X11 显示，不可用
7. **operate_appmsg + 空标题**：创建成功但内容只有标题文本
8. **operate_appmsg + 标题被正文污染（3198字）**：返回 `ret: 64702`（标题超 64 字限制）
9. **operate_appmsg + `<img src="data:...">` 封面**：data URI 被 WeChat 过滤清除

### 最终成功的方法

**`operate_appmsg` API 直接调用** + **content0 传完整 inline HTML（含内联 SVG）**

```javascript
// 成功的关键参数
params['title0'] = 'Claude Desktop 悄悄封杀第三方模型：开放两周，墙就来了';  // 30字 < 64
params['content0'] = bodyHtml;  // 12725 chars, 含 <p style="..."> + 3个 <svg> + <h2> + <blockquote>
params['digest0'] = '2026年5月6日...';  // 摘要
// fileid0 = '' （无封面图ID，草稿显示不完整但可编辑）
```

返回 `ret: 0`, `appMsgId: 100000355`, `filter_content_html[0].content` 包含完整 HTML。
