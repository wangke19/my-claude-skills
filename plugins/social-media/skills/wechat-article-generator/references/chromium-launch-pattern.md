# Chromium 启动 + 微信公众号扫码登录流程

## 完整流程（两步：先起浏览器，后发文章）

> ⚠️ `publish-draft.mjs` 依赖 Chrome 已启动 + 已扫码登录。不要直接运行模板，会因找不到 Chrome WebSocket 而超时。

---

## 第一步：启动 Chromium 并完成扫码登录

### 1.1 杀掉旧实例（避免端口占用）

```bash
# 用 background=true 避免 & foregrounding 被 terminal 工具拦截
terminal(background=true, command='pkill -f chromium 2>/dev/null; sleep 1; echo "killed"')
```

### 1.2 启动 Chromium（background=true）

```bash
terminal(background=true, command=[
  'chromium',
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--remote-debugging-port=9222',
  '--user-data-dir=/home/kewang/.hermes/chrome-profile',
  '--window-size=1280,900',
  'https://mp.weixin.qq.com/'
])
```

**关键**：`background=true` 是必须的 — terminal 工具不允许 `&` 前台后台语法。

### 1.3 等待 Chrome 就绪

```bash
# 单独调用，不带 background
terminal(command='sleep 6 && curl -s --max-time 5 http://127.0.0.1:9222/json/version')
```

验证返回 JSON 含 `"Browser": "Chrome/..."` 即为成功。

### 1.4 获取标签页 Page WebSocket URL

用 `execute_code` 通过 CDP REST API 找到目标标签页的 WebSocket URL：

```python
import subprocess, json

r = subprocess.run(
    ['curl', '-s', 'http://127.0.0.1:9222/json/version'],
    capture_output=True, text=True
)
ws_base = json.loads(r.stdout)['webSocketDebuggerUrl']

r2 = subprocess.run(
    ['curl', '-s', 'http://127.0.0.1:9222/json'],
    capture_output=True, text=True
)
tabs = json.loads(r2.stdout)
for t in tabs:
    if 'mp.weixin.qq.com' in t.get('url', ''):
        # page_ws = browser_ws 的 /browser/ 替换成 /page/ 再拼接 tab id
        page_ws = ws_base.replace('/browser/', '/page/') + '/' + t['id']
        print("Target tab:", t['id'], t['url'])
        print("Page WS:", page_ws)
```

输出示例：
```
WS base: ws://127.0.0.1:9222/devtools/browser/7cba24d0-...
Target tab: AB6BFC0DD470F32AC11EAC1B3BBB4E0C https://mp.weixin.qq.com/
Page WS: ws://127.0.0.1:9222/devtools/page/AB6BFC0DD470F32AC11EAC1B3BBB4E0C
```

### 1.5 用 BunCdp 直接截取标签页截图

**关键**：连接 tab 的 Page WebSocket（`/page/<id>`），不是 browser WebSocket（`/browser/<id>`）。

```javascript
class BunCdp {
  constructor() { this.ws = null; this.pending = new Map(); this.nextId = 1; }
  connect(wsUrl) {
    const self = this;
    return new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error('timeout')), 15000);
      this.ws = new WebSocket(wsUrl);
      this.ws.addEventListener('open', () => { clearTimeout(t); res(); });
      this.ws.addEventListener('message', (evt) => {
        try {
          var msg = JSON.parse(evt.data);
          if (msg.id && msg.id > 0 && self.pending.has(msg.id)) {
            var p = self.pending.get(msg.id);
            self.pending.delete(msg.id); clearTimeout(p.t);
            p.res(msg.result !== undefined ? msg.result : msg);
          }
        } catch {}
      });
      this.ws.addEventListener('error', () => { clearTimeout(t); rej(new Error('WS error')); });
    });
  }
  send(m, params) {
    const self = this;
    params = params || {};
    return new Promise((res, rej) => {
      if (!this.ws) { rej(new Error('not connected')); return; }
      const id = this.nextId++;
      const t = setTimeout(() => { self.pending.delete(id); rej(new Error(m + ' timeout')); }, 30000);
      self.pending.set(id, { res, rej, t });
      this.ws.send(JSON.stringify({ id, method: m, params }));
    });
  }
  close() { if (this.ws) this.ws.close(); }
}

async function main() {
  const page_ws = "ws://127.0.0.1:9222/devtools/page/AB6BFC0DD470F32AC11EAC1B3BBB4E0C";
  const cdp = new BunCdp();
  await cdp.connect(page_ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  // 截图：结果直接在 ss.data（不是 ss.result.data）
  const ss = await cdp.send("Page.captureScreenshot", { format: "png", quality: 80 });
  if (ss?.data) {
    require("fs").writeFileSync("/tmp/wechat-qr.png", Buffer.from(ss.data, "base64"));
    console.log("Screenshot saved:", ss.data.length, "bytes");
  }
  cdp.close();
}
main().catch((e) => { console.error("[ERROR]", e.message); process.exit(1); });
```

**关键区别**：
- browser WS（`/browser/<id>`）：截整个浏览器窗口
- **page WS**（`/page/<id>`）：截该标签页内容 ✅
- Bun CDP 返回：`ss.data` 直接是 base64 字符串（不是 `ss.result.data`）

### 1.6 发截图给用户扫码

```javascript
send_message(
  action='send',
  message='请扫码登录微信公众号（Chromium 已启动）：MEDIA:/tmp/wechat-qr.png',
  target='feishu:oc_92a651b18162519d6c64f5454de8558c'
)
```

**当前 session 使用的飞书 target**（从 messaging targets list 获取）：
- `feishu:oc_92a651b18162519d6c64f5454de8558c` — 主 DM

### 1.5 等待用户扫码完成

用户扫码后，`browser_navigate` 或 `browser_vision` 应能看到微信公众平台已登录状态（内容不再是登录页）。

---

### 第二步：发布文章（复用已登录的 WebSocket）

### 2.1 检查 Chrome 状态

```bash
curl -s http://127.0.0.1:9222/json/version  # 确认 Chrome 仍运行
```

### 2.2 确认当前 URL 是微信公众平台

```javascript
browser_navigate(url='https://mp.weixin.qq.com/')
// 或直接用 browser_vision 查看当前页面
```

### 2.3 运行发布脚本

⚠️ **正确的调用方式**：当前模板已改用 `getArg('file')` 从 CLI 参数取数，**不要**复制模板再改 `BODY_FILE` 变量：

```bash
~/.bun/bin/bun /home/kewang/.hermes/skills/baoyu-post-to-wechat/templates/publish-draft.mjs \
  --title "文章标题（≤64字符）" \
  --file /tmp/article-body.html \
  --digest "文章摘要（≤120字）"
```

### 2.4 执行方式：用 terminal background=true

⚠️ `execute_code` 的 subprocess 有 60s 硬性超时（不受传入 timeout 控制），**不适用**于 bun 发布脚本。必须用 `terminal(background=true)`：

```javascript
terminal(
  background=true,
  command=[
    '/home/kewang/.bun/bin/bun',
    '/home/kewang/.hermes/skills/baoyu-post-to-wechat/templates/publish-draft.mjs',
    '--title', '文章标题',
    '--file', '/tmp/article-body.html',
    '--digest', '摘要'
  ],
  notify_on_complete=true,
  timeout=180
)
```

### 2.5 监控进度

```javascript
process(action='poll',   session_id='...')  // 查看状态
process(action='wait',   session_id='...', timeout=60)  // 等待（每次最多60s，可多次调用）
process(action='log',    session_id='...', limit=30)   // 查看输出
process(action='kill',   session_id='...')              // 超时则终止
```

---

## 常见失败情况

| 症状 | 原因 | 处理 |
|------|------|------|
| `WebSocket error` / 超时 | Chrome 未启动或未监听 9222 端口 | 重新执行 1.1 → 1.2 → 1.3 |
| `No WeChat tab` | Chrome 打开了错误页面 | 手动 `browser_navigate` 到 https://mp.weixin.qq.com |
| 登录页仍显示 | 用户还没扫码 | 发飞书消息催用户扫码 |
| exit code 124 | CLI 超时（60s），但草稿可能已创建 | 检查输出中是否有 `ret: 0` + `appMsgId` |

---

## 为什么不用 terminal 工具直接跑 publish-draft.mjs

`terminal` 工具有 60s 超时限制，而 Chrome 启动 + 扫码登录流程天然超过 60s。正确做法：

1. 用户扫码登录（需要人机交互）
2. 登录完成后，用 `execute_code` 或 `terminal` 运行发布脚本（不依赖 terminal 超时）

---

## 注意：每次发布都需要重新扫码吗？

不一定。如果 Chrome 实例保持运行（后台进程未退出），且用户之前已扫码登录，则下一次发布可以直接复用已有的 WebSocket 连接，不需要再次扫码。

判断方法：访问 https://mp.weixin.qq.com/ 如果直接显示后台界面（不需要扫码），说明会话仍在有效期内。

---

## ⚠️ Pitfall：手机扫码后 mp_quobalpha cookie 不会写入 Chrome

## ⚠️ Pitfall：手机扫码后 mp_quobalpha cookie 不会写入 Chrome

**问题现象**：用户扫描了 Chromium 页面里的二维码，WeChat 显示"已登录"，但自动化脚本仍报 `ret=200040 invalid csrf token`，后续 API 调用全部失败。

**根本原因**：WeChat 扫码登录的 `mp_quobalpha` cookie 是颁发给**扫码设备**（手机 WeChat 客户端）的，不是颁发给显示二维码的浏览器。即使二维码在 Chrome 里显示，扫描行为发生在手机微信，cookie 会被写到手机微信的 web 登录态，不会写到 Chrome 的 user-data-dir。

Chrome 里有 `token`（URL 参数形式），但缺少 `mp_quobalpha`（cookie 形式），导致无法通过 CSRF 验证（`del_token` / `create` 等操作需要 cookie 中的 CSRF token）。

**⚠️ 验证方法：不要只看页面是否显示已登录，必须检查 Cookie！**

用户说"已登录"≠ cookie 已写入 Chrome。正确验证方式：

```python
# 用 CDP Network.getCookies 检查
await ws.send(json.dumps({'id':1,'method':'Network.getCookies','params':{'urls':['https://mp.weixin.qq.com']}}))
resp = json.loads(await ws.recv())
cookies = resp.get('result',{}).get('cookies',[])
has_session = any(c['name'] in ('pass_ticket','slave_sid') for c in cookies)
# has_session=True → session 有效 ✅
# 只有 wxuin 没有 pass_ticket/slave_sid → session 已过期 ❌
# 两个都没有 → 完全未登录 ❌
```

**解决方案（按可行性排序）**：

| 方案 | 原理 | 可行性 |
|------|------|--------|
| **A. 同一 Chrome 内扫码**（推荐） | 打开 `https://wx.qq.com/`（微信网页版），在 Chrome 里展示二维码，用手机微信扫码 → cookie 直接写入 Chrome | ✅ 完全可行 |
| **B. 手动 copy-paste** | 生成 HTML → 告知用户文件路径 → 用户全选复制粘贴到微信编辑器 | ✅ 始终可用，无 cookie 依赖 |
| **C. 复用手机端已登录的 Session** | 用手机浏览器打开 mp.weixin.qq.com 并登录，手动在手机端编辑草稿 | ⚠️ 操作繁琐 |

**具体操作（方案 A）**：

```bash
# 1. 在已有 Chrome 实例里新开一个标签页，打开微信网页版
browser_navigate(url='https://wx.qq.com/')
# 此时会显示微信的二维码（左侧二维码，右侧微信 logo）

# 2. 截图发给用户
# 用户用手机微信扫码（不是扫公众平台二维码）

# 3. 登录成功后，导航到公众平台
browser_navigate(url='https://mp.weixin.qq.com/')
# 此时 cookie 里已有 mp_quobalpha，可以自动化操作
```

**错误操作（不要这样做）**：

❌ 在 `https://mp.weixin.qq.com/` 页面显示二维码后让用户扫码 → 扫码后 mp.weixin.qq.com 有 token 参数，但 mp_quobalpha cookie 在手机微信里，不在 Chrome 里

❌ 用另一个独立浏览器实例扫码 → cookie 写不到当前 automation 用的 Chrome 实例

❌ 只看页面 URL 或标题判断登录状态 → 必须用 CDP 检查 cookie 才可靠

**验证方法**：登录成功后，在 Chrome DevTools Console 执行：
```javascript
document.cookie.split(';').filter(c => c.trim().startsWith('mp_quobalpha'))
```
如果有输出 `mp_quobalpha=...` 则 CSRF 流程可以走通。如果没有输出，即使页面显示已登录，自动化也会失败。
