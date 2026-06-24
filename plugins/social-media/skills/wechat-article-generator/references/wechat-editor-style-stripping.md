# WeChat 编辑器样式剥离行为验证记录

## 2026-06-02 验证案例

### 问题现象
用户两次反馈"段落标题没有加粗，没有进行美化处理"。

### 验证过程

| 尝试 | 方法 | 结果 |
|------|------|------|
| 1 | 纯 `<h2>` 标签 + `<style>` 块定义 CSS | 用户反馈样式不生效 |
| 2 | 给 h2 添加 inline style | 样式生效 ✅ |
| 3 | 恢复纯 `<h2>` + `<style>` 块 | 用户再次反馈样式不生效 |
| 4 | 再次添加 inline style | 样式生效 ✅ |

### 根因分析

WeChat 富文本编辑器对 `<style>` 块的处理策略是"选择性保留"：
- **保留**：极少数基础标签的默认样式（如 `body` 的字体、`p` 的段落间距）
- **清除**：自定义的 h2/h3 CSS（`font-weight`、`border-left`、`margin` 等）

**结论**：`<style>` 块中的 h2/h3 CSS 定义在粘贴到微信编辑器后会被清除，导致标题失去所有样式。

### 正确做法

**h1、h2、h3 必须使用 inline style**，不能依赖 `<style>` 块。

```html
<!-- ✅ 正确 -->
<h2 style="font-size:20px;margin-top:8px;margin-bottom:12px;color:#111;border-left:4px solid #1a73e8;padding-left:10px;font-weight:700;">
一、标题</h2>

<!-- ❌ 错误（样式会被清除） -->
<h2>一、标题</h2>
<style>
h2 { font-size:20px; border-left:4px solid #1a73e8; ... }
</style>
```

### 推荐样式值

```html
<!-- h2 推荐 inline style -->
style="font-size:20px;margin-top:8px;margin-bottom:12px;color:#111;border-left:4px solid #1a73e8;padding-left:10px;font-weight:700;"

<!-- h3 推荐 inline style -->
style="font-size:17px;margin-top:24px;margin-bottom:10px;color:#333;font-weight:600;"
```

### 三层规则（最终版）

| 元素类型 | 样式方式 | 说明 |
|----------|---------|------|
| `h1`、`h2`、`h3` | **inline style** | WeChat 会清除 `<style>` 块中的自定义 h2/h3 CSS |
| `body`、`p`、`blockquote`、`table`、`code`、`pre` | `<style>` 块 | 基础排版元素，WeChat 会保留 |
| 装饰性元素（颜色区块、提示框、标签等） | **inline style** | 自定义视觉效果必须用 inline style |
