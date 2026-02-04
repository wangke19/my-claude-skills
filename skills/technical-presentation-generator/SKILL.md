---
name: technical-presentation-generator
description: Use when creating technical presentation web pages with multiple slides, bilingual support, code examples, or complex visual requirements. Ideal for conference talks, team presentations, or technical documentation requiring slide-based navigation.
---

# Technical Presentation Generator

## Overview

Generate self-contained HTML presentation files with professional styling, bilingual support, and technical content optimizations. Avoid external dependencies, create cohesive visual themes, and structure content for maximum clarity.

## When to Use

Use this skill when:
- Creating multi-slide technical presentations (10+ slides)
- Need bilingual support (Chinese/English or any language pair)
- Presenting code examples or technical concepts
- Want self-contained HTML files (no external dependencies after initial load)
- Need consistent visual theme across many slides
- Presenting to technical audiences (developers, architects, technical managers)

Don't use when:
- Simple markdown slides are sufficient
- Using existing presentation tools (PowerPoint, Google Slides)
- Single-page documentation (use regular HTML/markdown)
- Non-technical presentations (marketing, sales)

## Core Pattern

### Before: Generic Approach
```
❌ Use reveal.js or similar framework
❌ Default themes and colors
❌ External dependencies for fonts/styles
❌ Limited customization
❌ No bilingual strategy
```

### After: Self-Contained Custom Approach
```
✅ Pure HTML/CSS/JavaScript (no external frameworks)
✅ Custom theme matching content aesthetic
✅ Inline styles and fonts (or self-hosted)
✅ Full control over layout and transitions
✅ Built-in language toggle with proper architecture
```

## Implementation Workflow

### 1. Gather Requirements

**ALWAYS ask these questions upfront:**

```markdown
Before I create the presentation, I need to clarify:

1. **Slide Count**: How many slides total? (Helps plan structure)
2. **Languages**: Which language pair? (Chinese/English, other?)
3. **Visual Theme**: Any preference? (cyberpunk, minimal, corporate, tech-focused)
4. **Code Examples**: What languages will appear? (Go, Python, YAML, etc.)
5. **Content Ratio**: What balance per slide section?
   - Introduction slides: 60% text, 40% charts/visuals
   - Core content: 30% text, 70% charts/visuals
   - Summary slides: 50% text, 50% charts/visuals
6. **Key Topics**: What are the main sections/topics?
```

**Why ask**: Different presentations need different structures. Conference talks differ from internal documentation. Getting this right saves rework.

### 2. Create Structure Template

**Base HTML structure:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Title] :: [Subtitle]</title>
    <!-- Inline Google Fonts or custom fonts -->
    <style>
        /* CSS variables for theming */
        :root {
            --primary-color: #color;
            --secondary-color: #color;
            --bg-color: #color;
            --text-color: #color;
            /* ... more theme variables */
        }

        /* Base styles */
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'YourFont', monospace;
            background: var(--bg-color);
            color: var(--text-color);
        }

        /* Language toggle system */
        .zh { display: none; }
        .en { display: block; }

        body.lang-zh .zh { display: block; }
        body.lang-zh .en { display: none; }

        /* Slide layout */
        .slide {
            min-height: 100vh;
            padding: 80px;
            /* ... */
        }

        /* Navigation */
        .slide-counter { /* ... */ }
    </style>
</head>
<body>
    <header>
        <button id="langToggle">
            <span class="zh">EN</span>
            <span class="en">中文</span>
        </button>
        <div class="slide-counter" id="slideCounter">01/XX</div>
    </header>

    <main>
        <!-- Slides go here -->
    </main>

    <script>
        // Language toggle
        // Slide navigation
        // Scroll tracking
    </script>
</body>
</html>
```

### 3. Bilingual Architecture

**Correct pattern for language switching:**

```html
<!-- Use span wrappers with language classes -->
<h2 class="zh">中文标题</h2>
<h2 class="en">ENGLISH TITLE</h2>

<p class="zh">中文段落内容...</p>
<p class="en">English paragraph content...</p>

<!-- For inline mixed content -->
<p>
    <span class="zh">中文部分</span>
    <span class="en">English part</span>
</p>
```

**JavaScript toggle:**

```javascript
function toggleLang() {
    const body = document.body;
    const currentLang = body.classList.contains('lang-zh') ? 'en' : 'zh';

    if (currentLang === 'zh') {
        body.classList.add('lang-zh');
    } else {
        body.classList.remove('lang-zh');
    }
}

document.getElementById('langToggle').addEventListener('click', toggleLang);
```

**CSS:**

```css
/* Default: English visible */
.zh { display: none; }
.en { display: block; }

/* When Chinese selected */
body.lang-zh .zh { display: block; }
body.lang-zh .en { display: none; }
```

### 4. Slide Structure Patterns

**Title Slide:**
```html
<div class="slide" id="slide-1">
    <div class="slide-label">SLIDE 01 // TITLE</div>
    <div style="text-align: center; padding: 80px 0;">
        <h1 class="zh">主标题</h1>
        <h1 class="en">MAIN TITLE</h1>
        <div class="divider"></div>
        <h2 class="zh">副标题</h2>
        <h2 class="en">SUBTITLE</h2>
        <div style="margin-top: 60px;">
            <span class="tag">TAG 1</span>
            <span class="tag">TAG 2</span>
        </div>
        <div style="margin-top: 80px;">
            <p style="color: var(--accent-color);">YYYY/MM</p>
            <p>Presenter: Name | email@company.com</p>
        </div>
    </div>
</div>
<div class="divider"></div>
```

**Content Slide with Charts (30% text, 70% visuals):**
```html
<div class="slide" id="slide-X">
    <div class="slide-label">SLIDE XX // CATEGORY</div>
    <h2 class="zh">幻灯片标题</h2>
    <h2 class="en">SLIDE TITLE</h2>

    <div class="chart-heavy">
        <div>
            <!-- 30% text content -->
            <h3 class="zh">小节标题</h3>
            <h3 class="en">SECTION TITLE</h3>
            <ul class="zh">
                <li>要点一</li>
                <li>要点二</li>
            </ul>
            <ul class="en">
                <li>Point one</li>
                <li>Point two</li>
            </ul>
        </div>

        <div class="chart">
            <!-- 70% charts/visuals/code -->
            <div class="code-block">
                <pre>/* code example */</pre>
            </div>
        </div>
    </div>
</div>
<div class="divider"></div>
```

**Alert Boxes:**
```html
<div class="alert alert-success">
    <h4 class="zh">✓ 成功信息</h4>
    <h4 class="en">✓ SUCCESS</h4>
    <p class="zh">内容...</p>
    <p class="en">Content...</p>
</div>

<div class="alert alert-warning">
    <h4 class="zh">⚠ 警告信息</h4>
    <h4 class="en">⚠ WARNING</h4>
    <!-- ... -->
</div>

<div class="alert alert-danger">
    <h4 class="zh">✗ 错误信息</h4>
    <h4 class="en">✗ ERROR</h4>
    <!-- ... -->
</div>

<div class="alert alert-info">
    <h4 class="zh">ℹ 提示信息</h4>
    <h4 class="en">ℹ INFO</h4>
    <!-- ... -->
</div>
```

### 5. Code Highlighting

**Pure CSS approach (no external libraries):**

```css
.code-block {
    background: rgba(0, 0, 0, 0.3);
    border-left: 4px solid var(--accent-color);
    padding: 20px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    overflow-x: auto;
}

.code-block pre {
    margin: 0;
    color: var(--text-color);
}

/* Syntax highlighting */
.keyword { color: #ff79c6; font-weight: 700; }
.string { color: #50fa7b; }
.comment { color: #6272a4; font-style: italic; }
.function { color: #8be9fd; }
```

**HTML usage:**

```html
<div class="code-block">
<pre><span class="keyword">package</span> main

<span class="keyword">import</span> (
    <span class="string">"context"</span>
)

<span class="keyword">func</span> <span class="function">Reconcile</span>() {
    <span class="comment">// Reconciliation logic</span>
}
</pre>
</div>
```

### 6. Navigation System

**JavaScript for smooth scrolling:**

```javascript
const slides = document.querySelectorAll('.slide');
const slideCounter = document.getElementById('slideCounter');
let currentSlide = 0;

function updateSlideCounter() {
    const slideNum = String(currentSlide + 1).padStart(2, '0');
    const total = slides.length;
    slideCounter.textContent = `${slideNum}/${total}`;
}

function scrollToSlide(index) {
    if (index >= 0 && index < slides.length) {
        currentSlide = index;
        slides[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
        updateSlideCounter();
    }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
            scrollToSlide(currentSlide + 1);
            break;
        case 'ArrowLeft':
        case 'ArrowUp':
            scrollToSlide(currentSlide - 1);
            break;
        case 'Home':
            scrollToSlide(0);
            break;
        case 'End':
            scrollToSlide(slides.length - 1);
            break;
    }
});

// Scroll tracking
let scrollTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        // Find which slide is in view
        let closest = 0;
        let minDistance = Infinity;

        slides.forEach((slide, index) => {
            const rect = slide.getBoundingClientRect();
            const distance = Math.abs(rect.top);
            if (distance < minDistance) {
                minDistance = distance;
                closest = index;
            }
        });

        currentSlide = closest;
        updateSlideCounter();
    }, 100);
});

updateSlideCounter();
```

### 7. Visual Theme Selection

**Choose theme based on content:**

| Content Type | Suggested Theme | Colors |
|--------------|----------------|--------|
| DevOps/Cloud | Cyberpunk | Cyan, Magenta, Dark BG |
| Corporate | Minimal | Navy, White, Light Gray |
| Data/Analytics | Tech | Blue, Green, Dark |
| Security | Matrix | Green, Black |
| General Tech | Modern | Varied, Clean |

**Example cyberpunk theme:**

```css
:root {
    --cyber-bg: #0a0e1a;
    --cyber-surface: #151b2e;
    --cyber-primary: #00f0ff;
    --cyber-secondary: #ff00f7;
    --cyber-accent: #39ff14;
    --cyber-text: #e4e8f0;
    --cyber-gray: #6b7280;
}

/* Animated grid background */
.cyber-grid {
    position: fixed;
    background-image:
        linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
    background-size: 50px 50px;
}

/* Scan line effect */
.scanlines {
    position: fixed;
    background: linear-gradient(
        transparent 50%,
        rgba(0, 240, 255, 0.03) 50%
    );
    background-size: 100% 4px;
    animation: scan 8s linear infinite;
}
```

## Common Mistakes

### ❌ Mistake 1: Using External Frameworks

**Problem:** Dependencies on CDNs (reveal.js, impress.js) that may fail or change.

**Solution:** Build custom HTML/CSS/JS. It's simpler than it seems and gives full control.

### ❌ Mistake 2: Hardcoded Slide Count

**Problem:**
```javascript
slideCounter.textContent = slideNum + '/30';  // Hardcoded!
```

**Solution:**
```javascript
const total = slides.length;  // Dynamic
slideCounter.textContent = `${slideNum}/${total}`;
```

### ❌ Mistake 3: Poor Bilingual Architecture

**Problem:**
```html
<!-- Mixing languages in same element -->
<h2>Title / 标题</h2>
```

**Solution:**
```html
<h2 class="zh">标题</h2>
<h2 class="en">Title</h2>
```

### ❌ Mistake 4: Forgetting Date Format

**Problem:** No date on title slide.

**Solution:** Always add date in YYYY/MM format on first slide.

### ❌ Mistake 5: Inconsistent Language Classes

**Problem:** Some links or small text without language wrappers show wrong language.

**Solution:** Wrap ALL content in language classes, even single words.

```html
<!-- Wrong -->
<a href="...">GitHub PR #123</a> - 详细说明

<!-- Right -->
<a href="...">GitHub PR #123</a> - <span class="zh">详细说明</span><span class="en">Details</span>
```

## Quick Reference

### Essential Components Checklist

- [ ] Title slide with date (YYYY/MM)
- [ ] Language toggle button
- [ ] Slide counter (XX/Total)
- [ ] Keyboard navigation (arrows, Home, End)
- [ ] All content has language classes
- [ ] Code blocks with syntax highlighting
- [ ] Alert boxes styled
- [ ] Dividers between slides
- [ ] Progress tracking on scroll
- [ ] Responsive design (min-height: 100vh per slide)

### File Structure

```
presentation.html          # Single self-contained file
  ├─ <head>
  │   ├─ <style>          # All CSS inline
  │   └─ Google Fonts     # Or inline base64 fonts
  ├─ <body>
  │   ├─ <header>         # Lang toggle + counter
  │   ├─ <main>
  │   │   └─ .slide × N   # All slides
  │   └─ <script>         # All JS inline
```

### Slide Layout Grid Classes

```css
/* Two columns */
.chart-heavy {
    display: grid;
    grid-template-columns: 30fr 70fr;
    gap: 40px;
}

/* Three columns */
.grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
}

/* Two equal columns */
.grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
}
```

## Real-World Impact

### Before This Skill
- Developers used reveal.js with default themes
- External dependencies caused deployment issues
- Limited customization led to generic-looking presentations
- No standard bilingual pattern
- Inconsistent across presentations

### After This Skill
- Self-contained HTML files
- Fully customized themes matching content
- Reliable offline presentation capability
- Consistent bilingual architecture
- Professional, memorable presentations

### Example Success
The "Unified Automation Strategy for Control Plane" presentation (33 slides):
- Cyberpunk theme perfectly matched DevOps/automation content
- Bilingual toggle worked flawlessly
- Real code examples from actual repositories
- Self-contained 165KB file
- Zero external dependencies
- Professional feedback from technical leadership

## Workflow Example

```
User: "Create presentation about Kubernetes Operators, 15 slides"

You: "Before I create the presentation, I need to clarify:
1. Slide count: 15 slides (confirmed)
2. Languages: Chinese/English bilingual?
3. Visual theme: Technical/corporate/cyberpunk?
4. Code examples: Go, YAML?
5. Content ratio per section?
6. Key topics to cover?"

[User responds]

You: [Create single HTML file with]:
- Custom theme matching preferences
- Bilingual architecture
- 15 slides structured as requested
- Code examples with syntax highlighting
- Navigation system
- All inline, self-contained
```

## Testing Your Presentation

**Before delivery:**

1. Open in browser: `firefox presentation.html`
2. Test language toggle (should switch all content)
3. Test keyboard navigation (arrows, Home, End)
4. Scroll through all slides (counter should update)
5. Check slide numbers match total
6. Verify all code blocks are readable
7. Test on different screen sizes
8. Verify no console errors (F12)

**Checklist:**
- [ ] All X slides present
- [ ] Language toggle works on every slide
- [ ] No hardcoded slide counts
- [ ] Date on title slide (YYYY/MM)
- [ ] Navigation smooth
- [ ] Code highlighting correct
- [ ] No mixed-language text

## Tips

1. **Start with structure**: Get all slides as placeholders first, fill content later
2. **Use CSS variables**: Makes theme changes easy
3. **Keep inline**: Resist temptation to externalize CSS/JS
4. **Test early**: Check language toggle before adding all content
5. **Iterate on theme**: Get user feedback on visual style first
6. **Code syntax**: Use `<span>` for keywords, not complex libraries
7. **Mobile-friendly**: Use relative units (%, vh, vw) not fixed pixels

## When to Deviate

**Use external frameworks if:**
- User explicitly requests reveal.js/impress.js
- Interactive animations beyond CSS capabilities needed
- Presentation will be edited by non-technical users
- Tight deadline and boilerplate acceptable

**Always inform user of trade-offs.**
