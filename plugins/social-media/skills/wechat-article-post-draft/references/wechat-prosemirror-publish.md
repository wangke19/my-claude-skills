# 微信公众号 ProseMirror 编辑器注入发布流程

> ⚠️ **2026-05-30 更新**：此流程已验证**全部失败**。ProseMirror 编辑器会过滤掉所有 HTML 注入方式，只保留纯文本。
> 
> 以下注入方式均被过滤为纯文本（反复验证）：
> 1. `editor.innerHTML = html` — 直接赋值，Vue 不识别变更
> 2. `document.execCommand('insertHTML', false, html)` — HTML 标签被异步剥离
> 3. Clipboard API (`navigator.clipboard.write`) + paste 事件 — 被过滤器拦截
> 4. Selection API + Range.insertNode — 同样被剥离
> 5. InputEvent / ClipboardEvent 构造 — 被 ProseMirror schema 拦截
>
> **当前状态**：需要找到新版草稿箱的正确 API 端点，或找到 ProseMirror 正确接受 HTML 的方式。
> 
> 以下保留原始流程文档供参考，但已知不可用。

> 2026-05 验证：`operate_appmsg?sub=create`（无 type=77）返回 `ret=444002`（旧版图文素材不可再保存）。
> 即使加 `type=77` 返回 `ret=0`，内容也只存到"旧版图文素材"，用户在草稿箱看不到。
> 新版正确方式：通过 ProseMirror 编辑器页面注入内容 + 点击保存按钮。

## 流程概览

```
CDP WebSocket → 导航到编辑器页面 → 注入 HTML → 设标题 → 点保存按钮 → 检测"已保存"
```

## 详细步骤

### Step 1: 导航到编辑器页面

```python
editor_url = f"https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=77&token={token}&lang=zh_CN"
# CDP: Page.navigate → 等待 4 秒加载
```

### Step 2: 注入 HTML 到 ProseMirror 编辑器

```python
js_inject = f"""
(() => {{
    var editor = document.querySelector('.ProseMirror');
    if (!editor) return 'No ProseMirror editor found';
    editor.focus();
    var range = document.createRange();
    range.selectNodeContents(editor);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('insertHTML', false, {json.dumps(body_html)});
    return 'Content injected, editor children: ' + editor.children.length;
}})()
"""
```

关键点：
- **必须先 focus 编辑器**，否则 execCommand 不生效
- **用 Selection API 选中内容**（不是 selectAll）
- **`execCommand('insertHTML')`** 触发 ProseMirror parser

### Step 3: 设置标题（在注入内容之后）

```python
js_title = f"""
(() => {{
    var textarea = document.querySelector('#title');
    if (!textarea) return 'No title textarea';
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(textarea, {json.dumps(title)});
    textarea.dispatchEvent(new Event('input', {{ bubbles: true }}));
    textarea.dispatchEvent(new Event('change', {{ bubbles: true }}));
    return 'Title set OK';
}})()
"""
```

关键点：
- **必须用 native setter**（直接赋值不触发 Vue 响应式）
- **标题在注入内容之后设置**，否则 insertHTML 可能覆盖标题

### Step 4: 点击"保存为草稿"按钮

按钮是 `<span class="btn btn_input btn_primary r">` 元素，检查 `offsetParent !== null` 确保可见。

### Step 5: 等待 3 秒，检测 "已保存" toast

## 页面结构（2026-05）

- **标题输入**: `<textarea id="title" name="title">`
- **正文编辑器**: `<div class="ProseMirror" contenteditable="true">`
- **保存按钮**: `<span class="btn btn_input btn_primary r">保存为草稿</span>`
- **页面框架**: Vue 3 + ProseMirror + jQuery

## 注意事项

1. **不要在注入前设标题**：insertHTML 可能覆盖整个编辑区
2. **弹窗处理**：注入后微信可能弹出"AI图片"/"公众号未实名"弹窗，需要关闭
3. **SVG 内联**：ProseMirror 接受 inline SVG
4. **body-only HTML**：注入的 HTML 不含 `<html><head><body>` 标签
