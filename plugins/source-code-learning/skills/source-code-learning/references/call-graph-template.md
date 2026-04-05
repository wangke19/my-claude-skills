# Call Graph Walkthrough Template

Use this to trace a concrete execution path through a codebase.

## Start Point

What triggers this execution?
- User action: `kubectl apply`, `oc create`, API call
- Event: object created/updated/deleted, timer, signal
- Test: what the test calls to start the flow

## Trace Path

Walk each step: file → function → what it does → what it calls next.

| Step | File | Function | What Happens |
|------|------|----------|-------------|
| 1 | `cmd/manager/main.go` | `main()` | Parse flags, init manager |
| 2 | `pkg/controller/foo.go` | `Reconcile()` | Triggered by informer event |
| 3 | `pkg/controller/foo.go` | `syncFoo()` | Fetch current state |
| 4 | `pkg/client/bar.go` | `Get()` | API call to kube-apiserver |
| 5 | `pkg/controller/foo.go` | `updateStatus()` | Write status conditions |

## Important Files

Key files touched by this flow:

- `pkg/controller/foo.go` — main reconcile logic
- `api/v1alpha1/foo_types.go` — the type being reconciled
- `pkg/client/` — how API calls are made

## Critical Conditions

Where does this path branch based on errors or state?

| Condition | Code Location | Behavior |
|-----------|--------------|---------|
| Object not found | `reconcile()` L42 | Return nil (already deleted) |
| API call fails | `syncFoo()` L87 | Requeue with backoff |
| Validation fails | `validate()` L120 | Set Degraded condition, don't requeue |

## Error Handling

- Which errors trigger a requeue?
- Which errors are permanent (don't requeue)?
- Is there exponential backoff? Where is it configured?
- Are errors wrapped with context? (check `fmt.Errorf("...: %w", err)`)
