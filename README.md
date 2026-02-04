# My Claude Skills Repository

Personal collection of Claude Code skills for improved development workflows.

## Skills Included

### 1. technical-presentation-generator

Creates self-contained HTML presentation files with bilingual support, professional themes, and technical content optimizations.

**Use when:**
- Creating multi-slide technical presentations (10+ slides)
- Need bilingual support (Chinese/English or any language pair)
- Presenting code examples or technical concepts
- Want self-contained HTML files

**Features:**
- Bilingual architecture with language toggle
- Multiple visual themes (cyberpunk, minimal, corporate, tech-focused)
- Code syntax highlighting
- Keyboard navigation
- Smooth slide transitions
- Self-contained (no external dependencies except fonts)

See [skills/technical-presentation-generator/SKILL.md](skills/technical-presentation-generator/SKILL.md) for full documentation.

## Installation

### For Claude Code Users

Add this repository to your Claude Code configuration:

1. Edit `~/.claude/config.json` (create if doesn't exist)
2. Add this repository:

```json
{
  "skillRepositories": [
    {
      "url": "git@gitlab.cee.redhat.com:kewang/my-claude-skills.git"
    }
  ]
}
```

3. Restart Claude Code (or it will auto-reload)

### Alternative: Manual Installation

Clone this repo and symlink individual skills:

```bash
git clone git@gitlab.cee.redhat.com:kewang/my-claude-skills.git
ln -s ~/work/gitlab/my-claude-skills/skills/technical-presentation-generator ~/.claude/skills/
```

## Usage

Once installed, Claude Code will automatically use these skills when appropriate. No special commands needed - just work naturally!

Example:
```
You: Create a technical presentation about Docker with 15 slides, bilingual Chinese/English

Claude: [Automatically uses technical-presentation-generator skill]
```

## Repository Structure

```
my-claude-skills/
├── README.md                           # This file
├── skills/                             # All skills
│   └── technical-presentation-generator/
│       ├── SKILL.md                    # Main skill documentation
│       └── README.md                   # Skill-specific readme
└── .gitignore                          # Git ignore rules
```

## Contributing

This is a personal repository, but suggestions are welcome!

## Tested With

- Claude Code CLI
- Red Hat OpenShift development environment
- Multiple presentation projects (33-slide, 15-slide, 12-slide presentations)

## Author

**Ke Wang**
📧 kewang@redhat.com
🏢 Red Hat - OpenShift Control Plane Team

## License

These skills are shared for internal Red Hat use and community benefit.

## Version History

- **2026-02-04**: Initial release with technical-presentation-generator skill
  - Tested and validated with multiple presentations
  - Bilingual support (Chinese/English)
  - Multiple theme options
  - Self-contained HTML output
