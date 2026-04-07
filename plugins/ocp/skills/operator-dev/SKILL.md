---
name: operator-dev
description: >
  Kubernetes/OpenShift operator development protocol — reconciliation logic, idempotency,
  finalizers, status conditions, RBAC, and testing patterns using controller-runtime.
  Use when building or modifying controllers/operators: adding reconcile logic, implementing
  finalizers, updating status conditions, writing unit/E2E tests for controllers, or
  reviewing RBAC for a new operator. Trigger on "add controller", "implement reconciler",
  "operator for X", "controller-runtime", "reconcile loop", or "build operator".
  Do NOT use for CRD schema changes (use ocp:crd-update) or writing E2E tests only (use ocp:e2e-test).
allowed-tools: Bash(*), Read(*), Glob(*), Grep(*), Agent(*)
---

# OCP: Operator Development Protocol

Use this protocol when building or modifying Kubernetes/OpenShift controllers/operators.

## Step 1: Understand Existing Patterns

Before writing code:
- Read similar controllers in `pkg/controller/` or `controllers/`
- Understand the reconciliation logic flow
- Check how Status conditions are used
- Review finalizer patterns if cleanup is needed

## Step 2: Define the Reconciliation Logic

Controllers must be **idempotent** - reconcile can run N times safely.

```go
func (r *MyReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    // 1. Fetch the resource
    obj := &v1.MyResource{}
    if err := r.Get(ctx, req.NamespacedName, obj); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }

    // 2. Handle deletion (finalizers)
    if !obj.DeletionTimestamp.IsZero() {
        return r.handleDeletion(ctx, obj)
    }

    // 3. Add finalizer if needed
    if !controllerutil.ContainsFinalizer(obj, myFinalizer) {
        controllerutil.AddFinalizer(obj, myFinalizer)
        return ctrl.Result{}, r.Update(ctx, obj)
    }

    // 4. Reconcile spec → actual state
    if err := r.reconcileResources(ctx, obj); err != nil {
        return ctrl.Result{}, err
    }

    // 5. Update status (separate from spec changes)
    return ctrl.Result{}, r.updateStatus(ctx, obj)
}
```

## Step 3: Implement Tests

### Unit Tests
- Mock the Kubernetes client
- Test reconcile logic in isolation
- Fast (<1s per test)
- No cluster dependency

```go
func TestReconcile_HappyPath(t *testing.T) {
    client := fake.NewClientBuilder().
        WithScheme(scheme).
        WithObjects(testObj).
        Build()

    r := &MyReconciler{Client: client}

    result, err := r.Reconcile(ctx, req)
    require.NoError(t, err)
    // Assert state...
}
```

### E2E Tests
- Real cluster required
- Full reconciliation workflow
- Test CRD lifecycle: create → update → delete

## Step 4: Update CRDs if API Changed

If you modified types in `api/` or `pkg/apis/`:

```bash
make manifests
git diff config/crd/
```

Commit generated CRD files.

## Step 5: Verify

```bash
make lint && make vet
gofmt -s -w .
make test
make test-e2e        # requires cluster
kubectl get <your-crd> -A
kubectl describe <your-crd>/<instance-name>
```

## Step 6: Check RBAC

Does your controller need new permissions?

- Check `config/rbac/role.yaml`
- Test with limited ServiceAccount:
  ```bash
  kubectl auth can-i --as=system:serviceaccount:<ns>:<sa> <verb> <resource>
  ```

## Idempotency Checklist

Before completing:
- [ ] Can reconcile run multiple times safely?
- [ ] Handles partial failures gracefully?
- [ ] Status reflects **actual state**, not desired state?
- [ ] Finalizers clean up external resources?
- [ ] No race conditions in status updates?

## Common Patterns

- **Status Conditions**: Use `meta.SetStatusCondition()` for observability
- **Predicate Filtering**: Filter watch events to reduce reconcile triggers
- **Leader Election**: Built into controller-manager for HA
- **Rate Limiting**: Configure workqueue for retry backoff
