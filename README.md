# My Claude Skills

Personal Claude Code plugin marketplace.

## Plugins

| Plugin | Description | Skills |
|--------|-------------|--------|
| **ask** | Structured learning and analysis | thing, tech, onboard, analyze-repo, deep-dive, design, debug, diff |
| **utils** | Productivity tools | slack-copy-rich, technical-presentation-generator |
| **cc-aid** | Claude Code helpers | session-init, session-checkpoint, session-summary, session-postmortem |
| **report** | Work report generation | work-report |
| **ci** | CI/CD helpers | prow-job-retry |

## Installation

Register as a local marketplace in `~/.claude/plugins/known_marketplaces.json`:

```json
{
  "my-claude-skills": {
    "source": {
      "source": "directory",
      "path": "/home/kewang/src/gitlab/my-claude-skills"
    },
    "installLocation": "/home/kewang/src/gitlab/my-claude-skills",
    "lastUpdated": "2026-03-26T00:00:00.000Z"
  }
}
```

Then enable plugins in `~/.claude/settings.json` under `enabledPlugins`.

## Structure

```
.claude-plugin/marketplace.json     # Plugin registry
plugins/
  <plugin-name>/
    .claude-plugin/plugin.json      # Plugin metadata
    skills/
      <skill-name>/SKILL.md        # Skill definition
```

## Author

**Ke Wang** — kewang@redhat.com — Red Hat OpenShift Control Plane Team
