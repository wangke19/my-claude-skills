# 微信公众号文章美化与代码高亮工作流

## 场景

当用户要求"美化文章"、"处理代码高亮"、"重新排版"时，使用此工作流。

## 核心规则

### 1. h2/h3 必须使用 inline style

WeChat 富文本编辑器会剥离 `<style>` 块中的自定义 h2/h3 CSS。

**❌ 错误**：
```html
<h2>一、标题</h2>
<style>h2 { border-left: 4px solid #1a73e8; }</style>
```

**✅ 正确**：
```html
<h2 style="font-size:20px;margin-top:8px;margin-bottom:12px;color:#111;border-left:4px solid #1a73e8;padding-left:10px;font-weight:700;">
一、标题</h2>
```

### 2. Hermes CLI 代码高亮

使用技能自带脚本 `scripts/code-highlight-hermes.py`，不要手写处理逻辑。

**用法**：
```bash
python3 ~/.hermes/skills/wechat-article-generator/scripts/code-highlight-hermes.py \
  /tmp/article.html /tmp/article-highlighted.html
```

**高亮分类**：

| 元素 | CSS 类 | 颜色 | 示例 |
|------|--------|------|------|
| 主命令 (hermes) | `.code-snippet__attribute` | 红色 `#d73a49` | `hermes` |
| 子命令 | `.code-snippet__attribute` | 红色 `#d73a49` | `kanban`, `profile` |
| 参数标志 (`--xxx`) | `.code-snippet__flag` | 蓝色 `#005cc5` | `--columns` |
| 字符串值 | `.code-snippet__string` | 深蓝 `#032f62` | `"Backlog,To Do"` |
| 文件路径 | `.code-snippet__path` | 灰色 `#6a737d` | `/home/kewang/.hermes/...` |

### 3. 发布前必须提取 body

```python
import re

with open("/tmp/article.html", "r", encoding="utf-8") as f:
    content = f.read()

body_match = re.search(r'<body[^>]*>([\s\S]*)</body>', content)
body = body_match.group(1).strip()

# 去除非正文元素
body = re.sub(r'<h1[^>]*>.*?</h1>\s*', '', body, flags=re.DOTALL)  # h1 标题
body = re.sub(r'<p style="font-size:13px[^>]*>.*?</p>\s*', '', body, flags=re.DOTALL)  # 日期行
body = re.sub(r'<hr\s*/?>\s*', '', body)  # hr 分割线
body = re.sub(r'<!--[\s\S]*?-->\s*', '', body)  # HTML 注释
body = body.strip()

with open("/tmp/article-body.html", "w", encoding="utf-8") as f:
    f.write(body)
print(f"Body: {len(body)} chars")
```

### 4. 发布命令

```bash
~/.hermes/hermes-agent/venv/bin/python \
  ~/.hermes/skills/baoyu-post-to-wechat/scripts/publish-draft.py \
  --title "文章标题（≤64字符）" \
  --file /tmp/article-body.html \
  --digest "文章摘要（≤120字）"
```

## 完整流程

1. **定位 HTML 文件** — 找到最近生成的 `*-wechat.html` 文件
2. **应用美化** — 修复 h2 inline style，运行代码高亮脚本
3. **提取 body** — 用 Python 正则去除非正文元素
4. **发布草稿** — 运行 `publish-draft.py`
5. **验证** — 返回草稿 ID，告知用户手动上传封面图

## 注意事项

- **封面图**：用户在微信编辑器草稿箱手动上传（900×383px，≤200KB），不要写在 HTML 里
- **SVG 配图**：必须 inline `<svg>` 元素，不能用 data URI 的 `<img>` 标签
- **inline style**：所有装饰性元素（颜色区块、提示框等）必须用 inline style
- **大内容技巧**：当正文 HTML >5000 字符时，使用 Base64 编码 + `atob()` 绕过 JS 字符串转义限制
