# API 文档

- `GET /api/health`
- `POST /api/project/start`
- `GET /api/project/status`
- `POST /api/meeting/start`
- `GET /api/tasks`
- `POST /api/tasks/update`
- `WS /ws`

`POST /api/meeting/start` 请求体示例：

```json
{
  "type": "design-review",
  "topic": "战斗系统设计",
  "proposer": "designer"
}
```
