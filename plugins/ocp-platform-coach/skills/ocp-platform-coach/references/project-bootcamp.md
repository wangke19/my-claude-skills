# Operator Project Bootcamp

Build a real OpenShift controller from scratch — CRD to e2e tests.

## Goal

Deliver a working operator that manages a custom resource on an OpenShift cluster. The operator must be testable, deployable, and resilient to injected failures.

## Steps

### 1. Define the CRD

- Choose a domain problem (e.g., manage a ConfigMap that syncs from an external source)
- Write the CRD YAML with spec and status fields
- Add status conditions: `Available`, `Progressing`, `Degraded`
- Run `make manifests` to generate the CRD from Go types

```go
type MyResourceSpec struct {
    Source string `json:"source"`
}
type MyResourceStatus struct {
    Conditions []metav1.Condition `json:"conditions,omitempty"`
}
```

### 2. Implement the Reconcile Loop

Core pattern:
```go
func (r *MyResourceReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    obj := &v1alpha1.MyResource{}
    if err := r.Get(ctx, req.NamespacedName, obj); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }
    // 1. Read desired state from spec
    // 2. Read actual state from cluster
    // 3. Compute delta
    // 4. Apply changes
    // 5. Update status conditions
    return ctrl.Result{}, nil
}
```

Rules:
- Always idempotent — reconcile N times = same result
- Update status separately from spec reconciliation
- Use `ctrl.Result{RequeueAfter: X}` for polling, not `time.Sleep`

### 3. Add Status Conditions

Use `apimeta.SetStatusCondition` to set conditions. Follow the OCP convention:
- `Available=True` when the resource is healthy
- `Progressing=True` while reconciling
- `Degraded=True` when reconciliation failed

### 4. Write Unit Tests

Use `envtest` for a real API server without a cluster:
```go
var _ = Describe("MyResource controller", func() {
    It("should set Available=True when source is reachable", func() {
        // create resource, wait for condition, assert
    })
    It("should set Degraded=True when source is missing", func() {
        // create resource with bad source, assert degraded
    })
})
```

### 5. Add E2E Tests

- Deploy the operator to a real OCP cluster (or use `oc apply`)
- Create the CR
- Assert conditions reach expected state within a timeout
- Clean up in `AfterEach`

### 6. Deploy to Cluster

```bash
make docker-build docker-push IMG=<registry>/my-operator:latest
make deploy IMG=<registry>/my-operator:latest
oc get pods -n my-operator-system
oc logs -n my-operator-system deploy/my-operator-controller-manager
```

### 7. Inject Failure Scenarios

Test resilience by deliberately breaking things:
- Delete the operand and verify the operator recreates it
- Make the source unavailable and verify `Degraded` condition appears
- Kill the operator pod and verify it recovers without data loss
- Scale to 2 replicas and verify leader election works

Each scenario: inject → observe → verify recovery → document the behavior.
