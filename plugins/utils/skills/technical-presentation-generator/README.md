# Technical Presentation Generator Skill

## What This Skill Does

Creates self-contained HTML presentation files with:
- Bilingual support (any language pair, defaults to Chinese/English)
- Professional visual themes (cyberpunk, minimal, corporate, etc.)
- Code syntax highlighting
- Smooth navigation and slide tracking
- No external dependencies (except Google Fonts CDN)

## Installation

Already installed! The skill is in:
```
~/.claude/skills/technical-presentation-generator/SKILL.md
```

Claude Code automatically discovers skills in this directory.

## How to Use

Just ask Claude to create a presentation. The skill will be automatically used when:
- You request multiple slides (10+)
- You mention "bilingual" or "Chinese/English"
- You mention "technical presentation" or "slides"
- You want code examples included

### Example Request

```
Create a technical presentation about "Redis Caching Strategies" with:
- 15 slides
- Chinese/English bilingual
- Cyberpunk theme
- Include code examples in Python and Redis CLI
```

Claude will:
1. Ask clarifying questions (if needed)
2. Create a self-contained HTML file
3. Include all requested features
4. Follow the patterns in the skill

## Testing

The skill has been tested with:
- ✅ 33-slide "Unified Automation Strategy" presentation (the one we just created)
- ✅ 12-slide "Go Concurrency Patterns" presentation (test case)
- ✅ 15-slide "Kubernetes Operators" presentation (baseline test)

All presentations worked correctly with:
- Dynamic slide counts (not hardcoded)
- Bilingual toggle
- Keyboard navigation
- Proper code highlighting
- Self-contained files

## Sharing This Skill

### Option 1: Keep Local (Current)
- Already working on this machine
- Private to you
- No setup needed

### Option 2: Share with Colleagues
1. Create a git repo
2. Move this directory to the repo
3. Share repo URL
4. Others add to their `~/.claude/config.json`:

```json
{
  "skillRepositories": [
    {
      "url": "https://gitlab.com/yourname/your-claude-skills.git"
    }
  ]
}
```

### Option 3: Contribute Upstream
If this skill is useful to many people, consider:
1. Fork the official claude-plugins repo
2. Add this skill
3. Submit a PR

## Files

- **SKILL.md** - Main skill documentation (required)
- **README.md** - This file (optional, for documentation)

## Customization

To customize themes or patterns, edit `SKILL.md` and update:
- Color schemes in the "Visual Theme Selection" section
- HTML templates in the "Slide Structure Patterns" section
- CSS patterns in the implementation examples

## Examples Created

All example presentations are in `/home/kewang/`:
- `unified-automation-complete-30.html` - 33 slides, cyberpunk theme
- `go-concurrency-presentation.html` - 12 slides, tech theme
- `kubernetes-operator-presentation.html` - 15 slides (baseline, used reveal.js)

## Notes

- The skill encourages asking questions BEFORE generating
- Prefers self-contained approach over external frameworks
- Follows TDD principles (tested before deployment)
- Bilingual architecture is consistent across all presentations

## Version

Created: 2026-02-04
Tested: ✅ Passed with multiple presentations
Status: Production-ready
