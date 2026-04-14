---
description: Analyze and optimize resume, prepare job application documents
argument-hint: "[resume_file_path] [job_description_url or 'analyze']"
---

## Name
resume:optimize

## Synopsis
/resume:optimize [resume_file_path] [job_description_url or 'analyze']

## Description
This skill helps you optimize your resume and prepare job application documents. It can analyze your existing resume, extract core skills and experiences, integrate work history, and create targeted application materials based on job descriptions. Whether you need to generate a professional PDF resume, create a bilingual HTML version, or draft a tailored cover letter, this skill provides comprehensive support throughout your job search process.

## Use Cases

### Resume Analysis and Enhancement
- Analyze existing resume content and structure
- Extract and organize work experiences by company and role
- Identify key achievements and technical skills
- Suggest improvements for clarity and impact

### Job Application Preparation
- Match resume content to specific job descriptions
- Generate tailored application emails and cover letters
- Highlight relevant experience and skills for target positions
- Create interview preparation talking points

### Document Generation
- Convert markdown resume to professional HTML format
- Generate bilingual (Chinese/English) resume with language switching
- Create optimized PDF versions with proper formatting
- Fix common PDF generation issues (Chinese characters, links, layout)

### Career Content Creation
- Integrate and consolidate work experience from multiple sources
- Generate professional summaries and competency highlights
- Create technical skills categorization
- Develop career objective statements

## Implementation

### Step 1: Input Analysis

1. **Determine processing mode**:
   - If `analyze`: Analyze existing resume content
   - If `job_description_url`: Tailor resume for specific job
   - If neither: General resume optimization

2. **Read resume content**:
   ```bash
   if [ -f "$ARGUMENTS" ]; then
       resume_file="$ARGUMENTS"
       # Detect file format (md, html, txt, json)
       file_ext="${resume_file##*.}"
   else
       # Ask user for resume file path
       echo "Please provide your resume file path (markdown, HTML, or text):"
       read resume_file
   fi
   ```

3. **Parse content**:
   - Extract sections: contact info, summary, experience, skills, education
   - Identify work history by company and dates
   - Extract technical skills and tools
   - Note achievements and quantifiable results

### Step 2: Content Analysis

1. **Work experience analysis**:
   - Group by company and role
   - Calculate duration for each position
   - Identify progression and responsibility growth
   - Extract key achievements and impact

2. **Skills extraction**:
   - Categorize by domain (cloud-native, AI, testing, etc.)
   - Identify proficiency level from context
   - Note version-specific experience (e.g., OpenShift 3.11-4.22)
   - Highlight unique or specialized skills

3. **Content optimization suggestions**:
   - Check for action verbs and quantifiable achievements
   - Identify gaps or areas needing elaboration
   - Suggest restructuring for better flow
   - Recommend keywords for ATS optimization

### Step 3: Job Description Matching (if applicable)

1. **Fetch job description**:
   ```bash
   if [[ "$2" =~ ^https?:// ]]; then
       jd_url="$2"
       # Use web reader or fetch to extract JD content
   fi
   ```

2. **Analyze job requirements**:
   - Extract required skills and qualifications
   - Identify key responsibilities and daily tasks
   - Note company culture and values indicators
   - Determine seniority level and scope

3. **Generate tailored content**:
   - Match experience to job requirements
   - Highlight relevant achievements
   - Adjust language to match job posting tone
   - Create targeted summary statement

### Step 4: Document Generation

1. **Generate HTML resume** (if needed):
   - Create responsive HTML structure
   - Add CSS styling for professional appearance
   - Include language switching functionality (Chinese/English)
   - Ensure proper character encoding and fonts

2. **Generate PDF resume** (if needed):
   - Use reportlab or similar PDF generation library
   - Handle Chinese fonts and characters properly
   - Add clickable links for GitHub, email, etc.
   - Optimize layout for A4 page size
   - Fix common formatting issues

3. **Create application email** (if needed):
   - Address to hiring team or specific contact
   - Include compelling opening statement
   - Highlight 3-5 most relevant qualifications
   - Add call-to-action and contact information
   - Keep concise (3-4 paragraphs max)

### Step 5: Output and Recommendations

1. **Generate optimized resume content**:
   - Enhanced professional summary
   - Reorganized work experience with impact statements
   - Categorized technical skills
   - Improved formatting and structure

2. **Provide recommendations**:
   - Top 3 areas for improvement
   - Keywords to add for ATS optimization
   - Suggestions for quantifying achievements
   - Recommended content to emphasize for specific roles

3. **Create deliverables**:
   - Optimized resume in requested format
   - Application email template
   - Interview preparation points
   - Skills-highlight summary

## Examples

### Analyze existing resume
```
User: /resume:optimize ~/work/resume/resume.md
```
- Analyzes resume.md and provides optimization suggestions
- Extracts and organizes work experience
- Generates improved content structure

### Tailor for specific job
```
User: /resume:optimize ~/work/resume/resume.md https://careers.example.com/job/senior-engineer
```
- Fetches job description from URL
- Matches resume content to job requirements
- Generates tailored application email
- Creates targeted resume version

### Create bilingual HTML resume
```
User: /resume:optimize ~/work/resume/resume.md html
```
- Converts markdown to professional HTML
- Adds Chinese/English language switching
- Includes responsive CSS styling
- Generates downloadable HTML file

### Generate professional PDF
```
User: /resume:optimize ~/work/resume/resume.md pdf
```
- Creates professional PDF format resume
- Handles Chinese character display
- Adds clickable contact links
- Optimizes layout and formatting

## Best Practices

1. **Always read existing content first** - Understand current resume before suggesting changes
2. **Preserve factual accuracy** - Never fabricate experience or skills
3. **Quantify achievements** - Add metrics and impact where possible
4. **Tailor to audience** - Adjust content for specific roles and industries
5. **Maintain consistency** - Ensure formatting and style are consistent throughout
6. **Focus on impact** - Emphasize results and business value over responsibilities
7. **Keep it concise** - Aim for 1-2 pages maximum
8. **Test deliverables** - Verify PDF rendering and link functionality

## Troubleshooting

### PDF generation issues
- Chinese characters display as squares: Install proper Chinese fonts
- Links not clickable: Check PDF library link syntax
- Layout issues: Adjust margins and spacing parameters
- File size too large: Optimize images and embedded fonts

### Content analysis issues
- Missing sections: Check for consistent heading markers
- Incorrect date parsing: Verify date format consistency
- Skills extraction: Look for technical keywords and tools
- Experience gaps: Ask user about unexplained time periods

### Job description issues
- URL not accessible: Try alternative fetch methods or ask user to paste JD
- Content not parseable: Request plain text version
- Requirements unclear: Ask user for clarification on key points

## Dependencies

- File reading and writing capabilities
- Web fetch for job descriptions (if URL provided)
- PDF generation library (reportlab or similar)
- Basic text processing and formatting
- Chinese font support for PDF generation
