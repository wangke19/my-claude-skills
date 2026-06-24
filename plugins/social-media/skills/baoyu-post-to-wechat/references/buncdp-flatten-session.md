# BunCdp Flatten-Session Pattern

The reliable BunCdp pattern for `operate_appmsg` drafts, verified across 10+ article publishes (May 2026).

## Key Difference from bun-cdp-injection.md

| Aspect | bun-cdp-injection.md | This pattern (flatten) |
|--------|---------------------|----------------------|
| WS URL source | Tab's `webSocketDebuggerUrl` | `/json/version` browser WS URL |
| Session attach | `Target.attachToTarget` (no flatten) | `Target.attachToTarget({flatten:true})` |
| Token extraction | From cookie via `Runtime.evaluate` | From tab URL: `tab.url.match(/token=([^&]+)/)` |
| Send opts | `sid` as 3rd positional arg | `{sessionId: sid}` opts object |

## Minimal Working Script

```javascript
#!/usr/bin/env bun
const {readFileSync} = await import("fs");
const BODY_FILE = "/path/to/article.html";
const TITLE = "Article Title ≤64 chars";
const DIGEST = "Article summary ≤120 chars";

class BunCdp {
  ws=null; pending=new Map(); nextId=1;
  connect(wsUrl) {
    const self=this;
    return new Promise(function(res,rej) {
      const t=setTimeout(function(){rej(new Error('timeout'))},15000);
      self.ws=new WebSocket(wsUrl);
      self.ws.addEventListener('open',function(){clearTimeout(t);res()});
      self.ws.addEventListener('message',function(evt){
        try{var msg=JSON.parse(evt.data);
          if(msg.id){var p=self.pending.get(msg.id);if(p){self.pending.delete(msg.id);clearTimeout(p.t);p.res(msg.result);}}
        }catch{}
      });
      self.ws.addEventListener('error',function(){clearTimeout(t);rej(new Error('WS error'))});
    });
  }
  send(m,params,opts) {
    const self=this; params=params||{};
    var sid = opts&&opts.sessionId;
    return new Promise(function(res,rej) {
      if(!self.ws){rej(new Error('not connected'));return;}
      const id=self.nextId++;
      const t=setTimeout(function(){self.pending.delete(id);rej(new Error(m+' timeout'))},120000);
      self.pending.set(id,{res:res,rej:rej,t:t});
      self.ws.send(JSON.stringify(sid?{id:id,method:m,params:params,sessionId:sid}:{id:id,method:m,params:params}));
    });
  }
}

async function ev(cdp,expr,sid) {
  var r = await cdp.send("Runtime.evaluate",{expression:expr,returnByValue:true},{sessionId:sid});
  return r.result?r.result.value:undefined;
}

async function main() {
  var ver = await (await fetch("http://127.0.0.1:9222/json/version")).json();
  var cdp = new BunCdp();
  await cdp.connect(ver.webSocketDebuggerUrl);
  var tabs = await (await fetch("http://127.0.0.1:9222/json")).json();
  var wxTab = tabs.find(function(t){return t.url.includes("mp.weixin.qq.com")});
  if (!wxTab) { console.error("No WeChat tab"); process.exit(1); }
  var token = wxTab.url.match(/token=([^&]+)/)[1];
  var sid = (await cdp.send("Target.attachToTarget",{targetId:wxTab.id,flatten:true})).sessionId;

  var body = readFileSync(BODY_FILE,"utf-8").trim();
  console.log("[1] body:",body.length);

  console.log("[2] Create...");
  var r = await ev(cdp, "(function(){var x=new XMLHttpRequest();x.open('POST','https://mp.weixin.qq.com/cgi-bin/operate_appmsg?t=ajax-response&sub=create&type=77&token=***&lang=zh_CN',false);x.setRequestHeader('Content-Type','application/x-www-form-urlencoded; charset=UTF-8');var p={token:'"+token+"',lang:'zh_CN',f:'json',ajax:'1',random:Math.random().toString(),AppMsgId:'',count:'1',data_seq:'0',operate_from:'Chrome',isMark:'0'};p['title0']="+JSON.stringify(TITLE)+";p['content0']="+JSON.stringify(body)+";p['author0']='';p['fileid0']='';p['digest0']="+JSON.stringify(DIGEST)+";p['sourceurl0']='';p['need_open_comment0']='0';p['show_cover_pic0']='1';p['copyright_type0']='0';p['can_reward0']='0';p['mediaapi_publish_status0']='0';p['fee_type0']='';p['pay_fee0']='0';p['pay_album_info0']='';p['is_set_sync_to_finder0']='0';var fd=Object.keys(p).map(function(k){return encodeURIComponent(k)+'='+encodeURIComponent(p[k])}).join('&');x.send(fd);return x.responseText})()", sid);

  var resp = JSON.parse(r);
  console.log("ret:",resp.ret,"id:",resp.appMsgId);
  if(resp.ret==0||resp.ret=="0"){
    var ct=resp.filter_content_html&&resp.filter_content_html[0]&&resp.filter_content_html[0].content;
    console.log("✅",resp.appMsgId,"content:",ct?ct.length:0);
  } else {
    console.log("❌",JSON.stringify(resp).substring(0,200));
  }
}
main().catch(function(e){console.error(e);process.exit(1)});
```

## Usage

```bash
# Edit BODY_FILE, TITLE, DIGEST at top of script
~/.bun/bin/bun /tmp/api-partN.mjs
```

## To delete an old draft before creating new one

Add before the Create block:
```javascript
console.log("[0] Del OLD_ID...");
await ev(cdp, "(function(){var x=new XMLHttpRequest();x.open('POST','https://mp.weixin.qq.com/cgi-bin/operate_appmsg?t=ajax-response&sub=del&type=77&token=***&lang=zh_CN',false);x.setRequestHeader('Content-Type','application/x-www-form-urlencoded; charset=UTF-8');x.send('token="+token+"&lang=zh_CN&f=json&ajax=1&AppMsgId=OLD_ID&count=1&data_seq=0')})()", sid).catch(function(){});
```

## ⚠️ URL Token Works Even When Masked as `***`

Chrome's CDP JSON endpoint redacts tokens in tab URLs (showing `token=***`). Despite this display, **the actual token value is present and functional** — XHR calls with it succeed (`ret: 0`). localStorage extraction also returns `NOT FOUND` — this is normal, the token is in the URL only.

## Common Pitfalls

- **`token` from cookie vs URL**: Cookie-based extraction (`document.cookie.match`) returns empty or partial values. Always extract from `wxTab.url.match(/token=([^&]+)/)` — the masked display `token=***` is cosmetic; the actual value is present and works in XHR calls.
- **`flatten:true` is required**: Without it, `Target.attachToTarget` returns `{sessionId}` at top level but events don't route correctly.
- **Exit code 124 is a false failure**: The draft creation (`ret: 0`, `appMsgId` returned) succeeds before the script hits Bun's 50s timeout. The process hangs after `main()` returns but the draft is already saved. Check the JSON response before the timeout to confirm success.
- **Content stripping: handle SVG data URI images**: The cover image `<img>` tag from `wechat-article-generator` contains an SVG data URI inside `src`. When stripping, use `replace(/<img[^>]*>/gi, '')` (remove entire img tag) rather than trying to match `alt="封面图"` — the SVG data URI has quote encoding issues that break the pattern match.
- **localStorage token extraction fails**: `NOT FOUND` from localStorage is normal — WeChat stores the session token primarily in the URL, not localStorage. Do not treat this as a sign the session is expired.

## Screenshot (QR Code) for Re-Login

When the WeChat session expires (login required), capture the QR code via CDP:

**Correct approach** (uses `flatten:true` + existing tab, not `createTarget`):

```javascript
// Attach to existing WeChat tab, navigate to login URL, capture screenshot
var tabs = await (await fetch("http://127.0.0.1:9222/json")).json();
var wxTab = tabs.find(t => t.url.includes("mp.weixin.qq.com"));
if (!wxTab) { console.error("No WeChat tab"); process.exit(1); }
var sid = (await cdp.send("Target.attachToTarget",{targetId:wxTab.id,flatten:true})).sessionId;

// Navigate to login page
await cdp.send("Page.navigate",{url:"https://mp.weixin.qq.com/"},{sessionId:sid});
await new Promise(r => setTimeout(r, 3000));

// Capture screenshot
var screenshot = await cdp.send("Page.captureScreenshot",{format:"png"},{sessionId:sid});
var buf = Buffer.from(screenshot.data, 'base64');
require('fs').writeFileSync('/tmp/wechat-login.png', buf);
console.log('Screenshot saved');
```

**Why `Target.createTarget` fails**: It creates a new tab, navigates it, but requires an additional `attachToTarget` call that introduces extra async round-trips — the script times out before the screenshot arrives. Always reuse the existing tab instead.

## Running Bun Scripts from execute_code

`execute_code` (Python subprocess) has a **20s hard timeout**. `bun run --bun ...` commands that take >20s (especially CDP scripts that wait for page loads) will be killed with `TimeoutExpired`.

**Workaround**: Use `terminal(background=true)` to start the Bun process, then `process(wait)` to collect results:

```python
# WRONG — times out in execute_code
subprocess.run(['/home/kewang/.bun/bin/bun', 'run', '/tmp/script.mjs', ...], timeout=90)

# CORRECT — use terminal with background=true
```

```javascript
// terminal background session
terminal(command, background=true, notify_on_complete=false, timeout=60)
```

Then check output:
```bash
cat /tmp/publish-output.log
```

## ⚠️ Template Customization: Do NOT String-Replace `getArg()` Calls

The `publish-draft.mjs` template uses backtick-quoted `getArg()` calls:

```javascript
const BODY_FILE = getArg('file');
const TITLE     = getArg('title');
const DIGEST    = getArg('digest') || '';
```

These are **function calls**, not plain strings. If you do Python `str.replace("getArg('file')", '"/tmp/body.html"')`, the replacement resolves the **function reference** to a string literal — but the replacement text itself is quoted, so the actual `getArg()` call is **not evaluated** and `BODY_FILE` ends up being the string literal `getArg('file')`, not the argument value.

**Correct approach — copy template and pass runtime args**:
```bash
cp {baseDir}/templates/publish-draft.mjs /tmp/my-publish.mjs
~/.bun/bin/bun run --bun /tmp/my-publish.mjs \
  --title "Article Title" \
  --file /tmp/article-body.html \
  --digest "Article summary"
```

**What NOT to do**:
```python
# ❌ WRONG — corrupts getArg() calls
content = template.replace("getArg('file')", '"/tmp/body.html"')
with open('/tmp/publish.mjs', 'w') as f:
    f.write(content)   # getArg() is now a string, not evaluated
```

**When you MUST inject values at script creation time** (e.g. session-specific state that can't be passed as args), write a minimal inline script that hardcodes the values directly — do not try to preserve `getArg()` and replace at the same time:

```javascript
const BODY_FILE = "/tmp/article-body-aijobs.html";
const TITLE = "AI会不会抢走你的工作？2026年全球就业冲击图鉴";
const DIGEST = "高盛说AI要取代3亿岗位...";
```

## BunCdp Publish: Runtime Args, Not Template String Replacement

The `publish-draft.mjs` template uses `getArg()` — **do NOT do string replacement on the template**. Pass args at runtime:

```bash
~/.bun/bin/bun run --bun \
  /home/kewang/.hermes/skills/baoyu-post-to-wechat/templates/publish-draft.mjs \
  --title "Article Title" \
  --file /tmp/article-body.html \
  --digest "Article summary ≤120 chars"
```

Or copy the template to `/tmp/` and pass args to the copy (avoids modifying the original skill template):
```bash
cp /home/kewang/.hermes/skills/baoyu-post-to-wechat/templates/publish-draft.mjs /tmp/api-publish.mjs
~/.bun/bin/bun run --bun /tmp/api-publish.mjs --title "..." --file ... --digest ...
```

**Do NOT** use Python `str.replace()` on the `.mjs` template file — the template already handles argument passing via `getArg()`. If you need a custom script, copy the template, import its logic, and call it with your variables.
