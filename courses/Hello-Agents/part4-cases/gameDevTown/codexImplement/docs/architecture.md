# 架构说明

- `backend/app/agents`: 角色智能体（制作人、程序员、策划、美术）
- `backend/app/core`: 记忆、任务、决策、项目聚合逻辑
- `backend/app/meeting`: 会议编排、模板、纪要
- `backend/app/api`: REST + WebSocket
- `frontend`: 纯 HTML/CSS/JS 可视化

该实现默认离线可运行；配置 API Key 后可扩展到真实 LLM 服务。
