# Prow CI API Reference

## GCS Bucket Structure

Prow CI stores job artifacts in Google Cloud Storage with this structure:

```
gs://test-platform-results/
└── pr-logs/
    └── pull/
        └── {pr-number}/
            └── {job-name}/
                └── {build-id}/
                    ├── prowjob.json          # Job metadata
                    ├── started.json          # Job start timestamp
                    ├── finished.json         # Job completion status
                    ├── build-log.txt         # Console output
                    └── artifacts/            # Test artifacts
```

### Key Files

#### prowjob.json
Contains job metadata and configuration.

**Key fields:**
```json
{
  "spec": {
    "job": "pull-ci-openshift-origin-main-e2e-aws",
    "type": "presubmit",
    "cluster": "build03",
    "refs": {
      "org": "openshift",
      "repo": "origin",
      "pulls": [{"number": 30585, "sha": "abc123"}]
    }
  },
  "status": {
    "state": "success|failure|aborted|pending",
    "startTime": "2024-01-15T10:00:00Z",
    "completionTime": "2024-01-15T11:30:00Z"
  }
}
```

#### started.json
Indicates job has started executing.

```json
{
  "timestamp": 1705315200,  // Unix timestamp
  "node": "ci-op-abc123",
  "repo-version": "v1.2.3"
}
```

#### finished.json
Indicates job completion with result.

```json
{
  "timestamp": 1705320600,
  "passed": false,
  "result": "SUCCESS|FAILURE|ABORTED",
  "revision": "abc123def456",
  "metadata": {}
}
```

**Result values:**
- `SUCCESS`: Job completed successfully
- `FAILURE`: Job failed (test failure, infra issue, etc.)
- `ABORTED`: Job was cancelled or aborted

## Status Checking Pattern

### Determining Job State

1. **Check for finished.json** - If exists, job is complete
   ```bash
   gcloud storage cat gs://test-platform-results/{path}/finished.json
   ```
   - If successful: Parse `.result` field
   - If 404: Job not finished, continue

2. **Check for started.json** - If exists, job is running
   ```bash
   gcloud storage cat gs://test-platform-results/{path}/started.json
   ```
   - If successful: Job is running
   - If 404: Job hasn't started yet

3. **Neither exists** - Job is queued or doesn't exist

### Polling Best Practices

- **Check interval**: 10 minutes minimum for E2E jobs
- **Timeout**: Set maximum wait time (e.g., 4 hours)
- **Error handling**: Retry GCS API calls 3 times with 30s delay
- **Rate limiting**: Don't check more frequently than every 5 minutes

## Finding New Job IDs After Retry

When a retry is triggered via GitHub comment (e.g., `/test job-name`), a new Prow job is created with a new build ID.

### Using GitHub API

```bash
# Get PR checks
gh pr view {pr-number} --repo {org/repo} --json statusCheckRollup

# Extract job URL from checks
jq '.statusCheckRollup[] |
    select(.name | contains("{job-name}")) |
    .detailsUrl'

# Parse job ID from URL (19-digit number)
grep -oP '\d{19}' | tail -1
```

### Job URL Format

Prow job URLs follow this pattern:
```
https://prow.ci.openshift.org/view/gs/test-platform-results/pr-logs/pull/{pr}/{job-name}/{build-id}
```

The build ID is always a 19-digit number (Twitter Snowflake ID format).

## Common Failure Patterns

### Infrastructure Failures

**Indicators:**
- Node not ready
- Resource constraints (CPU, memory, disk)
- Timeout waiting for resources
- ImagePullBackOff
- Pod scheduling failures
- Network connectivity issues

**Typical messages in build-log.txt:**
```
error: timed out waiting for the condition
error: node "xyz" not ready
error: pod scheduling failed: insufficient memory
error: failed to pull image: connection refused
```

### Code Failures

**Indicators:**
- Test assertion failures
- Compilation errors
- Runtime panics
- Expected vs actual mismatches

**Typical messages in build-log.txt:**
```
FAIL: TestSomething (0.23s)
    expected 200, got 404
panic: runtime error: index out of range
compilation failed: undefined: FunctionName
```

## Exponential Backoff Strategy

When retrying infrastructure failures, use exponential backoff to avoid overwhelming the system:

```
Retry #1: Wait 10 minutes  (base * 2^0)
Retry #2: Wait 20 minutes  (base * 2^1)
Retry #3: Wait 40 minutes  (base * 2^2)
Retry #4: Wait 80 minutes  (base * 2^3)
Retry #5: Wait 160 minutes (base * 2^4)
```

**Total time for 5 retries:** ~310 minutes (~5 hours)

### Why Exponential Backoff?

1. **Resource recovery**: Gives infrastructure time to recover
2. **Cost efficiency**: Avoids rapid retry of expensive operations
3. **Fair scheduling**: Allows other jobs to run
4. **Success probability**: Infrastructure issues often resolve with time

## Integration with GitHub

### Posting Retry Comments

Trigger a new Prow job by posting a comment on the PR:

```bash
gh pr comment {pr-number} --repo {org/repo} --body "/test {job-name}"
```

### Retry Comment Template

```markdown
/test {job-name}

Automatic retry #{count}/{max} triggered by CI monitor.
Previous job failed due to infrastructure issue.
Backoff: {minutes} minutes.
```

### Rate Limits

- **GitHub API**: 5000 requests/hour for authenticated users
- **Check remaining**: `gh api rate_limit`
- **Best practice**: Cache PR data, minimize API calls

## Error Handling

### GCS API Errors

**404 Not Found:**
- File doesn't exist yet (normal for started.json/finished.json)
- Job doesn't exist (invalid bucket path)
- Action: Return appropriate status, don't treat as error

**403 Forbidden:**
- Authentication issue
- Insufficient permissions
- Action: Check `gcloud auth list`, verify bucket access

**500/503 Service Unavailable:**
- Temporary GCS outage
- Action: Retry with exponential backoff (3 attempts)

### GitHub API Errors

**Rate limit exceeded:**
- HTTP 403 with `X-RateLimit-Remaining: 0`
- Action: Wait until `X-RateLimit-Reset` timestamp

**Authentication failed:**
- HTTP 401
- Action: Run `gh auth login`

**Repository not found:**
- HTTP 404
- Action: Verify repo name, check permissions
