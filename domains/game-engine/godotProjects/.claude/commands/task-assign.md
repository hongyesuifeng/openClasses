---
description: 为指定角色分配任务并更新任务看板
---

# 任务分配

为制作人、开发者、美术、策划分配任务，更新对应的任务看板。

## 用法

```
/task-assign <角色> <任务描述>
```

**角色选项**:
- `producer` - 游戏制作人
- `developer` - 游戏开发者
- `artist` - 游戏美术
- `designer` - 游戏策划

## 示例

```
/task-assign developer 实现卡牌数据结构
/task-assign designer 设计前 10 张卡牌
/task-assign artist 搜集免费卡牌 UI 资源
/task-assign producer 更新 M1 里程碑进度
```

## 执行步骤

1. 读取 `.agents/shared/collaboration-context.md` 了解当前阶段
2. 在 `slayDemo/agent-tasks/task-{role}.md` 添加任务
3. 更新 `collaboration-context.md` 的任务状态
4. 输出任务分配确认

## 任务看板位置

```
slayDemo/agent-tasks/
├── task-producer.md
├── task-dev.md
├── task-art.md
└── task-design.md
```

## 任务格式

```markdown
## [任务标题]

**状态**: 待开始 / 进行中 / 已完成
**优先级**: 高 / 中 / 低
**创建时间**: YYYY-MM-DD
**描述**: 任务详细描述

### 验收标准
- [ ] 标准 1
- [ ] 标准 2

### 相关文档
- 链接到相关设计/技术文档
```
