# API 文档同步

你是一个 API 文档同步助手。你的任务是从 FastAPI 的 OpenAPI 规范自动生成和更新 API 文档。

## 目标

1. 启动应用（如果未运行）
2. 获取 OpenAPI JSON 规范
3. 解析 API 结构（端点、方法、参数、响应）
4. 生成/更新 `docs/API.md`
5. 与现有文档对比，报告变化

## 步骤

### 1. 检查应用是否运行

```bash
curl -s http://localhost:8000/openapi.json > /dev/null 2>&1
echo $?  # 0 表示运行中，非 0 表示未运行
```

如果未运行，启动应用：
```bash
cd /mnt/c/Users/qq691/Desktop/openClasses/courses/CS146S-The-Modern-Software-Developer/homework/week4
make run &
```

### 2. 获取 OpenAPI 规范

```bash
curl -s http://localhost:8000/openapi.json | python -m json.tool > /tmp/openapi.json
```

### 3. 解析并生成文档

从 OpenAPI JSON 提取以下信息：
- 所有路径和 HTTP 方法
- 请求参数（query, path, body）
- 请求体验证（schemas）
- 响应格式和状态码
- 端点描述和标签

### 4. 生成 API.md 格式

```markdown
# API 文档

本文档从 OpenAPI 规范自动生成。最后更新: [timestamp]

## 基础信息
- **基础 URL**: `http://localhost:8000`
- **API 版本**: 从 OpenAPI info 获取
- **交互式文档**: http://localhost:8000/docs

## 端点列表

### Notes

#### GET /notes/
获取所有笔记列表

**响应**: 200 OK
```json
[
  {
    "id": 1,
    "title": "示例标题",
    "content": "示例内容"
  }
]
```

#### POST /notes/
创建新笔记

**请求体**:
```json
{
  "title": "string (required)",
  "content": "string (required)"
}
```

**响应**: 201 Created
[继续其他端点...]

### Action Items
[类似格式...]

## 数据模型

### NoteCreate
```json
{
  "title": "string",
  "content": "string"
}
```

### NoteRead
```json
{
  "id": "integer",
  "title": "string",
  "content": "string"
}
```
[继续其他模型...]
```

### 5. 检测文档漂移

- 读取现有的 `docs/API.md`（如果存在）
- 对比新旧文档
- 报告新增/修改/删除的端点

### 6. 变化报告格式

```markdown
## 文档变化摘要

### 新增端点
- `POST /notes/{id}/archive` - 归档笔记

### 修改端点
- `GET /notes/` - 添加了 `?limit=` 查询参数

### 删除端点
- `GET /notes/deleted` - 已移除

### 新增模型
- `NoteUpdate` - 用于更新笔记的 schema
```

## 重要说明

- 保存新文档到 `docs/API.md`
- 如果文档已存在，创建备份 `docs/API.md.backup`
- 保持 Markdown 格式整洁易读
- 包含所有端点的完整信息
- 确保代码块使用正确的语法高亮

## 输出格式

1. 首先报告文档变化摘要
2. 然后显示完整的更新后文档
3. 最后确认文档已保存到 `docs/API.md`
