# Prow Job Types and Retry Commands

This document describes how to identify different Prow job types and determine the correct retry command for each.

## Job Types

### 1. Presubmit Jobs (PR Tests)

**Definition:** Tests that run on pull requests when triggered manually or automatically.

**Job Name Format:**
```
pull-ci-{org}-{repo}-{branch}-{test-name}
```

**Example:**
```
pull-ci-openshift-hypershift-release-4.21-e2e-aks
```

**Retry Command:**
```
/test {test-name}
```

**Example Retry:**
```
/test e2e-aks
```

**Identification Pattern:**
- Starts with `pull-ci-`
- Format: `^pull-ci-[^-]+-[^-]+-[^-]+-(.+)$`
- The test name is the last segment after the third hyphen

**YAML Configuration Location:**
```
ci-operator/jobs/{org}/{repo}/{org}-{repo}-{branch}-presubmits.yaml
```

**Key YAML Fields:**
```yaml
name: pull-ci-openshift-hypershift-release-4.21-e2e-aks
rerun_command: /test e2e-aks
trigger: (?m)^/test( | .* )e2e-aks,?($|\s.*)
```

---

### 2. Periodic Jobs (Scheduled Tests)

**Definition:** Tests that run on a schedule (cron) against specific branches, not tied to PRs.

**Job Name Format:**
```
periodic-ci-{org}-{repo}-{branch}-{variant}-{test-name}
```

**Example:**
```
periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3
```

**Retry Command (when rehearsing on a PR):**
```
/pj-rehearse {full-job-name}
```

**Example Retry:**
```
/pj-rehearse periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3
```

**Identification Pattern:**
- Starts with `periodic-ci-`
- Format: `^periodic-ci-`

**YAML Configuration Location:**
```
ci-operator/jobs/{org}/{repo}/{org}-{repo}-{branch}-periodics.yaml
```

**Key YAML Fields:**
```yaml
name: periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3
labels:
  pj-rehearse.openshift.io/can-be-rehearsed: "true"
cron: 0 2 * * *  # or
minimum_interval: 168h  # Weekly
```

**Note:** Only periodic jobs with the label `pj-rehearse.openshift.io/can-be-rehearsed: "true"` can be rehearsed on PRs.

---

### 3. Rehearsal Jobs (Rehearsed Periodics on PRs)

**Definition:** Periodic jobs that are being tested on a PR to the release repository before they run on schedule.

**Job Name Format:**
```
rehearse-{PR-number}-{original-periodic-job-name}
```

**Example:**
```
rehearse-74326-periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3
```

**Retry Command:**
```
/pj-rehearse {original-periodic-job-name}
```

**Example Retry:**
```
/pj-rehearse periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3
```

**⚠️ IMPORTANT:** Do NOT include the `rehearse-{PR}-` prefix in the retry command!

**Identification Pattern:**
- Starts with `rehearse-{digits}-`
- Format: `^rehearse-[0-9]+-(.+)$`
- The original job name is captured in the regex group

**How to Extract Original Job Name:**
```bash
if [[ "$JOB_NAME" =~ ^rehearse-[0-9]+-(.+)$ ]]; then
    original_job="${BASH_REMATCH[1]}"
    echo "$original_job"
    # Output: periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3
fi
```

**Context:**
- Rehearsal jobs only appear on PRs to the `openshift/release` repository
- They test changes to periodic job configurations before merging
- Status check name in PR: `ci/rehearse/{original-job-name}`

---

## Decision Logic for Retry Commands

### Algorithm

```bash
determine_retry_command() {
    local job_name="$1"
    local retry_command

    if [[ "$job_name" =~ ^rehearse-[0-9]+-(.+)$ ]]; then
        # Rehearsal job: extract original periodic name
        local original_job="${BASH_REMATCH[1]}"
        retry_command="/pj-rehearse ${original_job}"

    elif [[ "$job_name" =~ ^periodic-ci- ]]; then
        # Periodic job: use full name
        retry_command="/pj-rehearse ${job_name}"

    elif [[ "$job_name" =~ ^pull-ci-[^-]+-[^-]+-[^-]+-(.+)$ ]]; then
        # Presubmit job: extract test name
        local test_name="${BASH_REMATCH[1]}"
        retry_command="/test ${test_name}"

    else
        # Unknown format: fallback to /test
        retry_command="/test ${job_name}"
    fi

    echo "$retry_command"
}
```

### Examples

| Job Name | Job Type | Retry Command |
|----------|----------|---------------|
| `pull-ci-openshift-hypershift-release-4.21-e2e-aks` | Presubmit | `/test e2e-aks` |
| `periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3` | Periodic | `/pj-rehearse periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3` |
| `rehearse-74326-periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3` | Rehearsal | `/pj-rehearse periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3` |

---

## Finding Job Information

### From Prow URL

Given a URL like:
```
https://prow.ci.openshift.org/view/gs/test-platform-results/pr-logs/pull/openshift_release/74326/rehearse-74326-periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3/2021876530476486656
```

Extract:
- **Bucket path**: `test-platform-results/pr-logs/pull/openshift_release/74326/rehearse-74326-periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3/2021876530476486656`
- **Build ID**: `2021876530476486656` (last 19 digits)
- **Job name**: Available in `prowjob.json` at `gs://{bucket-path}/prowjob.json` under `.spec.job`

### From prowjob.json

Download:
```bash
gcloud storage cp gs://test-platform-results/pr-logs/.../prowjob.json .
```

Extract job name:
```bash
jq -r '.spec.job' prowjob.json
# Output: rehearse-74326-periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3
```

### From PR Status Checks

For rehearsal jobs, the GitHub status check name includes `ci/rehearse/`:
```bash
gh pr view 74326 --repo openshift/release --json statusCheckRollup | \
  jq -r '.statusCheckRollup[] | select(.name | contains("ci/rehearse/")) | .name'
```

Output:
```
ci/rehearse/periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3
```

---

## Common Mistakes

### ❌ WRONG: Using /test for periodic/rehearsal jobs
```
/test periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3
```
This won't work because `/test` is only for presubmit jobs.

### ❌ WRONG: Including rehearse prefix in retry command
```
/pj-rehearse rehearse-74326-periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3
```
This won't work because Prow expects the original periodic job name.

### ❌ WRONG: Using full job name for presubmit /test
```
/test pull-ci-openshift-hypershift-release-4.21-e2e-aks
```
This won't work because `/test` expects just the test name part.

### ✅ CORRECT Examples

**Rehearsal job retry:**
```
/pj-rehearse periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3
```

**Periodic job retry (on release PR):**
```
/pj-rehearse periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3
```

**Presubmit job retry:**
```
/test e2e-aks
```

---

## References

- **Job Definitions**: `/home/kewang/github-go/openshift/release/ci-operator/jobs/`
- **Prow Documentation**: https://docs.prow.k8s.io/
- **OpenShift CI Documentation**: https://docs.ci.openshift.org/
- **Rehearsal Label**: `pj-rehearse.openshift.io/can-be-rehearsed: "true"`
