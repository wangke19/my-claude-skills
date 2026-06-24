#!/usr/bin/env python3
"""
WeChat HTML Compatibility Transformer

Converts arbitrary HTML to WeChat-compatible HTML for publishing via operate_appmsg.
Handles: inline styles, code blocks, pseudo-lists, footnote links, blockquotes, tables.

Usage:
    python3 wechat-transform.py input.html output.html
    python3 wechat-transform.py input.html  # writes to stdout
"""

import sys
import re
from html.parser import HTMLParser


def transform_for_wechat(html: str) -> str:
    """Apply all WeChat compatibility transformations to HTML body content."""
    
    # 1. Remove <style> blocks (WeChat strips them anyway)
    html = re.sub(r'<style[^>]*>[\s\S]*?</style>\s*', '', html)
    
    # 2. Remove copy hints
    html = re.sub(
        r'<div[^>]*style="[^"]*background:#fff3cd[^"]*"[^>]*>[\s\S]*?</div>\s*',
        '', html
    )
    html = re.sub(
        r'<section[^>]*style="[^"]*background:#fff3cd[^"]*"[^>]*>[\s\S]*?</section>\s*',
        '', html
    )
    
    # 3. Remove data URI images (WeChat strips them)
    html = re.sub(r'<img[^>]*src="data:image/[^"]*"[^>]*/?\s*>\s*', '', html)
    
    # 4. Transform code blocks: <pre><code> → <section> with dark bg
    def transform_code_block(match):
        lang = match.group(1) or ''
        code = match.group(2)
        # Decode HTML entities
        code = code.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
        code = code.replace('&quot;', '"').replace('&#39;', "'")
        lang_attr = f' data-lang="{lang}"' if lang else ''
        return (
            f'<section style="background:#1e1e2e;border-radius:8px;padding:16px;'
            f'margin:16px 0;overflow-x:auto;"{lang_attr}>'
            f'<p style="color:#abb2bf;font-family:\'Courier New\',Consolas,monospace;'
            f'font-size:13px;line-height:1.7;white-space:pre-wrap;margin:0;'
            f'word-break:break-all;">{code}</p></section>'
        )
    html = re.sub(r'<pre[^>]*>(?:<code[^>]*>)?([\s\S]*?)(?:</code>)?</pre>', transform_code_block, html)
    
    # 5. Transform inline code: add styling
    def transform_inline_code(match):
        code = match.group(1)
        return (
            f'<code style="font-family:\'Courier New\',Consolas,monospace;font-size:13px;'
            f'background:#f6f8fa;padding:2px 5px;border-radius:4px;color:#c0392b;">{code}</code>'
        )
    html = re.sub(r'<code(?:\s[^>]*)?>([\s\S]*?)</code>', transform_inline_code, html)
    
    # 6. Transform <ul>/<li> → pseudo-lists
    def transform_ul(match):
        content = match.group(1)
        items = re.findall(r'<li[^>]*>([\s\S]*?)</li>', content)
        result = []
        for item in items:
            item = item.strip()
            if item:
                result.append(
                    f'<p style="margin:0 0 6px 0;padding-left:12px;">'
                    f'<span style="color:#333;">· {item}</span></p>'
                )
        return '\n'.join(result)
    html = re.sub(r'<ul[^>]*>([\s\S]*?)</ul>', transform_ul, html)
    
    # 7. Transform <ol>/<li> → numbered pseudo-lists
    def transform_ol(match):
        content = match.group(1)
        items = re.findall(r'<li[^>]*>([\s\S]*?)</li>', content)
        result = []
        for i, item in enumerate(items, 1):
            item = item.strip()
            if item:
                result.append(
                    f'<p style="margin:0 0 6px 0;padding-left:12px;">'
                    f'<span style="color:#333;"><b>{i}.</b> {item}</span></p>'
                )
        return '\n'.join(result)
    html = re.sub(r'<ol[^>]*>([\s\S]*?)</ol>', transform_ol, html)
    
    # 8. Collect links → footnote references
    links = []
    link_map = {}
    counter = [0]
    
    def collect_link(match):
        url = match.group(1)
        text = match.group(2)
        if url not in link_map:
            counter[0] += 1
            link_map[url] = counter[0]
            links.append((counter[0], url))
        ref = link_map[url]
        return f'{text}[{ref}]'
    
    html = re.sub(r'<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)</a>', collect_link, html)
    
    # Add footnotes at end if any links were collected
    if links:
        footnotes = '<section style="margin-top:24px;padding-top:12px;border-top:1px solid #eee;font-size:13px;color:#888;">'
        for num, url in links:
            footnotes += f'<p style="margin:0 0 4px 0;">[{num}] {url}</p>'
        footnotes += '</section>'
        html = html.rstrip() + '\n' + footnotes
    
    # 9. Add inline styles to h2 (blue bottom border)
    html = re.sub(
        r'<h2>',
        '<h2 style="font-size:20px;margin-top:8px;margin-bottom:12px;color:#111;'
        'border-bottom:3px solid #1a73e8;padding-bottom:8px;font-weight:700;">',
        html
    )
    
    # 10. Add inline styles to h3
    html = re.sub(
        r'<h3>',
        '<h3 style="font-size:17px;margin-top:24px;margin-bottom:10px;color:#333;font-weight:600;">',
        html
    )
    
    # 11. Convert <blockquote> → <section> with styling
    def transform_blockquote(match):
        content = match.group(1)
        return (
            '<section style="border-left:4px solid #1a73e8;padding:11px 18px;'
            'margin:18px 0;background:#f0f6ff;border-radius:0 8px 8px 0;color:#444;">'
            f'<p style="margin:0;">{content}</p></section>'
        )
    html = re.sub(r'<blockquote[^>]*>([\s\S]*?)</blockquote>', transform_blockquote, html)
    
    # 12. Convert decorative <div> → <section> (operate_appmsg strips <div> background)
    html = re.sub(r'<div([^>]*style="[^"]*background[^"]*"[^>]*)>',
                  lambda m: '<section' + m.group(1) + ' display:block;">', html)
    html = re.sub(r'</div>', '</section>', html)
    
    # 13. Add table inline styles
    html = html.replace('<table>', '<table style="border-collapse:collapse;width:100%;margin:18px 0;font-size:15px;">')
    html = html.replace('<th>', '<th style="background:#f6f8fa;font-weight:600;text-align:left;padding:10px 14px;border:1px solid #e1e4e8;">')
    html = html.replace('<td>', '<td style="padding:10px 14px;border:1px solid #e1e4e8;vertical-align:top;">')
    
    # 14. Clean up empty paragraphs and excessive whitespace
    html = re.sub(r'<p>\s*</p>', '', html)
    html = re.sub(r'\n{3,}', '\n\n', html)
    
    return html.strip()


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 wechat-transform.py input.html [output.html]", file=sys.stderr)
        sys.exit(1)
    
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        html = f.read()
    
    result = transform_for_wechat(html)
    
    if len(sys.argv) >= 3:
        with open(sys.argv[2], 'w', encoding='utf-8') as f:
            f.write(result)
        print(f"Transformed: {len(result)} chars → {sys.argv[2]}", file=sys.stderr)
    else:
        print(result)
