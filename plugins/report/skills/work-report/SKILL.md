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
# JIRA_USERNAME - Full email used for Jira JQL (e.g., "kewang@redhat.com") — PREFERRED
# JENKINS_USER_ID - Short username fallback (e.g., "kewang") — may not work on Jira Cloud
# GITHUB_USER_ID - Used for GitHub username (e.g., "wangke19")
jira_username = os.environ.get("JIRA_USERNAME") or os.environ.get("JENKINS_USER_ID")
github_username = os.environ.get("GITHUB_USER_ID", "@me")

# CRITICAL: For Jira Cloud (*.atlassian.net), always use the email address in JQL,
# not the short username. Short usernames like "kewang" silently return 0 results.
# Use quoted email: assignee = "kewang@redhat.com"
# Fallback to currentUser() only if no email is available.
if not jira_username:
    jira_jql_user = "currentUser()"
elif "@" in jira_username:
    jira_jql_user = f'"{jira_username}"'  # email → quoted string in JQL
else:
    jira_jql_user = "currentUser()"  # short username unreliable, use currentUser()
```

### Step 2: Calculate Date Range

```python
from datetime import datetime, timedelta, timezone

# CRITICAL: User is in CST (UTC+8). Jira JQL dates are interpreted as UTC.
# To cover "April 7 CST", we need UTC range: 2026-04-06 16:00 → 2026-04-07 16:00
# Always convert local date → UTC window using local UTC offset.

local_utc_offset_hours = 8  # CST = UTC+8; adjust if user is in a different timezone

today_local = datetime.now()  # local time
report_date = today_local.strftime("%Y-%m-%d")  # YYYY-MM-DD in local date

# UTC window start = local date 00:00 minus offset → previous UTC day at 16:00 (for UTC+8)
utc_start = today_local.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(hours=local_utc_offset_hours)
utc_end   = utc_start + timedelta(days=1)
utc_start_str = utc_start.strftime("%Y-%m-%d %H:%M")
utc_end_str   = utc_end.strftime("%Y-%m-%d %H:%M")

# For daily: use UTC-bounded range. For longer periods use simpler relative syntax.
# IMPORTANT: Include QA Contact field in Jira query to capture issues you're testing
if report_type == "daily":
    jira_jql = (
        f"updated >= '{utc_start_str}' AND updated < '{utc_end_str}' AND "
        f"(assignee = {jira_jql_user} OR reporter = {jira_jql_user} OR 'QA Contact' = {jira_jql_user})"
    )
    github_query = f"involves:{github_username} updated:>={report_date}"

elif report_type == "weekly":
    start_date = (today_local - timedelta(days=7)).strftime("%Y-%m-%d")
    jira_jql = f"updated >= -7d AND (assignee = {jira_jql_user} OR reporter = {jira_jql_user} OR 'QA Contact' = {jira_jql_user})"
    github_query = f"involves:{github_username} updated:>={start_date}"

elif report_type == "quarterly":
    start_date = (today_local - timedelta(days=90)).strftime("%Y-%m-%d")
    jira_jql = f"updated >= -90d AND (assignee = {jira_jql_user} OR reporter = {jira_jql_user} OR 'QA Contact' = {jira_jql_user})"
    github_query = f"involves:{github_username} updated:>={start_date}"

elif report_type == "yearly":
    start_date = (today_local - timedelta(days=365)).strftime("%Y-%m-%d")
    jira_jql = f"updated >= -365d AND (assignee = {jira_jql_user} OR reporter = {jira_jql_user} OR 'QA Contact' = {jira_jql_user})"
    github_query = f"involves:{github_username} updated:>={start_date}"
```

### Step 3: Fetch Jira Data

**IMPORTANT:** Filter by assignee, reporter, AND QA Contact to capture all work!

**Get Jira username from environment:**
```javascript
// JIRA_USERNAME (email) is the correct identifier for Jira Cloud JQL.
// JENKINS_USER_ID (short name like "kewang") silently returns 0 results on Jira Cloud.
// Always prefer the email; fall back to currentUser() if unavailable.
const jiraEmail = process.env.JIRA_USERNAME;  // e.g. "kewang@redhat.com"
const jiraJqlUser = jiraEmail ? `"${jiraEmail}"` : "currentUser()";
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

After deduplicating and verifying actual Apr-N activity per the gh CLI steps above,
set the `section` field on each PR so the report generator classifies them correctly.

```javascript
// CRITICAL: The report generator uses `section` (NOT `tags`) to classify open PRs.
// Without section="working_on", open PRs are silently dropped from 🦀 Working On.
//
// Rules for setting section:
//   "working_on" → I authored/commented/pushed on this PR TODAY
//   "next"       → I am reviewer/assignee but have NOT commented yet
//   (omit)       → merged PRs don't need section; merged_at field handles them

const githubPRs = verifiedPRs.map(pr => {
    const htmlUrl = pr.url || "";
    const repo = htmlUrl.replace("https://github.com/", "").split("/pull/")[0] || "unknown";
    const isMerged = pr.state === "merged";

    // Determine section for open PRs
    let section = undefined;
    if (!isMerged) {
        if (pr.iAmAuthor || pr.iCommentedToday || pr.iPushedToday) {
            section = "working_on";
        } else if (pr.iAmReviewer && !pr.iCommentedToday) {
            section = "next";
        }
    }

    return {
        repo,
        number: pr.number,
        title: pr.title,
        url: htmlUrl,
        state: isMerged ? "merged" : "open",
        merged_at: isMerged ? pr.closedAt : null,
        draft: pr.isDraft || false,
        is_author: pr.iAmAuthor || false,
        has_my_comments: pr.iCommentedToday || false,
        ...(section ? { section } : {})
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
- [ ] Read `JIRA_USERNAME` env var (email) for JQL — NOT `JENKINS_USER_ID` (short name)
- [ ] For daily reports, convert local date to UTC window (CST=UTC+8: use 16:00 prev day → 16:00 today)
- [ ] Load Jira MCP tool via ToolSearch
- [ ] Fetch Jira issues with correct JQL (email-based user, UTC-bounded date range)
- [ ] Transform Jira response to expected format (has_my_activity, is_assignee, is_reporter)
- [ ] Use `gh` CLI (NOT GitHub MCP) for PR search — run all 4 searches, deduplicate
- [ ] Verify actual user activity on report date per PR (comments, reviews, authorship)
- [ ] Set `section: "working_on"` on open PRs with activity (NOT `tags`)
- [ ] Set `section: "next"` on PRs where user is reviewer but hasn't commented
- [ ] Load work-report-generator MCP tool via ToolSearch
- [ ] Call generator with transformed data
- [ ] Handle errors gracefully (empty data if one source fails)
- [ ] Report success with file paths and summary

## Known Bugs (Fixed)

| # | Bug | Root Cause | Fix |
|---|-----|------------|-----|
| 1 | Jira returned 0 results | Used `JENKINS_USER_ID` (`kewang`) in JQL — Jira Cloud requires email | Use `JIRA_USERNAME` (`kewang@redhat.com`) as quoted string in JQL |
| 2 | Jira missed issues at day boundary | JQL `updated >= 'YYYY-MM-DD'` uses UTC midnight; user is in CST (UTC+8) | Use UTC window: `updated >= 'YYYY-MM-DD 16:00' AND updated < 'YYYY-MM-DD+1 16:00'` |
| 3 | Open PRs dropped from report | Passed `tags: ["working_on"]` — generator ignores `tags`, requires `section` field | Set `section: "working_on"` for open PRs with activity today |

## Tips

1. **Jira username = email:** `JIRA_USERNAME` env var holds the email; always quote it in JQL
2. **Timezone matters for daily:** Always use a UTC-bounded window, not a plain date
3. **`section` not `tags`:** The report generator classifies open PRs by `section` field only
4. **Always use ToolSearch first:** Load MCP tools before calling them
5. **gh CLI for GitHub:** GitHub MCP is not available; use `gh search prs` + verify activity
6. **Handle failures gracefully:** One source failing shouldn't break the whole report
7. **Default to daily:** If user doesn't specify, generate daily report
