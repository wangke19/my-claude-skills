---
name: thing
description: >
  Quickly understand any general concept, phenomenon, or thing using a structured cognitive model.
  Use when the user asks "what is X", "explain X", "help me understand X", "tell me about X",
  or any variation of wanting to learn about a non-technical, general-knowledge topic
  (e.g., economics concepts, scientific phenomena, philosophies, historical events, social systems,
  everyday things like coffee or batteries). Do NOT use for code/repo analysis, debugging,
  system design, or tech deep-dives — those have dedicated ask:* skills.
---

# Ask: Thing — Build a Cognitive Model

When someone asks about a concept or thing they don't understand, don't give them an encyclopedia article. Instead, build a mental model they can actually think with.

## How to respond

Take **X** (whatever the user is asking about) and walk through these 8 layers. Each layer builds on the previous one, so by the end the user has a working mental model — not just facts.

### 1. What it is (one-sentence essence)

Distill X down to its core in a single sentence. This isn't a dictionary definition — it's the "aha" sentence that makes everything else click.

Think: if someone remembered only one sentence about X, what should it be?

### 2. Why it exists (the problem it solves)

Everything exists for a reason — what gap or friction caused X to emerge? Cover the historical or situational context briefly. This answers "why should I care?" and anchors the concept in reality.

### 3. How it works (core mechanism via analogy)

Explain the fundamental mechanism using an analogy the user already understands. The analogy should illuminate the *mechanism*, not just the surface appearance.

Good: "A blockchain is like a shared notebook where everyone has a copy — if someone tries to change a page, everyone else's copy disagrees and rejects it."

Bad: "A blockchain is like a chain of blocks." (circular, no insight)

### 4. Key components (structural breakdown)

Break X into its 3-5 essential parts. Use a clear hierarchy:

```
X
├── Component A — what it does
├── Component B — what it does
└── Component C — what it does
```

Keep it to the parts that matter for understanding — not an exhaustive taxonomy.

### 5. How it differs from similar things (comparison)

Pick 1-2 things that X is most commonly confused with or compared to. Use a brief contrast table or side-by-side if it helps:

| Aspect | X | Similar thing |
|--------|---|---------------|
| Key difference 1 | ... | ... |
| Key difference 2 | ... | ... |

This sharpens the boundaries of the mental model.

### 6. Where you see it in practice (typical scenarios)

Give 2-3 concrete, real-world examples of X in action. These should be vivid and specific — not abstract categories.

### 7. Limitations and controversies

What X can't do, where it breaks down, or what people argue about. Be honest and balanced. This prevents the user from over-applying the mental model.

### 8. Three keys to go deeper

If the user wants to move beyond surface understanding, what are the 3 most important concepts, skills, or resources to pursue? Be specific — not "read more about it" but "understand Y, because it unlocks Z."

## Style guidelines

- **Use analogies liberally** — they're the fastest path to understanding
- **Use hierarchy and structure** — headers, trees, tables, not walls of text
- **Be opinionated** — say what matters most, don't hedge everything equally
- **Stay concrete** — examples > abstractions
- **Keep it conversational** — this is a knowledgeable friend explaining, not a textbook
- **Match the user's language** — if they ask in Chinese, respond in Chinese; if English, respond in English
