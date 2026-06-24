# wenyan-cli Themes

## Built-in Themes

List all: `wenyan theme -l`

1. **default** - Clean, universal
2. **lapis** - Blue tones, great for tech articles (recommended)
3. **phycat** - Modern, lightweight

Source: https://github.com/caol64/wenyan-core/tree/main/src/assets/themes

## Code Highlight Themes

### Light
- `atom-one-light` - Atom editor light
- `github` - GitHub style
- `solarized-light` - Solarized light (recommended)
- `xcode` - Xcode default

### Dark
- `atom-one-dark` - Atom editor dark
- `dracula` - Dracula theme
- `github-dark` - GitHub dark
- `monokai` - Classic Monokai
- `solarized-dark` - Solarized dark

## Custom Themes

```bash
# Install from local file
wenyan theme --add --name my-theme --path /path/to/theme.css

# Install from URL
wenyan theme --add --name my-theme --path https://example.com/theme.css

# Use custom theme
wenyan publish -f article.md -t my-theme

# Remove theme
wenyan theme --rm my-theme
```

## Recommended Combos

Tech articles: `wenyan publish -f article.md -t lapis -h solarized-light`
Dark style: `wenyan publish -f article.md -t phycat -h dracula`
Clean style: `wenyan publish -f article.md -t default -h github`

## Extra Options

```bash
# Disable Mac-style code blocks
wenyan publish -f article.md -t lapis --no-mac-style

# Disable link-to-footnote conversion
wenyan publish -f article.md -t lapis --no-footnote
```
