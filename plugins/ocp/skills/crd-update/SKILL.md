---
name: crd-update
description: >
  Update Kubernetes/OpenShift CRDs and API types safely — kubebuilder validation markers,
  backward compatibility, API versioning, code generation, and migration paths.
  Use when adding/removing/changing fields in CRD types, regenerating manifests, handling
  breaking API changes, or implementing conversion webhooks. Trigger on "add field to CRD",
  "update API types", "make manifests", "kubebuilder marker", "api versioning", or
  "conversion webhook". Do NOT use for reconciler logic changes (use ocp:operator-dev).
allowed-tools: Bash(*), Read(*), Glob(*), Grep(*), Agent(*)
---

# OCP: CRD Update Protocol

Use this when modifying Kubernetes/OpenShift Custom Resource Definitions or API types.

## Step 1: Modify API Types

Edit files in `api/` or `pkg/apis/`:

```go
type MyResourceSpec struct {
    // +kubebuilder:validation:Required
    // +kubebuilder:validation:MinLength=1
    NewField string `json:"newField"`

    // Existing fields...
}
```

### Key Validation Markers

```go
// +kubebuilder:validation:Required
// +kubebuilder:validation:Optional
// +kubebuilder:validation:MinLength=1
// +kubebuilder:validation:Minimum=0
// +kubebuilder:validation:Maximum=100
// +kubebuilder:validation:Enum=foo;bar
// +kubebuilder:default=value
// +kubebuilder:validation:Pattern=`^[a-z0-9]([-a-z0-9]*[a-z0-9])?$`
// +kubebuilder:printcolumn:name="Phase",type=string,JSONPath=`.status.phase`
```

## Step 2: Regenerate CRDs

```bash
make manifests
git diff config/crd/   # review generated changes
```

**CRITICAL**: Always commit the generated files in `config/crd/`.

## Step 3: Update Samples

Update example CRs in `config/samples/` to include the new field.

## Step 4: Handle Backward Compatibility

### Adding Optional Fields — Safe ✅
```go
// +kubebuilder:validation:Optional
NewField string `json:"newField,omitempty"`
```

### Adding Required Fields — Breaking ⚠️
1. Add as optional first
2. Update all existing CRs
3. Make required in next version

### Removing Fields — Breaking ⚠️
```go
// Deprecated: use NewField instead
// +kubebuilder:validation:Optional
OldField string `json:"oldField,omitempty"`
```

## Step 5: API Versioning (Breaking Changes)

For breaking changes, create a new API version:

```bash
kubebuilder create api --group myapi --version v2 --kind MyResource
```

Then implement conversion webhooks between versions.

**Migration path:**
1. **Version N**: Add new optional field, document in release notes
2. **Version N+1**: Make field required with validation
3. **Version N+2**: Remove old deprecated fields

## Step 6: Update Tests

Update unit tests to include new fields; add validation test cases.

## Step 7: Deploy and Verify

```bash
kubectl apply -f config/crd/
kubectl get crd <crd-name> -o yaml | grep -A 10 openAPIV3Schema
kubectl apply -f config/samples/

# Test validation
kubectl apply -f - <<EOF
apiVersion: myapi.example.com/v1
kind: MyResource
metadata:
  name: test-invalid
spec:
  newField: ""   # Should fail if MinLength=1
EOF
```

## CRD Update Checklist

- [ ] API types modified in `api/*/types.go`
- [ ] `make manifests` executed and output reviewed
- [ ] Generated CRD files staged (`config/crd/`)
- [ ] Sample CRs updated (`config/samples/`)
- [ ] Backward compatibility considered
- [ ] Validation markers added
- [ ] Tests updated for new fields
- [ ] CRD applied to test cluster and validated
