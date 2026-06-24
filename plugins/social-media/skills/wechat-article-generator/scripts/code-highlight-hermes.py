#!/usr/bin/env python3
"""
Hermes CLI 代码语法高亮处理器

用于将微信公众号文章中的普通代码块转换为带语法高亮的格式。
参考 GitHub 代码块样式，高亮 hermes 命令、子命令、参数标志、字符串值和文件路径。

用法：
    python code-highlight-hermes.py <input.html> [output.html]

示例：
    python code-highlight-hermes.py /tmp/article-wechat.html /tmp/article-highlighted.html
"""

import re
import sys


# 占位符（使用不会被 regex 解释的特殊字符）
P_PATH = '\u0004'
P_STR = '\u0005'

# Hermes 子命令列表
SUBCOMMANDS = [
    'profile', 'kanban', 'config', 'gateway', 'doctor', 'skills',
    'chat', 'setup', 'use', 'clone', 'import', 'export', 'delete',
    'list', 'show', 'add', 'move', 'update', 'create', 'rename',
    'install', 'run', 'stop', 'start', 'remove'
]


def highlight_hermes_cmd(code: str) -> str:
    """将 hermes 命令行代码转换为带语法高亮的格式"""
    code = code.strip()
    lines = code.split('\n')
    result_lines = []
    
    for line in lines:
        highlighted = line
        
        # Step 1: 先保护路径和字符串
        path_matches = []
        def save_path(m):
            path_matches.append(m.group(0))
            return f'{P_PATH}{len(path_matches)-1}{P_PATH}'
        
        # 匹配家目录路径 ~/xxx 和绝对路径 /xxx
        highlighted = re.sub(r'(~[\w./-]+)', save_path, highlighted)
        highlighted = re.sub(r'(/[\w./-]+)', save_path, highlighted)
        
        # 保护字符串
        str_matches = []
        def save_str(m):
            str_matches.append(m.group(0))
            return f'{P_STR}{len(str_matches)-1}{P_STR}'
        highlighted = re.sub(r'"([^"]*)"', save_str, highlighted)
        
        # Step 2: 高亮 hermes 命令
        highlighted = re.sub(r'\bhermes\b', '<span class="code-snippet__attribute">hermes</span>', highlighted)
        
        # Step 3: 高亮子命令
        for cmd in SUBCOMMANDS:
            highlighted = re.sub(rf'\b{cmd}\b', f'<span class="code-snippet__attribute">{cmd}</span>', highlighted)
        
        # Step 4: 高亮 flag
        highlighted = re.sub(r'(--[\w-]+)', r'<span class="code-snippet__flag">\1</span>', highlighted)
        
        # Step 5: 恢复路径
        for i, path in enumerate(path_matches):
            highlighted = highlighted.replace(
                f'{P_PATH}{i}{P_PATH}',
                f'<span class="code-snippet__path">{path}</span>'
            )
        
        # Step 6: 恢复字符串
        for i, s in enumerate(str_matches):
            highlighted = highlighted.replace(
                f'{P_STR}{i}{P_STR}',
                f'<span class="code-snippet__string">{s}</span>'
            )
        
        result_lines.append(highlighted)
    
    return '\n'.join(result_lines)


def wrap_code_block(code_content: str) -> str:
    """将代码块包装成带语法高亮的完整 HTML"""
    highlighted = highlight_hermes_cmd(code_content)
    return f'''<section class="code-snippet__js">
<pre class="code-snippet__js code-snippet code-snippet_nowrap" data-lang="shell"><code><span leaf="">{highlighted}</span></code></pre>
</section>'''


def process_article_code_blocks(filepath: str, output_path: str = None) -> int:
    """处理文章中的所有代码块
    
    Args:
        filepath: 输入 HTML 文件路径
        output_path: 输出文件路径（默认为原文件覆盖）
    
    Returns:
        处理的代码块数量
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 找到所有 <pre><code> 代码块
    pattern = r'<pre><code[^>]*>(.*?)</code></pre>'
    
    def replace_code_block(match):
        code_content = match.group(1)
        # 解码 HTML 实体
        code_content = code_content.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
        # 高亮并包装
        wrapped = wrap_code_block(code_content)
        return wrapped
    
    new_content = re.sub(pattern, replace_code_block, content, flags=re.DOTALL)
    
    target_path = output_path if output_path else filepath
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    count = len(re.findall(pattern, content, flags=re.DOTALL))
    return count


def add_code_highlight_css(filepath: str) -> bool:
    """在文章的 <style> 块中添加代码高亮 CSS"""
    css = '''
    /* 代码块样式 */
    .code-snippet__js {
      margin: 20px 0;
    }
    .code-snippet__js pre {
      background: #f6f8fa;
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      padding: 16px;
      overflow-x: auto;
      font-family: "SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace;
      font-size: 14px;
      line-height: 1.5;
    }
    .code-snippet__js code {
      font-family: inherit;
    }
    .code-snippet__js code span[leaf=""] {
      display: block;
    }
    /* 语法高亮颜色 */
    .code-snippet__attribute {
      color: #d73a49;
      font-weight: 600;
    }
    .code-snippet__flag {
      color: #005cc5;
    }
    .code-snippet__string {
      color: #032f62;
    }
    .code-snippet__path {
      color: #6a737d;
    }
'''
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 找到 <style> 块的结束位置
    style_match = re.search(r'(<style>)(.*?)(</style>)', content, re.DOTALL)
    if style_match:
        # 在 style 块内容末尾添加代码高亮 CSS
        new_style = style_match.group(1) + style_match.group(2) + css + style_match.group(3)
        new_content = content[:style_match.start()] + new_style + content[style_match.end():]
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python code-highlight-hermes.py <input.html> [output.html]")
        print("示例: python code-highlight-hermes.py /tmp/article.html /tmp/article-highlighted.html")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # 添加 CSS
    if add_code_highlight_css(input_file):
        print(f"✅ CSS 已添加到 {input_file}")
    
    # 处理代码块
    count = process_article_code_blocks(input_file, output_file)
    print(f"✅ 处理了 {count} 个代码块")
    
    if output_file:
        print(f"输出: {output_file}")
