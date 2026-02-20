#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hello-Agents 课程整合脚本
将所有章节整合成一个Markdown文件，并尝试转换为PDF
"""

import os
import re
from datetime import datetime

# 课程文件路径
COURSE_BASE = "/mnt/c/Users/Administrator/Desktop/公开课/openClasses/courses/Hello-Agents"

# 章节顺序配置
CHAPTERS = [
    # 第一部分：基础篇
    {"part": "第一部分：基础篇", "chapters": [
        {"file": "part1-foundation/ch01-intro/README.md", "title": "第1章：课程介绍"},
        {"file": "part1-foundation/ch02-history/README.md", "title": "第2章：智能体发展史"},
        {"file": "part1-foundation/ch03-llm-basics/README.md", "title": "第3章：大语言模型基础"},
    ]},
    # 第二部分：构建篇
    {"part": "第二部分：构建篇", "chapters": [
        {"file": "part2-building-agents/ch04-patterns/README.md", "title": "第4章：Agent核心范式"},
        {"file": "part2-building-agents/ch05-lowcode/README.md", "title": "第5章：低代码平台开发"},
        {"file": "part2-building-agents/ch06-frameworks/README.md", "title": "第6章：框架开发实践"},
        {"file": "part2-building-agents/ch07-custom-framework/README.md", "title": "第7章：构建自定义Agent框架"},
    ]},
    # 第三部分：进阶篇
    {"part": "第三部分：进阶篇", "chapters": [
        {"file": "part3-advanced/ch08-memory/README.md", "title": "第8章：记忆与检索"},
        {"file": "part3-advanced/ch09-context/README.md", "title": "第9章：上下文工程"},
        {"file": "part3-advanced/ch10-protocols/README.md", "title": "第10章：通信协议"},
        {"file": "part3-advanced/ch11-training/README.md", "title": "第11章：Agentic-RL"},
        {"file": "part3-advanced/ch12-evaluation/README.md", "title": "第12章：性能评估"},
    ]},
    # 第四部分：案例篇
    {"part": "第四部分：案例篇", "chapters": [
        {"file": "part4-cases/ch13-travel-agent/README.md", "title": "第13章：智能旅行助手"},
        {"file": "part4-cases/ch14-research-agent/README.md", "title": "第14章：研究代理"},
        {"file": "part4-cases/ch15-cyber-town-game/README.md", "title": "第15章：赛博小镇游戏"},
    ]},
    # 第五部分：毕业设计
    {"part": "第五部分：毕业设计", "chapters": [
        {"file": "part5-graduation/ch16-project/README.md", "title": "第16章：毕业设计项目"},
    ]},
]

def read_chapter(file_path):
    """读取章节内容"""
    full_path = os.path.join(COURSE_BASE, file_path)
    if not os.path.exists(full_path):
        return f"\n\n**文件不存在: {file_path}**\n\n"

    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    return content

def generate_ebook():
    """生成整合的电子书"""
    output_file = os.path.join(COURSE_BASE, "Hello-Agents-完整课程.md")

    with open(output_file, 'w', encoding='utf-8') as f:
        # 写入标题
        f.write("# Hello-Agents：从零构建智能体应用\n\n")
        f.write("---\n\n")
        f.write(f"**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("---\n\n")

        # 写入目录
        f.write("# 目录\n\n")
        for part_data in CHAPTERS:
            f.write(f"## {part_data['part']}\n\n")
            for chapter in part_data['chapters']:
                f.write(f"- {chapter['title']}\n")
            f.write("\n")
        f.write("---\n\n")

        # 写入各章节内容
        for part_data in CHAPTERS:
            # 写入部分标题
            f.write(f"\n\n# {part_data['part']}\n\n")
            f.write("---\n\n")

            # 写入章节内容
            for chapter in part_data['chapters']:
                f.write(f"\n\n# {chapter['title']}\n\n")
                f.write("---\n\n")

                content = read_chapter(chapter['file'])
                f.write(content)

                f.write("\n\n---\n\n")
                f.write(f"**[⬆ 返回目录](#目录)**\n\n")
                f.write("---\n\n")

    print(f"✅ Markdown电子书已生成: {output_file}")
    return output_file

def try_convert_to_pdf(markdown_file):
    """尝试转换为PDF"""
    print("\n尝试转换为PDF...")

    # 方法1: 使用markdown-weasyprint
    try:
        import markdown
        from weasyprint import HTML, CSS

        # 读取Markdown
        with open(markdown_file, 'r', encoding='utf-8') as f:
            md_content = f.read()

        # 转换为HTML
        html_content = markdown.markdown(md_content)

        # 添加CSS样式
        css_style = """
        <style>
        body {
            font-family: "Microsoft YaHei", "SimHei", Arial, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #333;
            margin-top: 30px;
        }
        code {
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
        }
        pre {
            background-color: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 15px;
            color: #666;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        </style>
        """

        # 生成PDF
        html_doc = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            {css_style}
        </head>
        <body>
            {html_content}
        </body>
        </html>
        """

        pdf_file = markdown_file.replace('.md', '.pdf')
        HTML(string=html_doc).write_pdf(pdf_file)

        print(f"✅ PDF已生成: {pdf_file}")
        return pdf_file

    except ImportError as e:
        print(f"⚠️  缺少必要的库: {e}")
        print("\n请安装以下库之一：")
        print("  方案1: pip3 install markdown weasyprint")
        print("  方案2: pip3 install markdown2pdf")
        print("  方案3: 安装 pandoc: https://pandoc.org/installing.html")
        print("\n或使用在线工具转换:")
        print(f"  1. Markdown文件: {markdown_file}")
        print("  2. 访问: https://www.markdowntopdf.com/")
        print("  3. 或使用VS Code插件: Markdown PDF")

        return None

if __name__ == "__main__":
    print("=" * 60)
    print("Hello-Agents 课程电子书生成器")
    print("=" * 60)

    # 生成Markdown电子书
    md_file = generate_ebook()

    # 尝试转换为PDF
    try_convert_to_pdf(md_file)

    print("\n" + "=" * 60)
    print("完成！")
    print("=" * 60)
