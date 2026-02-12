#!/bin/bash

# CI Job Monitor with Exponential Backoff Retry
# Monitors Prow CI jobs and retries on infrastructure failures

set -euo pipefail

# Default configuration
# For long-running tests (4+ hours), use conservative retry strategy:
# - 30 min check interval (sufficient for 4h tests)
# - 2 max retries (total 3 runs = ~15h max)
# - 60 min base backoff (allows infrastructure recovery)
# - 10% jitter (avoid thundering herd)
CHECK_INTERVAL=${CI_MONITOR_CHECK_INTERVAL:-1800}  # 30 minutes
MAX_RETRIES=${CI_MONITOR_MAX_RETRIES:-2}           # 2 retries (3 total runs)
BASE_BACKOFF=${CI_MONITOR_BASE_BACKOFF:-3600}      # 60 minutes
BACKOFF_JITTER=${CI_MONITOR_BACKOFF_JITTER:-10}    # ±10% random jitter
ANALYZE_FAILURES=${CI_MONITOR_ANALYZE_FAILURES:-true}

# Parse command-line arguments
usage() {
    cat <<EOF
Usage: $0 --bucket-path <path> --pr-repo <repo> --pr-number <number> [OPTIONS]

Required:
  --bucket-path PATH     GCS bucket path (e.g., test-platform-results/pr-logs/pull/30585/...)
  --pr-repo REPO         GitHub repository (e.g., openshift/origin)
  --pr-number NUM        Pull request number

Options:
  --fast                 Skip failure analysis
  --no-retry             Disable automatic retries
  --max-retries N        Override max retries (default: 2)
  --quiet                Suppress progress updates
  --help                 Show this help message

Environment Variables:
  CI_MONITOR_CHECK_INTERVAL    Check interval in seconds (default: 1800 = 30min)
  CI_MONITOR_MAX_RETRIES       Maximum retry attempts (default: 2)
  CI_MONITOR_BASE_BACKOFF      Base backoff in seconds (default: 3600 = 60min)
  CI_MONITOR_BACKOFF_JITTER    Backoff jitter percentage (default: 10 = ±10%)
  CI_MONITOR_ANALYZE_FAILURES  Enable failure analysis (default: true)
EOF
    exit 1
}

# Parse arguments
BUCKET_PATH=""
PR_REPO=""
PR_NUMBER=""
FAST_MODE=false
NO_RETRY=false
QUIET=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --bucket-path)
            BUCKET_PATH="$2"
            shift 2
            ;;
        --pr-repo)
            PR_REPO="$2"
            shift 2
            ;;
        --pr-number)
            PR_NUMBER="$2"
            shift 2
            ;;
        --fast)
            FAST_MODE=true
            ANALYZE_FAILURES=false
            shift
            ;;
        --no-retry)
            NO_RETRY=true
            shift
            ;;
        --max-retries)
            MAX_RETRIES="$2"
            shift 2
            ;;
        --quiet)
            QUIET=true
            shift
            ;;
        --help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate required arguments
if [ -z "$BUCKET_PATH" ] || [ -z "$PR_REPO" ] || [ -z "$PR_NUMBER" ]; then
    echo "ERROR: Missing required arguments"
    usage
fi

# Extract build ID from bucket path
BUILD_ID=$(basename "$BUCKET_PATH")

# Setup working directory
WORK_DIR=".work/prow-job-retry/${BUILD_ID}"
mkdir -p "${WORK_DIR}/logs"
mkdir -p "${WORK_DIR}/tmp"

MONITOR_LOG="${WORK_DIR}/logs/monitor.log"
REPORT_FILE="${WORK_DIR}/report.md"

# Initialize monitoring
log() {
    local msg="$1"
    if [ "$QUIET" = false ]; then
        echo "$msg" | tee -a "$MONITOR_LOG"
    else
        echo "$msg" >> "$MONITOR_LOG"
    fi
}

log "==================================================================="
log "CI Job Monitor Started"
log "==================================================================="
log "Build ID: ${BUILD_ID}"
log "PR: https://github.com/${PR_REPO}/pull/${PR_NUMBER}"
log "Start Time: $(date '+%Y-%m-%d %H:%M:%S')"
log "Check Interval: ${CHECK_INTERVAL}s ($(($CHECK_INTERVAL / 60))min)"
log "Max Retries: ${MAX_RETRIES}"
log "Analyze Failures: ${ANALYZE_FAILURES}"
log "==================================================================="
log ""

# State variables
RETRY_COUNT=0
CHECK_ATTEMPT=1

# Download and validate prowjob.json
download_prowjob() {
    local prowjob_url="gs://${BUCKET_PATH}/prowjob.json"
    local prowjob_file="${WORK_DIR}/prowjob.json"

    log "Downloading prowjob.json..."
    if ! gcloud storage cp "$prowjob_url" "$prowjob_file" --no-user-output-enabled 2>/dev/null; then
        log "ERROR: Failed to download prowjob.json"
        return 1
    fi

    if ! jq empty "$prowjob_file" 2>/dev/null; then
        log "ERROR: Invalid prowjob.json format"
        return 1
    fi

    JOB_NAME=$(jq -r '.spec.job' "$prowjob_file")
    log "Job Name: ${JOB_NAME}"
}

# Check job status
check_job_status() {
    # Check for finished.json
    local finished_url="gs://${BUCKET_PATH}/finished.json"
    local finished_json=$(gcloud storage cat "$finished_url" 2>/dev/null || echo "")

    if [ -n "$finished_json" ] && echo "$finished_json" | jq -e . >/dev/null 2>&1; then
        local result=$(echo "$finished_json" | jq -r '.result')
        echo "$result"
        return 0
    fi

    # Check for started.json
    local started_url="gs://${BUCKET_PATH}/started.json"
    local started_json=$(gcloud storage cat "$started_url" 2>/dev/null || echo "")

    if [ -n "$started_json" ] && echo "$started_json" | jq -e . >/dev/null 2>&1; then
        echo "ONGOING"
        return 0
    fi

    echo "UNKNOWN"
    return 1
}

# Analyze failure and classify
analyze_failure() {
    if [ "$ANALYZE_FAILURES" = false ]; then
        log "Skipping failure analysis (fast mode)"
        echo '{"classification": "UNKNOWN", "confidence": "LOW", "reason": "Analysis skipped in fast mode"}'
        return 0
    fi

    log "Analyzing failure..."

    local script_dir="$(dirname "$0")"
    local analysis_output=$("${script_dir}/classify_failure.sh" \
        --bucket-path "${BUCKET_PATH}" \
        --build-id "${BUILD_ID}" \
        --work-dir "${WORK_DIR}" 2>&1 || echo '{"classification": "UNKNOWN", "confidence": "LOW", "reason": "Analysis failed"}')

    # Save analysis
    echo "$analysis_output" > "${WORK_DIR}/tmp/analysis_${RETRY_COUNT}.json"

    echo "$analysis_output"
}

# Trigger retry with exponential backoff
trigger_retry() {
    ((RETRY_COUNT++))

    # Calculate backoff: base_delay * (2 ^ (retry_count - 1))
    local backoff_base=$((BASE_BACKOFF * (2 ** (RETRY_COUNT - 1))))

    # Add random jitter (±BACKOFF_JITTER%)
    # Formula: backoff_base * (1 + random(-jitter%, +jitter%))
    local jitter_range=$((backoff_base * BACKOFF_JITTER / 100))
    local jitter=$((RANDOM % (2 * jitter_range + 1) - jitter_range))
    local backoff_seconds=$((backoff_base + jitter))

    # Ensure non-negative
    if [ $backoff_seconds -lt 0 ]; then
        backoff_seconds=$backoff_base
    fi

    local backoff_minutes=$((backoff_seconds / 60))

    log ""
    log "==================================================================="
    log "🔄 Triggering Retry #${RETRY_COUNT}/${MAX_RETRIES}"
    log "==================================================================="
    log "Base backoff: $((backoff_base / 60)) minutes (exponential: 2^${RETRY_COUNT-1})"
    log "Jitter applied: ${jitter}s (±${BACKOFF_JITTER}%)"
    log "Actual wait: ${backoff_minutes} minutes (${backoff_seconds} seconds)"

    # Determine correct retry command based on job type
    local retry_command
    local test_job_name

    if [[ "$JOB_NAME" =~ ^rehearse-[0-9]+-(.+)$ ]]; then
        # This is a rehearsal job - use /pj-rehearse with original periodic job name
        test_job_name="${BASH_REMATCH[1]}"
        retry_command="/pj-rehearse ${test_job_name}"
    elif [[ "$JOB_NAME" =~ ^periodic-ci- ]]; then
        # This is a periodic job - use /pj-rehearse with full job name
        retry_command="/pj-rehearse ${JOB_NAME}"
    elif [[ "$JOB_NAME" =~ ^pull-ci-[^-]+-[^-]+-[^-]+-(.+)$ ]]; then
        # This is a presubmit job - use /test with just the test name
        test_job_name="${BASH_REMATCH[1]}"
        retry_command="/test ${test_job_name}"
    else
        # Fallback: try /test with full job name
        retry_command="/test ${JOB_NAME}"
    fi

    # Post retry comment to PR
    local retry_comment="${retry_command}

Automatic retry #${RETRY_COUNT}/${MAX_RETRIES} triggered by CI monitor.
Previous job failed due to infrastructure issue.
Backoff: ${backoff_minutes} minutes."

    if gh pr comment "$PR_NUMBER" --repo "$PR_REPO" --body "$retry_comment" 2>/dev/null; then
        log "✅ Retry comment posted to PR"
    else
        log "❌ Failed to post retry comment (continuing anyway)"
    fi

    # Wait for backoff period
    log "⏳ Waiting ${backoff_minutes} minutes before checking for new job..."
    sleep "$backoff_seconds"

    # Try to find new job ID
    log "Searching for new job after retry..."
    local new_job_id=$(find_latest_job_id)

    if [ -n "$new_job_id" ] && [ "$new_job_id" != "$BUILD_ID" ]; then
        log "✓ Found new job ID: ${new_job_id}"
        BUILD_ID="$new_job_id"
        BUCKET_PATH=$(construct_bucket_path "$new_job_id")
        WORK_DIR=".work/prow-job-retry/${BUILD_ID}"
        mkdir -p "${WORK_DIR}/logs" "${WORK_DIR}/tmp"
        MONITOR_LOG="${WORK_DIR}/logs/monitor.log"
        log "Now monitoring new job: ${BUILD_ID}"
    else
        log "⚠️  Could not find new job, will continue monitoring current job"
    fi
}

# Find latest job ID from PR checks
find_latest_job_id() {
    local checks=$(gh pr view "$PR_NUMBER" --repo "$PR_REPO" --json statusCheckRollup 2>/dev/null || echo "")

    if [ -z "$checks" ]; then
        return 1
    fi

    local job_url=$(echo "$checks" | jq -r \
        ".statusCheckRollup[] | select(.name | contains(\"${JOB_NAME}\")) | .detailsUrl" \
        2>/dev/null | head -1)

    if [ -z "$job_url" ] || [ "$job_url" = "null" ]; then
        return 1
    fi

    # Extract 19-digit job ID
    echo "$job_url" | grep -oP '\d{19}' | tail -1
}

# Construct bucket path from job ID
construct_bucket_path() {
    local job_id=$1
    # Extract PR number and construct path
    # This is a simplified version - may need adjustment based on actual URL patterns
    echo "test-platform-results/pr-logs/pull/${PR_NUMBER}/${JOB_NAME}/${job_id}"
}

# Handle failure
handle_failure() {
    local analysis=$(analyze_failure)
    local failure_type=$(echo "$analysis" | jq -r '.classification' 2>/dev/null || echo "UNKNOWN")

    log "Failure Classification: ${failure_type}"

    case "$failure_type" in
        INFRASTRUCTURE)
            if [ "$NO_RETRY" = true ]; then
                log "Infrastructure issue detected but retry disabled (--no-retry)"
                generate_failure_report "$analysis"
                return 1
            fi

            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                trigger_retry
                return 0
            else
                log "❌ Max retries (${MAX_RETRIES}) reached"
                generate_failure_report "$analysis"
                return 1
            fi
            ;;
        CODE)
            log "🐛 Code issue detected, no retry needed"
            generate_failure_report "$analysis"
            return 1
            ;;
        UNKNOWN)
            log "⚠️  Unable to classify failure"
            if [ "$NO_RETRY" = false ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                log "Retrying conservatively due to unknown classification"
                trigger_retry
                return 0
            else
                generate_failure_report "$analysis"
                return 1
            fi
            ;;
    esac
}

# Generate reports
generate_success_report() {
    cat > "$REPORT_FILE" <<EOF
# CI Job Monitoring Report - SUCCESS ✅

## Job Information
- **Build ID**: ${BUILD_ID}
- **Job Name**: ${JOB_NAME}
- **PR**: https://github.com/${PR_REPO}/pull/${PR_NUMBER}
- **Status**: SUCCESS
- **Total Retries**: ${RETRY_COUNT}/${MAX_RETRIES}

## Timeline
\`\`\`
$(cat "$MONITOR_LOG")
\`\`\`

## Summary
The CI job completed successfully after ${RETRY_COUNT} retries.

## Artifacts
- Monitor logs: ${MONITOR_LOG}
- Prowjob data: ${WORK_DIR}/prowjob.json
EOF

    log ""
    log "=========================================="
    cat "$REPORT_FILE"
    log "=========================================="
    log ""
    log "Report saved to: ${REPORT_FILE}"
}

generate_failure_report() {
    local analysis=$1

    cat > "$REPORT_FILE" <<EOF
# CI Job Monitoring Report - FAILURE ❌

## Job Information
- **Build ID**: ${BUILD_ID}
- **Job Name**: ${JOB_NAME}
- **PR**: https://github.com/${PR_REPO}/pull/${PR_NUMBER}
- **Status**: FAILURE
- **Total Retries**: ${RETRY_COUNT}/${MAX_RETRIES}

## Timeline
\`\`\`
$(cat "$MONITOR_LOG")
\`\`\`

## Failure Analysis
\`\`\`json
${analysis}
\`\`\`

## Recommendations
$(generate_recommendations "$analysis")

## Artifacts
- Monitor logs: ${MONITOR_LOG}
- Analysis reports: ${WORK_DIR}/tmp/analysis_*.json
- Prowjob data: ${WORK_DIR}/prowjob.json
EOF

    log ""
    log "=========================================="
    cat "$REPORT_FILE"
    log "=========================================="
    log ""
    log "Report saved to: ${REPORT_FILE}"
}

generate_recommendations() {
    local analysis=$1
    local failure_type=$(echo "$analysis" | jq -r '.classification' 2>/dev/null || echo "UNKNOWN")

    case "$failure_type" in
        INFRASTRUCTURE)
            echo "- Review cluster capacity and node availability"
            echo "- Check for known infrastructure issues in this timeframe"
            echo "- Consider increasing resource requests if pods are evicted"
            ;;
        CODE)
            echo "- Review test failure logs for assertion errors"
            echo "- Fix the code issue before re-running"
            echo "- Consider adding retry logic in the test if appropriate"
            ;;
        *)
            echo "- Review full failure analysis for more details"
            echo "- Manually inspect job artifacts"
            echo "- Consider running /prow-job:analyze-test-failure for deeper analysis"
            ;;
    esac
}

# Main monitoring loop
main() {
    # Download prowjob.json
    if ! download_prowjob; then
        exit 1
    fi

    while true; do
        log "┌────────────────────────────────────────────────────────────┐"
        log "│ Check #${CHECK_ATTEMPT} at $(date '+%Y-%m-%d %H:%M:%S')"
        log "│ Retry Count: ${RETRY_COUNT}/${MAX_RETRIES}"
        log "└────────────────────────────────────────────────────────────┘"

        JOB_STATUS=$(check_job_status)
        log "Status: ${JOB_STATUS}"

        case "$JOB_STATUS" in
            SUCCESS)
                log "✅ Job completed successfully!"
                generate_success_report
                exit 0
                ;;
            ONGOING)
                log "⏳ Job still running, checking again in ${CHECK_INTERVAL}s..."
                ;;
            FAILURE)
                log "❌ Job failed, analyzing..."
                if ! handle_failure; then
                    exit 1
                fi
                ;;
            ABORTED)
                log "⚠️  Job was aborted"
                exit 1
                ;;
            *)
                log "⚠️  Unknown status: ${JOB_STATUS}"
                ;;
        esac

        ((CHECK_ATTEMPT++))
        log ""
        sleep "$CHECK_INTERVAL"
    done
}

main
