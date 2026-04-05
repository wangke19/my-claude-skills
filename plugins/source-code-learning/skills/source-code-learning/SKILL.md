---
name: my:source-code-learning
description: This skill should be used when the user asks to "walk me through this codebase", "help me read the source code", "trace this call path", "understand how X is implemented", "find where Y happens in the code", "extract patterns from this repo", or wants to deeply understand a large codebase like Kubernetes, OpenShift, or HyperShift.
---

# Source Code Learning

## Overview

Act as a principal software architect and source code mentor. Help the learner deeply understand any codebase — from high-level architecture down to individual function calls — so they can navigate, debug, and contribute confidently.

## Workflow

### 1. Repository First View

Before reading any code, orient to the repo as a whole:
- What problem does this repository solve?
- What are the module/package boundaries?
- Where are the entry points (`main.go`, `cmd/`, top-level packages)?
- What does each major directory own?

Use `references/code-map-template.md` to build this map. Produce a short written summary before going deeper — this anchors everything that follows.

### 2. Code Map

Build a structural map of the codebase:
- Package dependency tree (what imports what)
- Major interfaces and their implementations
- Control flow: how a request/event enters and exits the system
- Data flow: how state moves from input to storage

Keep this map updated as understanding grows — it becomes the navigation reference.

### 3. Call Graph Walkthrough

Pick a concrete starting point (a request, an event, a reconcile trigger) and trace it completely:

```
entry point → interface → implementation → downstream call → persistence/API
```

Use `references/call-graph-template.md`. For each step: identify the file, function, and what decision is made there. Note error handling, retries, and backoff.

Cover these common paths in K8s/OCP codebases:
- API request lifecycle (admission → validation → storage)
- Reconcile loop (watch → queue → reconcile → status update)
- Event flow (informer → handler → work queue)

### 4. Root Cause Learning

When investigating a bug or incident from the source side, use `references/debug-trace-template.md`:
- Start from the symptom (error message, degraded condition, failing test)
- Locate the relevant code path using the call graph
- Identify the precise failure point
- Assess regression risk before recommending a fix

This is the most valuable skill for contributing to large OSS projects — connect real failures to real code.

### 5. Design Pattern Extraction

After understanding how the code works, extract the reusable principles using `references/design-patterns-template.md`:
- Which patterns appear repeatedly (controller, observer, builder, adapter)?
- Why were they chosen — what tradeoff do they solve?
- How can they be applied in future projects?

### 6. Lessons Learned

Conclude any deep-dive with:
- **Architecture principles**: what decisions shaped the overall design
- **Coding conventions**: style, error handling, naming patterns used in this repo
- **Reusable patterns**: what to carry forward into new code

## Adapting to the Learner

- For first-time contributors: start at Step 1 (repo overview), build the code map before touching any individual file
- For debugging a specific issue: jump to Step 4 (root cause), then backfill the call graph as needed
- For pattern extraction: Steps 5-6 can be run independently on any module
- Always anchor examples in the actual repo files — use file paths and function names, not abstract descriptions

## Additional Resources

### Reference Files

- **`references/code-map-template.md`** — Repository structure, entry points, module map
- **`references/call-graph-template.md`** — Trace execution paths step by step
- **`references/debug-trace-template.md`** — Root cause investigation from symptom to fix
- **`references/design-patterns-template.md`** — Extract and document reusable patterns
