# 代码语法高亮：Hermes CLI 命令

## 概述

在微信公众号文章中展示 Hermes Agent 命令行时，使用增强语法高亮格式提升可读性。

## HTML 结构

```html
<section class="code-snippet__js">
<pre class="code-snippet__js code-snippet code-snippet_nowrap" data-lang="shell">
<code><span leaf="">
<span class="code-snippet__attribute">hermes</span> 
<span class="code-snippet__attribute">kanban</span> 
<span class="code-snippet__attribute">create</span> my-project
</span></code>
</pre>
</section>
```

## CSS 样式

```css
/* 代码块容器 */
.code-snippet__js {
  margin: 20px 0;
}

/* 代码块背景与边框 */
.code-snippet__js pre {
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  font-family: "SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace;
  font-size: 14px;
  line-height: 1.5;
}

.code-snippet__js code {
  font-family: inherit;
}

/* 确保 span 块级显示 */
.code-snippet__js code span[leaf=""] {
  display: block;
}

/* 语法高亮颜色 */
.code-snippet__attribute {
  color: #d73a49;      /* 红色 - 命令/子命令 */
  font-weight: 600;
}
.code-snippet__flag {
  color: #005cc5;      /* 蓝色 - 参数标志 */
}
.code-snippet__string {
  color: #032f62;      /* 深蓝 - 字符串值 */
}
.code-snippet__path {
  color: #6a737d;      /* 灰色 - 文件路径 */
}
```

## 高亮分类规则

| 元素类型 | CSS 类 | 颜色 | 示例 |
|---------|--------|------|------|
| 主命令 | `.code-snippet__attribute` | `#d73a49` | `hermes` |
| 子命令 | `.code-snippet__attribute` | `#d73a49` | `kanban`, `profile`, `config` |
| 参数标志 | `.code-snippet__flag` | `#005cc5` | `--columns`, `--description` |
| 字符串值 | `.code-snippet__string` | `#032f62` | `"Backlog,To Do"` |
| 文件路径 | `.code-snippet__path` | `#6a737d` | `/home/kewang/.hermes/...` |

## 子命令列表

以下命令应高亮为 `.code-snippet__attribute`：

- `profile` - 配置文件管理
- `kanban` - 看板项目管理
- `config` - 配置设置
- `gateway` - 网关管理
- `doctor` - 诊断工具
- `skills` - 技能管理
- `chat` - 聊天功能
- `setup` - 初始化设置
- `use` - 使用技能
- `clone` - 克隆项目
- `import` / `export` - 导入导出
- `delete` / `remove` - 删除
- `list` / `show` - 列表/显示
- `add` / `move` / `update` - 增/移/改
- `create` / `rename` - 创建/重命名
- `install` - 安装
- `run` / `stop` / `start` - 运行控制

## 处理流程

1. **保护阶段**：先用占位符保护路径和字符串，避免后续正则误匹配
2. **高亮 hermes**：替换主命令
3. **高亮子命令**：替换所有子命令关键词
4. **高亮 flag**：替换 `--xxx` 参数
5. **恢复路径**：还原路径并添加 `.code-snippet__path`
6. **恢复字符串**：还原字符串并添加 `.code-snippet__string`

## 注意事项

- **路径匹配**：只匹配绝对路径 `/xxx` 和家目录路径 `~/xxx`，避免误匹配模型名（如 `anthropic/claude-xxx`）
- **字符串保护**：字符串内的内容不应被其他规则处理
- **多行命令**：支持 `\\` 续行符，保持原有换行结构
- **HTML 实体**：处理前需解码 `&lt;`、`&gt;`、`&amp;`

## 批量处理

使用 `process_article_code_blocks(filepath)` 函数批量处理文章中的所有 `<pre><code>` 代码块。
