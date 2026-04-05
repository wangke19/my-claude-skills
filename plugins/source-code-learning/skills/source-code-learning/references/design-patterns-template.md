# Design Pattern Notes Template

Use to extract and document reusable patterns found in a codebase.

## Pattern Entry Format

---

### Pattern Name

**Type:** controller / observer / builder / adapter / factory / strategy / etc.

**Where Used:**
- File: `pkg/controller/foo.go`
- Function: `Reconcile()`
- Lines: ~45-120

**What It Does:**
Brief description of the pattern in this specific context.

**Why It Was Chosen:**
What design tradeoff does this solve? What alternative would have been worse?

**Code Example:**
```go
// Minimal excerpt showing the pattern
func (r *FooReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    // pattern implementation
}
```

**Reusable Lesson:**
How to apply this pattern in a new project. What to watch out for.

---

## Common Patterns in K8s/OCP Codebases

### Controller Pattern (Reconcile Loop)

Every operator follows this structure:
1. Get the object
2. Check if it's being deleted (handle finalizer)
3. Read desired state from spec
4. Read actual state from cluster
5. Compute delta
6. Apply changes
7. Update status conditions

**Key invariant:** Must be idempotent — running N times produces the same result.

### Observer Pattern (Informer/Watch)

```
API server watch → informer cache → event handler → work queue → reconcile
```

The work queue decouples event arrival from processing rate, enables deduplication, and adds backoff.

### Builder Pattern (Option Functions)

Common for configuring complex objects without constructor explosion:
```go
type Option func(*Config)
func WithTimeout(d time.Duration) Option { return func(c *Config) { c.Timeout = d } }
func NewClient(opts ...Option) *Client { ... }
```

### Adapter Pattern (Client Wrappers)

Wrapping a generated client to add retry, logging, or metrics:
```go
type RetryingClient struct {
    delegate client.Client
    maxRetries int
}
func (c *RetryingClient) Get(ctx context.Context, key types.NamespacedName, obj client.Object) error {
    // retry logic wrapping c.delegate.Get(...)
}
```
