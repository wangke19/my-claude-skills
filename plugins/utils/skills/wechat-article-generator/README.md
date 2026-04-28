# WeChat Article Generator

Generates a WeChat public account article as a self-contained HTML file.

## Usage

```markdown
使用 wechat-article-generator 技能，从 markdown 或文件创建微信公众号文章 HTML。
```

## What It Does

1. Reads content from a file path, raw markdown, or topic description
2. Generates a cover image (2.35:1 SVG, embedded as data URI) with 4 theme options
3. Creates inline SVG illustrations for architecture/flow diagrams
4. Converts markdown to WeChat-friendly HTML (inline CSS, no external dependencies)
5. Outputs a single `.html` file — open, copy, paste into WeChat editor

## Skills Directory

```
my-claude-skills/plugins/utils/skills/
├── wechat-article-generator/
│   └── SKILL.md
├── technical-presentation-generator/
├── pr-check-reviews/
└── slack-copy-rich/
```

## Trigger Words

- "生成微信公众号文章"
- "create wechat article"
- "convert to wechat format"
- "微信公众号文章"
- "markdown 转微信文章"