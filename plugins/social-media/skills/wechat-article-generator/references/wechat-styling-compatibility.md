# WeChat 富文本编辑器样式兼容性指南

## 核心发现（2026-06-02 验证，2026-06-05 补充）

WeChat 富文本编辑器对 CSS 的处理策略是**选择性剥离**：
- `<style>` 块中的自定义 CSS 会被清除
- 标准 HTML 标签（h1/h2/h3/p 等）的默认样式会被保留，但自定义样式（如 `border-left`、`font-weight`）会被清除
- inline style 会被保留

## ⚠️ 两条路径的样式行为差异（2026-06-05 新增）

| 样式 | ProseMirror 编辑器粘贴 | operate_appmsg API (type=77777) |
|------|:-:|:-:|
| `<div>` 的 `background` inline style | ✅ 保留 | ❌ **被过滤** |
| `<section>` 的 `background` inline style | ✅ 保留 | ✅ 保留 |
| `<div>` 的 `border` / `padding` | ✅ 保留 | ✅ 保留 |
| `<section>` 其他 inline style | ✅ 保留 | ✅ 保留 |

**结论**：装饰性区块（三色结论、提示框、信息盒）必须用 `<section>` + `display:block`，不能用 `<div>`。

## h2/h3 标题样式

### ❌ 错误做法（依赖 `<style>` 块）
```html
<h2>一、标题</h2>
<style>
h2 { font-size: 20px; border-left: 4px solid #1a73e8; font-weight: 700; }
</style>
```
**结果**：在微信编辑器中，h2 退化为纯文本标题，失去所有样式。

### ✅ 正确做法（inline style）
```html
<h2 style="font-size:20px;margin-top:8px;margin-bottom:12px;color:#111;border-left:4px solid #1a73e8;padding-left:10px;font-weight:700;">
一、标题</h2>
```
**结果**：样式完整保留。

## 三色结论区块样式

### ❌ 错误做法（用 `<div>`，operate_appmsg 路径下无背景色）
```html
<div style="background:#e8f0fe;border-left:4px solid #1a73e8;border-radius:4px;padding:14px 18px;margin:18px 0;width:100%;box-sizing:border-box">
  <strong>认知层面：</strong>内容
</div>
```
**结果**：ProseMirror 编辑器粘贴正常，但 operate_appmsg API 发布后 background 消失。

### ✅ 正确做法（用 `<section>`，两条路径都正常）
```html
<section style="background:#e8f0fe;border-left:4px solid #1a73e8;border-radius:4px;padding:14px 18px;margin:18px 0;width:100%;box-sizing:border-box;display:block">
  <strong>认知层面：</strong>内容
</section>
```
**关键差异**：
1. 标签 `<div>` → `<section>`
2. 闭合 `</div>` → `</section>`
3. 增加 `display:block`

**增强说明**：
- `width:100%` — 确保背景色覆盖整个内容宽度
- `box-sizing:border-box` — 确保 padding 不增加元素总宽度
- `display:block` — 兼容性保障

## 颜色体系（Google 风格）

| 层面 | 背景色 | 边框色 |
|------|--------|--------|
| 认知层面 | `#e8f0fe`（淡蓝） | `#1a73e8` |
| 能力层面 | `#e8f5e9`（淡绿） | `#34a853` |
| 判断层面 | `#fff8e1`（淡黄） | `#f9ab00` |

## 完整三色区块模板（可直接复制）

```html
<section style="background:#e8f0fe;border-left:4px solid #1a73e8;border-radius:4px;padding:14px 18px;margin:18px 0;width:100%;box-sizing:border-box;display:block">
  <strong>认知层面：</strong>[消除一个误解或恐惧]
</section>
<section style="background:#e8f5e9;border-left:4px solid #34a853;border-radius:4px;padding:14px 18px;margin:18px 0;width:100%;box-sizing:border-box;display:block">
  <strong>能力层面：</strong>[给出一个可操作的行动指引]
</section>
<section style="background:#fff8e1;border-left:4px solid #f9ab00;border-radius:4px;padding:14px 18px;margin:18px 0;width:100%;box-sizing:border-box;display:block">
  <strong>判断层面：</strong>[提醒边界和风险]
</section>
```

## 验证清单

发布前检查：
- [ ] h2/h3 是否使用 inline style（非 `<style>` 块）
- [ ] 三色区块是否用 `<section>` 标签（**非 `<div>`**）
- [ ] 三色区块是否包含 `width:100%;box-sizing:border-box;display:block`
- [ ] 所有装饰性元素是否使用 inline style（非 CSS class）
- [ ] 是否包含 SVG 插图（内联 `<svg>` 元素，非 `<img>` data URI）
- [ ] 列表是否使用伪列表格式（非 `<ul>/<li>`）

## 已验证案例

- **2026-06-02**：h2/h3 inline style 验证生效
- **2026-06-05**：三色区块 `<div>` → `<section>` 修复（草稿 ID 100000975 无颜色 → 100000979 颜色正常）
