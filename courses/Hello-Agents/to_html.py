#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将Markdown转换为HTML，以便在浏览器中打开并打印为PDF
"""

import os
import re
import markdown
from datetime import datetime

MARKDOWN_FILE = "/mnt/c/Users/Administrator/Desktop/公开课/openClasses/courses/Hello-Agents/Hello-Agents-完整课程.md"
HTML_FILE = "/mnt/c/Users/Administrator/Desktop/公开课/openClasses/courses/Hello-Agents/Hello-Agents-完整课程.html"

def markdown_to_html():
    """将Markdown转换为HTML"""

    # 读取Markdown文件
    if not os.path.exists(MARKDOWN_FILE):
        print(f"❌ 文件不存在: {MARKDOWN_FILE}")
        return

    with open(MARKDOWN_FILE, 'r', encoding='utf-8') as f:
        md_content = f.read()

    # 转换为HTML
    html_content = markdown.markdown(md_content)

    # 创建完整的HTML文档
    html_template = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello-Agents：从零构建智能体应用</title>
    <style>
        body {{
            font-family: "Microsoft YaHei", "SimHei", "PingFang SC", Arial, sans-serif;
            line-height: 1.8;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background-color: #fff;
        }}

        h1, h2, h3, h4, h5, h6 {{
            color: #2c3e50;
            margin-top: 40px;
            margin-bottom: 20px;
            font-weight: 600;
        }}

        h1 {{
            font-size: 2.5em;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }}

        h2 {{
            font-size: 2em;
            border-bottom: 2px solid #95a5a6;
            padding-bottom: 8px;
        }}

        h3 {{
            font-size: 1.5em;
            color: #34495e;
        }}

        h4 {{
            font-size: 1.3em;
            color: #7f8c8d;
        }}

        p {{
            margin: 15px 0;
            text-align: justify;
        }}

        a {{
            color: #3498db;
            text-decoration: none;
        }}

        a:hover {{
            text-decoration: underline;
        }}

        strong {{
            color: #2c3e50;
            font-weight: 600;
        }}

        code {{
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: "Consolas", "Monaco", monospace;
            font-size: 0.9em;
        }}

        pre {{
            background-color: #2c3e50;
            color: #ecf0f1;
            padding: 20px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 20px 0;
        }}

        pre code {{
            background-color: transparent;
            padding: 0;
            color: inherit;
        }}

        blockquote {{
            border-left: 4px solid #3498db;
            padding-left: 20px;
            margin: 20px 0;
            color: #7f8c8d;
            background-color: #f9f9f9;
            padding: 15px 20px;
            border-radius: 5px;
        }}

        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}

        th, td {{
            border: 1px solid #ddd;
            padding: 12px 15px;
            text-align: left;
        }}

        th {{
            background-color: #3498db;
            color: white;
            font-weight: 600;
        }}

        tr:nth-child(even) {{
            background-color: #f9f9f9;
        }}

        ul, ol {{
            margin: 15px 0;
            padding-left: 30px;
        }}

        li {{
            margin: 8px 0;
        }}

        hr {{
            border: none;
            border-top: 2px solid #ecf0f1;
            margin: 40px 0;
        }}

        .page-break {{
            page-break-before: always;
        }}

        /* 打印样式 */
        @media print {{
            body {{
                max-width: 100%;
                padding: 20px;
            }}

            h1, h2, h3 {{
                page-break-after: avoid;
            }}

            pre, blockquote, table {{
                page-break-inside: avoid;
            }}

            a {{
                color: #2c3e50;
                text-decoration: none;
            }}
        }}

        /* 目录样式 */
        #目录 {{
            background-color: #ecf0f1;
            padding: 30px;
            border-radius: 10px;
            margin: 30px 0;
        }}

        #目录 ul {{
            list-style-type: none;
            padding-left: 0;
        }}

        #目录 li {{
            margin: 10px 0;
            font-size: 1.1em;
        }}

        #目录 a {{
            color: #2c3e50;
            font-weight: 500;
        }}

        /* Mermaid图表容器 */
        .mermaid {{
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }}
    </style>
</head>
<body>
    <div id="content">
        {html_content}
    </div>

    <div style="text-align: center; margin-top: 60px; padding: 20px; background-color: #ecf0f1; border-radius: 10px;">
        <h3>💡 如何保存为PDF</h3>
        <p><strong>方法1:</strong> 按 Ctrl+P (打印) → 选择"另存为PDF"</p>
        <p><strong>方法2:</strong> 使用浏览器的"打印"功能 → 选择PDF打印机</p>
        <p style="font-size: 0.9em; color: #7f8c8d;">生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>
</body>
</html>
"""

    # 保存HTML文件
    with open(HTML_FILE, 'w', encoding='utf-8') as f:
        f.write(html_template)

    print(f"✅ HTML文件已生成: {HTML_FILE}")
    print(f"\n💡 使用方法:")
    print(f"  1. 双击打开: {HTML_FILE}")
    print(f"  2. 在浏览器中按 Ctrl+P")
    print(f"  3. 选择'另存为PDF'或'打印到PDF'")
    print(f"\n或者访问在线转换工具:")
    print(f"  - https://www.markdowntopdf.com/")
    print(f"  - https://cloudconvert.com/md-to-pdf")

if __name__ == "__main__":
    print("正在生成HTML版本...")
    try:
        markdown_to_html()
    except Exception as e:
        print(f"❌ 错误: {e}")
        print("\n请使用在线工具转换Markdown为PDF:")
        print(f"  Markdown文件: {MARKDOWN_FILE}")
        print(f"  访问: https://www.markdowntopdf.com/")
