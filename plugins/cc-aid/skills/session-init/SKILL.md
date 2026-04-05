---
name: session-init
description: Initialize coding session from saved checkpoint or fresh start
trigger:
  - /session-init
  - when user says "continue work", "start session", "init"
---

# PURPOSE

You are initializing a coding session.

This skill provides clean session startup by:
- Resuming from saved checkpoints when available
- Starting fresh when no checkpoint exists
- Preventing hallucination of prior work
- Ensuring clear task definition

# WHEN TO TRIGGER

Invoke this skill when:
- User explicitly requests `/session-init`
- User says "resume session", "continue work", "start session", "init"
- Beginning of a new Claude Code session where state restoration is needed
- User wants to pick up where they left off

# EXECUTION PROTOCOL

## STEP 1: Check for Existing Checkpoint

**Check if `.ai-session/STATE.md` exists:**

```bash
ls -la .ai-session/STATE.md
```

**Two paths:**
1. **File exists** → Resume from checkpoint (STEP 2)
2. **File not found** → Fresh start (STEP 3)

---

## STEP 2: Resume from Checkpoint

If `.ai-session/STATE.md` exists:

### 2.1: Read the checkpoint

```bash
cat .ai-session/STATE.md
```

### 2.2: Display resumption summary

Output **exactly** in this format:

```
=== SESSION RESUMED ===

📋 TASK
[One-line task objective from checkpoint]

✅ COMPLETED
- [Done item 1]
- [Done item 2]
- [Done item 3]

⚠️ CURRENT BLOCKER
[Blocker description or "None - ready to proceed"]

▶️ NEXT ACTION
[Next action from checkpoint]

---

Resuming work now...
```

### 2.3: Execute NEXT ACTION

**CRITICAL RULES:**

✓ **DO** execute the NEXT ACTION immediately
✓ **DO** use context from FILES/CONTEXT section
✓ **DO** trust DONE items as completed
✓ **DO** avoid FAILED approaches

❌ **DO NOT** re-explain the checkpoint
❌ **DO NOT** ask clarifying questions unless NEXT ACTION is ambiguous
❌ **DO NOT** re-verify completed work in DONE
❌ **DO NOT** hallucinate prior work not in checkpoint
❌ **DO NOT** assume context missing from checkpoint

**If NEXT ACTION is clear:** Execute it immediately

**If NEXT ACTION is ambiguous:** Ask ONE specific clarifying question, then execute

---

## STEP 3: Fresh Start

If `.ai-session/STATE.md` does NOT exist:

### 3.1: Display fresh start message

```
=== NEW SESSION ===

No checkpoint found at .ai-session/STATE.md

Starting fresh session.
```

### 3.2: Ask for task definition

Ask the user:

```
What task would you like to work on?

Provide:
- Task objective
- Relevant context (files, issues, PRs, etc.)
- Any constraints or requirements
```

### 3.3: Wait for user input

**DO NOT:**
- Assume the task
- Explore files randomly
- Start work without task definition
- Hallucinate prior context

**DO:**
- Wait for clear task description
- Ask clarifying questions if needed
- Confirm understanding before starting

---

## STEP 4: Optional - Create Initial Checkpoint

After task definition (fresh start) or before major work (resumed session), offer:

```
Would you like me to create a checkpoint before starting?

This will save the current state to .ai-session/STATE.md for future resumption.

(You can also manually run /session-checkpoint anytime)
```

---

# CHECKPOINT VALIDATION

When resuming from checkpoint, validate structure:

**Required sections:**
- TASK
- DONE
- NEXT ACTION

**Optional sections:**
- DECISIONS
- FAILED
- CURRENT BLOCKER
- FILES / CONTEXT

**If checkpoint is malformed:**

```
⚠️ WARNING: Checkpoint found but malformed

The checkpoint at .ai-session/STATE.md is missing required sections.

Options:
1. Provide task description to start fresh
2. Fix checkpoint manually and re-run /session-init
3. View checkpoint: cat .ai-session/STATE.md
```

---

# CONTEXT BOUNDARIES

**What you CAN assume from checkpoint:**
- DONE items are completed and verified
- FAILED approaches should not be repeated
- DECISIONS were made for good reasons
- NEXT ACTION is the correct next step

**What you CANNOT assume:**
- Files not listed in FILES/CONTEXT
- Work not listed in DONE
- Context not explicitly written in checkpoint
- Branches, PRs, or resources not mentioned

**Golden Rule:** If it's not in the checkpoint, it doesn't exist.

---

# EXAMPLES

## Example 1: Successful Resume

**Checkpoint exists at `.ai-session/STATE.md`:**

```markdown
# TASK
Debug pod crash loop in namespace openshift-ovn-kubernetes

# DONE
- Identified crashlooping pod: ovnkube-node-abc123
- Extracted logs showing "certificate has expired"
- Verified root cause is token expiration

# CURRENT BLOCKER
None - ready to implement fix

# NEXT ACTION
Edit DaemonSet manifest to add projected service account token volume with 1h TTL

# FILES / CONTEXT
- DaemonSet: deployments/ovnkube-node.yaml
- Namespace: openshift-ovn-kubernetes
```

**Skill output:**

```
=== SESSION RESUMED ===

📋 TASK
Debug pod crash loop in namespace openshift-ovn-kubernetes

✅ COMPLETED
- Identified crashlooping pod: ovnkube-node-abc123
- Extracted logs showing "certificate has expired"
- Verified root cause is token expiration

⚠️ CURRENT BLOCKER
None - ready to implement fix

▶️ NEXT ACTION
Edit DaemonSet manifest to add projected service account token volume with 1h TTL

---

Resuming work now...
```

**Then immediately:**
- Read `deployments/ovnkube-node.yaml`
- Make the token volume changes
- No re-explanation, no re-verification

---

## Example 2: Fresh Start

**No checkpoint exists:**

**Skill output:**

```
=== NEW SESSION ===

No checkpoint found at .ai-session/STATE.md

Starting fresh session.

What task would you like to work on?

Provide:
- Task objective
- Relevant context (files, issues, PRs, etc.)
- Any constraints or requirements
```

**User responds:**
"Fix the failing unit tests in pkg/controller/pod_controller_test.go"

**Skill continues:**
```
Got it. Task objective: Fix failing unit tests in pkg/controller/pod_controller_test.go

Let me start by examining the test file and running the tests to see the failures.
```

---

## Example 3: Malformed Checkpoint

**Checkpoint exists but missing NEXT ACTION:**

**Skill output:**

```
⚠️ WARNING: Checkpoint found but malformed

The checkpoint at .ai-session/STATE.md is missing required section: NEXT ACTION

Options:
1. Provide task description to start fresh
2. Fix checkpoint manually and re-run /session-init
3. View checkpoint: cat .ai-session/STATE.md

What would you like to do?
```

---

# INTEGRATION WITH OTHER SKILLS

**Session lifecycle:**

1. **Start session:** `/session-init` (this skill)
2. **During work:** `/session-checkpoint` to save state
3. **End work:** `/session-checkpoint` before logging off
4. **Resume work:** `/session-init` loads checkpoint
5. **Complete task:** `/session-postmortem` to extract knowledge

**Workflow:**

```
Day 1:
- /session-init (fresh start)
- Work on task
- /session-checkpoint (save before lunch)
- /session-init (resume after lunch)
- /session-checkpoint (save at end of day)

Day 2:
- /session-init (resume from yesterday)
- Complete task
- /session-postmortem (extract learnings)
```

---

# ERROR HANDLING

**Checkpoint read error:**

```
❌ ERROR: Cannot read checkpoint

File exists at .ai-session/STATE.md but cannot be read.

Error: [error message]

Please check file permissions or provide task description to start fresh.
```

**Ambiguous NEXT ACTION:**

```
⚠️ NEXT ACTION is ambiguous

Checkpoint says: "Fix the bug"

This is too vague to execute. Can you clarify:
- Which bug? (file, line, error message)
- What approach to use?
```

---

# QUALITY CHECKLIST

Before resuming from checkpoint, verify:

- [ ] Checkpoint was successfully read
- [ ] All required sections are present
- [ ] NEXT ACTION is executable
- [ ] FILES/CONTEXT provides necessary context
- [ ] No assumption of missing context

Before starting fresh, verify:

- [ ] User provided clear task definition
- [ ] Relevant context is specified
- [ ] No hallucination of prior work
- [ ] Task objective is confirmed

---

# REMEMBER

**This skill is an entry point, not the work itself.**

Your job:
1. Load state (checkpoint or fresh)
2. Confirm continuation path
3. Execute immediately

**DO NOT:**
- Over-explain the resume process
- Re-verify completed work
- Ask unnecessary questions
- Delay execution with preamble

**DO:**
- Trust the checkpoint
- Execute NEXT ACTION directly
- Ask ONE question if NEXT ACTION is unclear
- Start work immediately

**Session initialization should take < 10 seconds of user time.**

Be fast, be direct, be ready to work.
