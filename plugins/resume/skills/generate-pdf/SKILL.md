---
description: Generate professional PDF resume from markdown or HTML with Chinese font support
argument-hint: "<input_file> [output_file]"
---

## Name
resume:generate-pdf

## Synopsis
/resume:generate-pdf <input_file> [output_file]

## Description
Generate a professional PDF resume from markdown or HTML source files. This skill handles Chinese character rendering, creates clickable links for contact information, optimizes layout for A4 page size, and fixes common PDF formatting issues. Perfect for creating polished resume documents ready for job applications.

## Key Features

- **Chinese Character Support**: Proper font loading and rendering for Chinese characters
- **Clickable Links**: GitHub, email, and portfolio links become clickable in PDF
- **Professional Layout**: A4 page size with optimized margins and spacing
- **Format Conversion**: Convert from markdown or HTML to professional PDF
- **Bilingual Support**: Handle both Chinese and English content
- **Error Recovery**: Fix common PDF generation issues automatically

## Implementation

### Step 1: Input Processing

1. **Validate input file**:
   ```bash
   input_file="$ARGUMENTS"
   if [ ! -f "$input_file" ]; then
       echo "Error: Input file not found: $input_file"
       echo "Usage: /resume:generate-pdf <input_file> [output_file]"
       return 1
   fi
   ```

2. **Determine output file name**:
   ```bash
   if [ -n "$2" ]; then
       output_file="$2"
   else
       # Generate output filename from input
       base_name="${input_file%.*}"
       output_file="${base_name}_resume.pdf"
   fi
   ```

3. **Detect input format**:
   - Check file extension (.md, .html, .txt)
   - Read file content and structure
   - Identify sections and formatting

### Step 2: Content Parsing

1. **Extract resume sections**:
   ```
   - Contact information (name, email, phone, location)
   - Professional summary
   - Work experience (company, role, dates, achievements)
   - Technical skills (categorized by domain)
   - Education background
   - Additional information
   ```

2. **Parse special elements**:
   - Links (GitHub, email, portfolio)
   - Tables (skills, achievements)
   - Lists (responsibilities, projects)
   - Emojis and special characters
   - Date ranges and durations

### Step 3: PDF Generation

1. **Setup PDF document**:
   ```python
   from reportlab.lib.pagesizes import A4
   from reportlab.platypus import SimpleDocTemplate

   doc = SimpleDocTemplate(
       output_file,
       pagesize=A4,
       rightMargin=1.5*cm,
       leftMargin=1.5*cm,
       topMargin=1.5*cm,
       bottomMargin=1.5*cm
   )
   ```

2. **Load Chinese fonts**:
   ```python
   font_paths = [
       '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
       '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc',
       '/usr/share/fonts/truetype/arphic/uming.ttc',
   ]

   for font_path in font_paths:
       try:
           pdfmetrics.registerFont(TTFont('ChineseFont', font_path, subfontIndex=0))
           break
       except:
           continue
   ```

3. **Create paragraph styles**:
   - Title style (22pt, centered, dark blue)
   - Section headers (14pt, dark blue, with spacing)
   - Body text (9pt, black, 14pt leading)
   - Small text (8pt, for detailed info)
   - Link style (blue, underlined)

4. **Build document structure**:
   ```
   [Header with name and title]
   [Contact information with clickable links]
   [Professional summary]
   [Work experience with tables]
   [Technical skills organized by category]
   [Education]
   [Core competencies]
   [Additional information]
   ```

### Step 4: Link Processing

1. **Create clickable links**:
   ```python
   def create_linked_text(label, text, url):
       return f'{label}: <link href="{url}" color="blue">{text}</link>'
   ```

2. **Process contact information**:
   - GitHub: `<link href="https://github.com/username">username</link>`
   - Email: `<link href="mailto:user@example.com">user@example.com</link>`
   - Portfolio: `<link href="https://portfolio.url">portfolio</link>`

### Step 5: Table Formatting

1. **Achievement tables**:
   ```python
   data = [
       ['Period', 'Achievement'],
       ['2026', 'Completed OTE framework migration...'],
       ['2025', 'Large-scale infrastructure simplification...'],
   ]

   table = Table(data, colWidths=[1.8*cm, 12.7*cm])
   table.setStyle(TableStyle([
       ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#667eea')),
       ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
       ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
       ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, light_gray]),
   ]))
   ```

2. **Skills tables**:
   - Category column (2.5cm width)
   - Content column (13cm width)
   - Color-coded categories
   - Alternating row backgrounds

### Step 6: Error Handling and Fixes

1. **Character encoding issues**:
   - Use UTF-8 encoding throughout
   - Register Chinese fonts with proper subfontIndex
   - Handle special characters and emojis

2. **Layout problems**:
   - Adjust cell padding and margins
   - Use proper leading (line spacing)
   - Implement page breaks when needed
   - Balance content across pages

3. **Link formatting**:
   - Use proper `<link href="">` syntax
   - Set link color to blue
   - Ensure links are clickable in PDF readers
   - Test all generated links

## Examples

### Generate PDF from markdown
```
User: /resume:generate-pdf ~/resume/resume.md
```
Creates `~/resume/resume_resume.pdf` with optimized formatting

### Generate with custom output name
```
User: /resume:generate-pdf ~/resume/resume.md ~/resume/wangke_resume_2024.pdf
```
Creates PDF with specified filename

### Generate from HTML resume
```
User: /resume:generate-pdf ~/resume/resume.html ~/resume/wangke.pdf
```
Converts HTML to professional PDF format

## Troubleshooting

### Chinese characters display as squares
```bash
# Check font availability
fc-list :lang=zh | grep -i "noto\|wqy"

# Install Chinese fonts if needed
sudo apt-get install fonts-wqy-zenhei fonts-wqy-microhei
```

### Links not clickable in PDF
- Verify link syntax: `<link href="url">text</link>`
- Check PDF reader supports links
- Ensure URL protocol is included (http://, https://, mailto:)

### Table columns too narrow
- Adjust column widths in Table() constructor
- Reduce font size for crowded content
- Consider horizontal table layout

### Page overflow
- Add `PageBreak()` between sections
- Reduce font sizes slightly
- Adjust margins and spacing
- Split large tables across pages

## Output Quality Checklist

- [ ] Chinese characters display correctly
- [ ] All links are clickable and work
- [ ] Layout fits A4 page properly
- [ ] Text is legible (appropriate font size)
- [ ] Tables are well-formatted
- [ ] Section headers are clear
- [ ] Contact information is prominent
- [ ] Professional appearance overall
- [ ] File size is reasonable (< 500KB)
- [ ] PDF opens without errors in common readers

## Advanced Options

### Custom color scheme
```python
# Modify color variables
primary_color = colors.HexColor('#667eea')  # Purple
header_color = colors.HexColor('#2c3e50')   # Dark blue
accent_color = colors.HexColor('#667eea')   # Purple
```

### Font customization
```python
# Use specific Chinese font
pdfmetrics.registerFont(
    TTFont('ChineseFont', '/path/to/font.ttc', subfontIndex=0)
)
```

### Layout adjustments
```python
# Modify margins and spacing
doc = SimpleDocTemplate(
    output_file,
    pagesize=A4,
    rightMargin=2*cm,   # Adjust right margin
    leftMargin=2*cm,    # Adjust left margin
    topMargin=2*cm,     # Adjust top margin
    bottomMargin=2*cm   # Adjust bottom margin
)
```
