---
name: session-summary
description: Automatically summarize the current Claude Code session and generate a meaningful session name with 20-30 words
allowed-tools: Bash(echo *), Bash(cat *), Bash(ls *), Read(*), Write(*)
---

# Session Summary and Rename Skill

## Overview

Automatically analyze the current Claude Code session conversation, generate a comprehensive summary, and suggest/apply a meaningful session name (20-30 words) based on the key activities and topics discussed.

## When to Use

Use this skill when:
- User explicitly asks to "summarize session" or "rename session"
- At the end of a work session to capture learnings
- Before switching to a different task or project
- User wants to review what was accomplished
- Need to generate a session title for organization

Don't use when:
- Session just started (nothing meaningful to summarize)
- User only wants to update CLAUDE.md (use `claude-md-management:revise-claude-md` instead)
- Session is purely conversational with no actions taken

## Core Pattern

### Session Analysis Workflow

```
1. Read conversation history
   ↓
2. Identify key topics and activities
   ↓
3. Extract significant outcomes
   ↓
4. Generate summary
   ↓
5. Suggest descriptive session name (20-30 words)
   ↓
6. Apply rename (if user approves)
```

## Implementation

### Step 1: Analyze Session Location

First, determine the session storage location:

```bash
# Claude Code sessions are typically stored in:
# ~/.claude/sessions/ or similar location

# List recent session files
ls -lt ~/.claude/sessions/ | head -10
```

### Step 2: Identify Current Session

The current session can be identified by:
1. Most recently modified session file
2. Session ID from environment variable (if available)
3. PID or process information

```bash
# Check for session-related environment variables
env | grep -i claude | grep -i session

# Find most recent session file
find ~/.claude/sessions -type f -name "*.json" -o -name "*.jsonl" | xargs ls -t | head -1
```

### Step 3: Analyze Conversation Content

Extract and analyze the conversation from the current context:

```markdown
**Analysis Framework:**

1. **Topics Discussed:**
   - What subjects/technologies were discussed?
   - What problems were being solved?
   - What features were being developed?

2. **Actions Taken:**
   - Files created/modified/deleted
   - Commands executed
   - Tools/skills invoked
   - Git operations performed

3. **Key Outcomes:**
   - What was accomplished?
   - What decisions were made?
   - What problems were solved?
   - What remained unfinished?

4. **Context & Domain:**
   - Which project/repository?
   - Which programming language?
   - Which framework/technology?
```

### Step 4: Generate Summary

Create a structured summary:

```markdown
# Session Summary

## 📋 Overview
[One-paragraph summary of the entire session]

## 🎯 Key Topics
- Topic 1: [description]
- Topic 2: [description]
- Topic 3: [description]

## ✅ Accomplishments
1. [Achievement 1 with details]
2. [Achievement 2 with details]
3. [Achievement 3 with details]

## 📝 Files Changed
- Created: [list of new files]
- Modified: [list of modified files]
- Deleted: [list of deleted files]

## 🔧 Tools & Skills Used
- [Skill/tool 1]: [purpose]
- [Skill/tool 2]: [purpose]

## 💡 Key Decisions
- [Decision 1 and rationale]
- [Decision 2 and rationale]

## 🚧 Remaining Work
- [ ] [Task 1]
- [ ] [Task 2]

## 🏷️ Suggested Tags
[Technology, Domain, Type, etc.]
```

### Step 5: Generate Session Name (20-30 Words)

Create a descriptive, detailed session name that captures the full scope of the session:

**Naming Convention:**
```
[Detailed description of work including actions, technologies, and context]

Target: 20-30 words
Format: Complete sentences or detailed phrases
Include: What, Why, How, Technologies, Context

Examples (20-30 words):
✅ "Created comprehensive session-summary skill for Claude Code enabling automatic conversation analysis, structured summary generation, and intelligent session naming with detailed implementation documentation and examples"

✅ "Debugged and fixed critical authentication race condition in Express API middleware affecting production OAuth flows by implementing proper async lock mechanism and comprehensive unit tests"

✅ "Implemented complete OVN-Kubernetes topology visualization feature using D3.js force-directed graphs, including database query optimization, real-time updates, and interactive network exploration capabilities for troubleshooting"

✅ "Investigated Jira MCP server integration issues, resolved authentication failures, updated environment variable configuration, and successfully tested work report generation with proper data aggregation from multiple sources"

✅ "Refactored legacy GitHub PR analysis logic to improve performance by 70%, migrating from sequential processing to parallel batch API calls with proper error handling and retry mechanisms"
```

**Guidelines:**
- **Minimum 20 words, maximum 30 words**
- Include specific technologies, frameworks, or tools used
- Describe both WHAT was done and WHY/HOW when relevant
- Mention key outcomes or improvements (e.g., "improving performance by 70%")
- Include context (e.g., "for production OAuth flows", "in Express API")
- Be descriptive enough that reading the name alone gives full understanding
- Use complete phrases or sentences
- Front-load the most important information

**Word Count Examples:**

20 words (minimum):
"Implemented user authentication system for React dashboard using JWT tokens, OAuth2 integration, role-based access control, and comprehensive security audit logging"

25 words (sweet spot):
"Developed automated CI/CD pipeline for Kubernetes deployments including container builds, security scanning, integration tests, staging validation, and production rollout with zero-downtime blue-green deployment strategy"

30 words (maximum):
"Created end-to-end monitoring solution for distributed microservices architecture integrating Prometheus metrics collection, Grafana dashboards, AlertManager notifications, distributed tracing with Jaeger, and custom SLO tracking for critical business workflows"

### Step 6: Present to User

Show the summary and suggest the name:

```markdown
## 📊 Session Summary Generated

[Display the full summary here]

---

## 💾 Suggested Session Name

**Proposed (25 words):**
`[Generated detailed name with 20-30 words]`

**Word count:** [X] words

**Current:** `[Current session name if available]`

Would you like me to:
1. ✅ Apply this name to the session
2. ✏️ Generate alternative names
3. 🔄 Adjust word count (make shorter/longer)
4. ❌ Keep current name
```

### Step 7: Persist Session Summary (Hybrid Approach)

**IMPORTANT**: This skill uses a hybrid approach for maximum compatibility with ccsm (Claude Code Session Manager):

1. **Quick metadata** → Append to `.jsonl` file for fast title lookup
2. **Full summary** → Write to `~/.claude/summaries/` for detailed view

#### Step 7A: Write Metadata to Session JSONL

Append a metadata entry to the current session's JSONL file:

```bash
# Find current session file (most recently modified JSONL in projects)
SESSION_FILE=$(find ~/.claude/projects -name "*.jsonl" -type f | xargs ls -t | head -1)

# Extract session ID from filename
SESSION_ID=$(basename "$SESSION_FILE" .jsonl)

# Prepare metadata entry
METADATA_ENTRY=$(cat <<EOF
{"type":"metadata","sessionId":"${SESSION_ID}","timestamp":"$(date -u +%Y-%m-%dT%H:%M:%SZ)","summary":{"title":"${GENERATED_TITLE}","topics":${TOPICS_JSON},"wordCount":${WORD_COUNT}}}
EOF
)

# Append to session file
echo "$METADATA_ENTRY" >> "$SESSION_FILE"
```

**Field Specifications:**
- `type`: Always "metadata" (distinguishes from user/assistant messages)
- `sessionId`: Extract from filename (UUID format)
- `timestamp`: ISO 8601 format in UTC
- `summary.title`: The 20-30 word generated session name
- `summary.topics`: JSON array of topic strings (e.g., ["claude-code", "git-workflow"])
- `summary.wordCount`: Integer count for validation

**Example metadata entry:**
```json
{
  "type": "metadata",
  "sessionId": "abc123-def456-ghi789",
  "timestamp": "2026-03-03T09:30:45Z",
  "summary": {
    "title": "Created session-summary skill for Claude Code enabling automated conversation analysis and intelligent 20-30 word descriptive naming with comprehensive documentation",
    "topics": ["claude-code", "skill-development", "session-management"],
    "wordCount": 27
  }
}
```

#### Step 7B: Write Full Summary to External File

Create comprehensive summary file in `~/.claude/summaries/`:

```bash
# Create summaries directory
mkdir -p ~/.claude/summaries

# Prepare full summary JSON
SUMMARY_FILE=~/.claude/summaries/${SESSION_ID}.json

cat > "$SUMMARY_FILE" <<EOF
{
  "sessionId": "${SESSION_ID}",
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "title": "${GENERATED_TITLE}",
  "wordCount": ${WORD_COUNT},
  "overview": "${OVERVIEW_PARAGRAPH}",
  "topics": ${TOPICS_JSON},
  "accomplishments": ${ACCOMPLISHMENTS_JSON},
  "filesChanged": {
    "created": ${FILES_CREATED_JSON},
    "modified": ${FILES_MODIFIED_JSON},
    "deleted": ${FILES_DELETED_JSON}
  },
  "toolsUsed": ${TOOLS_JSON},
  "keyDecisions": ${DECISIONS_JSON},
  "remainingWork": ${REMAINING_WORK_JSON},
  "tags": ${TAGS_JSON},
  "metrics": {
    "duration": "${DURATION}",
    "messageCount": ${MESSAGE_COUNT},
    "commandsExecuted": ${COMMANDS_COUNT}
  }
}
EOF
```

**Full Summary Schema:**
```json
{
  "sessionId": "string (UUID)",
  "generatedAt": "string (ISO 8601)",
  "title": "string (20-30 words)",
  "wordCount": "number",
  "overview": "string (paragraph)",
  "topics": ["string"],
  "accomplishments": ["string"],
  "filesChanged": {
    "created": ["string"],
    "modified": ["string"],
    "deleted": ["string"]
  },
  "toolsUsed": [{"name": "string", "purpose": "string"}],
  "keyDecisions": [{"decision": "string", "rationale": "string"}],
  "remainingWork": ["string"],
  "tags": ["string"],
  "metrics": {
    "duration": "string",
    "messageCount": "number",
    "commandsExecuted": "number"
  }
}
```

#### Step 7C: Confirm Persistence

After writing both metadata and full summary:

```bash
echo "✅ Session summary persisted successfully!"
echo ""
echo "📝 Metadata appended to: $SESSION_FILE"
echo "📊 Full summary written to: $SUMMARY_FILE"
echo ""
echo "Integration with ccsm:"
echo "  • 'ccsm list' will show AI-generated title"
echo "  • 'ccsm show ${SESSION_ID}' will display full summary"
```

## Session File Format Investigation

To implement rename functionality, we need to understand the session storage format:

### Step A: Locate Session Files

```bash
# Check common locations
ls -la ~/.claude/sessions/
ls -la ~/.config/claude/sessions/
ls -la ~/.local/share/claude/sessions/

# Find all potential session files
find ~ -path "*/claude/sessions/*" -type f 2>/dev/null
```

### Step B: Examine Session File Structure

```bash
# Read a session file to understand format
cat "$(find ~/.claude/sessions -type f | head -1)" | head -50

# Or if they're JSON:
jq '.' "$(find ~/.claude/sessions -type f -name "*.json" | head -1)" | head -50

# Or if they're JSONL:
head -20 "$(find ~/.claude/sessions -type f -name "*.jsonl" | head -1)"
```

### Step C: Identify Name/Title Field

Look for fields like:
- `title`
- `name`
- `sessionName`
- `displayName`
- `metadata.title`

### Step D: Implement Update Logic

Once the format is known, update the appropriate field:

```javascript
// Example for JSON format
const sessionFile = "/path/to/session.json";
const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
sessionData.title = "New detailed session name with 20-30 words describing the work";
fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
```

## Generating Quality 20-30 Word Names

### Name Generation Algorithm

```javascript
function generateSessionName(summary) {
    // Extract key components
    const mainAction = extractPrimaryAction(summary.accomplishments);
    const technologies = extractTechnologies(summary);
    const context = extractContext(summary);
    const outcomes = extractOutcomes(summary);
    const details = extractKeyDetails(summary);

    // Build descriptive name
    let name = `${mainAction} `;

    // Add primary technology/domain
    if (technologies.length > 0) {
        name += `${technologies[0]} `;
    }

    // Add context and purpose
    if (context) {
        name += `${context} `;
    }

    // Add implementation details
    if (details.length > 0) {
        name += `including ${details.join(', ')} `;
    }

    // Add outcomes/improvements
    if (outcomes.length > 0) {
        name += `${outcomes.join(', ')} `;
    }

    // Ensure 20-30 word range
    const wordCount = name.trim().split(/\s+/).length;

    if (wordCount < 20) {
        // Add more details
        name = expandWithMoreContext(name, summary);
    } else if (wordCount > 30) {
        // Trim less important details
        name = trimToEssentials(name, 30);
    }

    return {
        name: name.trim(),
        wordCount: name.trim().split(/\s+/).length
    };
}
```

### Components to Include

**Priority 1 (Always include):**
- Primary action/task
- Main technology/framework
- Core problem/feature

**Priority 2 (Usually include):**
- Implementation approach
- Key technologies used
- Context (project, environment)

**Priority 3 (Include if space allows):**
- Outcomes/metrics
- Related components
- Additional context

### Examples by Session Type

**Feature Development (25 words):**
"Implemented comprehensive user authentication system for React SPA including JWT token management, OAuth2 social login, role-based authorization, session persistence, and security best practices"

**Bug Fix (23 words):**
"Resolved critical memory leak in Node.js WebSocket server affecting production stability by implementing proper event listener cleanup, connection pooling, and comprehensive monitoring"

**Refactoring (27 words):**
"Refactored monolithic Express application into microservices architecture using Docker containers, Kubernetes orchestration, service mesh communication, centralized logging, distributed tracing, and automated deployment pipelines"

**Investigation (24 words):**
"Investigated intermittent database connection timeout issues in production environment, analyzed slow query logs, identified N+1 query patterns, and documented optimization recommendations"

**Documentation (22 words):**
"Created comprehensive API documentation for RESTful endpoints using OpenAPI specification, including request/response examples, authentication flows, error codes, and integration guides"

**Skill Development (26 words):**
"Developed automated session summary skill for Claude Code enabling intelligent conversation analysis, structured summary generation, descriptive naming with 20-30 words, and comprehensive documentation"

## Error Handling

**Handle common failure cases:**

```javascript
try {
    // Attempt to locate session
    const sessionFiles = findSessionFiles();
    if (sessionFiles.length === 0) {
        throw new Error("No session files found");
    }

    // Analyze conversation
    const summary = analyzeConversation();
    if (summary.topics.length === 0) {
        return "⚠️ Session is too short to generate meaningful summary";
    }

    // Generate name with word count validation
    const sessionName = generateSessionName(summary);
    if (sessionName.wordCount < 20) {
        console.warn(`Generated name only has ${sessionName.wordCount} words, expanding...`);
        sessionName = expandName(sessionName, summary);
    }
    if (sessionName.wordCount > 30) {
        console.warn(`Generated name has ${sessionName.wordCount} words, trimming...`);
        sessionName = trimName(sessionName, 30);
    }

    // Present to user
    presentSummary(summary, sessionName);

} catch (error) {
    return `❌ Session summary failed: ${error.message}

**Possible causes:**
- Session files not accessible
- Insufficient conversation content
- Session format not recognized

**Workaround:**
You can still manually review the conversation and choose a session name.`;
}
```

## Common Patterns

### Pattern 1: End of Development Session

```
User: "summarize this session"

→ Analyze: Feature development work
→ Generate (24 words): "Implemented complete Express API authentication middleware with passport integration, JWT tokens, refresh token rotation, rate limiting, and comprehensive security testing suite"
→ Output: Full summary + detailed name
```

### Pattern 2: Debugging Session

```
User: "summarize what we did"

→ Analyze: Bug investigation and fix
→ Generate (26 words): "Debugged and resolved critical OVN controller memory leak affecting Kubernetes networking performance by implementing proper resource cleanup, adding memory profiling, and creating regression tests"
→ Output: Summary with debugging steps
```

### Pattern 3: Multi-topic Session

```
User: "what did we accomplish?"

→ Analyze: Multiple activities
→ Generate (28 words): "Fixed authentication bugs in user login flow, implemented new dashboard features with real-time updates, and optimized database queries reducing average response time by 60 percent"
→ Output: Summary grouped by topic
```

## Best Practices

### 1. Timing

✅ **Good times to summarize:**
- After completing a feature/fix
- Before switching contexts
- End of work day
- After significant debugging session

❌ **Avoid summarizing when:**
- Session just started
- Only asked quick questions
- No meaningful work done

### 2. Name Quality

✅ **Good session names (20-30 words):**
- "Developed automated Kubernetes operator for managing PostgreSQL clusters including custom resource definitions, reconciliation loops, backup automation, monitoring integration, and comprehensive end-to-end testing framework"
- "Investigated and resolved race condition in async webhook processing system by implementing distributed locking with Redis, adding retry mechanisms, and creating detailed observability dashboards"
- "Created comprehensive OVN-Kubernetes network topology visualization tool using D3.js force graphs with interactive node exploration, real-time updates, database integration, and export capabilities"

❌ **Poor session names:**
- "Work on stuff" (too vague, too short)
- "Coding session" (no detail, too short)
- "Fix bug" (missing context, way too short)
- Single long sentence over 30 words (too verbose)

### 3. Word Count Validation

Always validate word count:

```javascript
function validateWordCount(name) {
    const words = name.trim().split(/\s+/);
    const count = words.length;

    if (count < 20) {
        return {
            valid: false,
            message: `Name too short (${count} words). Need ${20 - count} more words.`,
            suggestion: "Add more context about technologies, approach, or outcomes"
        };
    }

    if (count > 30) {
        return {
            valid: false,
            message: `Name too long (${count} words). Remove ${count - 30} words.`,
            suggestion: "Focus on most important details, remove redundant phrases"
        };
    }

    return {
        valid: true,
        count: count,
        message: `Perfect length (${count} words)`
    };
}
```

## Troubleshooting

### Issue: Cannot generate 20-30 word name

**Cause:** Session too simple or too complex

**Solution for simple sessions:**
```
Expand with:
- Technologies used (even common ones)
- Methodology/approach taken
- Quality attributes (performance, security, maintainability)
- Context and environment details
```

**Solution for complex sessions:**
```
Focus on:
- Most significant accomplishment
- Primary technology/domain
- Key outcome or metric
- Core implementation detail
```

### Issue: Name feels repetitive or verbose

**Cause:** Including redundant information

**Solution:**
```
Replace redundant phrases:
❌ "Created and developed and built..."
✅ "Developed..."

❌ "For the purpose of enabling..."
✅ "Enabling..."

❌ "In order to improve..."
✅ "Improving..."
```

### Issue: Hard to fit in 20-30 words

**Cause:** Natural language constraints

**Solution:**
```
Use efficient phrasing:
❌ "Made improvements to the performance" (5 words)
✅ "Improved performance" (2 words)

❌ "In the context of the production environment" (7 words)
✅ "In production" (2 words)

❌ "With the ability to automatically" (5 words)
✅ "Automatically" (1 word)
```

## Implementation Checklist

When implementing this skill:

**Analysis Phase:**
- [ ] Parse conversation history from context
- [ ] Extract key topics using pattern matching
- [ ] Identify files changed from conversation
- [ ] List skills/tools used
- [ ] Extract accomplishments and decisions

**Generation Phase:**
- [ ] Generate structured summary with all sections
- [ ] Create descriptive session name with 20-30 words
- [ ] Validate word count is within range (20-30)
- [ ] Adjust name if too short or too long
- [ ] Format topics as JSON array
- [ ] Format all data for persistence

**Persistence Phase (Hybrid Approach):**
- [ ] Locate current session JSONL file in ~/.claude/projects/
- [ ] Extract session ID from filename
- [ ] Prepare metadata JSON entry
- [ ] Append metadata to session JSONL file
- [ ] Create ~/.claude/summaries/ directory if needed
- [ ] Write full summary to ~/.claude/summaries/<session-id>.json
- [ ] Verify both files were written successfully

**Presentation Phase:**
- [ ] Present summary with word count to user
- [ ] Show file locations where data was saved
- [ ] Mention ccsm integration benefits
- [ ] Handle error cases gracefully

**Testing:**
- [ ] Test with various session types (development, debugging, documentation)
- [ ] Verify metadata appears in ccsm list
- [ ] Verify full summary loads in ccsm show
- [ ] Test with sessions that have no previous metadata
- [ ] Test error handling for write failures

## Example Output

### Input
```
User: "summarize this session and rename it"
```

### Output
```markdown
## 📊 Session Summary

### 📋 Overview
Created a comprehensive Claude Code skill for automated session summarization
and intelligent renaming. Developed complete implementation including conversation
analysis, structured summary generation, and descriptive 20-30 word naming
convention with validation and examples.

### 🎯 Key Topics
- Claude Code session management and automation
- Skill development patterns and best practices
- Session storage format investigation
- Descriptive naming conventions (20-30 words)
- Name generation algorithms and validation

### ✅ Accomplishments
1. Created new git branch: feature/session-summary-rename-skill
2. Developed comprehensive SKILL.md with detailed implementation guide
3. Defined session analysis workflow and naming algorithm
4. Created 20-30 word naming convention with validation logic
5. Documented complete examples across different session types
6. Established best practices and troubleshooting guides

### 📝 Files Changed
Created:
- skills/session-summary/SKILL.md (comprehensive documentation)

### 🔧 Skills & Tools Used
- Git: Branch creation and version control
- Glob: Analyzed existing skill patterns
- Read: Examined skill structure examples
- Write: Created new skill documentation

### 💡 Key Decisions
- Use 20-30 word descriptive names (not brief titles)
- Include technologies, approach, and outcomes in names
- Validate word count programmatically
- Provide expansion/trimming strategies
- Front-load important information

### 🏷️ Suggested Tags
claude-code, skill-development, session-management, automation, naming-conventions

---

## 💾 Suggested Session Name

**Proposed (27 words):**
`Developed comprehensive session-summary skill for Claude Code enabling automated conversation analysis, structured summary generation, and intelligent 20-30 word descriptive naming with validation, examples, and implementation documentation`

**Word count:** 27 words ✅

Would you like me to apply this name to the session?
```

## Quick Reference

### Naming Formula

```
[Action] + [Technology/Domain] + [Key Details] + [Outcomes]
= 20-30 words
```

### Word Count Targets

- **Minimum:** 20 words
- **Sweet Spot:** 23-27 words
- **Maximum:** 30 words

### Essential Components

1. **Action verb** (1-2 words): Developed, Implemented, Fixed, Debugged
2. **Primary subject** (2-4 words): Authentication system, OVN controller
3. **Context** (2-4 words): For React dashboard, in production
4. **Implementation details** (8-12 words): Using JWT tokens, OAuth2, role-based access
5. **Outcomes** (4-6 words): Improving performance by 70 percent

## ccsm Integration

This skill integrates seamlessly with **ccsm** (Claude Code Session Manager) for enhanced session discovery and management.

### How Integration Works

1. **session-summary generates data** → Writes both inline metadata and external summary files
2. **ccsm reads metadata** → Displays AI-generated titles in list view
3. **ccsm shows details** → Renders full structured summaries on demand

### ccsm Commands Enhanced

**Before Integration:**
```bash
$ ccsm list
📅 Today (Mar 3)
────────────────────────────────────
  abc123  02:15  how can I see the skill in claude?
          project: my-claude-skills  branch: main  msgs: 45
```

**After Integration:**
```bash
$ ccsm list
📅 Today (Mar 3)
────────────────────────────────────
  abc123  02:15  Created session-summary skill for Claude Code enabling...
          project: my-claude-skills  branch: main  msgs: 45
          topics: claude-code, skill-development, session-management
```

**New Command - Full Summary:**
```bash
$ ccsm show abc123

📊 Session Summary

📋 Overview:
Developed and deployed comprehensive session-summary skill for Claude Code
enabling automated conversation analysis and intelligent 20-30 word session
naming...

🎯 Key Topics:
• Claude Code session management
• Skill development workflow
• 20-30 word naming convention

✅ Accomplishments:
1. Created feature branch feature/session-summary-rename-skill
2. Developed comprehensive SKILL.md with detailed implementation guide
...

📝 Files Changed:
Created:
• skills/session-summary/SKILL.md (689 lines)
• skills/session-summary/README.md (93 lines)

🔧 Tools Used:
• Git - Branch creation and version control
• Write - Created comprehensive skill documentation

📈 Metrics:
• Duration: Full development session
• Messages: 45
• Commands: 12+
```

### Setup Instructions

**1. Install ccsm with summary support:**
```bash
# ccsm v0.2.0+ includes summary metadata parsing
go install github.com/kewang/ccsm/cmd/ccsm@latest
```

**2. Use session-summary skill:**
```bash
# At end of work session
/session-summary

# Or ask Claude
"summarize this session"
```

**3. View in ccsm:**
```bash
# List with AI-generated titles
ccsm list

# View full summary
ccsm show <session-id>
```

### Data Flow Diagram

```
┌─────────────────────┐
│  Claude Code        │
│  Session            │
└──────┬──────────────┘
       │
       │ User invokes
       │ /session-summary
       ▼
┌─────────────────────┐
│ session-summary     │
│ skill analyzes      │
│ conversation        │
└──────┬──────────────┘
       │
       ├─────────────────────┐
       │                     │
       ▼                     ▼
┌──────────────┐    ┌─────────────────┐
│ Append to    │    │ Write full      │
│ .jsonl       │    │ summary to      │
│ (metadata)   │    │ ~/.claude/      │
│              │    │ summaries/      │
└──────┬───────┘    └────────┬────────┘
       │                     │
       │    ┌────────────────┘
       │    │
       ▼    ▼
┌─────────────────────┐
│  ccsm reads         │
│  both sources       │
└──────┬──────────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
 ┌──────────┐     ┌──────────┐
 │ ccsm     │     │ ccsm     │
 │ list     │     │ show     │
 │ (fast)   │     │ (detail) │
 └──────────┘     └──────────┘
```

### File Locations

```
~/.claude/
├── projects/
│   └── <project-dir>/
│       └── <session-id>.jsonl      # ← Metadata appended here
└── summaries/
    └── <session-id>.json           # ← Full summary written here
```

### Benefits

✅ **Better Discovery**: Find sessions by meaningful descriptions, not first messages
✅ **Rich Context**: View full summaries without opening Claude Code
✅ **Fast Search**: ccsm can search across AI-generated topics and titles
✅ **No Duplication**: Hybrid approach balances speed and detail
✅ **Backward Compatible**: Works with old sessions that lack metadata

## Tips

1. **Always count words:** Use `name.trim().split(/\s+/).length`
2. **Front-load importance:** Most critical info first
3. **Be specific:** "JWT authentication" not "authentication"
4. **Include metrics:** "Reducing latency by 60%" adds value
5. **Use active voice:** "Implemented" not "Was implemented"
6. **Avoid filler:** Remove "in order to", "for the purpose of"
7. **Test readability:** Should be clear without additional context
8. **Run at session end:** Generate summaries before switching contexts
9. **Verify persistence:** Check that both JSONL and summary files are written
10. **Use with ccsm:** Install ccsm v0.2.0+ for full integration benefits
