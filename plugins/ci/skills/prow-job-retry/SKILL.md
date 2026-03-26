---
name: prow-job-retry
description: Automatically retry failed Prow CI jobs with intelligent failure analysis and exponential backoff. Monitors job status, classifies failures (infrastructure vs code), and retries infrastructure failures automatically. Use when users want to monitor Prow jobs, automatically retry failed tests, or handle flaky infrastructure. Triggers on phrases like "retry this prow job", "monitor and retry", "auto-retry failed test", or any mention of automatic Prow job retry with failure analysis.
---

# Prow Job Auto-Retry

Automatically monitor Prow CI job status, analyze failures to distinguish infrastructure vs. code issues, and retry infrastructure failures with intelligent exponential backoff.

**Optimized for long-running tests (2-4 hours):**
- 30-minute check interval
- 2 retries max (3 total runs, ~15h max)
- 60-minute base backoff with ±10% jitter
- Total cost: ~40% lower than naive retry strategies

## Quick Start

**User request example:**
```
Monitor ci job https://prow.ci.openshift.org/view/gs/test-platform-results/pr-logs/pull/30585/pull-ci-openshift-origin-main-okd-scos-images/2021101652626378752 for PR https://github.com/openshift/origin/pull/30585
```

**What happens:**
1. Check job status every 30 minutes (configurable)
2. If SUCCESS → Report and exit
3. If FAILURE → Classify as INFRASTRUCTURE or CODE
   - INFRASTRUCTURE → Retry with exponential backoff + jitter (60min±6min, 120min±12min)
   - CODE → Report to user, no retry
4. Generate comprehensive report

**Default timeline for 4-hour test:**
```
T+0h:    Initial run starts
T+4h:    Fails (infrastructure issue detected)
T+5h:    Retry #1 starts (waited 60min ± 6min)
T+9h:    Retry #1 fails
T+11h:   Retry #2 starts (waited 120min ± 12min)
T+15h:   Complete (max 3 runs, ~15 hours total)
```

## Workflow

### Step 1: Parse User Input

Extract:
- **Prow job URL**: `https://prow.ci.openshift.org/view/gs/test-platform-results/...`
- **PR URL**: `https://github.com/{org}/{repo}/pull/{number}`

```python
import re

prow_pattern = r'https://prow\.ci\.openshift\.org/view/gs/(test-platform-results/.+?)(?:\s|$)'
pr_pattern = r'https://github\.com/([\w-]+/[\w-]+)/pull/(\d+)'

prow_match = re.search(prow_pattern, user_input)
pr_match = re.search(pr_pattern, user_input)

bucket_path = prow_match.group(1)  # e.g., "test-platform-results/pr-logs/pull/30585/..."
repo = pr_match.group(1)            # e.g., "openshift/origin"
pr_number = pr_match.group(2)       # e.g., "30585"
build_id = bucket_path.split('/')[-1]  # Last segment
```

### Step 2: Run Monitoring Script

Execute the `scripts/monitor_job.sh` script with parsed parameters:

```bash
./scripts/monitor_job.sh \
    --bucket-path "{bucket_path}" \
    --pr-repo "{repo}" \
    --pr-number "{pr_number}"
```

**The script handles:**
- Downloading prowjob.json
- Checking job status every 10 minutes
- Failure classification
- Exponential backoff retry
- GitHub PR comment posting
- Report generation

### Step 3: Monitor Progress

The script outputs real-time progress:

```
=================================================================
CI Job Monitor Started
=================================================================
Build ID: 2021101652626378752
PR: https://github.com/openshift/origin/pull/30585
Start Time: 2026-02-10 14:30:00
Check Interval: 600s (10min)
Max Retries: 5
=================================================================

┌────────────────────────────────────────────────────────────┐
│ Check #1 at 2026-02-10 14:30:00
│ Retry Count: 0/5
└────────────────────────────────────────────────────────────┘
Status: ONGOING
⏳ Job still running, checking again in 600s...
```

### Step 4: Review Final Report

When the job completes or max retries reached, a report is generated at `.work/prow-job-retry/{build_id}/report.md`.

**Success report:**
```markdown
# CI Job Monitoring Report - SUCCESS ✅

## Job Information
- Build ID: 2021101652626378752
- Job Name: pull-ci-openshift-origin-main-okd-scos-images
- PR: https://github.com/openshift/origin/pull/30585
- Status: SUCCESS
- Total Retries: 2/5

## Summary
The CI job completed successfully after 2 retries.
```

**Failure report includes:**
- Timeline of all checks
- Failure classification (INFRASTRUCTURE/CODE/UNKNOWN)
- Retry history with backoff times
- Recommendations for next steps
- Paths to all artifacts

## Configuration Options

### Quick Presets (by test duration)

**Short tests (< 30min):** Quick iterations, more retries
```bash
export CI_MONITOR_CHECK_INTERVAL=300      # 5 minutes
export CI_MONITOR_MAX_RETRIES=3           # 3 retries
export CI_MONITOR_BASE_BACKOFF=300        # 5 minutes
export CI_MONITOR_BACKOFF_JITTER=10       # ±10%
```

**Medium tests (30min-2h):** Balanced approach
```bash
export CI_MONITOR_CHECK_INTERVAL=600      # 10 minutes
export CI_MONITOR_MAX_RETRIES=2           # 2 retries
export CI_MONITOR_BASE_BACKOFF=1200       # 20 minutes
export CI_MONITOR_BACKOFF_JITTER=10       # ±10%
```

**Long tests (2-4h):** ⭐ **DEFAULT** - Conservative, cost-effective
```bash
export CI_MONITOR_CHECK_INTERVAL=1800     # 30 minutes
export CI_MONITOR_MAX_RETRIES=2           # 2 retries
export CI_MONITOR_BASE_BACKOFF=3600       # 60 minutes
export CI_MONITOR_BACKOFF_JITTER=10       # ±10%
```

**Super long tests (> 4h):** Minimal retries, long recovery
```bash
export CI_MONITOR_CHECK_INTERVAL=3600     # 60 minutes
export CI_MONITOR_MAX_RETRIES=1           # 1 retry only
export CI_MONITOR_BASE_BACKOFF=7200       # 120 minutes
export CI_MONITOR_BACKOFF_JITTER=15       # ±15%
```

See `references/retry_strategy_presets.md` for detailed analysis and rationale.

### Environment Variables

Full list of configuration options:
```bash
export CI_MONITOR_CHECK_INTERVAL=1800     # Check interval in seconds (default: 1800 = 30min)
export CI_MONITOR_MAX_RETRIES=2           # Max retry attempts (default: 2)
export CI_MONITOR_BASE_BACKOFF=3600       # Base backoff in seconds (default: 3600 = 60min)
export CI_MONITOR_BACKOFF_JITTER=10       # Jitter percentage (default: 10 = ±10%)
export CI_MONITOR_ANALYZE_FAILURES=true   # Enable failure classification (default: true)
```

### Command-line Flags

```bash
# Skip failure analysis (faster, but less intelligent)
./scripts/monitor_job.sh ... --fast

# Disable automatic retries
./scripts/monitor_job.sh ... --no-retry

# Custom retry count
./scripts/monitor_job.sh ... --max-retries 3

# Quiet mode (less output)
./scripts/monitor_job.sh ... --quiet
```

## Failure Classification

The `scripts/classify_failure.sh` script analyzes failures:

### INFRASTRUCTURE Issues (Retry)

**Keywords detected in build-log.txt:**
- "node not ready"
- "resource not available"
- "timeout waiting for"
- "cluster operator degraded"
- "pod scheduling failed"
- "insufficient resources"
- "ImagePullBackOff"
- "connection refused"
- "dial tcp...i/o timeout"
- "context deadline exceeded"

**Action:** Retry with exponential backoff

### CODE Issues (No Retry)

**Keywords detected:**
- "assertion failed"
- "expected...but got"
- "test failed"
- "panic:"
- "syntax error"
- "undefined:"
- "compilation failed"

**Action:** Report to user, manual fix required

### UNKNOWN Issues

**Scenarios:**
- No classification keywords found
- Mixed signals (both infra and code keywords)
- Analysis failed

**Action:** Conservative retry (default behavior)

## Exponential Backoff with Jitter

Retry delays increase exponentially to give infrastructure time to recover, with random jitter to avoid thundering herd:

**Default (long tests, 2-4h):**
```
Retry #1: 60 minutes  ± 6min   (3600s * 2^0 ± 10%)
Retry #2: 120 minutes ± 12min  (3600s * 2^1 ± 10%)

Total: ~15 hours for 3 runs (4h each + backoff)
```

**Short tests (< 30min):**
```
Retry #1: 5 minutes  ± 30s   (300s * 2^0 ± 10%)
Retry #2: 10 minutes ± 1min  (300s * 2^1 ± 10%)
Retry #3: 20 minutes ± 2min  (300s * 2^2 ± 10%)

Total: ~2 hours for 4 runs
```

**Why exponential + jitter?**
- **Exponential**: Infrastructure needs increasing time to fully recover
- **Jitter**: Prevents multiple failed jobs from retrying simultaneously
- **Cost-effective**: Avoids rapid retry of expensive tests
- **Fair**: Reduces resource contention for other jobs in queue
- **Proven**: Industry-standard approach (AWS, Kubernetes, etc.)

## GitHub Integration

### Retry Mechanism

When infrastructure failure detected:

1. **Post comment to PR:**
   ```
   /test {job-name}

   Automatic retry #1/5 triggered by CI monitor.
   Previous job failed due to infrastructure issue.
   Backoff: 10 minutes.
   ```

2. **Wait for backoff period** (10min, 20min, 40min, etc.)

3. **Find new job ID** from PR checks

4. **Switch monitoring** to new job

5. **Continue monitoring** until success or max retries

### Finding New Jobs

After posting retry comment, the script queries GitHub API to find the new job:

```bash
gh pr view {pr-number} --repo {org/repo} --json statusCheckRollup | \
  jq -r '.statusCheckRollup[] |
         select(.name | contains("{job-name}")) |
         .detailsUrl' | \
  grep -oP '\d{19}' | tail -1
```

## Advanced Usage

### Background Monitoring

Run in background and check later:

```bash
nohup ./scripts/monitor_job.sh \
    --bucket-path "..." \
    --pr-repo "..." \
    --pr-number "..." \
    > monitor.log 2>&1 &

# Check progress
tail -f monitor.log

# Or view report
cat .work/prow-job-retry/{build_id}/report.md
```

### Custom Retry Strategy

Adjust backoff for different job types:

```bash
# Aggressive (short backoff for fast tests)
export CI_MONITOR_BASE_BACKOFF=300  # 5 minutes

# Conservative (long backoff for expensive E2E)
export CI_MONITOR_BASE_BACKOFF=1200  # 20 minutes
```

### Fast Mode

Skip failure analysis for quicker monitoring:

```bash
./scripts/monitor_job.sh ... --fast
```

**Trade-off:** Retries all failures (no intelligent classification)

## Troubleshooting

### "Failed to download prowjob.json"

**Cause:** Invalid job URL or GCS access denied

**Solution:**
1. Verify job URL is correct
2. Check: `gcloud auth list`
3. Test access: `gcloud storage cat gs://test-platform-results/.../prowjob.json`

### "Failed to post retry comment"

**Cause:** GitHub authentication or permission issue

**Solution:**
1. Check: `gh auth status`
2. Verify write access to repo
3. Test: `gh pr comment {pr} --repo {repo} --body "test"`

### "New job ID not found"

**Cause:** Job hasn't started yet or GitHub API delay

**Solution:** Normal behavior - script continues monitoring current job and will pick up new job on next check

### Classification returns "UNKNOWN"

**Cause:** No clear keywords in build-log.txt

**Solution:** Script retries conservatively. Review `.work/prow-job-retry/{build_id}/logs/build-log.txt` manually

## Implementation Details

### Scripts

**monitor_job.sh** (Main script)
- Polls job status every 10 minutes
- Calls classify_failure.sh on failures
- Implements exponential backoff
- Posts GitHub PR comments
- Generates final reports

**classify_failure.sh** (Failure analyzer)
- Downloads build-log.txt
- Searches for infrastructure/code keywords
- Returns JSON classification:
  ```json
  {
    "classification": "INFRASTRUCTURE|CODE|UNKNOWN",
    "confidence": "HIGH|MEDIUM|LOW",
    "reason": "Description of why classified this way"
  }
  ```

### References

**prow_api.md** (Detailed reference)
- GCS bucket structure
- prowjob.json format
- Status checking patterns
- GitHub API integration
- Error handling strategies

**job_types_and_commands.md** (Job type identification)
- Presubmit vs Periodic vs Rehearsal jobs
- Correct retry commands for each job type
- Job name pattern matching
- Common mistakes and corrections

Load these references when you need details about:
- Prow job URL formats
- API response structures
- Retry best practices
- Error codes and handling
- How to determine the correct /test or /pj-rehearse command

## Best Practices

1. **Use appropriate retry counts**
   - Critical jobs: 5 retries (default)
   - Non-critical: 2-3 retries
   - Expensive jobs: 3 retries (conservative)

2. **Monitor important jobs only**
   - Long-running E2E tests ✓
   - Flaky infrastructure-dependent tests ✓
   - Fast unit tests ✗ (not needed)

3. **Review failure reports**
   - Always check classification accuracy
   - Look for patterns in retry history
   - Share reports for retrospectives

4. **Tune for your environment**
   - Adjust backoff based on cluster capacity
   - Set appropriate max retries
   - Use --fast for known-stable infrastructure

5. **Check authentication first**
   ```bash
   gcloud auth list  # GCS access
   gh auth status    # GitHub access
   ```

## Common Patterns

### Pattern 1: Monitor with Default Settings

```
User: "monitor ci job https://prow.ci.openshift.org/view/gs/test-platform-results/pr-logs/pull/30585/pull-ci-openshift-origin-main-e2e-aws/123456789 for PR https://github.com/openshift/origin/pull/30585"
```

**Actions:**
1. Parse URLs
2. Run `./scripts/monitor_job.sh` with defaults
3. Check every 10 minutes
4. Retry infrastructure failures up to 5 times
5. Generate report

### Pattern 2: Fast Monitoring (No Analysis)

```
User: "monitor ci job <url> for PR <url>, skip failure analysis"
```

**Actions:**
1. Parse URLs
2. Run with `--fast` flag
3. Retry all failures (no classification)
4. Faster but less intelligent

### Pattern 3: Monitor Without Retry

```
User: "monitor ci job <url> for PR <url>, just notify me when done"
```

**Actions:**
1. Parse URLs
2. Run with `--no-retry` flag
3. Report status changes only
4. No automatic retry

### Pattern 4: Custom Retry Count

```
User: "monitor ci job <url> for PR <url>, retry up to 3 times"
```

**Actions:**
1. Parse URLs
2. Run with `--max-retries 3`
3. Earlier exit on failures

## Output Artifacts

All artifacts stored in `.work/prow-job-retry/{build_id}/`:

```
.work/prow-job-retry/2021101652626378752/
├── prowjob.json                    # Job metadata
├── logs/
│   ├── monitor.log                 # Full monitoring log
│   └── build-log.txt               # Downloaded build log
├── tmp/
│   ├── analysis_0.json             # Initial failure analysis
│   ├── analysis_1.json             # Retry #1 analysis
│   └── analysis_2.json             # Retry #2 analysis
└── report.md                       # Final report (SUCCESS/FAILURE)
```

**Access artifacts:**
```bash
# View monitoring progress
cat .work/prow-job-retry/{build_id}/logs/monitor.log

# Check failure analysis
cat .work/prow-job-retry/{build_id}/tmp/analysis_*.json

# Read final report
cat .work/prow-job-retry/{build_id}/report.md
```
