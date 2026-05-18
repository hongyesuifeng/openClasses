# SlayDemo 协调者上下文同步文件

> 最后更新: 2026-05-18 08:25

## 项目概况
- 类型: 类杀戮尖塔卡牌Roguelike MVP
- 引擎: Godot 4.x
- 路径: C:\Users\qq691\Desktop\openClasses\domains\game-engine\godotProjects\slayDemo
- 文档: docs/ 下25份设计/技术/美术文档

## 当前阶段: M1 项目骨架（游戏制作人视角）

## Agent ID映射（待确认）

| 角色 | 我视角的sender_id | 状态 |
|------|-------------------|------|
| 游戏制作人 | ou_46afa44ace0d8b920e806cee213a4b19 | ✅ 已确认 |
| 游戏客户端开发 | 待确认 | ❓ |
| 游戏策划 | 待确认 | ❓ |
| 游戏美术 | 待确认 | ❓ |

## 协同机制

1. 群内@消息 - 需要正确的ou_格式ID
2. 项目文件同步 - agent-tasks/ 目录下各agent的任务文件
3. 用户中转 - 协调者告诉用户，用户@bot

## 注意事项
- 飞书不同App看到的open_id不同，不能用其他bot视角的ID
- 避免在群里同时@多个bot，会触发消息风暴
