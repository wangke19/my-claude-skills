# Resume Plugin

A Claude Code plugin for resume optimization and job application preparation.

## Overview

This plugin provides comprehensive skills for:
- Analyzing and optimizing resume content
- Generating professional PDF resumes with Chinese character support
- Creating bilingual (Chinese/English) HTML resumes
- Preparing tailored job application documents
- Matching resume content to job descriptions

## Skills

### `resume:optimize`
Analyze and optimize your resume, prepare job application documents.

**Usage:**
```
/resume:optimize [resume_file_path] [job_description_url or 'analyze']
```

**Features:**
- Resume content analysis and enhancement
- Work experience integration and organization
- Skills extraction and categorization
- Job description matching
- Application email generation
- HTML resume creation with language switching

**Examples:**
- `/resume:optimize ~/resume/resume.md` - Analyze and optimize existing resume
- `/resume:optimize ~/resume/resume.md https://company.com/job/senior-engineer` - Tailor for specific job

### `resume:generate-pdf`
Generate professional PDF resume from markdown or HTML sources.

**Usage:**
```
/resume:generate-pdf <input_file> [output_file]
```

**Features:**
- Chinese character support with proper font loading
- Clickable links for GitHub, email, and portfolio
- Professional A4 layout with optimized spacing
- Format conversion (markdown/HTML → PDF)
- Bilingual content support
- Automatic error recovery and formatting fixes

**Examples:**
- `/resume:generate-pdf ~/resume/resume.md` - Generate PDF from markdown
- `/resume:generate-pdf ~/resume/resume.html ~/resume/wangke_2024.pdf` - Custom output filename

## Installation

This plugin is part of the my-claude-skills repository. Ensure it's properly installed in your Claude Code skills directory.

## Requirements

- Python 3.x
- reportlab library for PDF generation
- Chinese fonts (fonts-wqy-zenhei or fonts-wqy-microhei)
- Web fetch capability for job description URLs

## Common Use Cases

1. **Resume Optimization**: Analyze your current resume and get improvement suggestions
2. **PDF Generation**: Convert markdown resume to professional PDF format
3. **Job Applications**: Generate tailored application emails for specific positions
4. **Bilingual Resumes**: Create Chinese/English resumes with language switching
5. **Content Integration**: Merge work experience from multiple sources
6. **Skills Analysis**: Extract and categorize technical skills from experience

## Tips for Best Results

1. **Start with clean markdown** - Well-structured markdown converts better to PDF
2. **Use consistent formatting** - Makes parsing and optimization easier
3. **Include quantifiable achievements** - Add metrics and impact statements
4. **Keep it concise** - Aim for 1-2 pages maximum
5. **Test PDF output** - Verify Chinese characters and links display correctly
6. **Tailor for each application** - Match keywords and highlight relevant experience

## Troubleshooting

### PDF Generation Issues
- **Chinese characters display as squares**: Install Chinese fonts (`sudo apt-get install fonts-wqy-zenhei`)
- **Links not clickable**: Check link syntax format in source file
- **Layout problems**: Adjust margins or font sizes in the skill

### Content Analysis Issues
- **Missing sections**: Use consistent heading markers (##, ###)
- **Skills not extracted**: Add clear technical keywords and tools
- **Experience gaps**: Provide complete date ranges for all positions

## Author

Created by kewang for personal resume optimization and job application preparation.

## License

Part of the my-claude-skills repository.
