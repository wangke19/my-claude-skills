# Repository Code Map Template

Use this to orient to any new codebase before reading individual files.

## Purpose

What problem does this repository solve? (1-2 sentences)

## Entry Points

Where does execution begin?

| Entry Point | Purpose |
|-------------|---------|
| `cmd/manager/main.go` | Binary entry, flags, dependency wiring |
| `cmd/operator/main.go` | Operator binary |
| `pkg/operator/` | Core operator logic |

## Key Packages

| Package | Responsibility |
|---------|---------------|
| `api/` | CRD types, deepcopy, defaults |
| `pkg/controller/` | Reconcile loop implementations |
| `pkg/client/` | Generated or wrapped API clients |
| `pkg/operator/` | High-level orchestration |
| `vendor/` | Pinned dependencies |

## Dependency Tree

Draw the package import graph (top-down, most important relationships):

```
cmd/manager
  └── pkg/operator
        ├── pkg/controller/foo
        │     └── api/v1alpha1
        └── pkg/controller/bar
              └── api/v1alpha1
```

## Lifecycle

How does a request/event flow through the system at the highest level?

```
external trigger → entry point → handler → business logic → persistence/API
```

Example for an operator:
```
cluster event → informer → work queue → reconcile() → kube API → status update
```

## Important Interfaces

List the 3-5 most important interfaces in the codebase and what implements them:

| Interface | Location | Key Implementations |
|-----------|----------|---------------------|
| `Reconciler` | `controller-runtime` | `FooReconciler`, `BarReconciler` |
| `Client` | `sigs.k8s.io/controller-runtime/pkg/client` | real client, fake client |
