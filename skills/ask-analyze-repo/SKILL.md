---
name: analyze-repo
description: >
  Perform a systematic architecture review of a repository or codebase. Analyzes project
  structure, core components, data/control flows, key abstractions, and design decisions —
  focused on the critical path, not line-by-line code explanation. Use when the user asks
  to "analyze this repo", "review this codebase", "walk me through this project's architecture",
  "what does this repo do", "break down this project", "explain the structure of this code",
  or points you at a repository and wants to understand how it's designed. Also trigger when
  the user shares a repo URL or path and asks broad questions like "how does this work" or
  "what's going on here". Do NOT use for debugging (use ask:debug), general tech concepts
  (use ask:tech), or non-technical topics (use ask:thing).
allowed-tools: Bash(*), Read(*), Glob(*), Grep(*), Agent(*)
---

# Ask: Analyze Repo — Architecture Review

When asked to analyze a repository, conduct an architecture review — not a code walkthrough. Think like a senior engineer reviewing a system for the first time: find the critical path, understand the design intent, and surface what matters.

---

## Before You Start

1. **Locate the repo** — if the user provides a path or URL, use it. If they say "this repo", use the current working directory.
2. **Quick scan** — read the top-level directory structure, README (if any), and key config files (go.mod, package.json, Cargo.toml, Makefile, etc.) to orient yourself.
3. **Identify the language/framework** — this shapes what to look for (e.g., Go interfaces vs Java classes, CRDs vs REST endpoints).

Don't read every file. Be strategic — focus on entry points, core packages, and key abstractions.

---

## The Review

Work through these 6 layers. Focus on the **happy path** — ignore edge cases, error handling, and peripheral logic unless they reveal important design decisions.

### 1. Core Responsibility (position in the system)

Answer in 2-3 sentences: what does this project do, and where does it sit in the larger system? Is it a controller, a library, a CLI tool, a service, a plugin?

If it's part of a larger ecosystem, name its upstream dependencies and downstream consumers.

### 2. Module Structure (component breakdown)

Map the top-level packages/modules and their responsibilities:

```
repo/
├── cmd/           — entry points, CLI setup
├── pkg/api/       — public API types and interfaces
├── pkg/controller/ — reconciliation logic
│   ├── foo/       — handles Foo resources
│   └── bar/       — handles Bar resources
├── pkg/store/     — persistence layer
└── internal/      — private utilities
```

For each major module, one line on what it owns. Skip vendored/generated code.

### 3. Critical Data Flow / Control Flow

Trace the most important operation end-to-end. Pick the one path that best represents what this project *does* — the thing that if it stopped working, the project would be useless.

Walk through it step by step with an ASCII diagram:

```
User creates CR → API Server stores it → Controller watches → Reconcile()
    → Read current state → Diff desired vs actual → Apply changes → Update status
```

Name the actual functions/methods involved at each step — but explain *what* they do, not *how* they do it line by line.

### 4. Key Abstractions

Identify the 3-5 most important types, interfaces, or CRDs that define the system's vocabulary:

- **`FooSpec`** — defines the desired state of a Foo; key fields: `replicas`, `image`, `config`
- **`Reconciler` interface** — `Reconcile(ctx, req) (Result, error)` — the core loop entry point
- **`Store` interface** — abstracts persistence; implementations for etcd and in-memory

For each one: what it represents, its key fields/methods, and why it exists as an abstraction (not just what it contains).

### 5. Key Design Decisions

Surface 2-4 deliberate architectural choices and explain the *why*:

- **"Why a controller pattern instead of a webhook?"** — because X needs to handle drift and eventual consistency, not just admission-time validation
- **"Why is the cache layer in-process instead of Redis?"** — because the working set is small and network latency would negate the benefit

Look for clues in: architecture docs, PR descriptions referenced in comments, the shape of interfaces (what they abstract over reveals what's expected to change), and anything that seems like it could have been done differently.

### 6. Risks and Improvement Opportunities

Identify 2-4 areas that are fragile, overly complex, or could be improved:

- **Risk**: "The reconciler has no rate limiting — a burst of CR updates could overwhelm the downstream API"
- **Improvement**: "The `utils/` package is a grab bag with no clear ownership — several functions belong in their respective domain packages"
- **Tech debt**: "There are two serialization paths (JSON and protobuf) that have diverged in field naming"

Be specific and actionable. "The code could be cleaner" is useless. "The `sync()` function in `pkg/controller/foo.go` mixes API calls with business logic — extracting the API calls into the store layer would make it testable" is useful.

---

## Style Guidelines

- **Think architecture review, not code review** — zoom out, don't zoom in
- **Follow the critical path** — the happy path reveals the design; edge cases reveal the bugs (save those for debugging)
- **Name real files, functions, types** — anchor observations in the actual code so the user can follow up
- **Be opinionated** — if something looks wrong or suboptimal, say so and say why
- **Match the user's language** — if they ask in Chinese, respond in Chinese; if English, respond in English
