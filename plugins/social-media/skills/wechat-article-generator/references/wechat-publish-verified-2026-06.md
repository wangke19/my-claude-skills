# 已验证的 WeChat 草稿发布流程（2026-06-02）

## 核心发现

### 1. Python asyncio CDP + type=77777 + FormData 是可靠方案

**验证时间**：2026-06-02

**方案A（推荐）**：Python asyncio + websockets + CDP Runtime.evaluate + operate_appmsg API

```python
import asyncio, json, websockets, urllib.request

CDP_PORT = 9222

async def get_ws_url():
    tabs = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{CDP_PORT}/json").read())
    for t in tabs:
        if "mp.weixin.qq.com" in t.get("url", ""):
            return t["webSocketDebuggerUrl"]

async def cdp_eval(ws, js_expr, msg_id=1):
    await ws.send(json.dumps({
        "id": msg_id, "method": "Runtime.evaluate",
        "params": {"expression": js_expr, "returnByValue": True, "timeout": 30000}
    }))
    resp = json.loads(await ws.recv())
    return resp.get("result", {}).get("result", {}).get("value", "")

async def create_draft(ws, token, title, body_html, digest=""):
    # Step 1: Store content in window context
    store_js = f"window.__draft_body__ = {json.dumps(body_html)}; window.__draft_title__ = {json.dumps(title)}; window.__draft_digest__ = {json.dumps(digest)}; 'stored'"
    await ws.send(json.dumps({"id":20, "method": "Runtime.evaluate", "params": {"expression": store_js, "returnByValue": True}}))
    await ws.recv()

    # Step 2: Create draft via FormData + type=77777
    create_js = f"""(function() {{
        var x = new XMLHttpRequest();
        x.open('POST', 'https://mp.weixin.qq.com/cgi-bin/operate_appmsg?sub=create&type=77777&token={token}', false);
        var fd = new FormData();
        fd.append('token', '{token}');
        fd.append('lang', 'zh_CN');
        fd.append('f', 'json');
        fd.append('ajax', '1');
        fd.append('AppMsgId', '');
        fd.append('count', '1');
        fd.append('data_seq', '0');
        fd.append('title0', window.__draft_title__);
        fd.append('content0', window.__draft_body__);
        fd.append('digest0', window.__draft_digest__);
        fd.append('author0', '');
        fd.append('content_source_url0', '');
        fd.append('need_open_comment0', '0');
        fd.append('show_cover_pic0', '1');
        fd.append('copyright_type0', '0');
        fd.append('can_reward0', '0');
        fd.append('mediaapi_publish_status0', '0');
        fd.append('fee_type0', '');
        fd.append('pay_fee0', '0');
        fd.append('pay_album_info0', '');
        fd.append('is_set_sync_to_finder0', '0');
        x.send(fd);
        return x.responseText;
    }})()"""
    await ws.send(json.dumps({"id":21, "method": "Runtime.evaluate", "params": {"expression": create_js, "returnByValue": True}}))
    resp = await ws.recv()
    return json.loads(resp).get("result",{}).get("result",{}).get("value","")

async def main():
    ws_url = await get_ws_url()
    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        # Extract token from tab URL
        token_js = """(function() {
            var m = location.href.match(/token=([^&]+)/);
            return m ? m[1] : '';
        })()"""
        token = await cdp_eval(ws, token_js)
        print(f"token: {token}")

        with open("/tmp/article-body.html", "r") as f:
            body_html = f.read().strip()

        result_str = await create_draft(ws, token, "文章标题", body_html, "摘要")
        data = json.loads(result_str)
        print(f"ret: {data.get('ret')}, appMsgId: {data.get('appMsgId')}")

asyncio.run(main())
```

**关键要点**：
1. **tab-level WebSocket URL**：必须用 `tab["webSocketDebuggerUrl"]`（来自 `/json` 端点），不能用 browser-level URL
2. **token 来源**：从 tab URL 中提取 `token=...`，不是从 `/json/version` 端点
3. **type=77777**：新版单图文草稿 API，必须用此值
4. **FormData**：必须用 multipart/form-data，不能用 URL-encoded
5. **同步 XHR**：`xhr.open('POST', url, false)` 第三个参数 `false` 确保同步执行
6. **content 存储**：先用 `window.__draft_body__ = ...` 存储到页面上下文，避免 JS 字符串转义问题

### 2. 删除旧草稿的 API 调用

```python
async def delete_draft(ws, token, draft_id):
    js = f"""(function() {{
        var x = new XMLHttpRequest();
        x.open('POST', 'https://mp.weixin.qq.com/cgi-bin/operate_appmsg?t=ajax-response&sub=del&type=77&token={token}&lang=zh_CN', false);
        x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        x.send('token={token}&lang=zh_CN&f=json&ajax=1&AppMsgId={draft_id}&count=1&data_seq=0');
        return x.responseText;
    }})()"""
    await ws.send(json.dumps({"id":10, "method": "Runtime.evaluate", "params": {"expression": js, "returnByValue": True}}))
    resp = json.loads(await ws.recv())
    return resp.get("result",{}).get("result",{}).get("value","")
```

### 3. 验证草稿内容

`list_card` API 返回的 `content` 字段为空，**不能用它验证**。正确做法：
- 检查 `operate_appmsg` 返回的 `ret` 和 `appMsgId`
- 检查 `filter_content_html` 字段中的 `content` 长度
- 手动在微信编辑器中打开草稿验证

### 4. 批量/连续发布（系列文章）

系列文章（如三篇系列）可以连续调用 `publish-draft.py`，同一个 token 在一次登录会话内有效，每次调用独立创建新草稿（每次几秒完成）：

```bash
# 确认 token 有效后，连续发布多篇
~/.hermes/hermes-agent/venv/bin/python \
  ~/.hermes/skills/baoyu-post-to-wechat/scripts/publish-draft.py \
  --title "系列（1）：标题" --file /tmp/article-1-body.html --digest "摘要1"

~/.hermes/hermes-agent/venv/bin/python \
  ~/.hermes/skills/baoyu-post-to-wechat/scripts/publish-draft.py \
  --title "系列（2）：标题" --file /tmp/article-2-body.html --digest "摘要2"
```

**要点**：
- `publish-draft.py` 走 foreground `terminal(timeout=120)` 即可，每次几秒完成，**不需要 background**
- 每次调用创建新草稿，返回不同 appMsgId，不会覆盖已有草稿
- bun 脚本（方案B）才需要 `background=true`（有静默挂起风险）

### 5. 发布流程总结

```
1. 确认 Chrome 已启动并登录微信（token 在 URL 中）
2. 从 HTML 文件提取 body（去除 h1、复制提示、hr、注释等）
3. 连接 CDP WebSocket（tab-level URL）
4. 提取 token（从 tab URL）
5. 存储 body 到 window 上下文
6. 调用 operate_appmsg?sub=create&type=77777（FormData）
7. 验证返回结果（ret=0 + appMsgId）
8. 如需更新，先删除旧草稿（sub=del&type=77），再创建新草稿
```

### 5. 常见失败情况

| 症状 | 原因 | 处理 |
|------|------|------|
| `WebSocket error` / 超时 | Chrome 未启动或未监听 9222 端口 | 先启动 Chromium，确认 `curl http://127.0.0.1:9222/json/version` 有返回 |
| `No WeChat tab` | Chrome 打开了错误页面 | 手动导航到 https://mp.weixin.qq.com |
| `token not in url` | 未完成扫码登录 | 重新截图给用户扫码 |
| `ret=200002` | 参数错误（AppMsgId/fileid0 不为空字符串） | 确保 AppMsgId=''、fileid0='' |
| `ret=444002` | API 路径错误 | 用相对路径 `/cgi-bin/operate_appmsg` |
