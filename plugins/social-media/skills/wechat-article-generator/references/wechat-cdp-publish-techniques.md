# WeChat 草稿发布：CDP + API 经验总结

## BunCdp `send()` 返回值处理

CDP `send()` 的返回值经过封装后：
- 成功时：直接是 `msg.result`（可能是 `undefined`、字符串、对象等）
- 出错时：整个 `msg` 对象（包含 `error` 字段）

```javascript
// ✅ 正确：优先取 result，避免 error 对象被当正常值
const r = await cdp.send("Runtime.evaluate", {...});
if (r && r.result !== undefined) {
  // 正常结果
} else {
  // 错误或特殊值
}
```

## `Page.captureScreenshot` 返回格式

`Page.captureScreenshot` 在 BunCdp 中的返回格式：
- 直接返回 `{ data: "base64..." }`，不是 `{ result: { data: "..." } }`
- 因此代码中直接用 `ss.data`，不要写 `ss.result.data`

```javascript
const ss = await cdp.send("Page.captureScreenshot", {format:"png",quality:80});
// ✅ ss.data — 直接是 base64 字符串
// ❌ ss.result.data — 会是 undefined
require("fs").writeFileSync("/tmp/out.png", Buffer.from(ss.data, "base64"));
```

## token=0 的根因与解法

**现象**：`Runtime.evaluate` 取到的 `window.location.href` 包含 `token=0`（而非真实 token）。

**根因**：WeChat 公众平台的 token 是 HttpOnly Cookie，不是 URL 参数，也不是 localStorage。登录后 cookie 被设置在 `mp.weixin.qq.com` 域下。

**解法**：
1. 登录成功后，**从已加载页面的 URL 中获取 token**（即使 token=0，这个 cookie 本身有效）
2. API 调用（`operate_appmsg`）通过 `fetch` 发送请求时，设置 `Cookie: wxuin=...` 来自当前页面 cookie（从 URL 或 cookie API 中提取）
3. 关键：`wxuin` 不是 HttpOnly，可以从 URL 参数中解析（`https://mp.weixin.qq.com/cgi-bin/appmsg?t=...&wxuin=79100550279013&...`）

## Chromium 重启后 WebSocket URL 变化

每次重启 Chromium，`/devtools/browser/xxx` 中的 UUID 都会变化。

**正确做法**：
```javascript
// 每次都从 /json/version 动态获取
const ver = await (await fetch("http://127.0.0.1:9222/json/version")).json();
await cdp.connect(ver.webSocketDebuggerUrl);  // 这个 URL 每次都变

// 获取当前标签页的 WS URL（每次从 /json 获取最新的）
const tabs = await (await fetch("http://127.0.0.1:9222/json")).json();
const tab = tabs.find(t => t.url.includes("weixin.qq.com"));
await cdp.connect(tab.webSocketDebuggerUrl);
```

**不要依赖** 持久化的 WS URL 文件（如 `wechat-ws2.txt`），每次都要重新获取。

## 登录后 editor 页面导航

登录成功后的标准流程：
1. 用已登录页面的 WS URL（获取 cookie + token）
2. 导航到 `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=10&lang=zh_CN`
3. 等页面完全加载（约 5-8 秒）
4. 截图确认编辑器就绪
5. 调用 `operate_appmsg?sub=save` API 保存草稿

## operate_appmsg API 调用方式

必须用 `fetch` 而非 CDP 的 `Runtime.evaluate` + `XMLHttpRequest`：
- CDP session 的跨域限制会导致 XHR 失败
- 直接 fetch 可以带上浏览器的 cookie（通过 `Cookie` header 或自动带上）

```javascript
const formData = Object.keys(payload).map(k =>
  encodeURIComponent(k) + "=" + encodeURIComponent(payload[k])
).join("&");

const resp = await fetch("https://mp.weixin.qq.com/cgi-bin/operate_appmsg?sub=save", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "Referer": "https://mp.weixin.qq.com/"
  },
  body: formData
});
const result = await resp.json();
console.log("ret:", result.base_resp.ret, "appMsgId:", result.app_msg_id);
```

## publish-draft.mjs 静默挂起（2026-05 实测）

**现象**：`terminal(background=true)` 启动 publish-draft.mjs 后，进程存在（ps 可见）、CPU 占用正常，但 `process(log)` 返回 0 行输出。持续 2+ 分钟无任何 stdout/stderr。

**触发条件**（任一）：
- WeChat MP token 已过期（cookie 中无 `token=...`）
- Chrome tab 的 WS URL 已变化（tab 切换或页面导航导致）
- CSRF 校验失败（`mp_quobalpha` cookie 缺失）

**与 exit code 124 的区别**：
- exit code 124：进程被 timeout kill，有明确退出码
- 静默挂起：进程一直在跑，不退出不输出，需要手动 `process(kill)`

**预防措施**：运行脚本前先做 token 预检（见 SKILL.md Step 2.5）。

## Python websockets 直连 CDP 发布（publish-draft.mjs 失败时的后备方案）

当 publish-draft.mjs 不可用或反复失败时，可以用 Python websockets 库直接通过 CDP 调用 operate_appmsg API：

```python
import asyncio, json, random
from urllib.parse import quote

async def publish_via_cdp(ws_url, title, body_html, digest):
    import websockets
    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        # 1. Get token from cookie
        await ws.send(json.dumps({"id":1, "method":"Runtime.evaluate", "params":{
            "expression": "document.cookie.split(';').map(c=>c.trim()).find(c=>c.startsWith('token='))?.split('=')[1] || 'NO_TOKEN'"
        }}))
        resp = json.loads(await ws.recv())
        token = resp["result"]["result"]["value"]
        if not token or token == "NO_TOKEN":
            return {"error": "NO_TOKEN"}

        # 2. Build form data
        parts = [
            f"token={token}", "lang=zh_CN", "f=json", "ajax=1",
            f"random={random.random()}", "AppMsgId=", "count=1",
            "data_seq=0", "operate_from=Chrome", "isMark=0",
            f"title0={quote(title)}", f"content0={quote(body_html)}",
            "author0=", "fileid0=", f"digest0={quote(digest)}",
            "sourceurl0=", "need_open_comment0=0", "show_cover_pic0=1",
            "copyright_type0=0", "can_reward0=0", "fee_type0=", "pay_fee0=0",
        ]
        form_data = "&".join(parts)

        # 3. Call API via synchronous XHR in page context
        js = f"""
        (function() {{
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/cgi-bin/operate_appmsg?sub=create&t=ajax-response&lang=zh_CN', false);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.send({json.dumps(form_data)});
            return xhr.responseText;
        }})()
        """
        await ws.send(json.dumps({"id":2, "method":"Runtime.evaluate", "params":{
            "expression": js, "awaitPromise": False
        }}))
        resp = json.loads(await ws.recv())
        return json.loads(resp["result"]["result"]["value"])

# 用法
# tabs = json.loads(requests.get("http://127.0.0.1:9222/json").text)
# ws_url = [t for t in tabs if "mp.weixin" in t["url"]][0]["webSocketDebuggerUrl"]
# result = asyncio.run(publish_via_cdp(ws_url, title, body, digest))
```

**注意事项**：
- `websockets` 库需要 `pip install websockets`
- XHR 用同步模式（第三个参数 `false`），异步 `awaitPromise` 在 CDP 环境下不稳定
- API 用相对路径 `/cgi-bin/operate_appmsg`，不用绝对 URL
- `AppMsgId` 和 `fileid0` 传空字符串 `''`，不是 `'0'` 或 `'-1'`

## operate_appmsg type=77 草稿内容为空（2026-05-30 验证）

**现象**：`operate_appmsg sub=create type=77` 返回 `ret=0`，`filter_content_html` 包含完整 HTML（11,302 字符），`appMsgId` 正确生成。草稿出现在列表中，标题正确。但在微信编辑器中打开后，ProseMirror `children=0`，`innerText` 只有标题文本，正文完全为空。

**根因**：`type=77` 是旧版素材管理 API，内容存入旧版素材区。新版草稿箱和旧版素材是两套独立系统。草稿列表混合展示两者，但编辑器只正确加载新版草稿数据。

**已验证的失败路径**（均返回 ret=0 但编辑器正文为空）：
1. `baoyu-post-to-wechat` 的 `publish-draft.py` — `type=77` + 同步 XHR
2. 手动 Python CDP + 同步 XHR — 修复了 URL 中 `token=***` 问题，改用真实 token
3. 两种方式 `filter_content_html` 都有完整内容，但编辑器不加载

**`publish-draft.py` 额外问题**：第 100 行 URL 中 `token=***` 是 CDP 掩码（`document.cookie` 等在 `Runtime.evaluate` 中会被替换为 `***`），但 POST body 中的 `params.token` 用的是 Python f-string 插值的真实值，所以实际不影响功能。

**正确验证方法**：不要只看 `filter_content_html` 返回值。必须导航到编辑器页面，检查 `document.querySelector('.ProseMirror').children.length > 0`。

**当前状态**：`operate_appmsg type=77` 不适用于新版草稿箱。ProseMirror 编辑器注入（innerHTML/execCommand/paste/clipboard API）也全部被过滤为纯文本。需要找到新版草稿箱的正确 API 端点。

## Session 有效性验证（2026-06-08 经验）

**现象**：`publish-draft.py` 返回 `invalid session`（`ret=None base_ret=200003`），但用户说自己已经登录了看到了"公众号主页"。

**根因**：用户可能在个人浏览器里看到的是正常页面，但 headless Chrome（`/home/kewang/.hermes/chrome-profile`）的 session 已过期。URL 中可能有旧 `token=` 参数但 session 已失效。

**⚠️ 关键教训：用户说"已登录"不代表 Chrome cookie 有效。** 2026-06-17 再次验证——`mp.weixin.qq.com` 扫码后 cookie 不写入 Chrome，必须检查 `Network.getCookies` 确认。

**⚠️ Chromium profile cookie 不持久化（2026-06-17）**：`--user-data-dir=/home/kewang/.hermes/chrome-profile` 在 headless 模式下，扫码登录后的 cookie **可能不会持久化到磁盘**。每次重启 Chromium 后 `document.cookie` 为空。原因可能是 headless 模式的 cookie 缓存策略不同（内存中未 flush）。

**对策**：
1. 保持 Chrome 进程持续运行，不重启
2. 每次 Chrome 重启后用 `Network.getCookies` 验证 cookie
3. 如果 cookie 丢失，只能重新扫码

**⚠️ Token 过期极快（几分钟）**：通过 URL 参数传递的 token（如 `token=33247932`）有效期很短。用户从自己浏览器复制的 token 很快过期，不能作为发布凭据。唯一可靠方式是 Chrome cookie。

**可靠的验证方法——检查 Cookie，不要只看 URL：**

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

**判断规则**：
- `wxuin` 存在 + `pass_ticket`/`slave_sid` 存在 → session 有效 ✅
- 只有 `wxuin`，没有 `pass_ticket`/`slave_sid` → session 过期，需重新扫码 ❌
- 两个都没有 → 完全未登录 ❌

**QR 码快速刷新**：微信登录二维码有效期约 30 秒。过期后需要刷新页面重新获取（不是直接重新请求同一个 URL）。用 CDP `Page.navigate` 到 `https://mp.weixin.qq.com/` 触发刷新，等待 4 秒，再通过浏览器内 XHR fetch 新的 `scanloginqrcode?action=getqrcode&random=...` 图片。

**publish-draft.py 失败时的错误码**：
- `base_ret=200003` + `msg=invalid session` → token 过期，需重新登录
- `base_ret=200002` → 参数错误（检查 title/digest 是否为空）
## 关键 lesson

1. **WS URL 每次重启都变** → 动态获取，不要信任缓存文件
2. **CDP result 可能是 undefined** → 总是检查 `result !== undefined`
3. **token=0 不代表失败** → cookie 才是真正的认证载体，API 调用靠 cookie
4. **截图是最可靠的验证** → 任何 CDP DOM 查询失败，先截图看实际页面状态
5. **HTML 文件要持久化** → `/tmp` 文件可能在会话间丢失，及时保存到 `~/.hermes/` 等持久目录
6. **publish-draft.mjs 可能静默挂起** → 先做 token 预检，失败则用 Python CDP 后备方案
7. **operate_appmsg type=77 是旧版 API** → `ret=0` + `filter_content_html` 有内容 ≠ 草稿箱有内容。必须用编辑器实际打开验证。
8. **Session 验证看 Cookie 不看 URL** → `wxuin` 存在不等于已登录，必须有 `pass_ticket`/`slave_sid`。用户说"已登录"可能是看的自己的浏览器，不是 headless Chrome。
