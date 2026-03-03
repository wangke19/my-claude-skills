# Session Summary Skill

Automatically analyze Claude Code sessions and generate comprehensive summaries with descriptive 20-30 word session names.

## Quick Start

```bash
# Use the skill (when deployed)
/session-summary

# Or ask Claude
"summarize this session and rename it"
```

## What It Does

1. **Analyzes** your conversation to identify key topics and activities
2. **Generates** a structured summary with accomplishments and outcomes
3. **Creates** a descriptive 20-30 word session name
4. **Suggests** applying the name to your session

## Example Session Name

Instead of:
- ❌ "Work session"
- ❌ "Fix bug"

You get:
- ✅ "Developed comprehensive session-summary skill for Claude Code enabling automated conversation analysis, structured summary generation, and intelligent 20-30 word descriptive naming with validation, examples, and implementation documentation" (27 words)

## When to Use

- End of a work session
- Before switching contexts
- After completing a feature or fix
- When you want to capture what you accomplished

## Features

- 📊 Structured summary generation
- 🏷️ 20-30 word descriptive names
- ✅ Word count validation
- 🎯 Technology and outcome extraction
- 📝 Files changed tracking
- 🔧 Tools and skills used analysis

## Installation

This skill will be available once the plugin is installed.

## Output Example

```markdown
## 📊 Session Summary

### 📋 Overview
[One-paragraph summary of your session]

### 🎯 Key Topics
- Topic 1: description
- Topic 2: description

### ✅ Accomplishments
1. What you achieved
2. Key outcomes

### 📝 Files Changed
- Created: list of new files
- Modified: list of modified files

### 🔧 Tools & Skills Used
- Tool 1: purpose
- Tool 2: purpose

---

## 💾 Suggested Session Name (25 words)
[Detailed descriptive name with technologies, approach, and outcomes]
```

## Development Status

🚧 **In Development**

- [x] Skill documentation created
- [ ] Session storage format investigation
- [ ] Rename functionality implementation
- [ ] Integration testing
- [ ] User acceptance testing

## Contributing

Contributions welcome! This skill is part of the my-claude-skills repository.
