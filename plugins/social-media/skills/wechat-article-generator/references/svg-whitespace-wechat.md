# SVG 空白间距问题：根因分析与修复方案

## 问题现象
微信公众号文章中，SVG 配图和上下文字之间出现大片空白，即使设了 `margin:0` 也无法消除。

## 根因分析（3 个叠加因素）

### 1. SVG 默认 inline-block + 基线对齐（最主要原因）
SVG 是行内块元素，默认按文字基线对齐。这会在 SVG 下方留一段"字母下行空间"（descender gap），形成底部空白。**这不是 margin，是行内对齐产生的空间**，所以调 margin 对它完全无效。

### 2. 父元素 line-height / margin 自带间距
`<p>`、`<section>`、`<h2>` 有默认行高与外边距，把 SVG 上下"顶"开。

### 3. SVG 写死 width/height + viewBox 预留内边距
固定尺寸在不同屏幕上产生额外空间。内部 rect 又留了安全边距，视觉上更松。

## 已尝试但失败的方案

| 方案 | 为什么失败 |
|------|-----------|
| `margin-bottom:0` on `<p>` | 微信渲染器忽略内联 margin 覆盖 |
| `<div>` 替代 `<p>` | 微信给所有 block 元素加默认 margin |
| `<br>` 替代 `<p>` | 间距反而更大 |
| 负 margin `-10px` | 在微信里无效 |
| section `margin:2px 0` | 邻居元素的默认 margin 不受影响 |

## 验证有效的方案

```html
<p style="margin-bottom:0">配图上方文字</p>
<section style="margin:12px 0;padding:0;line-height:1">
  <svg viewBox="0 0 680 320" width="100%"
       style="display:block;vertical-align:bottom;border-radius:8px">
    <rect width="680" height="320" fill="#f8f9fb" rx="8"/>...
  </svg>
</section>
<p style="margin-top:0">配图下方文字</p>
```

三个关键修复：
1. **`vertical-align:bottom`** — 消除基线间隙（解决根因 1，最关键！）
2. **`width="100%"` 不写死 height** — SVG 自适应容器（解决根因 3）
3. **section `margin:12px 0;line-height:1`** — 上下各留 12px 呼吸空间，同时清零行高（解决根因 2）

## ⚠️ 子任务/批量修改文章时的 SVG 属性保护

当用 `patch` 工具或子任务批量修改文章 HTML 时，如果子任务只改了正文段落而没有同步保留 SVG 属性，SVG 会被还原成旧版本。**每次内容修改后必须重新验证 SVG 属性。**

**典型旧版本问题（子任务修改后容易出现）**：
```html
❌ width="680" height="400"       # 禁止同时写死 width 和 height
❌ width="680" height="340"       # 即使写了 width="100%"，height 固定值仍会导致间距
❌ display:block;margin:0 auto    # 缺少 vertical-align:bottom
❌ section style="margin:2px 0"    # 旧间距，应为 margin:12px 0
❌ style="margin-bottom:0"         # 残留旧 margin 控制
```

**⚠️ 正确写法：只写 `width="100%"`，完全删除 `height` 属性**：
```html
<!-- ✅ 正确：只有 width="100%"，没有 height 属性 -->
<svg viewBox="0 0 680 320" width="100%"
     style="display:block;vertical-align:bottom;border-radius:8px">
  <rect width="680" height="320" fill="#f8f9fb" rx="8"/>...
</svg>

<!-- ❌ 错误：同时写了 width="100%" 和 height="340" -->
<svg viewBox="0 0 680 340" width="100%" height="340" ...>
```

**快速验证正则**（execute_code 里跑）：
```python
import re
svg_sections = re.findall(r'<section[^>]*>.*?</section>', html, re.DOTALL)
for i, s in enumerate(svg_sections):
    has_va = 'vertical-align:bottom' in s
    has_width100 = 'width="100%"' in s
    has_section_clear = re.search(r'<section style="[^"]*margin:0[^"]*line-height:1', s)
    print(f"SVG {i+1}: va={has_va}, width100={has_width100}, section_clear={bool(has_section_clear)}")
```

**批量检查 10 个文件**：
```python
files = [
    "/home/kewang/post-to-wechat/2026-05-12/hermes-post-setup.html",
    "/home/kewang/post-to-wechat/2026-05-12/hermes-part2-system.html",
    "/home/kewang/post-to-wechat/2026-05-12/hermes-part3-concepts.html",
    "/home/kewang/post-to-wechat/2026-05-12/hermes-part4-soul.html",
    "/home/kewang/post-to-wechat/2026-05-12/hermes-part5-advanced.html",
    "/home/kewang/post-to-wechat/2026-05-12/advanced-part1-prompt.html",
    "/home/kewang/post-to-wechat/2026-05-12/advanced-part2-decompose.html",
    "/home/kewang/post-to-wechat/2026-05-12/advanced-part3-skills.html",
    "/home/kewang/post-to-wechat/2026-05-12/advanced-part4-debug.html",
    "/home/kewang/post-to-wechat/2026-05-12/advanced-part5-automation.html",
]
```

## 极简速查

- 下方空白大 → `display:block` + `vertical-align:bottom`
- 上下都松 → 父元素 `margin:12px 0;padding:0;line-height:1`
- 不要写死 SVG 的 width/height → 用 `width="100%"` 让 viewBox 自适应
