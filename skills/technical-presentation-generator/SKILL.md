---
name: technical-presentation-generator
description: This skill should be used when creating technical presentation web pages with multiple slides, bilingual support, code examples, or complex visual requirements. Ideal for conference talks, team presentations, or technical documentation requiring slide-based navigation. Also triggered when a user asks to "make slides fill the screen", "resize for projector", "auto-scale to resolution", or "full-viewport presentation".
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
✅ Full-viewport snap layout — each slide fills the screen exactly
✅ Fluid typography via clamp() — auto-scales to any resolution
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
5. **Content Ratio**: The default ratios per slide section are:
   - Introduction slides: 60% text, 40% charts/visuals
   - Core content: 30% text, 70% charts/visuals
   - Summary slides: 50% text, 50% charts/visuals
   Would you like to keep these defaults, or adjust any of them?
6. **Key Topics**: What are the main sections/topics?
```

**Why ask**: Different presentations need different structures. Conference talks differ from internal documentation. Getting this right saves rework.

**Content Ratio guidance:**
- Always present the three defaults explicitly and ask the user to confirm or adjust — do not silently apply defaults.
- If the user adjusts ratios, record their preferences and apply them consistently across all slides of that type.
- Common adjustments: data-heavy talks may want core content at 20% text / 80% visuals; executive briefings may prefer 50/50 throughout.

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

        /* Full-viewport snap layout */
        html { height: 100%; overflow: hidden; }
        body {
            height: 100%;
            overflow-y: scroll;
            scroll-snap-type: y mandatory;
            scroll-behavior: smooth;
        }

        .slide {
            height: 100vh;               /* exactly one screen */
            scroll-snap-align: start;
            scroll-snap-stop: always;    /* never skip slides */
            padding: 80px 7vw 60px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            overflow: hidden;            /* clip overflowing content */
        }
        .slide > * { flex-shrink: 1; min-height: 0; }

        /* Dividers: zero-height, invisible */
        .divider { height: 0; border: none; margin: 0; }

        /* Fluid typography — scales with viewport width */
        h1 { font-size: clamp(32px, 4vw, 62px); }
        h2 { font-size: clamp(22px, 2.6vw, 40px); }
        h3 { font-size: clamp(15px, 1.5vw, 24px); }
        p, li { font-size: clamp(13px, 1.15vw, 19px); }
        .subtitle { font-size: clamp(14px, 1.4vw, 22px); }

        /* Navigation */
        .slide-counter { /* ... */ }

        /* Stack to single column on narrow screens */
        @media (max-width: 900px) {
            .slide { padding: 70px 5vw 40px; }
            .grid-2, .grid-3, .chart-heavy { grid-template-columns: 1fr; }
        }
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
        // Snap-aware slide navigation (see references/responsive-layout.md)
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
/* IMPORTANT: Default language is ENGLISH */
/* English visible by default, Chinese hidden */
.zh { display: none; }
.en { display: block; }

/* When Chinese toggle clicked, add 'lang-zh' class to body */
body.lang-zh .zh { display: block; }
body.lang-zh .en { display: none; }
```

**Key Point:** English is the default language. Chinese appears only when user clicks the language toggle button.

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

**IMPORTANT:** When using the full-viewport snap layout (recommended), `body` is the scroll container — not `window`. Use `body.scrollTo()` and listen on `body`, not `window`.

```javascript
const slides = document.querySelectorAll('.slide');
const scroller = document.body;   // snap container
let currentSlide = 0;

function updateSlideCounter() {
    const num = String(currentSlide + 1).padStart(2, '0');
    slideCounter.textContent = `${num}/${slides.length}`;
}

function scrollToSlide(index) {
    if (index < 0 || index >= slides.length) return;
    currentSlide = index;
    scroller.scrollTo({ top: slides[index].offsetTop, behavior: 'smooth' });
    updateSlideCounter();
}

// Keyboard: arrows, space, Home, End, F (fullscreen)
document.addEventListener('keydown', function(e) {
    switch(e.key) {
        case 'ArrowRight': case 'ArrowDown': case ' ':
            e.preventDefault(); scrollToSlide(currentSlide + 1); break;
        case 'ArrowLeft': case 'ArrowUp':
            e.preventDefault(); scrollToSlide(currentSlide - 1); break;
        case 'Home': e.preventDefault(); scrollToSlide(0); break;
        case 'End':  e.preventDefault(); scrollToSlide(slides.length - 1); break;
        case 'f': case 'F':
            document.fullscreenElement
                ? document.exitFullscreen()
                : document.documentElement.requestFullscreen();
            break;
    }
});

// Scroll tracking — read body.scrollTop, not window.scrollY
let scrollTimer;
scroller.addEventListener('scroll', function() {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function() {
        const top = scroller.scrollTop;
        let closest = 0, minDist = Infinity;
        slides.forEach(function(slide, i) {
            const dist = Math.abs(slide.offsetTop - top);
            if (dist < minDist) { minDist = dist; closest = i; }
        });
        currentSlide = closest;
        updateSlideCounter();
    }, 80);
});

updateSlideCounter();
```

For full details including touch swipe support, see **`references/responsive-layout.md`**.

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

### ❌ Mistake 5: Wrong Default Language

**Problem:** Setting Chinese as default instead of English.

**Solution:**
```css
/* CORRECT: English default */
.zh { display: none; }
.en { display: block; }

/* WRONG: Chinese default */
.zh { display: block; }  /* ❌ Don't do this! */
.en { display: none; }
```

English should ALWAYS be the default language for international accessibility.

### ❌ Mistake 6: Inconsistent Language Classes

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
- [ ] **English as default language** (.en display: block, .zh display: none)
- [ ] Slide counter (XX/Total) — dynamic, not hardcoded
- [ ] Keyboard navigation (arrows, space, Home, End, F for fullscreen)
- [ ] Touch swipe support
- [ ] All content has language classes
- [ ] Code blocks with syntax highlighting
- [ ] Alert boxes styled
- [ ] **Full-viewport snap layout** (`body` as scroll-snap container, `height: 100vh` per slide)
- [ ] **Fluid typography** — all font sizes use `clamp(min, vw, max)`
- [ ] **Dividers are zero-height** (no 1px dividers that break snap alignment)
- [ ] Progress tracking on scroll (reads `body.scrollTop`)
- [ ] Responsive breakpoint stacks grids to single column ≤ 900px

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
5. Content ratio — the defaults are:
   - Introduction slides: 60% text, 40% charts/visuals
   - Core content: 30% text, 70% charts/visuals
   - Summary slides: 50% text, 50% charts/visuals
   Would you like to keep these, or adjust any of them?
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
2. **Verify English is default** (should show English text initially)
3. Test language toggle (should switch all content to Chinese)
4. Test keyboard navigation (arrows, Home, End)
5. Scroll through all slides (counter should update)
6. Check slide numbers match total
7. Verify all code blocks are readable
8. Test on different screen sizes
9. Verify no console errors (F12)

**Checklist:**
- [ ] All X slides present
- [ ] **English is default language** (verify on page load)
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
7. **Viewport-relative units always**: Use `vw`, `vh`, `clamp()` — never fixed `px` for layout/typography
8. **Press F to present**: The fullscreen shortcut turns any browser into a presentation tool

## When to Deviate

**Use external frameworks if:**
- User explicitly requests reveal.js/impress.js
- Interactive animations beyond CSS capabilities needed
- Presentation will be edited by non-technical users
- Tight deadline and boilerplate acceptable

**Always inform user of trade-offs.**

## Additional Resources

### Reference Files

- **`references/responsive-layout.md`** — Complete full-viewport snap layout pattern: CSS snap container setup, fluid `clamp()` typography table, viewport-relative spacing, snap-aware JS navigation, touch swipe, common mistakes, and a full checklist. Consult this whenever implementing or debugging responsive/viewport behavior.
