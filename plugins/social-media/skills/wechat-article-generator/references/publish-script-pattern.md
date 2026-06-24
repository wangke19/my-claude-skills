# 微信公众号草稿发布脚本模式

## ⚠️ 当前推荐方式（2026年5月验证）

当前 `publish-draft.mjs` 模板已改用 CLI 参数，不再需要复制模板改 `BODY_FILE`：

```bash
~/.bun/bin/bun \
  /home/kewang/.hermes/skills/baoyu-post-to-wechat/templates/publish-draft.mjs \
  --title "文章标题（≤64字符）" \
  --file /tmp/article-body.html \
  --digest "文章摘要（≤120字）"
```

⚠️ `execute_code` subprocess 有 60s 硬性超时，不适用于 bun 脚本。必须用 `terminal(background=true)` + `process(wait)` 轮询。

## 标准发布脚本结构（经验证成功版）

```javascript
const { readFileSync } = require('fs');

const WS_URL = 'ws://127.0.0.1:9222/devtools/page/B326F1952FBD047D30A62784DACC1650';
const BODY_FILE = '/tmp/article-body.html';
const TITLE = '文章标题';
const DIGEST = '文章摘要（≤120字）';

const ws = new WebSocket(WS_URL);
let nid = 1;
const pending = new Map();

ws.addEventListener('open', () => { console.log('WS_OPEN'); main(); });
ws.addEventListener('message', e => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const p = pending.get(msg.id);
    clearTimeout(p.t);
    pending.delete(msg.id);
    p.res(msg.result);
  }
});
ws.addEventListener('close', () => { process.exit(0); });

function cmd(method, params, timeout = 30000) {
  return new Promise((res, rej) => {
    const id = nid++;
    const t = setTimeout(() => { pending.delete(id); rej(new Error(method + ' TIMEOUT')); }, timeout);
    pending.set(id, { res, rej, t });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  try {
    // Get token from URL
    const urlR = await cmd('Runtime.evaluate', {
      expression: "location.href.match(/token=([^&]+)/)?.[1]",
      returnByValue: true
    });
    const token = urlR.result.value;
    if (!token || token.length < 6) { console.log('FAIL: no token'); ws.close(); return; }
    console.log('Token:', token);

    // Get cookies
    const cookieR = await cmd('Runtime.evaluate', {
      expression: "document.cookie",
      returnByValue: true
    });
    console.log('Cookie len:', cookieR.result.value.length);

    // Read body
    const body = readFileSync(BODY_FILE, 'utf-8').trim();
    console.log('BODY_LEN:', body.length);

    // Create draft using SYNCHRONOUS XHR (关键！)
    const js = `(function(){
      var x = new XMLHttpRequest();
      x.open('POST', '/cgi-bin/operate_appmsg?t=ajax-response&sub=create&type=77&token=${token}&lang=zh_CN', false);
      x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
      var p = {
        token: '${token}', lang: 'zh_CN', f: 'json', ajax: '1',
        random: Math.random().toString(), AppMsgId: '', count: '1',
        data_seq: '0', operate_from: 'Chrome', isMark: '0'
      };
      p['title0'] = ${JSON.stringify(TITLE)};
      p['content0'] = ${JSON.stringify(body)};
      p['author0'] = '';
      p['fileid0'] = '';  // ✅ 空字符串，不是 '-1'
      p['digest0'] = ${JSON.stringify(DIGEST)};
      p['sourceurl0'] = '';
      p['need_open_comment0'] = '0';
      p['show_cover_pic0'] = '1';
      p['copyright_type0'] = '0';
      p['can_reward0'] = '0';
      p['fee_type0'] = '';
      p['pay_fee0'] = '0';
      var fd = Object.keys(p).map(function(k){ return encodeURIComponent(k)+'='+encodeURIComponent(p[k]) }).join('&');
      x.send(fd);
      return x.responseText;
    })()`;

    const r = await cmd('Runtime.evaluate', { expression: js, returnByValue: true });
    console.log('RESULT:', JSON.stringify(r.result).slice(0, 1000));
    ws.close();
  } catch(e) {
    console.error('FATAL:', e.message);
    ws.close();
  }
}

setTimeout(() => { console.log('MASTER_TIMEOUT'); ws.close(); process.exit(1); }, 120000);
```

## 关键字段说明（2026年5月实测）

| 字段 | 错误值（会导致 200002） | 正确值 |
|------|------------------------|--------|
| `AppMsgId`（注意大写） | `'0'` | `''`（空字符串） |
| `fileid0` | `'-1'` | `''`（空字符串） |
| `count` | `'0'` | `'1'` |

**同步 XHR 是关键**：用 `xhr.open('POST', url, false)` 第三个参数 `false` = 同步请求，然后直接 `return xhr.responseText`。

**不要用 `awaitPromise: true`**：在 CDP 环境下，`Runtime.evaluate` 的 `awaitPromise: true` 选项不稳定——Promise 可能返回 `ReferenceError` 而非实际响应。同步 XHR 绕过这个问题。

**URL 用相对路径**：`/cgi-bin/operate_appmsg?...`，不走 `https://mp.weixin.qq.com/cgi-bin/...` 绝对路径。

## 旧版脚本结构（参考，已过时）

以下写法已导致 200002 错误，不再使用：

```javascript
// ❌ 错误写法 1：异步 fetch + awaitPromise
fetch(url, {method:'POST', body:...}).then(r => r.text())  // awaitPromise 不稳定
awaitPromise: true  // ReferenceError

// ❌ 错误写法 2：fileid0: '-1'
fileid0: '-1'  // → 200002

// ❌ 错误写法 3：AppMsgId: '0'
AppMsgId: '0'  // → 200002
```

## 生成脚本的 Python 辅助函数

```python
import json

def generate_publish_script(body_file, title, digest, output_path):
    script = f'''const {{ readFileSync }} = require('fs');

const WS_URL = 'ws://127.0.0.1:9222/devtools/page/B326F1952FBD047D30A62784DACC1650';
const BODY_FILE = {json.dumps(body_file)};
const TITLE = {json.dumps(title)};
const DIGEST = {json.dumps(digest)};

const ws = new WebSocket(WS_URL);
let nid = 1;
const pending = new Map();

ws.addEventListener('open', () => {{ console.log('WS_OPEN'); main(); }});
ws.addEventListener('message', e => {{
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {{
    const p = pending.get(msg.id);
    clearTimeout(p.t);
    pending.delete(msg.id);
    p.res(msg.result);
  }}
}});
ws.addEventListener('close', () => {{ process.exit(0); }});

function cmd(method, params, timeout = 30000) {{
  return new Promise((res, rej) => {{
    const id = nid++;
    const t = setTimeout(() => {{ pending.delete(id); rej(new Error(method + ' TIMEOUT')); }}, timeout);
    pending.set(id, {{ res, rej, t }});
    ws.send(JSON.stringify({{ id, method, params }}));
  }});
}}

async function main() {{
  try {{
    const urlR = await cmd('Runtime.evaluate', {{
      expression: "location.href.match(/token=([^&]+)/)?.[1]",
      returnByValue: true
    }});
    const token = urlR.result.value;
    if (!token || token.length < 6) {{ console.log('FAIL: no token'); ws.close(); return; }}
    console.log('Token:', token);

    const cookieR = await cmd('Runtime.evaluate', {{
      expression: "document.cookie",
      returnByValue: true
    }});
    console.log('Cookie len:', cookieR.result.value.length);

    const body = readFileSync(BODY_FILE, 'utf-8').trim();
    console.log('BODY_LEN:', body.length);

    const js = `(function(){{
      var x = new XMLHttpRequest();
      x.open('POST', '/cgi-bin/operate_appmsg?t=ajax-response&sub=create&type=77&token=${{token}}&lang=zh_CN', false);
      x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
      var p = {{
        token: '${{token}}', lang: 'zh_CN', f: 'json', ajax: '1',
        random: Math.random().toString(), AppMsgId: '', count: '1',
        data_seq: '0', operate_from: 'Chrome', isMark: '0'
      }};
      p['title0'] = ${{JSON.stringify(title)}};
      p['content0'] = ${{JSON.stringify(body)}};
      p['author0'] = ''; p['fileid0'] = ''; p['digest0'] = ${{JSON.stringify(digest)}};
      p['sourceurl0'] = ''; p['need_open_comment0'] = '0'; p['show_cover_pic0'] = '1';
      p['copyright_type0'] = '0'; p['can_reward0'] = '0'; p['fee_type0'] = ''; p['pay_fee0'] = '0';
      var fd = Object.keys(p).map(function(k){{ return encodeURIComponent(k)+'='+encodeURIComponent(p[k]) }}).join('&');
      x.send(fd);
      return x.responseText;
    }})()`;

    const r = await cmd('Runtime.evaluate', {{ expression: js, returnByValue: true }});
    console.log('RESULT:', JSON.stringify(r.result).slice(0, 1000));
    ws.close();
  }} catch(e) {{
    console.error('FATAL:', e.message);
    ws.close();
  }}
}}

setTimeout(() => {{ console.log('MASTER_TIMEOUT'); ws.close(); process.exit(1); }}, 120000);
'''
    with open(output_path, 'w') as f:
        f.write(script)

# 用法
generate_publish_script(
    body_file='/tmp/ai-10-small-things-body.html',
    title='AI 最适合帮你做的 10 件小事',
    digest='你可能已经用AI写过年终总结，但这些都算大活儿...',
    output_path='/tmp/wx-publish-10things.mjs'
)
```

## 脚本存放位置

每次发布用完的脚本保留在 `/tmp/wx-publish-*.mjs`，按用途命名：
- `/tmp/wx-publish-num-*.mjs` — 系列文章带编号标题
- `/tmp/wx-publish-{article-slug}.mjs` — 单篇专题文章

## 关键注意事项

### 1. 不删除旧草稿（默认行为）
修改后的脚本**不设 `DEL_ID`**，保留历史草稿供后续处理。

### 2. exit code 124 不代表失败
`~/.bun/bin/bun {script}.mjs` 超时（60s limit）时 exit code=124，但草稿可能已创建成功。检查输出的 `appMsgId` 确认。

### 3. WeChat WebSocket tab 查找
查找包含 `mp.weixin.qq.com` 的 Chrome DevTools tab。如果报错 "No WeChat tab"，需要手动打开微信公众平台网页版（https://mp.weixin.qq.com）并确保有至少一个草稿管理页签打开。

### 4. 批量发布
串行逐个跑（不要后台并行，会抢 Chrome DevTools WebSocket 连接）。

### 5. ⚠️ 脚本复制后必须同步更新所有变量

**教训**：从旧脚本复制生成新脚本时，`BODY_FILE` 路径改了，但 `TITLE` 变量忘记改 —— 导致发出去的是旧标题。

**验证清单**：生成新脚本后，发之前必查：
```javascript
const BODY_FILE = "/tmp/article-body.html";  // ✅ 文件名对吗？
const TITLE = "文章标题";                     // ✅ 标题对吗？
const DIGEST = "文章摘要";                    // ✅ 摘要对吗？
```
