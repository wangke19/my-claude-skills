---
name: onboard
description: >
  Ramp up on a new project, framework, library, or technical concept from scratch — structured
  as a system walkthrough with analogies for an engineer who has general experience but zero
  prior exposure to this specific thing. Use when the user is encountering something for the
  first time: a new framework (React, Terraform, Kafka), a new project they just joined,
  a new protocol or standard, a new tool or platform. Trigger on phrases like "I'm new to X",
  "just started learning X", "onboard me on X", "walk me through X", "ramp me up on X",
  "I need to get up to speed on X". Do NOT use for concepts the user already knows and wants
  a deeper technical briefing on (use ask:tech), or for general non-technical topics (use ask:thing).
---

# Ask: Onboard — Ramp Up on Anything New

When an engineer encounters something entirely new — a framework, a project, a concept — they don't need a manual. They need a guided tour that builds understanding layer by layer, with analogies that connect to what they already know.

---

## The Walkthrough

Work through these 7 layers in order. Each one builds on the previous, so by the end the engineer has a working mental model they can start using immediately.

### 1. Why It Exists (the core problem)

What pain point or gap caused X to be created? Don't start with what X *is* — start with what the world looked like *without* X. Make the problem feel real.

Example: "Before containers, deploying meant 'it works on my machine' prayers. Every server had slightly different library versions, and a Python 2.7 app couldn't coexist with a Python 3 app without dependency hell."

### 2. Core Abstractions (the vocabulary)

Every system introduces 3-5 key concepts that everything else builds on. List them with one-line definitions. This is the vocabulary the engineer needs before anything else makes sense.

```
X's mental model:
├── Concept A — one-line explanation
├── Concept B — one-line explanation
├── Concept C — one-line explanation
└── Concept D — one-line explanation
```

For each core concept, add a brief analogy if it helps:

> "A Pod is like a shared apartment — multiple containers live together, share the same network address, and can talk to each other over localhost."

### 3. How It Works (the critical path)

Walk through the single most common operation — the "hello world" flow. What happens step by step when X does its primary job?

Use an ASCII diagram for anything with more than 2 steps:

```
User writes config → CLI parses it → Plan generated → User approves → Changes applied → State saved
```

Focus on the happy path. Mention error handling only if it's fundamental to understanding the design.

### 4. Architecture Layers

Break X into its structural layers. Show how the pieces fit together:

```
X
├── Interface Layer — how users interact
│   └── CLI / API / UI
├── Core Engine — where the logic lives
│   ├── Sub-system A
│   └── Sub-system B
└── Storage / Runtime — where state lives
```

### 5. How It Differs from Alternatives

Pick 1-2 alternatives the engineer is most likely to already know or encounter. Draw a clear contrast:

| Aspect | X | Alternative |
|--------|---|-------------|
| Core approach | ... | ... |
| Best for | ... | ... |
| Worst for | ... | ... |

Be direct about when to choose X and when not to.

### 6. Real-World Usage Patterns

Give 2-3 concrete, specific examples of X in production. Not abstract categories — real scenarios with enough detail to be useful:

- **Scenario**: "A team running 50 microservices uses X to [specific action] because [specific reason], resulting in [specific outcome]."

This grounds the abstraction in reality and helps the engineer see where X fits in their own work.

### 7. Limitations and Trade-offs

What X deliberately sacrifices, where it falls apart at scale, or what it simply can't do. Be honest — every tool has edges:

- **Trade-off**: What X gives up to get its strengths
- **Scaling limit**: Where X starts to struggle
- **Ecosystem gap**: What X doesn't cover that you'll need separately

---

## Style Guidelines

- **Use analogies heavily** — the user has zero context on X, so bridge from what they know
- **Be an opinionated guide** — "start here, ignore that for now, this matters most"
- **Stay concrete** — real commands, real file names, real scenarios
- **No encyclopedia tone** — this is a senior engineer explaining over coffee, not a textbook
- **Match the user's language** — if they ask in Chinese, respond in Chinese; if English, respond in English
