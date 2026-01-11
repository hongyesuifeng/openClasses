# Week 2 – 行动项提取器

本周，我们将在一个最小的 FastAPI + SQLite 应用基础上进行扩展，将自由格式的笔记转换为枚举的行动项。

***我们建议在开始之前完整阅读本文档。***

提示：要预览此 markdown 文件
- 在 Mac 上，按 `Command (⌘) + Shift + V`
- 在 Windows/Linux 上，按 `Ctrl + Shift + V`


## 入门指南

### Cursor 设置
按照以下说明设置 Cursor 并打开你的项目：
1. 领取你免费一年的 Cursor Pro：https://cursor.com/students
2. 下载 Cursor：https://cursor.com/download
3. 要启用 Cursor 命令行工具，打开 Cursor 并按 `Command (⌘) + Shift+ P`（Mac 用户）或 `Ctrl + Shift + P`（非 Mac 用户）打开命令面板。输入：`Shell Command: Install 'cursor' command`。选择它并按 Enter。
4. 打开一个新的终端窗口，导航到你的项目根目录，然后运行：`cursor .`

### 当前应用
以下是启动当前入门应用的方法：
1. 激活你的 conda 环境。
```
conda activate cs146s
```
2. 从项目根目录运行服务器：
```
poetry run uvicorn week2.app.main:app --reload
```
3. 打开 Web 浏览器并导航到 http://127.0.0.1:8000/。
4. 熟悉应用的当前状态。确保你能成功输入笔记并生成提取的行动项清单。

## 练习
对于每个练习，使用 Cursor 来帮助你实现指定的改进，以增强当前的行动项提取器应用。

在完成作业的过程中，使用 `writeup.md` 来记录你的进度。务必包括你使用的提示词，以及你或 Cursor 所做的任何更改。我们将根据 write-up 的内容进行评分。另外，请在代码中添加注释以记录你的更改。

### TODO 1：搭建新功能

分析 `week2/app/services/extract.py` 中现有的 `extract_action_items()` 函数，该函数当前使用预定义的启发式方法提取行动项。

你的任务是实现一个 **基于 LLM 的** 替代方案 `extract_action_items_llm()`，利用 Ollama 通过大语言模型执行行动项提取。

一些提示：
- 要产生结构化输出（即 JSON 字符串数组），请参考此文档：https://ollama.com/blog/structured-outputs
- 要浏览可用的 Ollama 模型，请参考此文档：https://ollama.com/library。注意，较大的模型会占用更多资源，所以从小处着手。要拉取并运行模型：`ollama run {MODEL_NAME}`

### TODO 2：添加单元测试

为 `extract_action_items_llm()` 编写单元测试，在 `week2/tests/test_extract.py` 中覆盖多种输入（例如，项目符号列表、带关键字前缀的行、空输入）。

### TODO 3：重构现有代码以提高清晰度

对后端代码进行重构，特别关注明确定义的 API 契约/模式、数据库层清理、应用生命周期/配置、错误处理。

### TODO 4：使用代理模式自动化小任务

1. 将基于 LLM 的提取集成为新端点。更新前端，添加一个"Extract LLM"按钮，点击时通过新端点触发提取过程。

2. 暴露一个最终端点来检索所有笔记。更新前端，添加一个"List Notes"按钮，点击时获取并显示它们。

### TODO 5：从代码库生成 README

***学习目标：***
*学生了解 AI 如何内省代码库并自动生成文档，展示 Cursor 解析代码上下文并将其转换为人类可读形式的能力。*

使用 Cursor 分析当前代码库并生成结构良好的 `README.md` 文件。README 应至少包括：
- 项目简要概述
- 如何设置和运行项目
- API 端点和功能
- 运行测试套件的说明

## 交付成果
根据提供的说明填写 `week2/writeup.md`。确保所有更改都在你的代码库中有记录。

## 评分标准（总分 100 分）
- 第 1-5 部分各 20 分（每部分 10 分用于生成的代码，10 分用于提示词）
