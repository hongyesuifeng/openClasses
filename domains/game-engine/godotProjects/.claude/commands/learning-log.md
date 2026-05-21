---
description: 记录当前角色的学习日志，沉淀学习收获
---

# 学习日志

记录在角色视角切换过程中的学习收获，帮助沉淀跨角色知识。

## 用法

```
/learning-log [角色] [日志内容]
```

**角色选项**:
- `producer` - 游戏制作人
- `developer` - 游戏开发者
- `artist` - 游戏美术
- `designer` - 游戏策划
- `cross` - 跨角色洞察

## 示例

```
/learning-log developer 发现信号模式比直接调用更适合解耦
/learning-log designer 数值平衡需要考虑玩家成长曲线
/learning-log cross 开发者视角让我意识到设计文档需要更具体
```

## 执行步骤

1. 确定日志类型（角色特定 or 跨角色）
2. 在 `slayDemo/docs/learning/` 下创建或更新日志文件
3. 按模板记录学习收获

## 日志存放位置

```
slayDemo/docs/learning/
├── knowledge-base/
│   ├── producer-insights.md
│   ├── developer-patterns.md
│   ├── artist-guidelines.md
│   ├── designer-principles.md
│   └── cross-functional.md
└── daily-logs/
    └── YYYY-MM-DD.md
```

## 日志格式

### 角色知识积累

```markdown
## [知识点标题]

**来源**: 从哪个任务/问题中学到
**日期**: YYYY-MM-DD

### 发现
- 具体的知识点内容

### 为什么重要
- 这个知识点的意义

### 应用场景
- 什么时候会用到

### 相关知识点
- 链接到其他相关知识
```

### 跨角色洞察

```markdown
## [洞察标题]

**涉及角色**: 角色 A ↔ 角色 B
**日期**: YYYY-MM-DD

### 背景
- 触发这个洞察的情境

### 角色差异
- 角色 A 的视角：...
- 角色 B 的视角：...
- 差异在哪里：...

### 我的收获
- 我学到了什么
- 我会怎么应用

### 后续行动
- 需要进一步了解什么
```
