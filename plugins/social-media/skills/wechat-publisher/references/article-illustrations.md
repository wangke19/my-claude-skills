# Generating Article Illustrations (No GPU)

When you can't use `image_gen` (no GPU, API unavailable, or quota exceeded), generate professional-looking article illustrations using HTML/CSS rendered via Chromium headless screenshot.

## Workflow

### 1. Design HTML/CSS

Create a standalone HTML file with:
- Fixed dimensions matching target size (e.g., `width: 1080px; height: 864px`)
- `overflow: hidden` on body
- Dark tech aesthetic works well for AI/tech topics: `linear-gradient(135deg, #0f172a, #1e293b)`
- System fonts: `-apple-system, 'PingFang SC', 'Noto Sans SC', sans-serif`
- Use CSS grid/flexbox for layout, no external dependencies

### 2. Render with Chromium

```bash
/usr/bin/chromium --headless --no-sandbox --disable-gpu \
  --screenshot=/path/to/output.png \
  --window-size=WxH \
  "file:///path/to/input.html"
```

- `--window-size` must match the body dimensions
- Output is written as PNG
- Chromium must be installed (`chromium` or `google-chrome`)
- On Debian: `apt install -t bullseye-backports chromium`

### 3. Image Sizes

| Purpose | Size | Notes |
|---------|------|-------|
| Cover (封面图) | 1080×864 | WeChat recommended 2.5:2 ratio |
| Content image | 1080×600 | Good for infographics, diagrams, comparisons |
| Square | 1080×1080 | General purpose |

### 4. Design Patterns

**Timeline/Progression**: Horizontal dots connected by a colored line, dates above, descriptions below. Color transitions (green→yellow→red) convey escalation.

**Code/Technical**: Pseudo-code blocks with syntax-colored spans, data flow boxes (input→filter→output), monospace font for code lines.

**Comparison (A vs B)**: Two side-by-side panels, VS badge in center. Left=walled/red tones, Right=open/green tones. Items listed with checkmarks or strikethroughs.

**Escalation Steps**: Numbered vertical cards, color intensity increasing (yellow→orange→red→dark red). Arrow connectors between steps. Side panel for parallel track (e.g., Desktop vs CLI).

**Cover**: Central title with gradient text highlight, background glow effects (radial gradients), grid pattern overlay, minimal icon row at top, subtitle at bottom.

### 5. Tips

- Always use `--screenshot=ABSOLUTE_PATH` — relative paths may silently fail
- Verify output exists and has non-zero size after rendering
- Test one image first before batch rendering
- CSS `backdrop-filter: blur()` may not render in headless — use solid backgrounds as fallback
- `animation` properties won't be visible in a static screenshot — don't rely on them for visual effect
- Keep HTML self-contained (no external fonts/images) for reliability
