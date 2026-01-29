# Week 2 Write-up
Tip: To preview this markdown file
- On Mac, press `Command (⌘) + Shift + V`
- On Windows/Linux, press `Ctrl + Shift + V`

## INSTRUCTIONS

Fill out all of the `TODO`s in this file.

## SUBMISSION DETAILS

Name: **TODO** \
SUNet ID: **TODO** \
Citations: **TODO**

This assignment took me about **TODO** hours to do. 


## YOUR RESPONSES
For each exercise, please include what prompts you used to generate the answer, in addition to the location of the generated response. Make sure to clearly add comments in your code documenting which parts are generated.

### Exercise 1: Scaffold a New Feature
Prompt:
```
实现一个基于 LLM 的行动项提取函数 `extract_action_items_llm()`，使用 Ollama 和 llama3.1 模型。

要求：
1. 使用 Ollama 的结构化输出功能（Pydantic schema）
2. 提取的行动项以 JSON 数组形式返回
3. 包含完整的错误处理（连接错误、超时、解析错误）
4. 添加日志记录
5. 更新 action_items.py 路由支持 method 参数（"heuristic" 或 "llm"）

参考文档：
- https://ollama.com/blog/structured-outputs
- 现有的 extract_action_items() 启发式函数
```

Generated Code Snippets:
```
文件: week2/app/services/extract.py
- 行 11: 添加 pydantic 相关导入
- 行 16: 添加 logger 配置
- 行 97-134: 定义 ActionItemList Pydantic schema 和 EXTRACTION_PROMPT
- 行 136-194: 实现 extract_action_items_llm() 函数

文件: week2/app/routers/action_items.py
- 行 4: 添加 logging 导入
- 行 11: 添加 logger 配置
- 行 17-58: 更新 /extract 端点支持 method 参数
```

### Exercise 2: Add Unit Tests
Prompt:
```
为 extract_action_items_llm() 函数编写完整的单元测试，覆盖以下场景：

1. 项目符号和复选框格式
2. 关键字前缀（TODO:, ACTION:, NEXT:）
3. 叙述性文本中的祈使句
4. 空输入边界情况
5. 无行动项的文本
6. 混合格式
7. 重复项处理
8. 中文文本支持

使用 pytest 框架，创建 TestExtractActionItemsLLM 测试类。
```

Generated Code Snippets:
```
文件: week2/tests/test_extract.py
- 行 4: 添加 extract_action_items_llm 导入
- 行 22-123: 添加 TestExtractActionItemsLLM 测试类，包含 8 个测试用例
  * test_extract_bullets_and_checkboxes_llm: 测试项目符号格式
  * test_extract_keyword_prefixes_llm: 测试关键字前缀
  * test_extract_imperative_sentences_llm: 测试祈使句提取
  * test_empty_text_llm: 测试空输入
  * test_no_action_items_llm: 测试无行动项
  * test_mixed_format_llm: 测试混合格式
  * test_deduplication_llm: 测试去重
  * test_chinese_text_llm: 测试中文文本

文件: week2/app/services/extract.py
- 行 126: 修复 Pydantic 警告（min_items -> min_length）
```

### Exercise 3: Refactor Existing Code for Clarity
Prompt:
```
重构后端代码以提高清晰度，重点关注：

1. **API 契约/模式**：使用 Pydantic 定义清晰的请求/响应模型
2. **数据库层清理**：添加缺失的函数，改进代码结构
3. **应用生命周期/配置**：创建配置模块集中管理环境变量
4. **错误处理**：统一错误处理和 HTTP 状态码

要求：
- 创建 schemas.py 定义所有 API 模型
- 创建 config.py 管理配置
- 更新所有路由使用新的模型
- 添加全局异常处理器
- 添加健康检查端点
```

Generated/Modified Code Snippets:
```
新文件: week2/app/schemas.py (新建)
- 完整的 Pydantic 模型定义
- ExtractRequest, ExtractResponse, ActionItemResponse
- NoteResponse, CreateNoteRequest, MarkDoneRequest

新文件: week2/app/config.py (新建)
- Config 类集中管理配置
- Ollama、数据库、日志配置
- 环境变量支持

文件: week2/app/routers/action_items.py (完全重写)
- 使用 Pydantic 模型进行请求验证
- 统一错误处理和 HTTP 状态码
- 改进的文档字符串
- response_model 定义

文件: week2/app/routers/notes.py (完全重写)
- 使用 Pydantic 模型
- 添加 list_notes 端点
- 改进错误处理

文件: week2/app/db.py
- 行 117-133: 添加 get_action_item() 函数

文件: week2/app/main.py (完全重写)
- 集成配置模块
- 添加全局异常处理器
- 添加健康检查端点 /health
- 改进的日志配置
```


### Exercise 4: Use Agentic Mode to Automate a Small Task
Prompt:
```
使用 Agentic Mode (Cursor Composer) 完成以下任务：

1. **LLM 提取功能集成**：
   - 在现有 /action-items/extract 端点添加 method 参数支持
   - 更新前端添加 "Extract LLM" 按钮，调用 LLM 提取方法
   - 复用现有的 extract_action_items_llm() 函数

2. **笔记列表功能**：
   - 添加 GET /notes 端点返回所有笔记
   - 更新前端添加 "List Notes" 按钮显示笔记列表
   - 实现笔记列表展示区域

要求：
- 保持代码风格一致
- 复用现有的 Pydantic 模型
- 添加适当的错误处理
- 更新前端 UI 保持一致性
```

Generated Code Snippets:
```
文件: week2/app/routers/action_items.py
- 行 27-90: 更新 /extract 端点支持 method 参数
  * 支持两种提取方式："heuristic" (默认) 和 "llm"
  * 添加 LLM 服务不可用时的错误处理 (503 状态码)
  * 集成 extract_action_items_llm() 函数

文件: week2/app/routers/notes.py
- 行 67-79: 添加 list_notes 端点
  * GET /notes 返回所有笔记列表
  * 按创建时间倒序排列
  * 使用 NoteResponse 模型

文件: week2/frontend/index.html
- 行 46: 添加 "Extract LLM" 按钮（绿色 btn-success）
- 行 47: 添加 "List Notes" 按钮（灰色 btn-secondary）
- 行 52-58: 添加笔记列表展示区域（默认隐藏）
- 行 72-74: LLM 提取按钮事件处理，调用 extractItems('llm')
- 行 137-141: List Notes 按钮事件处理
- 行 149-172: loadNotes() 函数，获取并显示笔记列表
```


### Exercise 5: Generate a README from the Codebase
Prompt:
```
分析 week2 项目代码库，生成一个结构良好的 README.md 文件。

要求包含以下部分：
1. 项目概述和功能特性
2. 项目结构说明
3. 快速开始指南（环境要求、安装依赖、启动服务）
4. API 端点文档（完整的端点列表和方法说明）
5. 提取模式说明（启发式 vs LLM）
6. 运行测试套件的说明
7. 配置选项
8. 故障排除

请：
- 分析所有路由文件（routers/）获取 API 端点
- 查看 config.py 了解配置项
- 查看 tests/ 了解测试结构
- 使用清晰的 Markdown 格式
- 添加代码示例和 curl 命令示例
```

Generated Code Snippets:
```
新文件: week2/README.md (新建)
- 完整的项目文档，包含：
  * 项目概述和功能特性
  * 项目目录结构
  * 快速开始指南
  * 完整的 API 端点文档（表格格式）
  * 提取模式对比说明
  * Ollama 配置指南
  * 测试运行说明
  * 配置选项和环境变量
  * 开发工具命令
  * 技术栈列表
  * 前端功能说明
  * 故障排除指南
```


## SUBMISSION INSTRUCTIONS
1. Hit a `Command (⌘) + F` (or `Ctrl + F`) to find any remaining `TODO`s in this file. If no results are found, congratulations – you've completed all required fields. 
2. Make sure you have all changes pushed to your remote repository for grading.
3. Submit via Gradescope. 