# Week 4 Developer Command Center - Claude Context Guide

本文档为 Claude Code 提供代码库特定的上下文和指导，确保 AI 助手能够高效地协助开发工作。

---

## 项目概述

**开发者指挥中心** (Developer Command Center) 是一个全栈应用，帮助开发者组织笔记和行动项。

### 技术栈
- **后端**: FastAPI (Python 3.11+)
- **数据库**: SQLite (SQLAlchemy ORM)
- **前端**: Vanilla JavaScript + HTML/CSS
- **测试**: pytest + pytest-cov
- **代码质量**: black (格式化), ruff (lint), pre-commit hooks

### 应用功能
1. **Notes**: 创建、读取、搜索笔记
2. **Action Items**: 创建、读取、标记完成行动项
3. **提取服务**: 从笔记中提取行动项（待实现）

---

## 目录结构

```
week4/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI 应用入口
│   │   ├── db.py            # 数据库连接和会话管理
│   │   ├── models.py        # SQLAlchemy ORM 模型
│   │   ├── schemas.py       # Pydantic 请求/响应模型
│   │   ├── routers/         # API 路由模块
│   │   │   ├── __init__.py
│   │   │   ├── notes.py
│   │   │   └── action_items.py
│   │   └── services/        # 业务逻辑服务
│   │       └── extract.py
│   └── tests/               # pytest 测试套件
│       ├── conftest.py      # pytest fixtures
│       ├── test_notes.py
│       ├── test_action_items.py
│       └── test_extract.py
├── frontend/                # 静态前端文件
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── docs/                    # 项目文档
│   ├── TASKS.md             # 待办任务列表
│   └── API.md               # API 文档（自动生成）
├── data/                    # SQLite 数据库位置
│   ├── app.db               # 运行时创建
│   └── seed.sql             # 种子数据（可选）
├── .claude/                 # Claude Code 配置
│   └── commands/            # 斜杠命令定义
├── Makefile                 # 开发命令快捷方式
├── pre-commit-config.yaml   # pre-commit hooks 配置
├── pyproject.toml           # Python 项目配置
└── writeup.md               # 作业提交文档
```

---

## 开发工作流程

### 运行应用

```bash
cd /mnt/c/Users/qq691/Desktop/openClasses/courses/CS146S-The-Modern-Software-Developer/homework/week4
make run
```

应用将在 http://localhost:8000 启动，交互式 API 文档在 http://localhost:8000/docs

### 运行测试

```bash
# 基础测试
make test

# 带覆盖率报告
pytest --cov=backend --cov-report=term-missing backend/tests

# 特定测试文件
pytest backend/tests/test_notes.py -v
```

### 代码质量

```bash
# 格式化代码
make format
# 或手动: black . && ruff check . --fix

# 检查代码问题
make lint
# 或手动: ruff check .

# 运行 pre-commit hooks
pre-commit run --all-files
```

### 数据库管理

```bash
# 重新创建数据库（删除并重新应用种子数据）
rm data/app.db && make run

# 手动应用种子数据
make seed
```

---

## 代码约定

### FastAPI 路由

路由模块位于 `backend/app/routers/`，每个资源一个文件。

**标准路由模式**:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import YourModel
from ..schemas import ModelCreate, ModelRead

router = APIRouter(prefix="/resources", tags=["resources"])

@router.get("/", response_model=list[ModelRead])
def list_resources(db: Session = Depends(get_db)) -> list[ModelRead]:
    rows = db.execute(select(YourModel)).scalars().all()
    return [ModelRead.model_validate(row) for row in rows]

@router.post("/", response_model=ModelRead, status_code=201)
def create_resource(payload: ModelCreate, db: Session = Depends(get_db)) -> ModelRead:
    resource = YourModel(**payload.model_dump())
    db.add(resource)
    db.flush()
    db.refresh(resource)
    return ModelRead.model_validate(resource)

@router.get("/{resource_id}", response_model=ModelRead)
def get_resource(resource_id: int, db: Session = Depends(get_db)) -> ModelRead:
    resource = db.get(YourModel, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return ModelRead.model_validate(resource)
```

### 数据库模型

模型定义在 `backend/app/models.py`：

```python
from sqlalchemy import Boolean, Column, Integer, String, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class YourModel(Base):
    __tablename__ = "your_table"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
```

### Pydantic Schemas

Schema 定义在 `backend/app/schemas.py`：

```python
from pydantic import BaseModel

class ModelCreate(BaseModel):
    name: str
    description: str | None = None

class ModelRead(BaseModel):
    id: int
    name: str
    description: str | None = None

    class Config:
        from_attributes = True
```

### 测试模式

测试文件位于 `backend/tests/`，遵循 `test_{resource}.py` 命名：

```python
def test_create_and_list_resources(client):
    # 创建
    payload = {"name": "Test", "description": "Hello"}
    r = client.post("/resources/", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Test"

    # 列表
    r = client.get("/resources/")
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 1

def test_get_resource(client):
    # 创建资源
    payload = {"name": "Test"}
    create_r = client.post("/resources/", json=payload)
    resource_id = create_r.json()["id"]

    # 获取资源
    r = client.get(f"/resources/{resource_id}")
    assert r.status_code == 200
    assert r.json()["name"] == "Test"

def test_get_nonexistent_resource(client):
    r = client.get("/resources/99999")
    assert r.status_code == 404
```

**注意**: `client` fixture 在 `conftest.py` 中定义，提供测试用的 FastAPI TestClient。

---

## 安全清单

### 允许运行的命令
- `pytest`, `python -m pytest` - 运行测试
- `black`, `ruff` - 代码格式化和检查
- `pre-commit` - Git hooks
- `uvicorn` - 开发服务器
- `conda activate` - 环境激活（提示用户运行）
- `ls`, `cat`, `head`, `tail` - 文件查看

### 需要用户确认的命令
- `rm` - 删除文件（特别是数据库文件）
- 任何修改系统配置的命令
- 推送到远程仓库 (`git push`)

### 禁止的命令
- `rm -rf /` 或类似的危险删除
- `git push --force`
- 修改系统级别配置
- 任何可能破坏用户环境的命令

---

## 常见任务模式

### 添加新端点

1. 在 `backend/app/models.py` 添加模型类
2. 在 `backend/app/schemas.py` 添加 Create/Read schemas
3. 在 `backend/app/routers/` 创建新路由文件
4. 在 `backend/app/main.py` 注册路由
5. 在 `backend/tests/` 添加测试
6. 运行 `make format && make test`

### 编写测试

1. 在 `backend/tests/test_{resource}.py` 创建测试文件
2. 使用 `client` fixture 发送 HTTP 请求
3. 断言状态码和响应内容
4. 测试正常流程和错误情况
5. 运行 `make test` 验证

### 调试技巧

1. 查看 API 文档: 访问 http://localhost:8000/docs
2. 检查数据库: `sqlite3 data/app.db`
3. 查看日志: 应用启动时的控制台输出
4. 测试特定功能: `pytest backend/tests/test_notes.py::test_create_note -v`

---

## 项目特定提示

### 任务列表 (`docs/TASKS.md`)

当前待完成的任务包括：
1. 启用 pre-commit hooks
2. 添加笔记搜索端点（已实现）
3. 完成行动项完成流程
4. 改进提取逻辑（解析标签）
5. 笔记 CRUD 增强（编辑、删除）
6. 请求验证和错误处理
7. API 文档漂移检查

### 已知问题

1. 测试覆盖率约 30-40%，需要提升
2. 缺少编辑/删除端点
3. 提取服务需要增强

### 开发环境

- **Python 版本**: 3.11+
- **Conda 环境**: `cs146s`
- **工作目录**: `/mnt/c/Users/qq691/Desktop/openClasses/courses/CS146S-The-Modern-Software-Developer/homework/week4`

---

## 可用斜杠命令

- `/test-coverage` - 运行测试并生成覆盖率报告
- `/sync-api-docs` - 从 OpenAPI 规范同步 API 文档
- `/generate-endpoint <resource> <fields>` - 生成新 CRUD 端点的样板代码

---

## 最后更新

- **日期**: 2026-02-10
- **版本**: Week 4 作业实施
- **维护者**: CS146S 学生
