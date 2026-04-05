# Hands-on Lab Playbook

Each lab includes: objective, prerequisites, commands, expected output, and what to do if it goes wrong.

---

## Lab 1: Trace an API Request End-to-End

**Objective:** Understand what happens between `kubectl apply` and a resource appearing in etcd.

**Steps:**
1. Enable API server audit logging or use `--v=9` on kubectl
2. Apply a simple ConfigMap: `kubectl apply -f configmap.yaml`
3. In audit logs, find: authentication → authorization → admission webhooks → validation → storage
4. Use `etcdctl get` to verify the object is stored

**What to observe:** Which admission webhooks fired, what the final stored JSON looks like, any mutations applied.

---

## Lab 2: Debug a Degraded Cluster Operator

**Objective:** Diagnose and resolve a degraded operator condition.

**Steps:**
1. `oc get co` — find an operator not in `Available=True, Progressing=False, Degraded=False`
2. `oc describe co <name>` — read the condition message
3. `oc logs -n openshift-<operator> deploy/<operator>` — find the error
4. Trace from the error message to the reconcile loop in the source code
5. Apply a fix or document the root cause

**Common causes:** missing secret, webhook misconfiguration, node resource pressure, version skew.

---

## Lab 3: Rotate Expired Certificates

**Objective:** Manually rotate a certificate and verify the component recovers.

**Steps:**
1. Identify the expired cert: `oc get secret -n openshift-kube-apiserver-operator`
2. Check expiry: `oc get secret <name> -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -dates`
3. Force rotation: annotate or delete the managed secret to trigger operator reconciliation
4. Watch operator status: `oc get co kube-apiserver -w`
5. Verify new cert: repeat the expiry check

---

## Lab 4: Investigate an RBAC Deny

**Objective:** Find why a ServiceAccount is being denied access to a resource.

**Steps:**
1. Reproduce the deny: `oc auth can-i <verb> <resource> --as=system:serviceaccount:<ns>:<sa>`
2. List what the SA has: `oc get rolebindings,clusterrolebindings -A | grep <sa>`
3. Check what's needed: read the operator log for the `forbidden` error, extract the required verb/resource/group
4. Add the missing RBAC rule and verify: repeat step 1

---

## Lab 5: Trace a HyperShift Hosted Cluster Failure

**Objective:** Debug a HostedCluster that won't reach `Available` state.

**Steps:**
1. `oc get hostedcluster -n <ns>` — check conditions
2. `oc describe hostedcluster <name>` — read condition messages
3. Check control plane pods in the management cluster: `oc get pods -n <hosted-ns>`
4. Look at control plane operator logs: `oc logs -n <hosted-ns> deploy/control-plane-operator`
5. Trace the failing reconcile loop
