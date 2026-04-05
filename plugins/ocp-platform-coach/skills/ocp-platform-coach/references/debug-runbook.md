# Platform Debug Runbook

## Universal Debug Workflow

```
1. Identify symptom
   ↓
2. Collect status and conditions
   ↓
3. Collect relevant logs
   ↓
4. Trace the component path
   ↓
5. Isolate root cause
   ↓
6. Apply fix
   ↓
7. Validate recovery
```

---

## Incident Types

### Degraded Cluster Operator

**Symptoms:** `oc get co` shows `Degraded=True` or `Available=False`

**Collect:**
```bash
oc get co <name>
oc describe co <name>          # read condition message carefully
oc logs -n openshift-<operator> deploy/<operator> --tail=100
oc get events -n openshift-<operator> --sort-by='.lastTimestamp'
```

**Common causes:** misconfigured operand, missing dependency, node pressure, version mismatch

---

### Certificate Expiry

**Symptoms:** TLS handshake errors, authentication failures, component restarts

**Collect:**
```bash
# Find all certs expiring soon
oc get secret -A -o json | jq -r '
  .items[] | select(.type == "kubernetes.io/tls") |
  "\(.metadata.namespace)/\(.metadata.name)"
' | while read s; do
  ns=$(echo $s | cut -d/ -f1)
  name=$(echo $s | cut -d/ -f2)
  oc get secret -n $ns $name -o jsonpath='{.data.tls\.crt}' | \
    base64 -d | openssl x509 -noout -enddate 2>/dev/null | \
    grep -v "^$" | sed "s/^/$s /"
done
```

**Fix:** Force operator to rotate by deleting managed secret or annotating it for refresh.

---

### Auth / Token Issues

**Symptoms:** `401 Unauthorized`, `403 Forbidden`, pod can't call API

**Collect:**
```bash
oc auth can-i <verb> <resource> --as=system:serviceaccount:<ns>:<sa>
oc get rolebindings,clusterrolebindings -A -o json | \
  jq -r '.items[] | select(.subjects[]?.name == "<sa>")'
```

**Fix:** Add missing Role/ClusterRole binding; check token projection in pod spec.

---

### Route Inaccessible

**Symptoms:** `503 Service Unavailable` or `connection refused` on OCP Route

**Collect:**
```bash
oc get route <name> -n <ns>
oc get endpoints <service> -n <ns>    # are pods registered?
oc get pods -n <ns> -l <selector>     # are pods Running/Ready?
oc logs -n openshift-ingress deploy/router-default --tail=50
```

**Common causes:** no ready endpoints, wrong service selector, TLS misconfiguration, ingress controller issue.

---

### Pod CrashLoopBackOff

**Symptoms:** Pod restarts repeatedly, `CrashLoopBackOff` status

**Collect:**
```bash
oc describe pod <pod> -n <ns>          # check events and exit code
oc logs <pod> -n <ns> --previous       # logs from crashed container
oc get pod <pod> -n <ns> -o yaml       # check resource limits, probes
```

**Exit code clues:** 1=application error, 137=OOM killed, 139=segfault, 143=SIGTERM.

---

### HyperShift Hosted Cluster Not Available

**Symptoms:** `HostedCluster` condition `Available=False`

**Collect:**
```bash
oc get hostedcluster <name> -n <ns> -o yaml | yq '.status.conditions'
oc get pods -n <hosted-control-plane-ns>
oc logs -n <hosted-control-plane-ns> deploy/control-plane-operator
oc logs -n <hosted-control-plane-ns> deploy/kube-apiserver
```
