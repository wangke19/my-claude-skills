#!/bin/bash

# Classify Prow CI job failures as INFRASTRUCTURE vs CODE issues
# Integrates with /prow-job:analyze-test-failure skill

set -euo pipefail

# Parse arguments
usage() {
    cat <<EOF
Usage: $0 --bucket-path <path> --build-id <id> --work-dir <dir>

Required:
  --bucket-path PATH  GCS bucket path
  --build-id ID       Build/job ID
  --work-dir DIR      Working directory for artifacts

Output:
  JSON object with classification, confidence, and reason
EOF
    exit 1
}

BUCKET_PATH=""
BUILD_ID=""
WORK_DIR=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --bucket-path)
            BUCKET_PATH="$2"
            shift 2
            ;;
        --build-id)
            BUILD_ID="$2"
            shift 2
            ;;
        --work-dir)
            WORK_DIR="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage
            ;;
    esac
done

if [ -z "$BUCKET_PATH" ] || [ -z "$BUILD_ID" ] || [ -z "$WORK_DIR" ]; then
    echo "ERROR: Missing required arguments" >&2
    usage
fi

# Download build-log.txt for basic analysis
BUILD_LOG="${WORK_DIR}/logs/build-log.txt"
mkdir -p "$(dirname "$BUILD_LOG")"

gcloud storage cp "gs://${BUCKET_PATH}/build-log.txt" "$BUILD_LOG" --no-user-output-enabled 2>/dev/null || {
    echo '{"classification": "UNKNOWN", "confidence": "LOW", "reason": "Failed to download build-log.txt"}'
    exit 0
}

# Keywords for infrastructure issues
INFRA_KEYWORDS=(
    "node not ready"
    "node.*not ready"
    "resource.*not available"
    "timeout waiting for"
    "cluster operator degraded"
    "pod scheduling failed"
    "insufficient.*resources"
    "ImagePullBackOff"
    "connection refused"
    "connection reset"
    "dial tcp.*i/o timeout"
    "context deadline exceeded"
    "no.*nodes available"
    "evicted"
    "OOMKilled"
    "disk pressure"
    "memory pressure"
    "network.*unreachable"
    "temporarily unavailable"
    "service unavailable"
)

# Keywords for code issues
CODE_KEYWORDS=(
    "assertion.*failed"
    "expected.*but got"
    "test.*failed"
    "panic:"
    "syntax error"
    "undefined:"
    "cannot find"
    "compilation failed"
    "runtime error"
)

# Basic classification using keyword matching
classify_basic() {
    local infra_count=0
    local code_count=0

    # Check for infrastructure keywords
    for keyword in "${INFRA_KEYWORDS[@]}"; do
        if grep -iE "$keyword" "$BUILD_LOG" >/dev/null 2>&1; then
            ((infra_count++))
        fi
    done

    # Check for code keywords
    for keyword in "${CODE_KEYWORDS[@]}"; do
        if grep -iE "$keyword" "$BUILD_LOG" >/dev/null 2>&1; then
            ((code_count++))
        fi
    done

    # Determine classification based on keyword counts
    if [ $infra_count -gt $code_count ] && [ $infra_count -gt 0 ]; then
        echo "INFRASTRUCTURE"
        echo "MEDIUM"
        echo "Infrastructure keywords found: $infra_count (code keywords: $code_count)"
    elif [ $code_count -gt $infra_count ] && [ $code_count -gt 0 ]; then
        echo "CODE"
        echo "MEDIUM"
        echo "Code issue keywords found: $code_count (infrastructure keywords: $infra_count)"
    elif [ $infra_count -eq 0 ] && [ $code_count -eq 0 ]; then
        echo "UNKNOWN"
        echo "LOW"
        echo "No classification keywords found in build log"
    else
        echo "UNKNOWN"
        echo "LOW"
        echo "Mixed signals: infra=$infra_count, code=$code_count"
    fi
}

# Advanced classification using /prow-job:analyze-test-failure skill
classify_advanced() {
    # Check if Claude CLI is available
    if ! command -v claude &> /dev/null; then
        classify_basic
        return
    fi

    # This is a placeholder for calling the analyze-test-failure skill
    # In practice, this would invoke Claude with the skill
    # For now, fall back to basic classification
    classify_basic
}

# Main classification logic
main() {
    # Try advanced classification first, fall back to basic
    local result=$(classify_advanced)

    # Parse result (classification, confidence, reason on separate lines)
    local classification=$(echo "$result" | sed -n '1p')
    local confidence=$(echo "$result" | sed -n '2p')
    local reason=$(echo "$result" | sed -n '3p')

    # Output JSON
    cat <<EOF
{
  "classification": "${classification}",
  "confidence": "${confidence}",
  "reason": "${reason}",
  "build_id": "${BUILD_ID}",
  "analyzed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
}

main
