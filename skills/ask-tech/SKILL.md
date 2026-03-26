---
name: tech
description: >
  Explain any technical concept, system, protocol, or technology as a system design briefing
  for an experienced engineer — then follow up with common pitfalls and key takeaways.
  Use when the user asks about technical topics like databases, protocols, distributed systems,
  algorithms, infrastructure, frameworks, networking, OS concepts, cloud services, etc.
  Trigger on phrases like "explain X technically", "how does X work under the hood",
  "break down X for me", "what is X (technical topic)". Do NOT use for general non-technical
  concepts (use ask:thing), code/repo analysis, or debugging — those have dedicated skills.
---

# Ask: Tech — Two-Phase Technical Briefing

When an engineer asks about a technical concept, treat it like a system design briefing — not a tutorial, not a Wikipedia summary. Assume the audience has engineering experience but no prior knowledge of this specific topic.

The response has two phases that flow naturally in a single answer.

---

## Phase 1: System Design Briefing

Walk through these 6 dimensions. Be direct and opinionated — this is a briefing, not a survey.

### Problem

What concrete problem does X solve? What was painful or broken before X existed? Be specific — "it was slow" is weak; "every read required a full table scan across N shards" is strong.

### Core Abstraction

What is the key mental model or abstraction that makes X work? Every good system introduces one powerful idea. Name it and explain it.

Example: "Kafka's core abstraction is an append-only log partitioned by key — producers write to the tail, consumers track their own offset."

### Mechanism

How does it actually work under the hood? Cover the critical path — what happens when the system handles its primary operation. Use diagrams (ASCII) if the flow has more than 3 steps:

```
Client → Load Balancer → Worker → Cache → DB
                                    ↓
                              Cache Miss → DB → Cache Fill
```

Focus on the steady-state path first, then mention failure/edge cases briefly.

### Architecture Layers

Break down the system into its structural layers or components:

```
X
├── Layer/Component A — responsibility
│   ├── Sub-component — detail
│   └── Sub-component — detail
├── Layer/Component B — responsibility
└── Layer/Component C — responsibility
```

Keep it to what matters for understanding the design, not an exhaustive component list.

### Trade-offs vs. Alternatives

Compare X against 1-2 alternatives that solve the same problem. Use a trade-off table:

| Dimension | X | Alternative |
|-----------|---|-------------|
| Strength of X | ... | ... |
| Weakness of X | ... | ... |
| Sweet spot | ... | ... |

Be honest about where X loses. Every design is a set of trade-offs.

### Risks and Uncertainties

What are the biggest operational risks, scaling limits, or open questions? Where does X break down? What keeps the maintainers up at night?

---

## Phase 2: Engineer's Cheat Sheet

After the briefing, immediately follow with these three sections. This is where the real value is — the stuff that saves someone from learning the hard way.

### Commonly Misunderstood

List 2-3 things that people frequently get wrong about X. For each one, state the misconception and the reality:

- **Misconception**: "X guarantees exactly-once delivery"
- **Reality**: X provides at-least-once; exactly-once requires idempotent consumers

### Beginner Pitfalls

The 2-3 most common mistakes newcomers make when first working with X. Be specific and actionable — not "read the docs" but "always set connection pool timeout lower than your load balancer timeout, or you'll get silent connection reuse failures."

### Three Sentences to Remember

If the engineer could only retain 3 sentences about X, what should they be? These should be dense, precise, and useful — the kind of thing you'd write on a sticky note.

---

## Style Guidelines

- **Write like you're briefing a peer** — no hand-holding, no filler
- **Be concrete** — real numbers, real scenarios, real failure modes
- **Use ASCII diagrams** for flows and architectures
- **Stay opinionated** — say what the best practice is, don't list 5 options equally
- **Match the user's language** — if they ask in Chinese, respond in Chinese; if English, respond in English
