# Hermes Agent 版本功能历史

> 来源：2026-06-04 会话核实

## Web Dashboard 版本归属

**Web Dashboard 不是 v0.15 新增的**，它在 **v0.9** 就已引入。

| 版本 | Dashboard 状态 |
|------|---------------|
| **v0.9** | Web Dashboard 首次引入（浏览器管理界面，端口 9119） |
| **v0.14** | 无 dashboard 相关改动 |
| **v0.15.0** | 无 dashboard 相关改动 |
| **v0.15.1** | 修复 loopback 模式下 401 刷新死循环 |
| **v0.15.2** | 无 dashboard 相关改动 |

## v0.15 对 Dashboard 的增强

v0.15 对 Web Dashboard 做了两项重要增强（不是新增 Dashboard 本身）：

### 1. Chat 标签页

在 dashboard 里嵌入了完整的 `hermes --tui` 终端界面，通过 WebSocket + PTY 在浏览器里直接运行 TUI。slash 命令、模型选择器、工具调用卡片、markdown 流式输出、confirm/sudo/approval 提示全都能用。

### 2. MCP Catalog

v0.15 引入 MCP 插件目录，可以在 dashboard 里直接浏览、安装、管理 MCP 服务器。不再需要手动编辑 JSON 配置文件，粘贴 Claude Desktop / Cursor / VS Code 的 MCP JSON 就能导入。

## 启动命令

```bash
hermes dashboard --tui
```

默认端口：`http://127.0.0.1:9119`

## 写作提醒

在写 Hermes Agent 相关文章时：
- **不要**说"v0.15 新增 Web Dashboard"——这是错误的
- **要说**"v0.15 增强了 Web Dashboard，新增 Chat 标签页和 MCP Catalog"
- 如果需要介绍 Dashboard，说明它从 v0.9 就已存在

## 来源

- [Web Dashboard 官方文档](https://hermes-agent.nousresearch.com/docs/user-guide/features/web-dashboard)
- [Hermes Agent v0.15.2 Release Notes](https://releasebot.io/updates/nousresearch/hermes-agent)
- [Hermes v0.9 Dashboard 介绍](https://juliangoldie.com/hermes-v0-9-dashboard)
