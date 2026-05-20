---
description: 切换到指定游戏开发角色视角分析问题
---

# 角色视角切换

从制作人、开发者、美术、策划四个角色视角分析问题，帮助理解不同专业视角。

## 用法

```
/role-switch <角色> [问题描述]
```

**角色选项**:
- `producer` - 游戏制作人视角
- `developer` - 游戏开发者视角
- `artist` - 游戏美术视角
- `designer` - 游戏策划视角

## 示例

```
/role-switch designer 卡牌 UI 如何设计？
/role-switch developer 如何实现卡牌效果系统？
/role-switch artist 游戏的整体美术风格应该怎么定？
/role-switch producer 当前里程碑进度如何？
```

## 执行步骤

1. 读取 `.agents/roles/{role}/ROLE.md` 获取角色定义
2. 根据角色视角分析用户的问题
3. 按以下结构输出：
   - 我看到了什么
   - 我关心什么
   - 我会怎么做
   - 为什么（我的视角）
   - 其他角色可能怎么看

## 角色定义位置

```
.agents/roles/
├── producer/ROLE.md
├── developer/ROLE.md
├── artist/ROLE.md
└── designer/ROLE.md
```
