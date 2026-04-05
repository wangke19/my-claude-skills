# Platform Engineering Learning Roadmap

## Stage 1: Kubernetes Foundations

- Pod, Deployment, ReplicaSet, Service, ConfigMap, Secret
- RBAC: Role, ClusterRole, ServiceAccount, token projection
- etcd: what it stores, how it's accessed, why it matters
- Basic `kubectl` workflows: get, describe, logs, exec, port-forward

**Goal:** Comfortable running workloads and diagnosing basic failures on any K8s cluster.

## Stage 2: Control Plane Internals

- kube-apiserver: admission chain, validation webhooks, request lifecycle
- kube-scheduler: predicates, priorities, binding
- kube-controller-manager: what controllers run, reconcile loop pattern
- etcd watch mechanism: how controllers get notified of changes

**Goal:** Understand why a pod gets scheduled (or doesn't), and what happens between `kubectl apply` and a running pod.

## Stage 3: OpenShift Internals

- openshift-apiserver and oauth-apiserver: what they add over upstream K8s
- kube-apiserver-operator: how OCP manages its own API server
- Cluster Operators: what they are, how `ClusterOperatorStatus` works
- OCP-specific objects: Route, BuildConfig, ImageStream, OAuth
- Machine API: MachineSet, Machine, Node lifecycle
- CVO (Cluster Version Operator): how upgrades are orchestrated

**Goal:** Navigate an OCP cluster's control plane, understand operator-managed components, diagnose degraded operators.

## Stage 4: HyperShift

- Hosted control plane architecture: management cluster vs guest cluster
- HostedCluster and NodePool CRDs
- Control Plane Operator: what it reconciles
- How etcd, kube-apiserver, and other control plane components run as pods in the management cluster
- Networking: how guest cluster API traffic reaches hosted control plane
- HyperShift vs standalone OCP: operational differences

**Goal:** Understand why HyperShift exists, how to deploy and debug a hosted cluster, what changes in the operator model.

## Stage 5: Source Code Mastery

- Reading the reconciliation path in a real operator (e.g., kube-apiserver-operator)
- Understanding operator-lib and controller-runtime patterns
- Reading e2e tests to understand expected behavior
- Contributing a fix: find the right file, understand the invariants, write the test

**Goal:** Confidently read and contribute to openshift/kubernetes, openshift/hypershift, or any operator codebase.
