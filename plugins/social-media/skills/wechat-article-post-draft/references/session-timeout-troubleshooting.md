# 微信登录 Session 故障排查

## 症状识别

脚本返回 `ret=200003 msg=invalid session` 时，说明 Chrome 中的微信 session 已过期。

两种表现形式：

| 页面标题 | 显示内容 | 说明 |
|----------|----------|------|
| `微信公众平台` | "使用账号登录" 链接 + `e10` paragraph | 二维码登录页，未扫码 |
| `公众号` | "登录超时，请重新登录" | 曾登录过但已超时 |

## 排查步骤

### Step 1: 检查当前 token

在浏览器控制台执行：
```js
JSON.stringify({
  token: window.__token,
  cookie_uin: document.cookie.match(/wxuin=([^;]+)/)?.[1],
  href: location.href
})
```

- `token` 为空字符串 → session 未建立，需要扫码
- `token` 有值但返回 200003 → token 过期，需要重新扫码

### Step 2: 获取并发送登录二维码

当页面显示"登录超时，请重新登录"时，需要重新获取二维码让用户扫码。**不要**依赖 `browser_vision` 描述登录页布局——vision 模型无法可靠识别截图中的二维码。

**正确流程（CDP 内部执行）**：

**1. 展开二维码**：在"登录超时"页面，点击 paragraph `ref=e10` 可切换到扫码登录视图（二维码 + "微信扫一扫"文字）

**2. 获取二维码 base64（在 browser_console 执行）**：
```js
var img = document.querySelector('img[src*="scanloginqrcode"]') || document.querySelector('img');
if (!img) return 'NO_IMG';
var canvas = document.createElement('canvas');
canvas.width = img.width;
canvas.height = img.height;
var ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0);
return canvas.toDataURL('image/png');  // 完整 data URL，含 data:image/png;base64, 前缀
```

**3. 保存并发送（在 execute_code 执行）**：
```python
import base64
# base64_str 是上一步返回的完整字符串（data:image/png;base64,...）
b64_data = base64_str.replace('data:image/png;base64,', '')
img_bytes = base64.b64decode(b64_data)
with open('/tmp/wechat-cdp-qr.png', 'wb') as f:
    f.write(img_bytes)
```

**4. 飞书发送**：
```
send_message(message='MEDIA:/tmp/wechat-cdp-qr.png', target='feishu:<chat_id>')
```

**⚠️ 关键发现**：`scanloginqrcode?action=getqrcode&random=...` URL 是每次页面加载时生成的临时地址，从 CDP 外部（curl）访问返回空内容。**必须**在 CDP 浏览器内通过 JavaScript 执行 `canvas.toDataURL()` 获取图片数据，不能靠 curl 下载。

### Step 3: 验证登录成功

扫码后页面跳转到后台 URL（如含 `token=` 参数的 `t=home/index`），执行：
```js
window.__token  // 应返回有效 token
```

或直接重新运行脚本。

## 扫码状态监控

**⚠️ 推荐方式：URL 变化检测（已验证成功）**

通过 CDP `Runtime.evaluate` 每隔 2-3 秒检查 `window.location.href` 是否包含 `token=`：

```js
// 扫码成功的标志：URL 从 https://mp.weixin.qq.com/ 跳转到
// https://mp.weixin.qq.com/cgi-bin/home?t=home/index&lang=zh_CN&token=...
location.href.includes('token=')
```

**备选方式：`scanloginqrcode?action=ask`（仅用于调试诊断，不推荐作为主检测）**

```js
(async () => {
    var r = await fetch('/cgi-bin/scanloginqrcode?action=ask&token=&lang=zh_CN&f=json&ajax=1');
    var data = await r.json();
    // data.status 含义：
    //   0 = 未扫描（QR 还没人扫过）
    //   1 = 已扫描，等待手机确认
    //   2 = 已确认，登录成功
    //   4 = 二维码已过期，需要刷新
    return JSON.stringify(data);
})()
```

**注意**：`action=ask` 在实际使用中经常始终返回 `status:0`（即使 QR 已被扫描），可靠性不如 URL 变化检测。频繁调用还可能干扰页面自身的登录轮询。

## QR 码原始 JPEG 导出（推荐）

Canvas `toDataURL('image/png')` 导出的 PNG 约 20KB，且经过 canvas 重绘。**直接 fetch 原始图片更可靠**（约 6KB JPEG）：

```js
(async () => {
    var img = document.querySelector('img[src*="scanloginqrcode"]');
    if (!img) return 'NO_IMG';
    var resp = await fetch(img.src, {credentials: 'include'});
    var blob = await resp.blob();
    var reader = new FileReader();
    return new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
})()
```

返回的 data URL 是 `data:image/jpeg;base64,...`（注意是 JPEG 不是 PNG），保存时用 `.jpg` 扩展名。

**为什么推荐**：原始文件更小，飞书发送时二次压缩损失更少，微信更容易识别。

## ⚠️ 飞书图片压缩风险

QR 码通过飞书发送给用户扫描时，飞书可能对图片进行压缩/重编码，导致微信"扫一扫"无法识别二维码。

**应对方案**：
1. 优先发送原始 JPEG（5-6KB），比 canvas PNG（20KB）被二次压缩的概率低
2. 如果 JPEG 仍不行，考虑让用户手动登录后提供 token + cookie（不需要扫码）
3. 可以用 `scanloginqrcode?action=ask` 实时验证用户是否真的扫到了（status 变化）

## 关键页面元素参考

微信登录页 DOM 特征（2024 年 5 月）：
- 二维码图片：`img[src*="scanloginqrcode"]` 或 `img[src*="mp_qrcode"]`
- 账号密码登录入口：`link[href*="login"]` 或 "使用账号登录" 链接
- 登录按钮：heading "登录" `ref=e13`

## 不要做的事

- **不要**依赖 `browser_vision` 描述登录页布局——vision 模型无法可靠识别截图中的二维码
- **不要**尝试从 CDP 外部下载 `scanloginqrcode` URL——该 URL 是每次页面加载时生成的临时地址，从外部访问返回空内容
- **不要**手动在 URL 中拼接 token——token 来自微信 session，非固定值
- **不要**用 `browser_vision` 来定位二维码图片或确认登录状态——vision 模型无法可靠描述登录页元素，优先用 JS DOM 查询

## 相关脚本

- `scripts/publish-draft.py` — 主发布脚本，token 获取逻辑见其中 `get_token()` 函数