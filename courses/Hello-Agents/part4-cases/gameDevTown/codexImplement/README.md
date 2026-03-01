# Game Dev Town - codexImplement

根据课程 `gameDevTown/README.md` 实现的可运行版本：

- 4 个角色 Agent（Alex/Cody/Diana/Arty）
- 会议编排（站会、设计评审、技术评审等）
- 决策权重系统与任务看板
- FastAPI REST + WebSocket
- 原生 HTML/CSS/JS 前端
- pytest 基础测试

## 运行

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

打开 `../frontend/index.html`。

## CLI 模式

```bash
cd backend
python -m app.main --mode meeting --type design-review
python -m app.main --mode simulate --days 10
```
