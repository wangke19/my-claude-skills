---
name: debug
description: >
  Structured debugging assistance — analyze a problem description, logs, and symptoms to
  produce ranked root causes with verification steps and a minimal investigation path.
  Use when the user reports a bug, error, unexpected behavior, or production issue and
  wants help figuring out what's wrong. Trigger on "I'm seeing X error", "this is broken",
  "help me debug X", "why is X happening", "getting this error", "something went wrong with X",
  or when the user pastes logs/errors and asks for help. Do NOT use for understanding how
  systems work (use ask:tech or ask:deep-dive), designing new systems (use ask:design),
  or general learning (use ask:thing).
allowed-tools: Bash(*), Read(*), Glob(*), Grep(*), Agent(*)
---

# Ask: Debug — Structured Root Cause Analysis

When an engineer hits a problem, they don't need a list of things that *could* be wrong — they need a ranked investigation plan they can execute immediately. Every suggestion must be verifiable with a concrete command, query, or check.

---

## Before You Start

If the user provides a codebase path, logs, or must-gather, read the relevant files first. Don't guess when you can look.

If the information is sparse, ask for the minimum needed to be useful:
- What did you expect to happen?
- What actually happened?
- When did it start? (or: did it ever work?)
- Any recent changes?

But don't block on perfect information — work with what you have and state your assumptions.

---

## How to Respond

### 1. Probable Root Causes (ranked by likelihood)

List 3-5 candidates, ordered from most to least likely. For each:

**#1 — [Specific cause]** (Likelihood: High/Medium/Low)

Brief explanation of why this could cause the observed symptoms and why you rank it here. Connect the dots between the evidence (logs, symptoms) and this hypothesis.

Be specific. Not "configuration issue" but "the `maxConnections` pool is set to 10, which matches the number of stuck requests — pool exhaustion under load."

### 2. Verification Method (for each root cause)

For every hypothesis, provide a concrete way to prove or disprove it:

| # | Root Cause | How to Verify |
|---|-----------|---------------|
| 1 | Connection pool exhaustion | `kubectl exec <pod> -- curl localhost:8080/debug/pprof/goroutine?debug=1 \| grep "semacquire"` |
| 2 | DNS resolution timeout | `kubectl exec <pod> -- dig +trace <service-name>.svc.cluster.local` — look for >5s response |
| 3 | OOMKill during GC spike | `kubectl describe pod <pod> \| grep -A5 "Last State"` — check exit code 137 |

Each verification must be:
- **Executable** — a real command, query, or check the user can run right now
- **Decisive** — the result clearly confirms or eliminates the hypothesis
- **Safe** — no side effects on production

### 3. Minimal Investigation Path

Don't investigate everything in parallel. Give a prioritized sequence — the shortest path to an answer:

```
Step 1: Check X (eliminates hypotheses #1 and #3)
  └─ If X shows anomaly → likely #1, proceed to Step 1a
  └─ If X is normal → proceed to Step 2

Step 2: Check Y (tests hypothesis #2)
  └─ If Y confirms → root cause found
  └─ If Y is normal → proceed to Step 3

Step 3: Check Z (tests hypothesis #4, #5)
```

Design the tree so each step eliminates the maximum number of hypotheses. Front-load checks that are fast, safe, and high-signal.

### 4. Blast Radius (if systemic)

If this might be a systemic issue rather than an isolated bug, map out what else could be affected:

```
Problem: API server latency spike
├── Direct impact
│   ├── All controllers watching this API group
│   └── Webhook admission calls timing out
├── Cascading effects
│   ├── Pod scheduling delays (scheduler can't read node status)
│   └── HPA not scaling (metrics-server can't reach API)
└── Related components to check
    ├── etcd — is it the actual bottleneck?
    └── Network — is it infra-wide or API-server specific?
```

### 5. Known Problem Patterns

If the symptoms match a well-known failure mode, call it out:

- **Pattern**: "This looks like the classic [X pattern]" — brief description
- **Signature**: The specific combination of symptoms that identifies it
- **Known fix**: What typically resolves it
- **Reference**: Link to upstream issue, KEP, or known bug if applicable

If you're not confident it matches a known pattern, say so — don't force-fit.

---

## Style Guidelines

- **Every suggestion must be verifiable** — if you can't tell the user how to check it, don't suggest it
- **Rank by likelihood, not alphabetically** — put the most probable cause first
- **Be specific to their environment** — if they're on OpenShift, give `oc` commands; if Kubernetes, `kubectl`
- **Show your reasoning** — explain *why* you rank a cause as likely, connecting evidence to hypothesis
- **Don't hedge everything equally** — if one cause is 80% likely, say so
- **Match the user's language** — if they ask in Chinese, respond in Chinese; if English, respond in English
