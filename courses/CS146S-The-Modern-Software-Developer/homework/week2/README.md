# Action Item Extractor

一个基于 FastAPI 的智能行动项提取器，能够从自由格式的笔记中自动提取可执行任务。支持启发式规则和 LLM（大语言模型）两种提取方式。

## 功能特性

- **双模式提取**：支持快速启发式规则和智能 LLM 提取
- **笔记管理**：保存和查看历史笔记
- **行动项追踪**：标记和管理提取的行动项
- **Web 界面**：简洁的前端界面，支持所有功能
- **RESTful API**：完整的 API 接口，支持集成开发
- **数据持久化**：使用 SQLite 数据库存储

## 项目结构

```
week2/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 应用主入口
│   ├── config.py            # 应用配置管理
│   ├── db.py                # SQLite 数据库操作
│   ├── schemas.py           # Pydantic 数据模型
│   ├── routers/
│   │   ├── action_items.py  # 行动项相关路由
│   │   └── notes.py         # 笔记相关路由
│   └── services/
│       └── extract.py       # 行动项提取服务
├── frontend/
│   └── index.html          # 前端界面
├── tests/
│   └── test_extract.py     # 单元测试
├── data/                   # 数据目录（运行时创建）
├── assignment.md           # 作业说明
├── writeup.md              # 开发记录
└── README.md               # 本文件
```

## 快速开始

### 环境要求

- Python 3.11+
- SQLite 3（Python 内置）
- Ollama（可选，用于 LLM 提取功能）

### 安装依赖

```bash
# 使用 Poetry（推荐）
poetry install

# 或使用 pip
pip install fastapi uvicorn ollama pydantic python-dotenv pytest
```

### 启动服务

```bash
# 开发模式（自动重载）
poetry run uvicorn week2.app.main:app --reload

# 或使用 conda 环境
conda activate cs146s
PYTHONPATH=/path/to/openClasses/courses/CS146S-The-Modern-Software-Developer/homework \
  python -m uvicorn week2.app.main:app --reload
```

服务启动后访问：
- **应用主页**：http://127.0.0.1:8000/
- **API 文档**：http://127.0.0.1:8000/docs
- **健康检查**：http://127.0.0.1:8000/health

## API 端点

### 基础端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/` | 返回前端 HTML 页面 |
| GET | `/health` | 健康检查，返回服务状态 |

### 笔记 API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/notes` | 创建新笔记 |
| GET | `/notes` | 获取所有笔记列表（按创建时间倒序）|
| GET | `/notes/{note_id}` | 获取单个笔记详情 |

**创建笔记示例**：
```bash
curl -X POST http://localhost:8000/notes \
  -H "Content-Type: application/json" \
  -d '{"content": "会议记录：需要完成项目报告"}'
```

### 行动项 API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/action-items/extract` | 从文本中提取行动项 |
| GET | `/action-items` | 获取所有行动项 |
| POST | `/action-items/{id}/done` | 标记行动项完成状态 |

**提取行动项示例**：
```bash
# 启发式提取（快速）
curl -X POST http://localhost:8000/action-items/extract \
  -H "Content-Type: application/json" \
  -d '{"text": "- [ ] 设置数据库\nTODO: 编写文档", "method": "heuristic", "save_note": true}'

# LLM 提取（智能，需要 Ollama）
curl -X POST http://localhost:8000/action-items/extract \
  -H "Content-Type: application/json" \
  -d '{"text": "会议记录：需要安排下周的团队建设活动", "method": "llm", "save_note": true}'
```

## 提取模式说明

### 启发式提取（Heuristic）

使用预定义规则快速识别行动项：

- **项目符号**：`- [ ] 任务描述`
- **复选框**：`- [x] 已完成任务`
- **关键字前缀**：`TODO:`、`ACTION:`、`NEXT:`
- **祈使句**：以动词开头的句子

**优点**：快速、无需外部服务
**缺点**：只能识别标准格式的行动项

### LLM 提取（大语言模型）

使用 Ollama 和 llama3.1 模型进行智能提取：

- 从叙述性文本中识别行动项
- 理解上下文和隐含任务
- 支持中文和英文

**优点**：更准确、理解上下文
**缺点**：需要 Ollama 服务，速度较慢

### 配置 Ollama

```bash
# 安装 Ollama（如果尚未安装）
# 访问 https://ollama.com/download

# 启动 Ollama 服务
ollama serve

# 拉取模型
ollama pull llama3.1:8b
```

## 运行测试

```bash
# 运行所有测试
poetry run pytest

# 运行特定测试文件
poetry run pytest tests/test_extract.py

# 显示详细输出
poetry run pytest -v

# 显示测试覆盖率
poetry run pytest --cov=app
```

测试覆盖：
- 启发式提取（项目符号、关键字、空输入等）
- LLM 提取（多种文本格式）
- 边界情况处理
- 中文文本支持

## 配置选项

可以通过环境变量配置应用（可选）：

```env
# Ollama 配置
OLLAMA_MODEL=llama3.1:8b
OLLAMA_HOST=127.0.0.1
OLLAMA_PORT=11434
OLLAMA_TIMEOUT=30
OLLAMA_TEMPERATURE=0.0

# 应用配置
DEFAULT_EXTRACTION_METHOD=heuristic
LOG_LEVEL=INFO
```

## 开发工具

```bash
# 代码格式化
poetry run black app/

# 代码检查
poetry run ruff check app/

# 安装预提交 hooks
poetry run pre-commit install
```

## 技术栈

- **后端框架**：FastAPI
- **ASGI 服务器**：Uvicorn
- **数据库**：SQLite 3
- **数据验证**：Pydantic
- **LLM 服务**：Ollama
- **测试框架**：pytest
- **代码质量**：black, ruff, pre-commit

## 前端功能

前端界面提供以下功能：

1. **文本输入**：输入自由格式的笔记内容
2. **提取模式选择**：
   - "Extract (启发式)" - 快速规则提取
   - "Extract LLM (智能)" - AI 智能提取
3. **笔记保存**：可选择是否保存笔记
4. **行动项管理**：查看和标记完成状态
5. **笔记列表**：查看所有历史笔记

## 故障排除

### LLM 提取失败

如果 LLM 提取返回错误，检查：
1. Ollama 服务是否运行：`ollama list`
2. 模型是否已下载：`ollama pull llama3.1:8b`
3. 服务端口是否正确：默认 11434

### 模块导入错误

如果遇到 `ModuleNotFoundError: No module named 'week2'`：
```bash
# 设置 PYTHONPATH
export PYTHONPATH=/path/to/openClasses/courses/CS146S-The-Modern-Software-Developer/homework
```

## 许可证

本项目为教学作业，仅供学习使用。

## 贡献

本项目是 CS146S 课程作业的一部分。
