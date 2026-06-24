---
name: wechat-article-post-draft
description: 发布微信公众号文章到草稿箱。通过 Python CDP 脚本连接本地 Chromium，使用新版 operate_appmsg API（type=77777）创建草稿。适用于 headless Linux 环境，不需要 bun 运行时。
trigger: 当需要将已生成的微信公众号 HTML 文章发布到草稿箱时使用。配合 wechat-article-generator skill 一起工作：先生成 HTML，再用本 skill 发布。
requires:
  tools:
    - terminal
    - execute_code
---

# 微信公众号草稿发布

将已生成的 HTML 文章通过 CDP (Chrome DevTools Protocol) 发布到微信公众号草稿箱。

> ⚠️ **QR 导出失败已知问题**：CDP `fetch(img.src)` 在 headless 模式下可能返回空（DOM 渲染不完整）。优先用 `Page.captureScreenshot` + Pillow 裁剪，如果用户扫描失败超过 2 次则切换备选方案（见 `references/qr-export-failures.md`）。

## 前置条件

1. **Chromium 运行中**：`http://127.0.0.1:9222` 可访问
2. **微信公众平台已登录**：Chrome 中有有效的公众号后台 session（需扫码登录）
3. **Python 3.11 with websockets**：系统 Python 3.9 没有 pip，需要找 Python 3.11
   - 先试 `~/.hermes/hermes-agent/venv/bin/python`
   - 若不存在或无 pip，试 `/home/kewang/.local/bin/python3.11`
   - 若提示 "externally managed environment"（uv），加 `--break-system-packages`
4. **body HTML 文件**：纯 body 内容（不含 `<html><head>`），通常从完整 HTML 中用正则提取

## 发布流程

### Step 1: 提取 body HTML

> ⚠️ **重要修正**：正则 `[^*]*` 的含义是"匹配除 `*` 外的任意字符"，不适合用于匹配 style 属性中的 `;` 分号。以下代码使用正确的 `[^>]*` 匹配到 `>` 为止，并改用字符串切片提取 body 内容（更可靠）。

```python
import re, os

html_path = "完整文章.html"
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# 方法1（推荐）：字符串切片，比正则更可靠
body_start = html.find('<body>') + len('<body>')
body_end = html.find('</body>')
body = html[body_start:body_end].strip()

# 方法2（备选）：正则（注意 [^>]* 而非 [^*]*）
# body_match = re.search(r'<body>(.*)</body>', html, re.DOTALL)
# body = body_match.group(1).strip()

# 去除非正文元素（注意：font-size:13px 含分号 ; 不能用 [^*]*）
body = re.sub(r'<div style="background:#fff3cd[^"]*"[^>]*>.*?</div>\s*', '', body, flags=re.DOTALL)  # 复制提示
body = re.sub(r'<img[^>]*alt="封面图"[^>]*>\s*', '', body)  # 封面图
body = re.sub(r'<h1[^>]*>.*?</h1>\s*', '', body, flags=re.DOTALL)  # h1 标题
body = re.sub(r'<p style="font-size:13px[^>]*>.*?</p>\s*', '', body, flags=re.DOTALL)  # 日期行（正确写法）
body = re.sub(r'<hr\s*/?>\s*', '', body)  # hr 分割线
body = re.sub(r'<p style="text-align:center[^>]*">— END —</p>', '', body)  # END 结尾
body = re.sub(r'<p style="text-align:center[^>]*">.*?</p>\s*', '', body, flags=re.DOTALL)  # 结尾著作权
body = re.sub(r'<!--[\s\S]*?-->\s*', '', body)  # HTML 注释
body = body.strip()

out_path = "/tmp/article-body.html"
with open(out_path, "w", encoding="utf-8") as f:
    f.write(body)
print(f"Body length: {len(body)}, saved to {out_path}")
```

### Step 2: 运行发布脚本

```bash
# 找到可用的 Python 3.11（venv 不存在时 fallback 到 uv managed Python）
PYTHON=$(command -v ~/.hermes/hermes-agent/venv/bin/python 2>/dev/null || \
         command -v /home/kewang/.local/bin/python3.11 2>/dev/null || \
         command -v python3.11 2>/dev/null)

$PYTHON ~/.hermes/skills/wechat-article-post-draft/scripts/publish-draft.py \
  --title "文章标题" \
  --file /tmp/article-body.html \
  --digest "文章摘要（可选，前120字）"
```

### Step 3: 确认结果

成功输出示例：
```
✅ 100000729 content: 7810
```
- 第一个数字是草稿 ID（appMsgId）
- 第二个是内容字符数

## 脚本参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--title` | ✅ | 文章标题，不超过 64 字 |
| `--file` | ✅ | body HTML 文件路径 |
| `--digest` | ❌ | 摘要，不传则自动截取前 120 字 |
| `--del` | ❌ | 删除指定 ID 的旧草稿 |

## ⚠️ 常见问题

### QR 码裁剪坐标验证（2026-06-14 验证）
- **问题**：CDP 截图后裁剪 QR 码时，如果坐标估算错误会导致截到空白区域
- **修复**：先用 `browser_vision` 确认页面完整布局，再根据视觉反馈调整裁剪坐标
- **典型坐标**（780x503 分辨率页面）：QR 码在右侧登录面板，约 x=429-608, y=110-276
- **裁剪后放大 2-3 倍**：`qr.resize((qr.width*2, qr.height*2), Image.LANCZOS)` 提高扫描成功率
- **发送格式**：JPEG（质量 95），PNG 在飞书中容易被压缩损坏
- **⚠️ 重要**：用户看不到 QR 码时，先发送完整页面截图确认位置（不要直接发裁剪图），用户确认"位置对的"后再发裁剪版

### 扫码登录标准流程（2026-06-04 验证）

**前置检查**：先检查当前 Chrome session 状态
```bash
curl -s http://127.0.0.1:9222/json/list | python3 -c "
import json,sys,re
tabs=json.load(sys.stdin)
for t in tabs:
    url=t.get('url','')
    if 'mp.weixin.qq.com' in url:
        m=re.search(r'token=(\d+)',url)
        if m:
            print(f'✅ Already logged in. Token: {m.group(1)}')
        else:
            print(f'⏳ Not logged in. URL: {url[:80]}')
"
```

**如果未登录或 token 过期，执行扫码登录：**

#### Step 1: 导航到登录页
```python
# 通过 CDP 导航到登录页
await ws.send(json.dumps({
    'id': 1,
    'method': 'Page.navigate',
    'params': {'url': 'https://mp.weixin.qq.com/'}
}))
await ws.recv()
await asyncio.sleep(3)  # 等待页面加载
```

#### Step 2: 截图获取二维码
```python
# 用 CDP 直接截图（JPEG，~6KB）
await ws.send(json.dumps({
    'id': 2,
    'method': 'Page.captureScreenshot',
    'params': {'format': 'jpeg', 'quality': 80}
}))
resp = await ws.recv()
data = json.loads(resp)
img_data = base64.b64decode(data['result']['data'])
with open('/tmp/wechat-qr.jpg', 'wb') as f:
    f.write(img_data)
# 发送给用户（飞书/Telegram 等）
```

#### Step 3: 轮询检测扫码状态
```bash
# 每 3-5 秒检测一次，最多等待 90 秒
for i in $(seq 1 30); do
  curl -s http://127.0.0.1:9222/json/list | python3 -c "
import json,sys,re
tabs=json.load(sys.stdin)
for t in tabs:
    url=t.get('url','')
    if 'mp.weixin.qq.com' in url:
        m=re.search(r'token=(\d+)',url)
        if m:
            print(f'SUCCESS:{m.group(1)}')
            sys.exit(0)
print('WAIT')
" 2>/dev/null
  if [ "$result" = "SUCCESS:*" ]; then
    token=$(echo "$result" | cut -d: -f2)
    echo "✅ Login success! Token: $token"
    break
  fi
  sleep 3
done
```

**扫码成功的标志**：页面 URL 从 `https://mp.weixin.qq.com/` 跳转到 `https://mp.weixin.qq.com/cgi-bin/home?t=home/index&lang=zh_CN&token=...`

#### Step 4: 超时处理
如果 90 秒内未检测到登录：
1. **刷新页面获取新二维码**：`Page.reload` → 重新截图 → 发送给用户
2. **不要手动拼接 token**：token 来自微信 session，非固定值
3. **检查页面状态**：用 CDP 执行 JS 检查是否有"二维码已过期"提示

### 扫码登录关键注意（反复踩坑总结）

**核心原则：不要干扰页面的 JS 定时器！**

1. **不能冻结 setInterval/setTimeout**：页面自身的轮询负责检测扫码确认并自动跳转。冻结后扫码成功但页面无法检测到，导致 login session 无法建立
2. **QR 码有效期短（~2分钟）**：导出→发送→用户扫描需要快速完成。不要提前导出等用户
3. **导出后立即发送**：用飞书发送原始 JPEG（不是 canvas 重绘 PNG），速度优先
4. **页面自动刷新 QR**：登录页 JS 会定期刷新 QR（random 参数变化），这是正常行为，不要阻止
5. **轮询检测要轻量**：只监控 `location.href` 变化（出现 `token=`），不要频繁调 `scanloginqrcode?action=ask` 干扰页面自身轮询
6. **检测频率**：每 3-5 秒检测一次，90 秒超时后刷新页面获取新二维码
7. **截图格式**：用 `Page.captureScreenshot` 直接获取 JPEG（~6KB），不要用 canvas 重绘 PNG（~20KB，飞书压缩后容易损坏二维码）

**⚠️ 重要：必须先完成扫码登录，才能运行 `publish-draft.py`**
- `publish-draft.py` 的三级 token fallback 依赖有效的微信 session
- 如果 session 未建立（未扫码或扫码未确认），脚本会返回 `ret=200003 invalid session`
- bun 脚本同样需要有效 session，否则静默挂起或返回 `invalid session`

### 微信 token 过期 (ret=200003)
- **现象**：`invalid session` 错误
- **识别**：页面显示"登录超时，请重新登录"，`h2` 包含该文本
- **解决**：点击 paragraph `ref=e10` 展开二维码 → 用 `canvas.toDataURL()` 获取 base64 → 发送飞书 → 用户扫码 → 重新运行脚本
- **不要做的事**：
  - **不要**用 `browser_vision` 描述登录页——vision 模型无法可靠识别二维码
  - **不要**用 curl 下载二维码 URL（临时地址，外部访问返回空）
  - 二维码 `scanloginqrcode?action=getqrcode&random=...` URL 只能在 CDP 浏览器内获取图片数据，外部 curl 返回 0 字节。**推荐直接 fetch 原始 JPEG**（~6KB）而非 canvas PNG（~20KB），飞书压缩后更不容易损坏
  - **不要**手动在 URL 中拼接 token——token 来自微信 session，非固定值
  - 用 `fetch('/cgi-bin/scanloginqrcode?action=ask&...')` 可监控扫码状态：status 0=未扫, 1=已扫待确认, 2=已确认, 4=过期。详见 `references/session-timeout-troubleshooting.md`

### 新版发布方案（2026-06-04 验证成功）
- **`publish-draft.py` with `type=77777`**：新版草稿 API，**必须配合有效微信 session**
- **成功标志**：输出 `✅ <draft_id> content: <char_count>`，且草稿箱中可见完整内容
- **失败标志**：`ret=200003 invalid session`（session 过期）或 `ret=200004`（未登录）
- **注意**：`publish-draft.py` 的三级 token fallback 在已登录状态下可靠；未登录时脚本无法获取 token

### 旧版 API 不可用（已废弃）
- `operate_appmsg?sub=save` 等旧操作已废弃
- `operate_appmsg?sub=create`（无 type=77）返回 `ret=444002`，已完全废弃
- `sub=create&type=77` 返回 `ret=0` + appMsgId，**但编辑器打开后正文为空**（ProseMirror children=0，只有标题文本）
- 根因：`type=77` 是旧版素材 API，内容存入旧版素材区。草稿列表混合展示两者，编辑器只加载新版草稿数据
- ProseMirror 注入（innerHTML/execCommand/paste/clipboard API）也全部被过滤为纯文本（2026-05-30 反复验证）

### publish-draft.py 脚本 Token 提取失败 / 草稿内容为空
- **现象A**：脚本输出 `错误: 获取微信 token 失败`，但浏览器 session 实际有效
- **原因**：脚本的三级 token fallback（`window.__token` → Cookie → URL）在某些页面状态下全部返回空
- **现象B**：脚本输出 `✅ 100000830 content: 11302`（看似成功），但编辑器打开后正文为空
- **原因**：`operate_appmsg type=77` 是旧版素材 API（详见上方"旧版 API 不可用"章节）
- **额外发现**：`publish-draft.py` 第 100 行 URL 中 `token=***` 是 CDP 掩码，CDP 在 `Runtime.evaluate` 中会将 cookie/token 值替换为 `***`。但 POST body 中的 token 是 Python f-string 插值的真实值，不影响功能
- **解决**：跳过脚本，需要找到新版草稿箱的正确 API。从 `location.href` 提取 token 更可靠：
  ```javascript
  var m = location.href.match(/token=(\d+)/);
  var token = m ? m[1] : null;
  ```

### 标题超长
- 微信限制 64 个字符
- 脚本会自动截断，但建议手动控制标题长度

### Chromium CDP WebSocket 403 Forbidden
- **现象**：`WebSocketBadStatusException: Handshake status 403 Forbidden` + `Rejected an incoming WebSocket connection from the http://127.0.0.1:9222 origin`
- **原因**：Chromium 110+ 要求显式允许 CDP WebSocket 来源
- **修复**：启动 Chromium 时加 `--remote-allow-origins=*`（或 `--remote-allow-origins=http://127.0.0.1:9222`）
- **注意**：此 flag 对 headless 和有头模式都生效，不加则所有 CDP WebSocket 连接被拒

### ⚠️ "已经登录"误导 — 用户说的"已登录"永远指自己的浏览器，不是 CDP Chrome（2026-06-17 验证）

当用户说"已经登录"时，他们**永远**指的是自己的个人浏览器。CDP Chrome（localhost:9222，独立 profile）是完全独立的 session，用户的登录态不会自动共享。

**正确的确认方式**：
```bash
curl -s http://127.0.0.1:9222/json | python3 -c "import sys,json,re;tabs=json.load(sys.stdin);[print(f'✅ CDP Chrome 已登录: {m.group(1)}' if (m:=re.search(r'token=(\d+)',t['url'])) else '❌ CDP Chrome 未登录') for t in tabs if 'mp.weixin.qq.com' in t['url']]"
```

**用户说"已经登录"时的标准回应**：
1. 先检查 CDP Chrome 的 `token=` 状态
2. 如果 CDP Chrome 未登录，告诉用户：**"请扫服务器上的二维码登录"**
3. 发 QR 码时必须附说明文字，避免用户以为在让自己浏览器扫码

### ⚠️ 不要无故重启 CDP Chrome

如果 `publish-draft.py` 报告 "No token found" 或 "invalid session"，**不要杀掉 Chrome 重新启动**。profile 目录保存的 session cookie 可能还能用。

**正确的恢复路径**：
1. ✅ 从当前 Chrome 页面截取 QR 码发给用户扫码（最优先）
2. ✅ 如果二维码过期，刷新页面重新截取
3. ❌ 不要杀掉 Chrome 进程重开 — 这会丢弃可能仍有效的 session cookie

**已发生的事故**（2026-06-17）：用户反馈"这个自动发布我用了好几个月都没问题"——Agent 杀掉了 Chrome 后 session 彻底丢失，用户需重新扫码。

**唯一需要重启 Chrome 的场景**：用户明确说"杀进程重试"，或 Chrome 进程已僵死。

### ⚠️ 用户浏览器的 token 对 CDP Chrome 无效

用户从自己浏览器 URL 复制来的 token（如 `token=33247932`）**不能用于 CDP Chrome**。
- CDP Chrome 导航到该 URL 会显示"登录超时，请重新登录"
- 原因：token 绑定用户浏览器 session cookie，CDP Chrome cookie 不同
- 唯一使用用户 token 的方式：让用户在**自己浏览器**的 Console 中执行 XHR

### ⚠️ Headless Chrome 无法渲染 WeChat 登录页 QR 码（2026-06-14 验证；2026-06-18 补充 xauth 备选方案）
- **现象**：`--headless=new` 模式下 Chrome 加载 `mp.weixin.qq.com` 后 DOM 为空（`document.body.innerHTML` 为空字符串），QR 码不显示
- **根因**：WeChat 登录页依赖 JavaScript 动态渲染 QR 码，headless 模式不执行 JS
- **验证方法**：用 CDP 的 `Runtime.evaluate` 执行 `document.body?.innerHTML?.substring(0, 200)`，返回空字符串则 QR 码未渲染
- **修复方案 A（推荐）：xvfb-run**（需要 `xauth`）：
  ```bash
  xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" \
    chromium --remote-debugging-port=9222 --no-first-run --no-default-browser-check --disable-gpu \
    --user-data-dir=/home/kewang/.hermes/chrome-profile
  ```
  **前提**：系统需安装 `xvfb` 和 `xauth`（`dpkg -l | grep -E 'xvfb|xauth'` 确认）。`xvfb-run` 依赖 `xauth` 创建认证 cookie，缺少会报 `xvfb-run: error: xauth command not found`。如果 `xauth` 未安装且无法安装（如无 sudo 权限），使用方案 B。
- **修复方案 B（备选）：手动 Xvfb**（不需要 `xauth`）：
  直接启动 Xvfb 虚拟显示器，用环境变量 DISPLAY 指向它：
  ```bash
  # 1. 后台启动虚拟显示器
  Xvfb :99 -screen 0 1920x1080x24 &
  
  # 2. 用 DISPLAY 环境变量启动 Chromium
  DISPLAY=:99 chromium --remote-debugging-port=9222 --no-sandbox --disable-dev-shm-usage \
    --user-data-dir=/home/kewang/.hermes/chrome-profile --window-size=1280,900 \
    "https://mp.weixin.qq.com/" &
  ```
  注意：方案 B 不加 `--disable-gpu`（Xvfb 需要 GPU 模拟），也不加 `--headless`。`--window-size` 必须设高分辨率（≥1280×900）以确保登录页完整布局。
- **验证**：启动后用 `curl http://127.0.0.1:9222/json/version` 确认 CDP 响应，再执行 `Runtime.evaluate` 检查 `document.body.innerHTML.length > 0` 确认页面已正常渲染

### 系统Python无pip
- 系统 Python 3.9 没有 pip，无法安装 websockets
- venv Python 路径可能已不存在（如 `~/.hermes/hermes-agent/venv/bin/python`）
- **Fallback 顺序**：先试 venv Python → `/home/kewang/.local/bin/python3.11`（uv-managed）→ 系统 python3.11
- uv-managed Python 安装包需 `--break-system-packages` flag

## 架构说明

```
┌─────────────────────┐
│  publish-draft.py   │
│  (Python 3.11)      │
└──────────┬──────────┘
           │ WebSocket
           ▼
┌─────────────────────┐
│  Chromium CDP       │
│  127.0.0.1:9222     │
└──────────┬──────────┘
           │ 同步 XHR
           ▼
┌─────────────────────┐
│  微信公众平台       │
│  operate_appmsg API │
│  (type=77777)       │
└─────────────────────┘
```

**Token 获取策略**（三级 fallback）：
1. `window.__token` — 全局变量
2. `document.cookie` — Cookie 中的 token
3. `location.search` — URL 参数（最可靠）

**CDP 执行方式**：
- 直接在 page context 执行 JS（`Runtime.evaluate`）
- 不使用 `Target.attachToTarget` 子 session
- 同步 `XMLHttpRequest` 调用 API（fetch 异步会被 CDP 超时截断）

## 新版发布流程（ProseMirror 编辑器注入）— ⚠️ 2026-05-30 验证失败

> 旧版 `operate_appmsg` API 和 ProseMirror 注入均验证失败。

**已验证失败的 ProseMirror 注入方式**（均被过滤为纯文本）：
1. `innerHTML` — 直接设置 `.ProseMirror` 的 innerHTML，Vue 不识别
2. `document.execCommand('insertHTML')` — 被异步处理，HTML 标签被剥离
3. Clipboard API + paste event — 被过滤器拦截
4. Selection API + Range.insertNode — 同样被剥离

原 ProseMirror 注入文档保留在 `references/wechat-prosemirror-publish.md` 供参考，但当前不可用。

## 与其他 skill 的关系

- **wechat-article-generator**：生成文章 HTML → 本 skill 发布到草稿箱
- **baoyu-post-to-wechat**：保留作为备份，包含更多发布方式（API/浏览器粘贴等），但需要 bun 运行时

## References

- `references/wechat-prosemirror-publish.md` — **新版发布流程**：ProseMirror 编辑器注入（2026-05 验证，替代已废弃的 operate_appmsg API）
- `references/operate-appmsg-api.md` — 微信 operate_appmsg API 详细文档（旧版，已废弃但保留参考）
- `references/bun-cdp-injection.md` — CDP 注入模式参考
- `references/buncdp-operate-appmsg-pattern.md` — Bun CDP 调用 operate_appmsg 的模式
- `references/session-timeout-troubleshooting.md` — 登录 session 超时（ret=200003）的识别与处理流程，包含二维码获取方法
- `references/qr-export-failures.md` — QR 码导出失败模式：fetch(img.src) 返回空、CDP 截图 QR 无法扫描等问题及备选方案
- `references/our-account-info.md` — 当前公众号信息（名称、ID、AppID）