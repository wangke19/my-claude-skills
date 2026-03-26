# Prow Job Auto-Retry

Intelligent automatic retry system for Prow CI jobs with failure classification and cost-optimized exponential backoff.

## ⚡ Quick Start

```bash
./skills/prow-job-retry/scripts/monitor_job.sh \
    --bucket-path "test-platform-results/pr-logs/pull/org_repo/123/job-name/456" \
    --pr-repo "openshift/release" \
    --pr-number "123"
```

The script will:
1. ✅ Monitor job status every 30 minutes
2. 🔍 Classify failures (infrastructure vs code)
3. 🔄 Auto-retry infrastructure failures (max 2 times)
4. 📊 Generate comprehensive report

## 🎯 Design Goals

**For long-running tests (2-4 hours):**

> Use the fewest high-cost retries to achieve the highest success rate, with a clear total timeout boundary.

- **Cost-optimized**: 2 retries (vs 5) = 40% cost reduction
- **Success rate**: ~97% (vs 99.7% with 5 retries)
- **Total time**: ~15h max (vs ~27h with old defaults)
- **Smart waiting**: 60-120min backoff allows infrastructure recovery

## 📊 Default Configuration

**Optimized for 2-4 hour tests:**

```bash
CHECK_INTERVAL=1800s     # 30 minutes (sufficient for long tests)
MAX_RETRIES=2            # 2 retries = 3 total runs max
BASE_BACKOFF=3600s       # 60 minutes (infrastructure recovery time)
BACKOFF_JITTER=10%       # ±10% random (avoid thundering herd)
```

**Timeline example (4-hour test):**
```
T+0h:    Run 1 starts
T+4h:    Run 1 fails (infrastructure issue)
T+5h:    Run 2 starts (waited 60min ± 6min)
T+9h:    Run 2 fails
T+11h:   Run 3 starts (waited 120min ± 12min)
T+15h:   Complete ✅
```

## 🎛️ Configuration Presets

Choose based on your test duration:

| Test Duration | Check Interval | Retries | Base Backoff | Total Time |
|--------------|----------------|---------|--------------|------------|
| **< 30min** | 5min | 3 | 5min | ~2h |
| **30min-2h** | 10min | 2 | 20min | ~4h |
| **2-4h** ⭐ | 30min | 2 | 60min | ~15h |
| **> 4h** | 60min | 1 | 120min | ~14h |

See [`references/retry_strategy_presets.md`](references/retry_strategy_presets.md) for detailed analysis.

## 🔧 Features

### Intelligent Job Type Detection

Automatically uses the correct retry command:

```bash
# Rehearsal job: rehearse-123-periodic-ci-...
→ /pj-rehearse periodic-ci-...

# Periodic job: periodic-ci-...
→ /pj-rehearse periodic-ci-...

# Presubmit job: pull-ci-org-repo-branch-testname
→ /test testname
```

### Failure Classification

Analyzes build logs to distinguish:

- **INFRASTRUCTURE** → Auto-retry
  - "node not ready", "timeout", "resource not available"
  - Network issues, cluster problems

- **CODE** → Report to user, no retry
  - "assertion failed", "test failed", "panic"
  - Actual bugs that need manual fixing

- **UNKNOWN** → Conservative retry
  - No clear signals, retry to be safe

### Exponential Backoff with Jitter

```
Formula: backoff = BASE * 2^(retry-1) ± JITTER%

Example (60min base, ±10%):
Retry 1: 54-66 minutes   (60 ± 6)
Retry 2: 108-132 minutes (120 ± 12)
```

**Why jitter?** Prevents 10 jobs from failing at T+4h and all retrying exactly at T+5h, causing resource contention.

## 📚 Documentation

- **[SKILL.md](SKILL.md)** - Complete usage guide
- **[retry_strategy_presets.md](references/retry_strategy_presets.md)** - Configuration strategy deep-dive
- **[job_types_and_commands.md](references/job_types_and_commands.md)** - Prow job type reference
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

## 🚀 Usage Examples

### Basic Usage (defaults)

```bash
./scripts/monitor_job.sh \
    --bucket-path "test-platform-results/pr-logs/pull/openshift_release/74326/rehearse-74326-periodic-ci-openshift-hypershift-release-4.21-periodics-e2e-kubevirt-metal-conformance-calico-version-skew-y3/2021876530476486656" \
    --pr-repo "openshift/release" \
    --pr-number "74326"
```

### Short Test (< 30min)

```bash
export CI_MONITOR_CHECK_INTERVAL=300
export CI_MONITOR_MAX_RETRIES=3
export CI_MONITOR_BASE_BACKOFF=300

./scripts/monitor_job.sh ...
```

### Super Long Test (> 4h) - Minimal Retries

```bash
export CI_MONITOR_MAX_RETRIES=1
export CI_MONITOR_BASE_BACKOFF=7200

./scripts/monitor_job.sh ...
```

### No Auto-Retry (monitoring only)

```bash
./scripts/monitor_job.sh ... --no-retry
```

### Override Max Retries

```bash
./scripts/monitor_job.sh ... --max-retries 1
```

## 📈 Cost-Benefit Analysis

Assuming 30% infrastructure failure rate:

| Strategy | Success Rate | Avg Time | Cost Multiplier |
|----------|-------------|----------|-----------------|
| No retry | 70% | 4h | 1.0× |
| 1 retry | 91% | 9h | 2.25× |
| **2 retries** ⭐ | **97.3%** | **15h** | **3.75×** |
| 5 retries | 99.7% | 27h | 6.75× |

**Conclusion:** 2 retries offers the best balance - 97% success at 44% lower cost than 5 retries.

## 🔍 Monitoring & Reports

All artifacts saved to `.work/prow-job-retry/{build-id}/`:

```
.work/prow-job-retry/2021876530476486656/
├── prowjob.json                # Job metadata
├── logs/
│   ├── monitor.log             # Full execution log
│   └── build-log.txt           # Downloaded build log
├── tmp/
│   ├── analysis_0.json         # Initial failure analysis
│   └── analysis_1.json         # Retry analysis
└── report.md                   # Final summary report
```

**View progress:**
```bash
tail -f .work/prow-job-retry/{build-id}/logs/monitor.log
```

**Final report:**
```bash
cat .work/prow-job-retry/{build-id}/report.md
```

## 🛠️ Requirements

- `bash` 4.0+
- `jq` (JSON parsing)
- `gh` CLI (GitHub API)
- `gcloud` CLI (GCS access)
- Prow job access permissions

## 🎓 Advanced Features

### Dynamic Strategy (Future)

Adjust backoff based on failure timing:

- **Early failure** (< 30min): Likely config issue → shorter backoff
- **Late failure** (> 2h): Likely resource exhaustion → longer backoff

### Batch Job Optimization

For multiple similar jobs, stagger retry times:
```bash
export CI_MONITOR_BACKOFF_JITTER=20  # ±20% for large batches
```

## 📝 Contributing

When making changes:
1. Update [`CHANGELOG.md`](CHANGELOG.md)
2. Test with real Prow jobs
3. Document configuration changes
4. Update presets if adding new defaults

## 📄 License

Part of the `my-claude-skills` project.

## 🔗 Related

- [OpenShift CI Documentation](https://docs.ci.openshift.org/)
- [Prow Documentation](https://docs.prow.k8s.io/)
- [openshift/release Repository](https://github.com/openshift/release)
