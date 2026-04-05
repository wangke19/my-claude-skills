# Debug Lab Template

Use this structure to teach through deliberate failure scenarios.

## Scenario

Describe a realistic situation where something is broken. Set the scene:
- What the learner was trying to do
- What environment they're in

## Symptoms

Present exactly what the learner would see:
- Error messages (verbatim)
- Unexpected output or behavior
- Logs that seem relevant (and some that are red herrings)

Do NOT reveal the cause yet. Ask the learner to diagnose first.

## Root Cause

After the learner attempts diagnosis, reveal:
- What actually went wrong
- Why this specific failure mode occurs
- Why it can be easy to miss

## Fix Steps

Walk through the repair:

1. **Identify** — confirm the hypothesis with a targeted check
2. **Isolate** — narrow the problem to the smallest possible scope
3. **Repair** — make the minimal change to fix it
4. **Validate** — verify the fix works and nothing else broke

## Lessons Learned

Summarize the generalizable principle:
- The pattern that caused this failure
- How to recognize it early in future
- Any tooling or practices that prevent it
