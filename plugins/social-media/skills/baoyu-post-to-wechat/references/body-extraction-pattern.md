# Body HTML Extraction Pattern

When publishing via `scripts/publish-draft.py` or `templates/publish-draft.mjs`, the `--file` parameter expects **pure body HTML** — no `<html>`, `<head>`, `<style>` wrapper tags. The `operate_appmsg` API's `content0` field receives this inner content directly.

## Extraction from Full HTML

The `wechat-article-generator` skill produces a complete HTML document. Before passing to the publish script, extract just the body:

### Python (execute_code)

```python
import re

with open("/tmp/article-full.html", "r") as f:
    html = f.read()

# Extract content between <body> tags
body = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL)
if body:
    body_html = body.group(1).strip()
else:
    # Fallback: strip html/head tags
    body_html = re.sub(r'</?(html|head|body|!DOCTYPE)[^>]*>', '', html).strip()

with open("/tmp/article-body.html", "w") as f:
    f.write(body_html)
```

### One-liner for terminal

```bash
python3 -c "
import re
h=open('/tmp/article-full.html').read()
b=re.search(r'<body[^>]*>(.*?)</body>',h,re.DOTALL)
open('/tmp/article-body.html','w').write(b.group(1).strip() if b else h)
"
```

## What Gets Preserved

The `operate_appmsg` API preserves all of these in `filter_content_html`:
- Inline `<style>` blocks within the body
- Inline `<svg>` elements
- `<strong>`, `<em>`, `<code>`, `<blockquote>`, `<h2>`, `<hr>`
- `style=""` attributes on any element

## What Gets Stripped

- `<img src="data:image/...">` (base64 data URIs) — use inline SVG instead
- External CSS `<link>` references
- JavaScript `<script>` tags
