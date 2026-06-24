# CLAUDE.md / AGENTS.md 研究资料

> 2026-06 调研，用于 AI 编码配置类公众号文章写作

## 核心事实

- **CLAUDE.md**：Anthropic Claude Code 原生配置文件，GitHub 81.6K+ stars，6.8K forks（2026-05 GA v1.0.0）
- **AGENTS.md**：Linux 基金会 Agentic AI Foundation 管理的开放标准，60+ 工具支持（Codex、Cursor、Copilot、Windsurf、Aider、Gemini CLI 等）
- **Everything Claude Code (ECC)**：82K+ stars 的 Claude Code 配置仓库（Affaan Mustafa），997 内部测试，跨 Claude Code/OpenAI Codex/Cursor/OpenCode

## 关键数据点

- 前沿 LLM 稳定遵循指令上限：150-200 条
- Claude Code 内置系统提示已占 ~50 个位置
- HumanLayer 的 CLAUDE.md 保持 60 行以内
- 大多数项目 300 行是合理上限
- OpenAI codex 仓库自身使用 88 个 AGENTS.md 文件
- AGENTS.md 大小限制：32 KiB（Codex 实现）

## CLAUDE.md 层级

`~/.claude/CLAUDE.md`（全局）→ `./CLAUDE.md`（项目根）→ `.claude/settings.json`

## AGENTS.md 层级（Codex 实现）

`~/.codex/AGENTS.md`（全局）→ 项目根 → 子目录 `AGENTS.override.md`

## Karpathy 四原则

1. **先想再写**：不做假设、不隐藏困惑、暴露权衡
2. **简约至上**：最少代码解决问题，不做投机性设计
3. **精确手术**：只动该动的，不"顺手"改旁边代码
4. **目标驱动**：定义验收标准，循环直到验证通过

## 社区补充规则（原版缺失）

1. **Token 预算**：单任务 ~4K tokens，单会话 ~30K tokens，到上限时总结重开
2. **检查点机制**：每完成重要步骤后输出总结，步骤 4 出错不用从步骤 1 重来
3. **先读后写**：写代码前先读 exports/调用者/共享工具
4. **显式失败**：不确定时明确说"不确定"，静默失败是最大敌人

## 各工具指令文件

| 工具 | 文件 | 特殊功能 |
|------|------|----------|
| Claude Code | CLAUDE.md | @import 导入、globs 路径限定、hooks |
| Cursor | .cursor/rules/*.mdc | 四种激活模式（Always/Auto/Agent/Manual） |
| Windsurf | .windsurf/rules/*.md | 双层模型：显性规则 + Cascade 记忆 |
| GitHub Copilot | .github/copilot-instructions.md | applyTo: 路径前缀，组织级（2026-04 推出） |
| Aider | .aider.conf.yml | 回退到 AGENTS.md |

## 最佳实践

- **选哪个**：单用 Claude Code → CLAUDE.md；多工具/开源 → AGENTS.md；推荐混合（AGENTS.md 存通用规则 + CLAUDE.md 导入增强）
- Copilot 的 copilot-instructions.md 可 symlink 到 AGENTS.md 避免重复
- 用 /init 命令起步（Claude Code 分析代码库生成草案）
- 删掉 AI 不被告诉也能做对的内容
- 用 Linter 处理格式，不要用指令规范代码风格
- 提交到 git，团队共同维护

## 文章写作角度

- "不是魔法，是记忆" — 好的结尾金句
- 对比角度：CLAUDE.md vs AGENTS.md vs .cursorrules
- 实战角度：记忆瘦身（108% → 31%）是活教材
- 趋势角度：Anthropic 2026 Agentic Coding 报告，从"辅助"到"协作"

## 来源

- https://tianpan.co/zh/blog/2026-02-25-claude-md-agents-md-ai-coding-agent-instruction-files
- https://medium.com/@tentenco/everything-claude-code-inside-the-82k-star-agent-harness
- https://resources.anthropic.com/hubfs/2026%20Agentic%20Coding%20Trends%20Report.pdf
- https://www.augmentcode.com/learn/anthropic-claude-code-github-stars
