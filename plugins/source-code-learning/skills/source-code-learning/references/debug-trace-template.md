# Debug Trace Template

Use when investigating a bug, test failure, or incident by reading source code.

## Symptom

What was observed? Be precise:
- Error message (verbatim)
- Degraded condition message
- Failing test name and assertion
- Unexpected behavior description

## Log Location

Where are the relevant logs?

```bash
# Operator logs
oc logs -n <ns> deploy/<operator> --tail=100

# API server audit logs
oc adm node-logs --role=master --path=kube-apiserver/audit.log | grep <resource>

# Test output
go test ./pkg/controller/... -v -run TestFoo 2>&1 | grep -A10 "FAIL\|Error"
```

## Suspected Code Path

Based on the symptom, which code path is likely involved?

1. Start from the error message — search for the string in the repo: `grep -r "error message text" .`
2. Find the function that emits it
3. Work backwards: what calls that function? What state leads to this branch?

## Root Cause

Precise failure point:

| Field | Value |
|-------|-------|
| File | `pkg/controller/foo.go` |
| Line | ~87 |
| Function | `syncFoo()` |
| Condition | `obj.Spec.Source == ""` |
| Effect | Returns error without setting status |

Explain WHY this is wrong, not just where it is.

## Fix

Minimal change recommendation:

```go
// Before
if obj.Spec.Source == "" {
    return fmt.Errorf("source is required")
}

// After
if obj.Spec.Source == "" {
    apimeta.SetStatusCondition(&obj.Status.Conditions, metav1.Condition{
        Type:    "Degraded",
        Status:  metav1.ConditionTrue,
        Reason:  "InvalidSpec",
        Message: "spec.source is required",
    })
    return r.Status().Update(ctx, obj)
}
```

## Regression Risk

- Which tests cover this code path?
- What other callers of this function exist?
- Does this change affect the happy path?
- What new test should be added to prevent regression?
