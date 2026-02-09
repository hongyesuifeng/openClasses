# API 文档

本文档从 OpenAPI 规范自动生成。

**最后更新**: 2026-02-10 00:17:50

## 基础信息
- **基础 URL**: `http://localhost:8000`
- **API 标题**: Modern Software Dev Starter (Week 4)
- **API 版本**: 0.1.0
- **OpenAPI 版本**: 3.1.0
- **交互式文档**: http://localhost:8000/docs

## 端点列表

### Action Items

#### GET /ACTION-ITEMS/

List Items

**响应**:

- **200**: Successful Response

#### POST /ACTION-ITEMS/

Create Item

**请求体**:

Content-Type: application/json
Schema: `ActionItemCreate`

**响应**:

- **201**: Successful Response
- **422**: Validation Error

#### PUT /ACTION-ITEMS/{ITEM_ID}/COMPLETE

Complete Item

**参数**:

- `item_id` (path): integer (必需)

**响应**:

- **200**: Successful Response
- **422**: Validation Error


### Default

#### GET /

Root

**响应**:

- **200**: Successful Response


### Notes

#### GET /NOTES/

List Notes

**响应**:

- **200**: Successful Response

#### POST /NOTES/

Create Note

**请求体**:

Content-Type: application/json
Schema: `NoteCreate`

**响应**:

- **201**: Successful Response
- **422**: Validation Error

#### GET /NOTES/SEARCH/

Search Notes

**参数**:

- `q` (query): unknown (可选)

**响应**:

- **200**: Successful Response
- **422**: Validation Error

#### GET /NOTES/{NOTE_ID}

Get Note

**参数**:

- `note_id` (path): integer (必需)

**响应**:

- **200**: Successful Response
- **422**: Validation Error


## 数据模型

### ActionItemCreate

```json
{
  "properties": {
    "description": {
      "type": "string",
      "title": "Description"
    }
  },
  "type": "object",
  "required": [
    "description"
  ],
  "title": "ActionItemCreate"
}
```

### ActionItemRead

```json
{
  "properties": {
    "id": {
      "type": "integer",
      "title": "Id"
    },
    "description": {
      "type": "string",
      "title": "Description"
    },
    "completed": {
      "type": "boolean",
      "title": "Completed"
    }
  },
  "type": "object",
  "required": [
    "id",
    "description",
    "completed"
  ],
  "title": "ActionItemRead"
}
```

### NoteCreate

```json
{
  "properties": {
    "title": {
      "type": "string",
      "title": "Title"
    },
    "content": {
      "type": "string",
      "title": "Content"
    }
  },
  "type": "object",
  "required": [
    "title",
    "content"
  ],
  "title": "NoteCreate"
}
```

### NoteRead

```json
{
  "properties": {
    "id": {
      "type": "integer",
      "title": "Id"
    },
    "title": {
      "type": "string",
      "title": "Title"
    },
    "content": {
      "type": "string",
      "title": "Content"
    }
  },
  "type": "object",
  "required": [
    "id",
    "title",
    "content"
  ],
  "title": "NoteRead"
}
```
