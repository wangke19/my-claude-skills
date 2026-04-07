---
name: e2e-test
description: >
  Write E2E tests for Kubernetes/OpenShift controllers using Ginkgo/Gomega against a real cluster.
  Covers full resource lifecycle (create → update → delete), async reconciliation with Eventually(),
  finalizer cleanup, and error scenarios. Use when adding or modifying E2E tests for controllers,
  debugging flaky E2E tests, or setting up a new E2E test suite. Trigger on "write e2e test",
  "add integration test", "test controller on cluster", "ginkgo test", or "eventually assertion".
  Do NOT use for unit tests (use ocp:operator-dev) or OTE-based OpenShift tests.
allowed-tools: Bash(*), Read(*), Glob(*), Grep(*), Agent(*)
---

# OCP: E2E Test Writing Protocol

E2E tests run against a **real cluster** and test the full reconciliation workflow.

## Step 1: Setup Test Environment

```go
import (
    "context"
    "time"

    . "github.com/onsi/ginkgo/v2"
    . "github.com/onsi/gomega"

    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "sigs.k8s.io/controller-runtime/pkg/client"
)

var _ = Describe("MyController E2E", func() {
    var (
        ctx       context.Context
        namespace string
    )

    BeforeEach(func() {
        ctx = context.Background()
        namespace = createTestNamespace()
    })

    AfterEach(func() {
        deleteTestNamespace(namespace)
    })
})
```

## Step 2: Test Resource Lifecycle

### Create → Reconcile → Verify

```go
It("should reconcile MyResource successfully", func() {
    obj := &v1.MyResource{
        ObjectMeta: metav1.ObjectMeta{Name: "test-resource", Namespace: namespace},
        Spec:       v1.MyResourceSpec{Field: "value"},
    }
    Expect(k8sClient.Create(ctx, obj)).To(Succeed())

    Eventually(func() bool {
        if err := k8sClient.Get(ctx, client.ObjectKeyFromObject(obj), obj); err != nil {
            return false
        }
        return meta.IsStatusConditionTrue(obj.Status.Conditions, "Ready")
    }, timeout, interval).Should(BeTrue())

    Expect(obj.Status.Phase).To(Equal("Running"))
})
```

### Update → Reconcile → Verify

```go
Eventually(func() error {
    if err := k8sClient.Get(ctx, key, obj); err != nil {
        return err
    }
    obj.Spec.Field = "new-value"
    return k8sClient.Update(ctx, obj)
}, timeout, interval).Should(Succeed())

Eventually(func() string {
    k8sClient.Get(ctx, key, obj)
    return obj.Status.ObservedField
}, timeout, interval).Should(Equal("new-value"))
```

### Delete → Finalizer Cleanup → Verify

```go
Expect(k8sClient.Delete(ctx, obj)).To(Succeed())

Eventually(func() bool {
    err := k8sClient.Get(ctx, key, obj)
    return apierrors.IsNotFound(err)
}, timeout, interval).Should(BeTrue())
```

## Step 3: Test Error Scenarios

```go
It("should handle invalid spec gracefully", func() {
    obj := &v1.MyResource{
        ObjectMeta: metav1.ObjectMeta{Name: "invalid-resource", Namespace: namespace},
        Spec:       v1.MyResourceSpec{Field: ""},
    }
    Expect(k8sClient.Create(ctx, obj)).To(Succeed())

    Eventually(func() bool {
        k8sClient.Get(ctx, client.ObjectKeyFromObject(obj), obj)
        cond := meta.FindStatusCondition(obj.Status.Conditions, "Ready")
        return cond != nil && cond.Status == metav1.ConditionFalse
    }, timeout, interval).Should(BeTrue())
})
```

## Step 4: Use Eventually for Async Operations

Reconciliation is **asynchronous**. Always use `Eventually()`:

```go
// ✅ Good
Eventually(func() bool {
    k8sClient.Get(ctx, key, obj)
    return obj.Status.Ready
}, timeout, interval).Should(BeTrue())

// ❌ Bad - will flake
k8sClient.Get(ctx, key, obj)
Expect(obj.Status.Ready).To(BeTrue())
```

## Step 5: Run Tests

```bash
kubectl cluster-info        # verify cluster access
make test-e2e               # run full suite
ginkgo -focus "test name" test/e2e/   # single test
kubectl logs -n <ns> -l app=<operator>  # check logs on failure
```

## Common Patterns

```go
const (
    timeout  = 30 * time.Second
    interval = 1 * time.Second
)

func waitForCondition(ctx context.Context, obj client.Object, condType string) {
    Eventually(func() bool {
        k8sClient.Get(ctx, client.ObjectKeyFromObject(obj), obj)
        return meta.IsStatusConditionTrue(obj.Status.Conditions, condType)
    }, timeout, interval).Should(BeTrue())
}
```

## E2E Test Checklist

- [ ] Tests run against real cluster (not mocked client)
- [ ] Uses `Eventually()` for all async checks
- [ ] Tests create → update → delete lifecycle
- [ ] Tests finalizer cleanup
- [ ] Tests error scenarios (invalid specs)
- [ ] Namespaces cleaned up in `AfterEach()`
- [ ] Timeout/interval configured appropriately (30s/1s)
