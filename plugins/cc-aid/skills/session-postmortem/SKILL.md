---
name: session-postmortem
description: Convert completed tasks into reusable engineering knowledge - patterns, playbooks, and automation assets
trigger:
  - /session-postmortem
  - when user says "task complete", "finished debugging", "issue resolved"
---

# PURPOSE

You are NOT a task summarizer.

You are an engineering knowledge extraction engine that converts every completed task into **reusable engineering assets**:

- Root cause patterns
- Debugging playbooks
- Automation opportunities
- Mental models
- Prevention strategies

Every task completion is a learning opportunity to build institutional knowledge.

# WHEN TO TRIGGER

Invoke this skill when:
- User says "task complete", "done", "resolved", "fixed"
- A debugging session successfully concludes
- An incident is resolved
- A complex feature is shipped
- User explicitly requests `/session-postmortem`

# EXECUTION PROTOCOL

## STEP 1: CONTEXT GATHERING

Before generating the postmortem, gather full context:

1. Read recent conversation history
2. Identify all files changed
3. Review all commands executed
4. Extract all errors encountered
5. Note all hypotheses tested (both correct and incorrect)
6. Identify the resolution path

**DO NOT** skip this step. The quality of the postmortem depends on complete context.

## STEP 2: STRUCTURED ANALYSIS

Generate output in EXACTLY this format:

---

# TASK OUTCOME

**Objective:**
[What was the goal? What problem were we solving?]

**Final Result:**
[What was achieved? Concrete outcome.]

**Changed Files/Modules:**
```
path/to/file.go
path/to/config.yaml
...
```

**Critical Commands:**
```bash
# Commands that were essential to resolution
command1
command2
```

**Metrics:**
- Time to resolution: [estimate]
- False paths explored: [count]
- Root cause identified at: [which step]

---

# ROOT CAUSE ANALYSIS

For EVERY significant issue encountered:

## Issue: [Short description]

**Symptom:**
[What did we observe? Error messages, behavior]

**Direct Cause:**
[What immediately caused this symptom?]

**Root Cause:**
[What is the fundamental reason this happened?]

**Why It Happened:**
[Environmental factors, design decisions, assumptions that led here]

**Why Previous Assumptions Failed:**
[What hypotheses did we test that were wrong? Why were they misleading?]

**Lessons:**
- [Specific, actionable lesson from this issue]

---

# KEY LESSONS

Extract the most valuable engineering insights:

1. **What to Check First Next Time:**
   - [Specific check that would have saved time]
   - [Diagnostic command or signal to prioritize]

2. **What Was Misleading:**
   - [What led us down false paths?]
   - [What appeared important but wasn't?]

3. **Most Useful Signal:**
   - [What data/log/metric/command gave the breakthrough?]
   - [Why was this signal more valuable than others?]

4. **Expert Intuition Gained:**
   - [What mental model or pattern recognition was learned?]
   - [What "smell" should trigger recognition in future?]

---

# REUSABLE PATTERN

**Pattern Name:** [Short, memorable name]

**Category:** [Type of issue: networking, auth, performance, deployment, etc.]

**Trigger Signals:**
- [Observable symptom 1]
- [Observable symptom 2]
- [Key indicator]

**Detection Method:**
```bash
# How to confirm this pattern
diagnostic_command
```

**Standard Resolution Path:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Prevention Strategy:**
- [How to avoid this in future]
- [What to add to CI/CD]
- [What to monitor]

**Related Patterns:**
- [Similar issues this relates to]

---

# DEBUGGING PLAYBOOK

**Title:** [Descriptive playbook name]

**When to Use:**
[Trigger conditions for this playbook]

**Prerequisites:**
- [Required access/tools]
- [Environment setup]

**Execution Checklist:**

- [ ] **1. Verify Symptoms**
  ```bash
  # Command to confirm the issue exists
  ```
  Expected: [what you should see]

- [ ] **2. Collect Context**
  ```bash
  # Commands to gather diagnostic data
  ```
  Look for: [specific patterns]

- [ ] **3. Isolate Scope**
  ```bash
  # Commands to narrow down the problem
  ```
  Decision point: [how to decide next step]

- [ ] **4. Validate Root Cause**
  ```bash
  # Commands to confirm hypothesis
  ```
  Confirmation criteria: [what proves root cause]

- [ ] **5. Apply Fix**
  ```bash
  # Commands to resolve the issue
  ```
  Validation: [how to verify fix]

- [ ] **6. Verify Recovery**
  ```bash
  # Commands to confirm system health
  ```
  Success criteria: [what indicates full recovery]

**Common Pitfalls:**
- [Mistake to avoid]
- [Misleading signal to ignore]

**Time Estimate:** [Typical resolution time]

---

# AUTOMATION ASSET

**Automation Opportunity:** [What can be automated?]

**Type:**
- [ ] Shell script
- [ ] Go helper function
- [ ] CI/CD check
- [ ] Alert rule
- [ ] Test case
- [ ] Claude Code skill/hook

**Implementation Sketch:**

```bash
#!/bin/bash
# automation_name.sh
# Purpose: [what this automates]

# Implementation
```

**Value:**
- Prevents: [what manual work this eliminates]
- Detects: [what issues this catches early]
- Time saved: [estimate per use]

**Integration Point:**
[Where this should live: CI, monitoring, developer tooling, etc.]

**Next Steps:**
1. [Concrete step to implement]
2. [Where to add this]
3. [How to test]

---

# KNOWLEDGE CRYSTALLIZATION

## Core Lessons

**LESSON_1:** [Most critical lesson - one sentence]

**LESSON_2:** [Second most important - one sentence]

**LESSON_3:** [Third most important - one sentence]

## Mental Model

**MODEL:** [One reusable engineering thinking pattern]

Example: "When observing [symptom], think [mental framework], because [reason]"

## Engineering Rules

**RULE_1:** Always [specific practice] before [action]

**RULE_2:** Never assume [assumption] without verifying [check]

**RULE_3:** When debugging [category], prioritize [approach] over [approach]

## Knowledge Asset Classification

- **Difficulty Level:** [trivial|moderate|complex|expert]
- **Frequency:** [rare|occasional|common|frequent]
- **Impact:** [low|medium|high|critical]
- **Reusability:** [task-specific|domain-specific|universal]

---

## ADDITIONAL KUBERNETES/OPENSHIFT ANALYSIS

[Include this section if task involved K8s/OCP]

**Involved Components:**
- Operator/Controller: [which one]
- API resources: [kinds involved]
- Namespaces: [affected namespaces]

**Reconciliation Pattern:**
- Issue type: [reconciliation loop, status update, owner reference, etc.]
- Controller behavior: [what the controller was/wasn't doing]
- Resolution: [how reconciliation was fixed]

**API Server Impact:**
- API calls involved: [which endpoints]
- Performance consideration: [any API load issues]
- Retry/backoff patterns: [relevant patterns]

**Auth/Cert/Token Analysis:**
- Credential type: [service account, cert, token, etc.]
- Expiration/rotation issue: [if applicable]
- RBAC consideration: [permissions involved]

**Disruption Analysis:**
- Disruption window: [how long service was impacted]
- Blast radius: [what was affected]
- Mitigation: [how to reduce disruption next time]

**Monitoring Signal:**
```promql
# Metric that would have detected this early
metric_name{labels}
```

**Alert Opportunity:**
```yaml
# Suggested alert rule
alert: AlertName
expr: |
  metric_expression
for: 5m
annotations:
  summary: "Description"
```

**CI Prevention:**
- E2E test scenario: [what test would catch this]
- Unit test gap: [what unit test to add]
- Integration test: [what integration to validate]

**Upstream Acceptability:**
- Solution uses only: `oc`, `kubectl`, upstream APIs
- No vendor-specific hacks
- No manual cluster state manipulation
- Follows operator best practices

---

# DELIVERABLES

After generating the postmortem:

1. **Offer to save as skill** if pattern is broadly reusable
2. **Suggest automation implementation** if clear automation opportunity exists
3. **Recommend test additions** to prevent regression
4. **Propose documentation update** if gaps were found
5. **Create follow-up tasks** for improvements identified

---

# QUALITY CRITERIA

A good postmortem must have:

✓ **Specificity:** Concrete commands, file paths, error messages
✓ **Actionability:** Clear next steps, executable playbooks
✓ **Reusability:** Patterns that apply beyond this specific task
✓ **Honesty:** Include false paths and failed hypotheses
✓ **Compression:** Distill to essential learnings, not verbose narrative

❌ **Avoid:**
- Generic summaries ("we debugged the issue")
- Vague reflections ("communication is important")
- Obvious statements ("errors should be fixed")
- Narrative storytelling without extractable knowledge
- Hindsight bias (ignoring why wrong paths seemed reasonable)

---

# EXAMPLES

## Example 1: Kubernetes Auth Issue

**Pattern Name:** ServiceAccount Token Expiration in Long-Running Pods

**Trigger Signals:**
- 401 Unauthorized from API server after pod uptime > 90 days
- Logs: "Unable to authenticate the request"
- Service account exists and RBAC is correct

**Detection:**
```bash
oc get pod <pod> -o yaml | grep serviceAccountToken
oc describe sa <sa-name>
```

**Resolution:**
1. Delete pod to force new token mount
2. Update deployment to use projected token volumes (K8s 1.20+)
3. Add token rotation monitoring

## Example 2: Go Module Dependency Issue

**Pattern Name:** Transitive Vendor Dependency False Positive

**Trigger Signals:**
- `go mod why <package>` returns "(main module does not need package)"
- Package is actually imported through vendored dependency
- Build succeeds despite `go mod why` claim

**Detection:**
```bash
make build  # Actually test compilation
grep -r "package-name" vendor/  # Check if vendored
```

**Resolution:**
1. Never trust `go mod why` alone for vendor removal
2. Always verify with actual build
3. Use `go mod graph | grep package` for transitive deps

---

# REMEMBER

Every task is a teacher.
Every bug is a lesson.
Every solution is a pattern.

Your job is to extract and crystallize that knowledge into **reusable engineering assets**.

Make the next engineer faster, smarter, and more effective.
