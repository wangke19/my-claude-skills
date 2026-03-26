---
name: deep-dive
description: >
  Deep-dive into a specific mechanism, process, or behavior — trace it step by step with
  triggers, state transitions, components involved, and design rationale. Use when the user
  already has general knowledge of a system and wants to understand one specific mechanism
  in detail: "how does X actually work", "walk me through the X process", "what happens
  when X triggers", "explain the X lifecycle", "trace what happens during X", "deep dive
  into X". This is for zooming INTO a mechanism, not for broad overviews (use ask:tech or
  ask:onboard) or repo analysis (use ask:analyze-repo).
allowed-tools: Bash(*), Read(*), Glob(*), Grep(*), Agent(*)
---

# Ask: Deep Dive — Trace a Mechanism End to End

When someone asks to deep-dive into a specific mechanism, they already know the big picture — they want to see the gears turn. Don't explain what X is. Explain exactly what happens, step by step, when X runs.

---

## How to Respond

If the mechanism lives in a codebase the user points to, read the relevant code first. If it's a general technical mechanism (e.g., "how does TCP handshake work"), use your knowledge. Either way, follow the same structure.

### 1. Trigger Conditions

When does this mechanism activate? Be precise:

- What event, signal, or state change kicks it off?
- Are there preconditions that must be true?
- Can it be triggered manually vs. automatically?

Example: "The reconciler triggers when the informer cache receives a watch event (ADD/UPDATE/DELETE) for a Foo resource, or when a resync timer fires (default: 10 hours)."

### 2. Step-by-Step Flow

Trace the mechanism from trigger to completion. Use a numbered sequence with the actual component/function names where applicable:

```
1. Event arrives at workqueue
2. Worker goroutine calls syncHandler(key)
3. syncHandler fetches current object from cache via lister.Get(key)
4. Compares .Spec (desired) vs .Status (actual)
5. If drift detected → calls createOrUpdate() on downstream resources
6. Updates .Status.Conditions with result
7. If error → requeues with exponential backoff
```

Use an ASCII sequence diagram when multiple components interact:

```
Controller          API Server          Kubelet
    │                    │                  │
    │── Watch ──────────►│                  │
    │◄── Event (ADD) ────│                  │
    │                    │                  │
    │── Update Status ──►│                  │
    │                    │── Sync Pod ─────►│
    │                    │◄── Status ───────│
```

Name real functions, methods, or protocol steps — not vague descriptions.

### 3. Key Components Involved

List each component that participates in this flow, with its specific role in *this* mechanism (not its general purpose):

- **Workqueue** — deduplicates and rate-limits incoming events before processing
- **Lister** — reads from local cache (not API server) to avoid thundering herd
- **Status subresource** — allows status updates without triggering a new reconcile loop

### 4. State Transitions

Show how state changes as the mechanism progresses. Use a state diagram or transition table:

```
Pending ──(validation passes)──► Running ──(completes)──► Succeeded
    │                               │
    └──(validation fails)──► Failed  └──(error)──► Failed ──(retry)──► Pending
```

Or a table if states are complex:

| State | Entry Condition | Exit Condition | Side Effects |
|-------|----------------|----------------|--------------|
| Pending | CR created | Validation passes | None |
| Running | Resources provisioned | Work completes | Creates downstream objects |
| Failed | Error at any stage | Manual retry or backoff | Emits event, increments counter |

### 5. Design Rationale

For 2-3 of the most interesting design choices in this mechanism, explain *why*:

- **"Why a workqueue instead of processing events inline?"** — decouples event rate from processing rate; allows deduplication so rapid updates don't cause redundant reconciles
- **"Why read from cache instead of API server?"** — a single controller watching 10k objects would DDoS the API server on every reconcile if it did live reads

Connect each decision to the problem it solves.

### 6. Common Misconceptions

List 2-3 things people frequently get wrong about this mechanism:

- **Wrong**: "Reconcile runs once per change" → **Right**: Reconcile runs once per *key* — rapid changes are coalesced by the workqueue
- **Wrong**: "Status updates don't trigger reconciliation" → **Right**: They do, unless you use a status subresource with a predicate filter

For each, state the misconception clearly, then the reality, and briefly explain why the confusion exists.

---

## Style Guidelines

- **Show the process, don't just name it** — sequences and diagrams over paragraphs
- **Name real things** — functions, fields, protocol messages, not "the system then processes it"
- **Explain the why alongside the what** — every step exists for a reason
- **Skip the overview** — the user already knows what X is; dive straight into the mechanism
- **Match the user's language** — if they ask in Chinese, respond in Chinese; if English, respond in English
