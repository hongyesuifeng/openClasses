# 示例

```bash
curl -X POST http://localhost:8000/api/project/start \
  -H "Content-Type: application/json" \
  -d '{"name":"王者之路","type":"first-person-rpg","timeline":"6-months"}'

curl -X POST http://localhost:8000/api/meeting/start \
  -H "Content-Type: application/json" \
  -d '{"type":"design-review","topic":"战斗系统设计","proposer":"designer"}'

curl http://localhost:8000/api/project/status
```
