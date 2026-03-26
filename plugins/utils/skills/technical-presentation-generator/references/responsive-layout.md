# Responsive Full-Viewport Layout

## Overview

This reference covers the full-viewport snap layout pattern — each slide fills exactly one screen at any resolution, with fluid typography that scales automatically using CSS `clamp()`. Apply this pattern for all presentations so they work correctly on laptops, external monitors, projectors, and 4K displays without any manual adjustment.

---

## Core Layout Architecture

### The Snap Container Model

The key insight: make `body` the scroll-snap container, not `window`. This gives precise control over which element snaps and how.

```css
html {
    height: 100%;
    overflow: hidden;   /* prevent double scrollbars */
}

body {
    height: 100%;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;   /* hard snap, no in-between states */
    scroll-behavior: smooth;
}
```

Each slide then snaps exactly into the viewport:

```css
.slide {
    height: 100vh;                  /* exactly one screen tall */
    scroll-snap-align: start;       /* snap to top of viewport */
    scroll-snap-stop: always;       /* never skip slides on fast scroll */
    padding: 80px 7vw 60px;        /* viewport-relative padding */
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;               /* clip content that overflows at small screens */
}
```

### Dividers Become Zero-Height

Divider elements between slides must not break the snap rhythm. Set them to zero height:

```css
.divider {
    height: 0;
    border: none;
    background: none;
    margin: 0;
    scroll-snap-align: none;
}
```

**Do not** use visible `1px` dividers when using snap layout — they shift slide boundaries by 1px and cause misalignment. Use subtle slide backgrounds or borders instead if visual separation is needed.

---

## Fluid Typography with `clamp()`

Use `clamp(minimum, preferred-viewport-unit, maximum)` for every font size. This makes text automatically smaller on compact screens and larger on wide/4K displays, without media queries.

### Formula

```
clamp(floor-px, scale-vw, ceiling-px)
```

- **floor**: minimum readable size (mobile / small laptop)
- **scale**: `vw`-based value — what the font would be at "normal" 1920px width
- **ceiling**: maximum at very large screens (27" 4K monitors, projectors)

### Recommended Scale Table

| Element | CSS |
|---|---|
| `h1` | `clamp(32px, 4vw, 62px)` |
| `h2` | `clamp(22px, 2.6vw, 40px)` |
| `h3` | `clamp(15px, 1.5vw, 24px)` |
| `p, li` | `clamp(13px, 1.15vw, 19px)` |
| `.subtitle` | `clamp(14px, 1.4vw, 22px)` |
| `.big-quote` | `clamp(14px, 1.5vw, 24px)` |
| `.stat-number` | `clamp(28px, 3.2vw, 48px)` |
| `.stat-label` | `clamp(11px, 0.9vw, 15px)` |
| `.alert h4` | `clamp(13px, 1vw, 16px)` |
| `.alert p` | `clamp(12px, 0.9vw, 15px)` |
| code blocks | `clamp(11px, 0.85vw, 14px)` |

### Full Typography Block

```css
h1 { font-size: clamp(32px, 4vw, 62px); font-weight: 700; line-height: 1.15; margin-bottom: 16px; }
h2 { font-size: clamp(22px, 2.6vw, 40px); font-weight: 700; margin-bottom: 20px; }
h3 { font-size: clamp(15px, 1.5vw, 24px); font-weight: 600; margin-bottom: 12px; }
p, li { font-size: clamp(13px, 1.15vw, 19px); line-height: 1.75; }
.subtitle { font-size: clamp(14px, 1.4vw, 22px); }
.big-quote { font-size: clamp(14px, 1.5vw, 24px); }
.stat-number { font-size: clamp(28px, 3.2vw, 48px); }
.stat-label  { font-size: clamp(11px, 0.9vw, 15px); }
```

---

## Viewport-Relative Spacing

Replace fixed `px` gaps and padding with viewport-relative units so layouts breathe proportionally at any resolution:

```css
/* Grid gaps */
.grid-2      { gap: 2vw;   }
.grid-3      { gap: 1.5vw; }
.grid-4      { gap: 1.2vw; }
.chart-heavy { gap: 2.5vw; }
.text-heavy  { gap: 2.5vw; }
.half-half   { gap: 2.5vw; }

/* Card padding scales with viewport */
.card {
    padding: clamp(12px, 1.5vh, 24px) clamp(14px, 1.5vw, 24px);
}

/* Stat boxes */
.stat-box {
    padding: clamp(12px, 2vh, 28px) clamp(10px, 1.5vw, 20px);
}

/* Alert/alert padding */
.alert {
    padding: clamp(12px, 1.5vh, 20px) clamp(14px, 1.5vw, 22px);
}
```

---

## JavaScript: Snap-Aware Navigation

When `body` is the scroll container, use `body.scrollTo()` — not `element.scrollIntoView()` — and track scroll position via `body.scrollTop`:

```javascript
const slides = document.querySelectorAll('.slide');
const scroller = document.body;   // the snap container
let currentSlide = 0;

function scrollToSlide(index) {
    if (index < 0 || index >= slides.length) return;
    currentSlide = index;
    scroller.scrollTo({
        top: slides[index].offsetTop,
        behavior: 'smooth'
    });
    updateSlideCounter();
}

// Scroll tracking — read offsetTop, not getBoundingClientRect
let scrollTimer;
scroller.addEventListener('scroll', function() {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function() {
        const scrollTop = scroller.scrollTop;
        let closest = 0, minDist = Infinity;
        slides.forEach(function(slide, i) {
            const dist = Math.abs(slide.offsetTop - scrollTop);
            if (dist < minDist) { minDist = dist; closest = i; }
        });
        currentSlide = closest;
        updateSlideCounter();
    }, 80);
});
```

### Keyboard Shortcuts — Full Set

```javascript
document.addEventListener('keydown', function(e) {
    switch(e.key) {
        case 'ArrowRight': case 'ArrowDown': case ' ':
            e.preventDefault();
            scrollToSlide(currentSlide + 1);
            break;
        case 'ArrowLeft': case 'ArrowUp':
            e.preventDefault();
            scrollToSlide(currentSlide - 1);
            break;
        case 'Home':
            e.preventDefault(); scrollToSlide(0); break;
        case 'End':
            e.preventDefault(); scrollToSlide(slides.length - 1); break;
        case 'f': case 'F':
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
            break;
    }
});
```

### Touch / Swipe Support

```javascript
let touchStartY = 0;
scroller.addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
}, { passive: true });

scroller.addEventListener('touchend', function(e) {
    const dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 40) {
        scrollToSlide(currentSlide + (dy > 0 ? 1 : -1));
    }
}, { passive: true });
```

---

## Responsive Breakpoints

Stack multi-column grids to single-column on narrow/portrait screens:

```css
@media (max-width: 900px) {
    .slide { padding: 70px 5vw 40px; }
    .grid-2, .grid-3, .grid-4,
    .chart-heavy, .text-heavy, .half-half {
        grid-template-columns: 1fr;
    }
}

/* Prevent flex children from overflowing fixed-height slides */
.slide > * { flex-shrink: 1; min-height: 0; }
```

---

## Title Slide Special Case

Title slides often use custom CSS (e.g., corporate branding). Ensure they still fill the viewport:

```css
/* Custom branded slide still fills 100vh */
.rh-title-content {
    position: relative;
    z-index: 10;
    padding: 5vh 7vw;           /* viewport-relative, not fixed px */
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;               /* fill the parent .slide which is 100vh */
}
```

Set `padding: 0; overflow: hidden` on the `.slide` wrapper itself so the branding graphics fill edge-to-edge:

```html
<div class="slide" id="slide-1" style="padding:0; overflow:hidden;">
    <div class="branded-content">...</div>
</div>
```

Scale title text with `clamp()` too:

```css
.rh-main-title { font-size: clamp(36px, 4.5vw, 68px); }
.rh-logo-text  { font-size: clamp(18px, 1.8vw, 28px); }
.rh-meta p     { font-size: clamp(16px, 1.5vw, 24px); }
```

---

## Common Mistakes

### ❌ Using `min-height: 100vh` instead of `height: 100vh`

`min-height` allows slides to grow taller than the viewport, breaking snap alignment for content-heavy slides. Use `height: 100vh` and `overflow: hidden` to clip.

### ❌ Scroll tracking on `window` instead of `body`

When `body` is the snap container, `window.scrollY` does not update — only `body.scrollTop` does.

```javascript
// WRONG — window.scrollY stays 0
window.addEventListener('scroll', ...)

// CORRECT — body is the scroller
document.body.addEventListener('scroll', ...)
```

### ❌ Fixed `px` gaps that crush content on small screens

```css
/* Bad — 40px gap on 768px screen wastes ~5% of width */
.grid-2 { gap: 40px; }

/* Good — scales proportionally */
.grid-2 { gap: 2vw; }
```

### ❌ Visible 1px dividers between slides

```css
/* Bad — shifts snap boundary by 1px */
.divider { height: 1px; background: ...; }

/* Good — zero height, invisible */
.divider { height: 0; border: none; margin: 0; }
```

### ❌ Forgetting `scroll-snap-stop: always`

Without `always`, fast trackpad swipes or rapid arrow key presses can skip slides:

```css
.slide {
    scroll-snap-align: start;
    scroll-snap-stop: always;   /* required — never skip */
}
```

---

## Checklist: Responsive Full-Viewport Layout

- [ ] `html { height: 100%; overflow: hidden; }`
- [ ] `body { height: 100%; overflow-y: scroll; scroll-snap-type: y mandatory; }`
- [ ] `.slide { height: 100vh; scroll-snap-align: start; scroll-snap-stop: always; overflow: hidden; }`
- [ ] `.divider { height: 0; border: none; margin: 0; }`
- [ ] All font sizes use `clamp(min, vw-value, max)`
- [ ] All grid gaps use `vw` units
- [ ] All card/stat/alert padding uses `clamp()`
- [ ] JS scroll tracking reads `body.scrollTop`, not `window.scrollY`
- [ ] JS navigation calls `body.scrollTo({ top: slide.offsetTop })`
- [ ] Keyboard: arrows, space, Home, End, F (fullscreen)
- [ ] Touch swipe handlers attached to `body`
- [ ] `@media (max-width: 900px)` stacks grids to single column
- [ ] `.slide > * { flex-shrink: 1; min-height: 0; }` prevents overflow
- [ ] Title slide uses `height: 100%` on inner content wrapper
