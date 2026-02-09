---
name: work-report
description: Generate daily, weekly, quarterly, or yearly work reports by orchestrating Jira and GitHub MCP servers to fetch data and format it into multiple report formats (Markdown, brief text, CherryTree). Automatically aggregates PRs, issues, and activities across specified time periods.
---

# Work Report Generator Skill

## Overview

Automatically generate comprehensive work reports by fetching data from Jira and GitHub MCP servers, then formatting into multiple output formats. Supports daily, weekly, quarterly, and yearly reports with intelligent date range handling.

## When to Use

Use this skill when:
- User asks to generate a work report or daily standup
- Need to summarize work activities across time periods
- Want to track Jira issues and GitHub PRs in one report
- Creating regular status updates or retrospectives
- Generating quarterly or yearly summaries

Don't use when:
- User wants only Jira data (use Jira MCP directly)
- User wants only GitHub data (use GitHub MCP directly)
- Custom report format needed (better to manually orchestrate)

## Prerequisites

**Required MCP Servers:**
1. `mcp__jira__jira_search` - Jira issue search
2. `mcp__github__search_pull_requests` - GitHub PR search
3. `mcp__work-report-generator__generate_daily_report` - Report formatting

**Configuration:**
- Jira credentials configured in Jira MCP server
- GitHub authentication configured in GitHub MCP server
- Work report generator MCP server running

## Core Pattern

### Report Types and Date Ranges

| Report Type | Date Range | Jira Query | GitHub Query |
|------------|------------|------------|--------------|
| **daily** | Today only | `updated >= YYYY-MM-DD` | `updated:>=YYYY-MM-DD` |
| **weekly** | Last 7 days | `updated >= -7d` | `updated:>=YYYY-MM-DD` |
| **quarterly** | Last 90 days | `updated >= -90d` | `updated:>=YYYY-MM-DD` |
| **yearly** | Last 365 days | `updated >= -365d` | `updated:>=YYYY-MM-DD` |

### Workflow

```
1. Determine report type and date range
   ↓
2. Fetch Jira issues (mcp__jira__jira_search)
   ↓
3. Fetch GitHub PRs (mcp__github__search_pull_requests)
   ↓
4. Transform data to report format
   ↓
5. Call work-report-generator MCP server
   ↓
6. Report success with file paths
```

## Implementation

### Step 1: Parse User Request and Get User Information from Environment

```python
# Determine report type from user input
report_type = "daily"  # default

if "weekly" in user_request or "week" in user_request:
    report_type = "weekly"
elif "quarterly" in user_request or "quarter" in user_request:
    report_type = "quarterly"
elif "yearly" in user_request or "year" in user_request:
    report_type = "yearly"

# Get user information from environment variables
# JENKINS_USER_ID - Used for Jira username (e.g., "kewang")
# GITHUB_USER_ID - Used for GitHub username (e.g., "wangke19")
jira_username = os.environ.get("JENKINS_USER_ID", "currentUser()")
github_username = os.environ.get("GITHUB_USER_ID", "@me")

# Note: If environment variables are not set, fallback to:
# - "currentUser()" for Jira (uses authenticated user)
# - "@me" for GitHub (uses authenticated user)
```

### Step 2: Calculate Date Range

```python
from datetime import datetime, timedelta

today = datetime.now()
report_date = today.strftime("%Y-%m-%d")

# Calculate start date based on report type
# IMPORTANT: Include QA Contact field in Jira query to capture issues you're testing
if report_type == "daily":
    start_date = report_date
    jira_jql = f"updated >= '{report_date}' AND (assignee = {jira_username} OR reporter = {jira_username} OR 'QA Contact' = {jira_username})"
    github_query = f"involves:{github_username} updated:>={report_date}"

elif report_type == "weekly":
    start_date = (today - timedelta(days=7)).strftime("%Y-%m-%d")
    jira_jql = f"updated >= -7d AND (assignee = {jira_username} OR reporter = {jira_username} OR 'QA Contact' = {jira_username})"
    github_query = f"involves:{github_username} updated:>={start_date}"

elif report_type == "quarterly":
    start_date = (today - timedelta(days=90)).strftime("%Y-%m-%d")
    jira_jql = f"updated >= -90d AND (assignee = {jira_username} OR reporter = {jira_username} OR 'QA Contact' = {jira_username})"
    github_query = f"involves:{github_username} updated:>={start_date}"

elif report_type == "yearly":
    start_date = (today - timedelta(days=365)).strftime("%Y-%m-%d")
    jira_jql = f"updated >= -365d AND (assignee = {jira_username} OR reporter = {jira_username} OR 'QA Contact' = {jira_username})"
    github_query = f"involves:{github_username} updated:>={start_date}"
```

### Step 3: Fetch Jira Data

**IMPORTANT:** Filter by assignee, reporter, AND QA Contact to capture all work!

**Get Jira username from environment:**
```javascript
// JENKINS_USER_ID is the standard environment variable for Jira username
const jiraUsername = process.env.JENKINS_USER_ID || "currentUser()";
const githubUsername = process.env.GITHUB_USER_ID || "@me";
```

**Call Jira MCP server:**

```javascript
// Use ToolSearch to load Jira MCP tool if not already loaded
await ToolSearch({ query: "select:mcp__jira__jira_search" });

// IMPORTANT: Include assignee, reporter, AND QA Contact in JQL query
// This captures: assigned issues, reported issues, and QA testing work
const jql = jira_jql;  // Already includes the complete filter from Step 2

// Fetch Jira issues
const jiraResult = await mcp__jira__jira_search({
    jql: jql,
    fields: "key,summary,status,updated,assignee,issuetype,priority",
    limit: 50
});
```

**Transform Jira response:**

```javascript
const jiraIssues = jiraResult.issues.map(issue => ({
    key: issue.key,
    summary: issue.summary,
    status: issue.status?.name || "Unknown",
    updated: issue.updated,
    assignee: issue.assignee?.display_name || "Unassigned",
    priority: issue.priority?.name || "Undefined"
}));

const jiraData = { issues: jiraIssues };
```

### Step 4: Fetch GitHub Data

**Call GitHub MCP server:**

```javascript
// Use ToolSearch to load GitHub MCP tool if not already loaded
await ToolSearch({ query: "select:mcp__github__search_pull_requests" });

// Fetch GitHub PRs using the query built in Step 2
// Query uses "involves:{username}" to capture PRs you authored, reviewed, or were mentioned in
const githubResult = await mcp__github__search_pull_requests({
    query: github_query,  // e.g., "involves:wangke19 updated:>=2026-02-09"
    perPage: 50
});
```

**Transform GitHub response:**

```javascript
const githubPRs = githubResult.items.map(pr => {
    // Extract repo from URL: https://github.com/owner/repo/pull/123
    const htmlUrl = pr.html_url || "";
    const repoParts = htmlUrl.replace("https://github.com/", "").split("/pull/");
    const repo = repoParts[0] || "unknown";

    return {
        repo: repo,
        number: pr.number,
        title: pr.title,
        url: htmlUrl,
        state: pr.state,
        updated: pr.updated_at,
        draft: pr.draft || false,
        merged_at: pr.merged_at || null,
        labels: (pr.labels || []).map(label => label.name),
        comments: pr.comments || 0
    };
});

const githubData = { prs: githubPRs };
```

### Step 5: Generate Report

**Call work-report-generator MCP server:**

```javascript
// Use ToolSearch to load report generator MCP tool
await ToolSearch({ query: "select:mcp__work-report-generator__generate_daily_report" });

// Get user display name from git config or environment
const userDisplayName = process.env.GIT_AUTHOR_NAME || "Unknown User";

// Generate all report formats
// NOTE: Currently the MCP server hardcodes "Ke Wang" in the report header
// A PR should be created to accept user_name parameter
const result = await mcp__work_report_generator__generate_daily_report({
    date: report_date,
    jira_data: jiraData,
    github_data: githubData,
    report_format: "all",  // Generates: Markdown, Brief, CherryTree
    user_name: userDisplayName  // TODO: MCP server needs to be updated to accept this
});
```

### Step 6: Report Success

```javascript
if (result.success) {
    return `
✅ ${report_type.charAt(0).toUpperCase() + report_type.slice(1)} work report generated successfully!

**Summary:**
- Date: ${result.date}
- Jira Issues: ${result.summary.jira_issues}
- GitHub PRs: ${result.summary.github_prs}

**Generated Files:**
${result.files.full ? `- Full Report: ${result.files.full}` : ''}
${result.files.brief ? `- Brief Report: ${result.files.brief}` : ''}
${result.files.cherrytree ? `- CherryTree: ${result.files.cherrytree}` : ''}
    `.trim();
} else {
    return `❌ Report generation failed: ${result.error}`;
}
```

## Complete Implementation

### Execution Flow

```
User: "generate daily report"
  ↓
Skill: Determine type = "daily", date = "2026-02-06"
  ↓
Skill: Call mcp__jira__jira_search(jql: "updated >= '2026-02-06'")
  ↓
Skill: Transform Jira response → jiraData
  ↓
Skill: Call mcp__github__search_pull_requests(query: "author:@me updated:>=2026-02-06")
  ↓
Skill: Transform GitHub response → githubData
  ↓
Skill: Call mcp__work_report_generator__generate_daily_report(date, jiraData, githubData)
  ↓
Skill: Report success with file paths
```

## Error Handling

**Handle MCP server failures gracefully:**

```javascript
try {
    const jiraResult = await mcp__jira__jira_search({ jql, fields, limit: 50 });
} catch (error) {
    console.error("Jira fetch failed:", error);
    // Continue with empty Jira data
    jiraData = { issues: [] };
}

try {
    const githubResult = await mcp__github__search_pull_requests({ query, perPage: 50 });
} catch (error) {
    console.error("GitHub fetch failed:", error);
    // Continue with empty GitHub data
    githubData = { prs: [] };
}

// Generate report even if one source fails
const result = await mcp__work_report_generator__generate_daily_report({
    date: report_date,
    jira_data: jiraData,
    github_data: githubData,
    report_format: "all"
});
```

## Common Patterns

### Pattern 1: Daily Standup

```
User: "generate daily report"
User: "create today's work report"
User: "daily standup report"

→ Report Type: daily
→ Date Range: Today only
→ Output: All formats (Markdown, Brief, CherryTree)
```

### Pattern 2: Weekly Summary

```
User: "generate weekly report"
User: "create report for this week"
User: "weekly work summary"

→ Report Type: weekly
→ Date Range: Last 7 days
→ Output: All formats with aggregated data
```

### Pattern 3: Quarterly Review

```
User: "generate quarterly report"
User: "Q1 work summary"
User: "3-month report"

→ Report Type: quarterly
→ Date Range: Last 90 days
→ Output: All formats with long-term trends
```

### Pattern 4: Yearly Retrospective

```
User: "generate yearly report"
User: "annual work summary"
User: "2026 report"

→ Report Type: yearly
→ Date Range: Last 365 days
→ Output: All formats with yearly statistics
```

## Output Formats

### 1. Full Report (Markdown)

**Location:** `~/work/work-reports/YYYY/MM/Week-WW/daily_report_YYYY-MM-DD.md`

**Contents:**
- Summary statistics
- Jira issues grouped by project
- GitHub PRs (merged + active)
- Professional formatting with links

### 2. Brief Report (Plain Text)

**Location:** `~/work/work-reports/YYYY/MM/Week-WW/daily_report_YYYY-MM-DD_brief.txt`

**Contents:**
- 🦀 Thing I've been working on (completed + ongoing)
- 🖖 Thing I plan on working on next
- 🤦 Blockers

**Use case:** Quick standup, Slack/email copy-paste

### 3. CherryTree (XML Database)

**Location:** `~/work/work-reports/daily_report.ctd` (or `.ctx` if encrypted)

**Contents:**
- Hierarchical structure: Year → Month → Week → Day
- Rich text formatting with clickable links
- Persistent database of all reports
- Optional 7-zip encryption support

## Advanced Usage

### Custom Date

```
User: "generate report for 2026-02-05"

→ Override report_date = "2026-02-05"
→ Use specified date instead of today
```

### Specific Format Only

```
User: "generate brief report only"

→ report_format = "brief"
→ Skips Markdown and CherryTree
```

### Extended Period

```
User: "generate report for last 30 days"

→ Custom date range calculation
→ start_date = today - 30 days
```

## Configuration

### Environment Variables

The work-report-generator MCP server uses:

```bash
# Optional: Enable encrypted CherryTree
export CHERRYTREE_ENCRYPTED="true"
export CHERRYTREE_PASSWORD="your-password"

# Report base directory (default: ~/work/work-reports)
# No env var needed - uses default
```

### Report Organization

```
~/work/work-reports/
├── 2026/
│   ├── 01/
│   │   ├── Week-01/
│   │   │   ├── daily_report_2026-01-01.md
│   │   │   └── daily_report_2026-01-01_brief.txt
│   │   ├── Week-02/
│   │   └── ...
│   ├── 02/
│   │   ├── Week-05/
│   │   ├── Week-06/
│   │   └── ...
│   └── ...
└── daily_report.ctd  # CherryTree database (all reports)
```

## Troubleshooting

### Issue: No Jira data returned

**Cause:** Jira MCP server not configured or wrong credentials

**Solution:**
1. Verify Jira MCP server is running
2. Check `JIRA_USERNAME` and `JIRA_API_TOKEN` environment variables
3. Test Jira MCP directly: `mcp__jira__jira_search({ jql: "updated >= -1d", limit: 1 })`

### Issue: No GitHub data returned

**Cause:** GitHub MCP server not authenticated

**Solution:**
1. Verify GitHub MCP server is running
2. Check GitHub authentication (usually via `gh` CLI)
3. Test GitHub MCP directly: `mcp__github__search_pull_requests({ query: "author:@me", perPage: 1 })`

### Issue: Report generator fails

**Cause:** work-report-generator MCP server not running

**Solution:**
1. Check if server is running: `ps aux | grep work-report-generator`
2. Start server: `cd ~/work/gitlab/work-report-generator && python src/server.py`
3. Verify in MCP tools list: `ToolSearch({ query: "work-report" })`

### Issue: Empty report generated

**Cause:** No activities in specified date range

**Solution:** Normal behavior - verify with direct Jira/GitHub queries to confirm no data exists

## Best Practices

### 1. Run Daily Reports Consistently

```bash
# Add to cron or daily routine
# Generate report at end of workday
```

### 2. Use Brief Format for Standups

```
Quick copy-paste for Slack:
1. Open: ~/work/work-reports/2026/02/Week-06/daily_report_2026-02-06_brief.txt
2. Copy content
3. Paste in standup channel
```

### 3. Use CherryTree for Long-Term Tracking

```
Open CherryTree database to review:
- Weekly trends
- Monthly progress
- Quarterly achievements
```

### 4. Customize Report Type

```
- Daily: For active projects
- Weekly: For status updates
- Quarterly: For performance reviews
- Yearly: For retrospectives
```

## Migration to ai-helpers

When ready to migrate this skill to the ai-helpers repository:

1. **Copy skill directory:**
   ```bash
   cp -r ~/work/gitlab/my-claude-skills/skills/work-report \
         ~/go/src/github.com/ai-helpers/plugins/utils/skills/
   ```

2. **Update plugin metadata:**
   - Add to `plugins/utils/.claude-plugin/plugin.json`
   - Add command to `plugins/utils/commands/`
   - Update `PLUGINS.md` documentation

3. **Test in ai-helpers context:**
   ```bash
   cd ~/go/src/github.com/ai-helpers
   # Test the skill works in new location
   ```

4. **Create PR:**
   - Title: `feat(utils): add work-report skill`
   - Description: Comprehensive work report generation
   - Link to work-report-generator MCP server repo

## Real-World Impact

### Before This Skill
- Manual copy-paste from Jira and GitHub
- Inconsistent report formatting
- Time-consuming daily standups
- Lost track of long-term progress
- No unified view of work activities

### After This Skill
- One command generates complete report
- Consistent formatting across time periods
- 2-minute daily standup preparation
- Historical tracking via CherryTree
- Unified Jira + GitHub view

### Example Success

**Daily Standup:**
```
User: "generate daily report"
[30 seconds later]
✅ Report ready with 9 Jira issues, 4 GitHub PRs
Copy brief report to Slack → Done!
```

**Quarterly Review:**
```
User: "generate quarterly report"
[1 minute later]
✅ Report shows 127 Jira issues, 43 GitHub PRs over 90 days
Use for performance review → Comprehensive!
```

## Quick Reference

### Commands

```
generate daily report       → Today only
generate weekly report      → Last 7 days
generate quarterly report   → Last 90 days
generate yearly report      → Last 365 days
```

### MCP Tools Used

1. `mcp__jira__jira_search` - Fetch Jira issues
2. `mcp__github__search_pull_requests` - Fetch GitHub PRs
3. `mcp__work_report_generator__generate_daily_report` - Format reports

### Output Files

- `~/work/work-reports/YYYY/MM/Week-WW/daily_report_YYYY-MM-DD.md` - Full
- `~/work/work-reports/YYYY/MM/Week-WW/daily_report_YYYY-MM-DD_brief.txt` - Brief
- `~/work/work-reports/daily_report.ctd` - CherryTree database

## Implementation Checklist

When implementing this skill:

- [ ] Parse report type from user request (daily/weekly/quarterly/yearly)
- [ ] Calculate correct date range based on type
- [ ] Load Jira MCP tool via ToolSearch
- [ ] Fetch Jira issues with correct JQL query
- [ ] Transform Jira response to expected format
- [ ] Load GitHub MCP tool via ToolSearch
- [ ] Fetch GitHub PRs with correct search query
- [ ] Transform GitHub response to expected format
- [ ] Load work-report-generator MCP tool via ToolSearch
- [ ] Call generator with transformed data
- [ ] Handle errors gracefully (empty data if one source fails)
- [ ] Report success with file paths and summary
- [ ] Verify all three output files were created

## Tips

1. **Always use ToolSearch first:** Load MCP tools before calling them
2. **Handle failures gracefully:** One source failing shouldn't break the whole report
3. **Transform data carefully:** Match the exact format expected by work-report-generator
4. **Default to daily:** If user doesn't specify, generate daily report
5. **Show file paths:** Users want to know where reports are saved
6. **Include summary:** Show count of issues and PRs processed
