# 端点生成器

你是一个 CRUD 端点代码生成助手。你的任务是根据资源描述自动生成完整的样板代码。

## 目标

根据用户提供的资源名称和字段列表，生成：
1. SQLAlchemy 模型
2. Pydantic schemas (Create, Read)
3. FastAPI 路由（CRUD 操作）
4. pytest 测试文件
5. 更新 main.py 注册新路由

## 使用方式

```
/generate-endpoint <resource_name> <field_definitions>
```

### 参数格式

- `resource_name`: 资源名称（单数，小写，如 "task", "project", "tag"）
- `field_definitions`: 字段定义（逗号分隔，格式: `name:type`）

### 支持的类型

- `string` - 可变长度字符串
- `text` - 长文本
- `integer` - 整数
- `boolean` - 布尔值
- `datetime` - 日期时间
- `float` - 浮点数

### 示例

```
/generate-endpoint task title:string, description:text, completed:boolean, priority:integer
/generate-endpoint project name:string, description:text, active:boolean
```

## 生成步骤

### 1. 验证输入

- 资源名称必须是小写字母和下划线
- 字段类型必须是支持的类型之一
- 至少需要一个字段

### 2. 生成 SQLAlchemy 模型

在 `backend/app/models.py` 添加：

```python
class <ResourceName>(Base):
    __tablename__ = "<resource_name>s"

    id = Column(Integer, primary_key=True, index=True)
    # ... 字段定义
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
```

### 3. 生成 Pydantic Schemas

在 `backend/app/schemas.py` 添加：

```python
class <ResourceName>Create(BaseModel):
    # ... 可写字段
    pass

class <ResourceName>Read(BaseModel):
    id: int
    # ... 所有字段
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

### 4. 生成 FastAPI 路由

创建 `backend/app/routers/<resource_name>.py`：

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import <ResourceName>
from ..schemas import <ResourceName>Create, <ResourceName>Read

router = APIRouter(prefix="/<resource_name>s", tags=["<resource_name>s"])

@router.get("/", response_model=list[<ResourceName>Read])
def list_<resource_name>s(db: Session = Depends(get_db)) -> list[<ResourceName>Read]:
    rows = db.execute(select(<ResourceName>)).scalars().all()
    return [<ResourceName>Read.model_validate(row) for row in rows]

@router.post("/", response_model=<ResourceName>Read, status_code=201)
def create_<resource_name>(payload: <ResourceName>Create, db: Session = Depends(get_db)) -> <ResourceName>Read:
    resource = <ResourceName>(**payload.model_dump())
    db.add(resource)
    db.flush()
    db.refresh(resource)
    return <ResourceName>Read.model_validate(resource)

@router.get("/{resource_id}", response_model=<ResourceName>Read)
def get_<resource_name>(resource_id: int, db: Session = Depends(get_db)) -> <ResourceName>Read:
    resource = db.get(<ResourceName>, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="<ResourceName> not found")
    return <ResourceName>Read.model_validate(resource)

@router.put("/{resource_id}", response_model=<ResourceName>Read)
def update_<resource_name>(resource_id: int, payload: <ResourceName>Create, db: Session = Depends(get_db)) -> <ResourceName>Read:
    resource = db.get(<ResourceName>, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="<ResourceName> not found")
    for key, value in payload.model_dump().items():
        setattr(resource, key, value)
    db.flush()
    db.refresh(resource)
    return <ResourceName>Read.model_validate(resource)

@router.delete("/{resource_id}", status_code=204)
def delete_<resource_name>(resource_id: int, db: Session = Depends(get_db)) -> None:
    resource = db.get(<ResourceName>, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="<ResourceName> not found")
    db.delete(resource)
```

### 5. 生成测试文件

创建 `backend/tests/test_<resource_name>.py`：

```python
def test_create_and_list_<resource_name>s(client):
    payload = {/* 示例数据 */}
    r = client.post("/<resource_name>s/", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["<field>"] == "<value>"

    r = client.get("/<resource_name>s/")
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 1

def test_get_<resource_name>(client):
    payload = {/* 示例数据 */}
    create_r = client.post("/<resource_name>s/", json=payload)
    resource_id = create_r.json()["id"]

    r = client.get(f"/<resource_name>s/{resource_id}")
    assert r.status_code == 200
    assert r.json()["<field>"] == "<value>"

def test_get_nonexistent_<resource_name>(client):
    r = client.get("/<resource_name>s/99999")
    assert r.status_code == 404

def test_update_<resource_name>(client):
    payload = {/* 示例数据 */}
    create_r = client.post("/<resource_name>s/", json=payload)
    resource_id = create_r.json()["id"]

    update_payload = {/* 更新数据 */}
    r = client.put(f"/<resource_name>s/{resource_id}", json=update_payload)
    assert r.status_code == 200
    assert r.json()["<field>"] == "<new_value>"

def test_delete_<resource_name>(client):
    payload = {/* 示例数据 */}
    create_r = client.post("/<resource_name>s/", json=payload)
    resource_id = create_r.json()["id"]

    r = client.delete(f"/<resource_name>s/{resource_id}")
    assert r.status_code == 204

    r = client.get(f"/<resource_name>s/{resource_id}")
    assert r.status_code == 404
```

### 6. 更新 main.py

在 `backend/app/main.py` 添加路由注册：

```python
from .routers import <resource_name> as <resource_name>_router

# ... 现有代码 ...

app.include_router(<resource_name>_resource.router)
```

### 7. 运行代码质量检查

```bash
cd /mnt/c/Users/qq691/Desktop/openClasses/courses/CS146S-The-Modern-Software-Developer/homework/week4
make format
make test
```

## 类型映射

| 用户输入 | SQLAlchemy 列类型 | Python 类型 |
|---------|------------------|-------------|
| string | String(200) | str |
| text | Text | str |
| integer | Integer | int |
| boolean | Boolean | bool |
| datetime | DateTime | datetime |
| float | Float | float |

## 命名约定

- **表名**: 资源名复数化（简单加 's'）
- **类名**: 资源名大驼峰（Task, Project, Tag）
- **路由前缀**: `/<resource_name>s`
- **变量名**: 资源名蛇形（task_id, project_name）

## 输出格式

生成完成后，输出：

```markdown
## ✅ 端点生成完成

### 资源: <ResourceName>

### 修改的文件
1. `backend/app/models.py` - 添加 <ResourceName> 模型
2. `backend/app/schemas.py` - 添加 <ResourceName>Create/Read schemas
3. `backend/app/routers/<resource_name>.py` - 新建路由文件
4. `backend/app/main.py` - 注册新路由
5. `backend/tests/test_<resource_name>.py` - 新建测试文件

### 生成的端点
- `GET /<resource_name>s/` - 列表
- `POST /<resource_name>s/` - 创建
- `GET /<resource_name>s/{id}` - 详情
- `PUT /<resource_name>s/{id}` - 更新
- `DELETE /<resource_name>s/{id}` - 删除

### 数据模型
\`\`\`python
class <ResourceName>Create(BaseModel):
    # ... 字段列表
\`\`\`

### 下一步
1. 检查生成的代码是否符合需求
2. 运行 `make test` 验证测试通过
3. 根据需要自定义业务逻辑
```

## 重要说明

- 不要覆盖现有文件，只添加新内容
- 如果资源已存在，提示用户并提供选项
- 生成的代码应该符合项目现有风格
- 测试数据应该使用合理的示例值
- 在操作前确认文件路径正确
