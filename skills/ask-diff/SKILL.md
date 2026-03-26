---
name: diff
description: >
  Compare two technologies, tools, frameworks, approaches, or architectures side by side —
  covering design philosophy, architecture, use cases, performance trade-offs, and a clear
  recommendation for when to choose each. Use when the user asks "A vs B", "compare A and B",
  "difference between A and B", "should I use A or B", "A or B for my use case",
  "how does A compare to B", "which is better A or B", or any variation of comparing two
  (or more) technical options. Do NOT use for understanding a single technology (use ask:tech
  or ask:onboard), debugging (use ask:debug), or non-technical comparisons (use ask:thing).
---

# Ask: Diff — Technical Comparison

When an engineer asks "A vs B", they need a clear, opinionated comparison that helps them make a decision — not a balanced-to-the-point-of-useless "both are great" answer.

---

## How to Respond

### 1. Design Philosophy

Start with the fundamental difference in *worldview* — the one sentence that explains why A and B exist as separate things:

> "Kafka treats data as an immutable log that consumers replay; RabbitMQ treats data as messages that get delivered and forgotten."

Then expand briefly: what does each project optimize for at its core? What do the creators believe is most important? This explains nearly every other difference downstream.

### 2. Architecture Comparison

Show how the two are structurally different. Use side-by-side diagrams when helpful:

```
A:                              B:
Producer → Broker → Consumer    Publisher → Exchange → Queue → Consumer
           (log)                            (routing)
           ↑                                ↑
     Consumer controls offset         Broker pushes to consumer
```

Highlight the architectural decisions that cause the most practical differences:
- Where does state live?
- What's the coordination model?
- What's the failure/recovery strategy?

### 3. Use Case Fit

Don't list abstract categories. Give concrete scenarios and name which one wins:

| Scenario | Winner | Why |
|----------|--------|-----|
| Event sourcing with replay | A | Log retention + consumer offset control |
| Task distribution across workers | B | Built-in load balancing + ack/nack |
| High-throughput stream processing | A | Sequential I/O, batching, partitions |
| Complex routing (topic/header-based) | B | Exchange types designed for this |

### 4. Performance and Scalability Trade-offs

Compare on the dimensions that actually matter, with real numbers where possible:

| Dimension | A | B |
|-----------|---|---|
| Throughput | ~1M msg/s per partition | ~50k msg/s per queue |
| Latency (p99) | ~5ms (batched) | ~1ms (single message) |
| Scaling model | Add partitions (rebalance cost) | Add queues (lightweight) |
| Storage cost | Retains everything (disk-heavy) | Delivers and discards (memory-heavy) |
| Operational complexity | High (ZK/KRaft, partition mgmt) | Medium (clustering, mirroring) |

If you don't have precise numbers, give order-of-magnitude estimates and say so.

### 5. Decision Guide

End with a clear, actionable recommendation. Use a decision tree or conditional format:

**Choose A when:**
- You need X
- Your system requires Y
- You have the operational capacity for Z

**Choose B when:**
- You need X
- Simplicity matters more than Y
- Your scale is below Z

**Don't choose either when:**
- [Alternative C might be better because...]

Be decisive. If the user gave context about their specific situation, tailor the recommendation directly to them — don't give a generic framework.

---

## Style Guidelines

- **Be opinionated** — name a winner for each dimension, don't say "both are good"
- **Use real numbers** — throughput, latency, resource usage; vague comparisons are useless
- **Start with philosophy, end with decision** — the structure flows from "why they're different" to "what you should pick"
- **Acknowledge nuance without hiding behind it** — "A is generally better for X, though B can work if you're willing to Y"
- **Match the user's language** — if they ask in Chinese, respond in Chinese; if English, respond in English
