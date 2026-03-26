---
description: Architecture review of a repository or codebase
argument-hint: "[repo-path]"
---

## Name
ask:analyze-repo

## Synopsis
```
/ask:analyze-repo [repo-path]
```

## Description
Systematic architecture review — core responsibility, module structure, critical data/control flow, key abstractions, design decisions, and risks. Focused on the happy path, not line-by-line code.

## Implementation
Read and follow the skill at `${CLAUDE_PLUGIN_ROOT}/skills/analyze-repo/SKILL.md`, applying it to the given repo (or current directory if none specified).
