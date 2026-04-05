---
name: session-checkpoint
description: Create clean task checkpoint and persist to local memory for session continuity
trigger:
  - /session-checkpoint
  - when user says "save checkpoint", "save session state", "create checkpoint"
---

# PURPOSE

You are a coding task memory manager.

**Goal:** Create a clean checkpoint of the current task and persist it locally WITHOUT polluting the git repository.

This skill enables clean session handoffs by distilling complex conversations into high-signal state that can be resumed instantly.

# WHEN TO TRIGGER

Invoke this skill when:
- User explicitly requests `/session-checkpoint`
- User says "save checkpoint", "save session state", "create checkpoint"
- Before long-running operations where state preservation is valuable
- When switching contexts but planning to return to current work
- End of work session before logging off

# EXECUTION PROTOCOL

## STEP 1: Generate Structured Checkpoint

Analyze the **full session context** and extract ONLY high-signal information.

**Critical:** Read recent conversation history, files changed, commands executed, errors encountered, and decisions made.

Output in this **exact format**:

```markdown
# TASK

[One sentence describing the final objective]

# DONE

- [Completed work item 1 - verified]
- [Completed work item 2 - verified]
- [Completed work item 3 - verified]

# DECISIONS

- [Technical decision 1 and reasoning]
- [Technical decision 2 and reasoning]
- [Architecture choice made]

# FAILED

- [Approach 1 that didn't work - why it failed]
- [Approach 2 that was abandoned - root cause]
- [Dead end 3 - what was learned]

# CURRENT BLOCKER

[Current issue blocking progress - be specific]

OR

[No blocker - ready for next action]

# NEXT ACTION

[Single, concrete next step to execute]

# FILES / CONTEXT

## Changed Files
- path/to/file1.go
- path/to/file2.yaml

## Relevant Context
- PR: owner/repo#123
- Branch: feature/xyz
- Issue: JIRA-456
- Logs: /path/to/relevant.log
- Command: `specific command used`

## Key Variables/IDs
- cluster: <cluster-name>
- namespace: <namespace>
- pod: <pod-name>
```

**Quality Criteria:**

✓ **Concise:** Remove duplicated reasoning and verbose explanations
✓ **High-signal:** Include only information needed to resume work
✓ **Actionable:** NEXT ACTION must be immediately executable
✓ **Complete:** Capture all failed attempts to prevent repetition
✓ **Specific:** Use concrete file paths, commands, error messages

❌ **Avoid:**
- Verbose narratives
- Obvious statements
- Abandoned paths without lessons
- Vague next steps
- Missing context for external references

---

## STEP 2: Persist to Local Memory

**CRITICAL:** Save the checkpoint to the local ephemeral AI memory directory.

**Location:**
```
.ai-session/STATE.md
```

**Rules:**

1. **Create directory** `.ai-session/` if it doesn't exist:
   ```bash
   mkdir -p .ai-session
   ```

2. **Write checkpoint** to `.ai-session/STATE.md` using the Write tool

3. **DO NOT modify** any existing project source files

4. **DO NOT place files** outside `.ai-session/`

5. **Add to .gitignore** if not already present:
   ```bash
   grep -q ".ai-session" .gitignore || echo ".ai-session/" >> .gitignore
   ```

**Why `.ai-session/`?**
- Local ephemeral AI memory only
- Won't pollute git history
- Easy to clean up (`rm -rf .ai-session`)
- Clearly separated from project code

---

## STEP 3: Output Restart Instruction

After successfully saving, print **exactly**:

```
=== CHECKPOINT SAVED ===

Location: .ai-session/STATE.md

To continue in a clean session, run:

  claude "Read .ai-session/STATE.md and continue from NEXT ACTION only. Ignore anything not in the file."

Or use:

  /session-init

To view checkpoint:

  cat .ai-session/STATE.md
```

---

# ADDITIONAL FEATURES

## Timestamp Tracking

Optionally add a timestamp header to STATE.md:

```markdown
---
checkpoint_time: 2026-04-01T12:34:56Z
session_duration: 45m
---
```

## Checkpoint History

If `.ai-session/STATE.md` already exists, **backup the old version**:

```bash
if [ -f .ai-session/STATE.md ]; then
  cp .ai-session/STATE.md .ai-session/STATE.backup.md
fi
```

## Auto-checkpoint Hint

After saving, suggest to the user:

> **Tip:** Consider creating a hook to auto-checkpoint before long operations:
>
> ```json
> {
>   "hooks": {
>     "before_git_push": "claude /session-checkpoint"
>   }
> }
> ```

---

# COMPANION SKILL: Resume Checkpoint

When the user wants to resume from a checkpoint, they can use:

```
/session-init
```

Which should:
1. Read `.ai-session/STATE.md`
2. Display the checkpoint summary
3. Execute the NEXT ACTION without re-explaining context

---

# EXAMPLES

## Example 1: Kubernetes Debugging Session

**Checkpoint saved to `.ai-session/STATE.md`:**

```markdown
# TASK

Debug pod crash loop in namespace openshift-ovn-kubernetes

# DONE

- Identified crashlooping pod: ovnkube-node-abc123
- Extracted logs showing "certificate has expired"
- Verified service account exists and RBAC is correct
- Confirmed issue is token expiration, not permissions

# DECISIONS

- Use projected token volumes (K8s 1.20+) instead of legacy service account token
- Update DaemonSet to mount token with 1h expiration and auto-rotation
- No manual pod deletion needed - DaemonSet will handle rollout

# FAILED

- Tried deleting pod manually - didn't fix root cause, pod recreated with same issue
- Attempted RBAC fix - not the problem, token expiration is the issue
- Checked API server connectivity - not a network issue

# CURRENT BLOCKER

No blocker - ready to implement fix

# NEXT ACTION

Edit DaemonSet manifest to add projected service account token volume with 1h TTL

# FILES / CONTEXT

## Changed Files
- None yet

## Relevant Context
- Namespace: openshift-ovn-kubernetes
- Pod: ovnkube-node-abc123
- DaemonSet: ovnkube-node
- Error: "Unable to authenticate the request" (401)
- Logs: /tmp/ovnkube-node.log

## Key Variables/IDs
- cluster: <cluster-name>
- sa: ovnkube-node
```

**Resume command:**
```bash
claude "Read .ai-session/STATE.md and continue from NEXT ACTION only."
```

---

## Example 2: Go Module Dependency Issue

**Checkpoint saved to `.ai-session/STATE.md`:**

```markdown
# TASK

Remove unused Go dependency github.com/unused/package from vendor

# DONE

- Verified package appears unused via `go mod why` (returns "main module does not need package")
- Ran `make build` - build SUCCEEDS despite go mod why claim
- Grepped vendor/ - package IS present in vendor/github.com/transitive/dep/

# DECISIONS

- Never trust `go mod why` alone for vendored dependencies
- Always verify removal with actual build
- Use `go mod graph | grep package` for transitive dependency check

# FAILED

- Removed from go.mod and ran `go mod tidy` - build FAILED
- `go mod why` gave false negative - package IS needed transitively

# CURRENT BLOCKER

Cannot safely remove dependency - it's a transitive dependency required by vendor/github.com/transitive/dep/

# NEXT ACTION

Document this false positive pattern and close the issue - dependency is actually required

# FILES / CONTEXT

## Changed Files
- None (reverted changes)

## Relevant Context
- Package: github.com/unused/package
- False positive: `go mod why` returned "(main module does not need package)"
- Actual usage: vendor/github.com/transitive/dep/ imports it
- Build command: `make build`
```

---

# QUALITY CHECKLIST

Before saving, verify:

- [ ] TASK is one clear sentence
- [ ] DONE items are verified completions, not attempts
- [ ] DECISIONS capture technical choices with rationale
- [ ] FAILED includes all dead ends with lessons
- [ ] CURRENT BLOCKER is specific or explicitly "none"
- [ ] NEXT ACTION is immediately executable
- [ ] FILES lists all relevant paths and context
- [ ] No verbose explanations or narratives
- [ ] High signal-to-noise ratio
- [ ] Someone could resume from this with zero prior context

---

# INTEGRATION WITH OTHER SKILLS

**Relationship to `/session-postmortem`:**
- `/session-checkpoint` = mid-task state preservation
- `/session-postmortem` = completed task knowledge extraction

**Workflow:**
1. During work: `/session-checkpoint` to save state
2. After completion: `/session-postmortem` to extract patterns
3. Resume later: `/session-init` to continue

**When to use which:**
- Use `/session-checkpoint` when pausing work (lunch, end of day, context switch)
- Use `/session-postmortem` when task is complete and you want to capture learnings

---

# REMEMBER

**This is NOT:**
- A git commit message
- A task summary for management
- A detailed explanation of what was done

**This IS:**
- A clean handoff document
- A resume point for future sessions
- A high-signal state snapshot
- A continuation enabler

Keep it **concise, concrete, and continuation-ready**.
