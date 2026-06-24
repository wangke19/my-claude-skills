# 微信公众号草稿发布：Base64 + 同步 XHR 模式

## 适用场景

当 HTML 正文内容较大（>5000 字符）时，直接通过 JS 字符串插值传递内容到浏览器上下文会出现转义问题，导致 `SyntaxError: Invalid or unexpected token`。本模式使用 Base64 编码绕过 JS 字符串限制。

## 已验证配置

- **日期**：2026-06-02
- **appMsgId**：100000904
- **API**：`/cgi-bin/operate_appmsg?sub=create&type=77777`
- **Content-Type**：`multipart/form-data; boundary=...`

## 核心技巧

### 1. Base64 编码正文

```python
import base64

with open("/tmp/article-body.html", "r", encoding="utf-8") as f:
    body_content = f.read()

body_b64 = base64.b64encode(body_content.encode("utf-8")).decode("ascii")
```

### 2. JS 中解码

```javascript
var bodyB64 = "BASE64_STRING";
var bodyContent = atob(bodyB64);
```

### 3. Token 从 URL 提取

```javascript
window.location.href.match(/token=(\d+)/)?.[1]
```

比从 cookie 提取更可靠，因为 `mp_quobalpha` cookie 可能不存在但页面已登录。

### 4. 同步 XHR 构建 multipart

```javascript
function addPart(name, value) {
    multipartBody += "--" + boundary + "\r\n";
    multipartBody += 'form-data; name="' + name + '"\r\n\r\n' + value + "\r\n";
}

addPart("content0", bodyContent);  // bodyContent 已解码
```

### 5. 完整字段清单

| 字段 | 值 |
|------|-----|
| `AppMsgId` | `""`（空字符串） |
| `fileid0` | `""`（空字符串） |
| `count` | `"1"` |
| `type` | `77777`（URL 参数） |

## 失败模式

| 症状 | 原因 | 修复 |
|------|------|------|
| `SyntaxError: Invalid or unexpected token` | JS 字符串转义冲突 | 使用 Base64 编码 |
| `invalid csrf token` | 验证草稿列表时缺少 token | 发布时用 `operate_appmsg`，验证用 `list_card` 需额外 token |
| `ret: 200002` | `AppMsgId` 或 `fileid0` 非空 | 设为空字符串 `""` |

## 验证方法

发布成功后，`operate_appmsg` 返回：
```json
{
  "ret": "0",
  "appMsgId": 100000904,
  "data_seq": "4543326466041856012",
  "filter_content_html": [{"content": "..."}]
}
```

**注意**：不要用草稿列表 API 验证内容——`list_card` 返回的 `content` 字段为空。用 `filter_content_html[0].content` 验证。
