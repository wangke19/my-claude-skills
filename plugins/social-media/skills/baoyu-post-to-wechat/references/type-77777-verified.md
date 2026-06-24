# WeChat Draft Publishing: type=77777 验证记录 (2026-05-30)

## 根因分析

### 问题现象
`publish-draft.py` 使用 `type=77` + URL-encoded string 调用 `operate_appmsg` API，返回 `ret=0` 和 `appMsgId`，看似成功。但：
- 编辑器打开草稿 → ProseMirror `children=0`，正文为空
- 新版草稿箱不可见（存入旧版素材区）

### 根因
| 参数 | 值 | 说明 |
|------|-----|------|
| `type` | `77` | ❌ **旧版素材 API**。ret=0 但内容存旧版素材区，新版草稿箱不可见 |
| `type` | `77777` | ✅ **新版单图文草稿 API**。内容正确保存到新版草稿箱 |
| 数据格式 | URL-encoded | ❌ 不报错但内容可能不保存 |
| 数据格式 | FormData (multipart) | ✅ 正确保存 |

### 验证证据
```
# type=77777 + FormData 创建的草稿 100000832
list_card API 返回: contentLen=11302, contentPreview 完整正确

# type=77 创建的草稿
编辑器 ProseMirror: children=0, textLen=46（只有标题）
```

## 正确方案（已验证）

### API 调用方式
```javascript
// URL
POST /cgi-bin/operate_appmsg?sub=create&type=77777&token={TOKEN}

// 方式：FormData（multipart），不用 URL-encoded
var fd = new FormData();
fd.append('AppMsgId', '');
fd.append('count', '1');
fd.append('title0', title);
fd.append('content0', bodyHTML);
fd.append('digest0', digest);
// ... 其他字段

var xhr = new XMLHttpRequest();
xhr.open('POST', '/cgi-bin/operate_appmsg?sub=create&type=77777&token=' + token, false);
xhr.send(fd);
```

### 最小必需字段
```javascript
fd.append('AppMsgId', '');
fd.append('count', '1');
fd.append('title0', title);         // ≤64 字符
fd.append('content0', bodyHTML);     // 完整 HTML，含 inline style + SVG
fd.append('digest0', digest);        // 可空
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
```

### 内容存储方式
```javascript
// Step 1: 存入 window 变量（避免 JS 字符串转义问题）
window.__draft_body__ = {json_dumps(body_html)};
window.__draft_title__ = {json_dumps(title)};

// Step 2: 在 XHR 中从 window 读取
fd.append('content0', window.__draft_body__);
fd.append('title0', window.__draft_title__);
```

## 验证方法

### 验证草稿内容是否保存成功
```javascript
// 调用 list_card API 查看 content
var x = new XMLHttpRequest();
x.open('POST', '/cgi-bin/appmsg?begin=0&count=10&type=77&action=list_card&token=' + token, false);
x.send('begin=0&count=10&lang=zh_CN&f=json&ajax=1');
var data = JSON.parse(x.responseText);
var items = data.app_msg_info.item;
// items[0].content 有值 = 内容保存成功
```

### ⚠️ 不要用编辑器验证
- 编辑器 URL (`t=media/appmsg_edit&type=77`) 可能不兼容 `type=77777` 草稿
- ProseMirror 显示 children=0 不代表内容丢失
- 用 `list_card` API 验证才是可靠方式

## 错误路径总结（本次会话踩过的坑）

| 尝试 | 结果 | 耗时 |
|------|------|------|
| `type=77` URL-encoded | ❌ 旧版素材区，新版不可见 | 大量调试时间 |
| ProseMirror innerHTML 注入 | ❌ React state 不认 | 浪费时间 |
| ProseMirror execCommand | ❌ 不触发保存 | 浪费时间 |
| Clipboard API + paste | ❌ headless 不支持 | 浪费时间 |
| `draft/box/add` API | ❌ 无响应 | 浪费时间 |
| `sub=save` | ❌ ret=2 | 浪费时间 |
| **`type=77777` + FormData** | ✅ **成功** | 应该一开始就用 |

## 关键教训
1. **API 返回 ret=0 不代表内容正确保存** — 要用 list_card 验证
2. **type 参数决定存储区域** — 77 是旧版，77777 是新版
3. **FormData vs URL-encoded 有本质区别** — 后者静默失败
4. **ProseMirror 注入在 headless 下全部无效** — 不要再尝试
