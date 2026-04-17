# 源码阅读方法论

本文档介绍高效的源码阅读技巧，帮助你更快地理解引擎实现。

## 目录

- [阅读策略](#阅读策略)
- [调试技巧](#debugging-skills)
- [常用工具](#common-tools)
- [阅读流程](#reading-flow)
- [常见问题](#common-issues)

---

## 阅读策略

### 策略一：自顶向下

从高层 API 入手，逐步深入到底层实现。

```
用户调用 node.addChild()
    ↓
查看 Node.addChild() 实现
    ↓
理解父子关系如何维护
    ↓
深入理解场景图数据结构
```

**适合**：想要理解某个功能完整实现流程时。

### 策略二：自底向上

从底层工具类开始，逐步理解上层模块。

```
先理解 Vec3 向量运算
    ↓
理解 Mat4 矩阵变换
    ↓
理解 Node 如何使用矩阵
    ↓
理解场景图的空间变换
```

**适合**：想要打好基础，系统学习时。

### 策略三：追踪调用链

从一个具体的 API 调用开始，跟踪整个执行过程。

```
追踪 director.loadScene()
    ↓
AssetManager.load()
    ↓
Bundle.load()
    ↓
Pipeline.execute()
    ↓
最终资源加载完成
```

**适合**：想要理解某个功能的完整流程时。

---

## 调试技巧

### 1. 断点调试

最直接的方式，在关键位置设置断点：

**推荐断点位置**：

| 文件 | 位置 | 用途 |
|------|------|------|
| `game.ts` | `tick()` | 观察每帧执行 |
| `director.ts` | `loadScene()` | 观察场景加载 |
| `node.ts` | `addChild()` | 观察节点操作 |
| `component.ts` | `onLoad()` | 观察组件生命周期 |

### 2. 日志追踪

在源码中添加日志，了解执行顺序：

```typescript
// 在 cocos/game/game.ts 的 tick 方法中
tick(dt: number) {
    console.log('[Game] tick start', dt);
    // ... 原有代码
    console.log('[Game] tick end');
}
```

### 3. 条件断点

设置条件断点，只在特定情况下暂停：

```javascript
// 只在特定节点名时暂停
node.name === 'Player'
```

### 4. 监视变量

在调试面板监视关键变量：
- `director._scene` - 当前场景
- `node._children` - 子节点列表
- `component.node` - 组件所属节点

---

## 常用工具

### VSCode 快捷键

| 快捷键 | 功能 |
|--------|------|
| `F12` | 跳转到定义 |
| `Shift + F12` | 查找所有引用 |
| `Ctrl + P` | 快速打开文件 |
| `Ctrl + Shift + F` | 全局搜索 |
| `F9` | 切换断点 |
| `F5` | 开始调试 |
| `F10` | 单步跳过 |
| `F11` | 单步进入 |

### Chrome DevTools

1. **Sources 面板**：查看和调试源码
2. **Call Stack**：查看调用栈
3. **Scope**：查看当前作用域变量
4. **Watch**：监视表达式

### 命令行工具

```bash
# 搜索特定文本
grep -r "loadScene" cocos/

# 查找文件
find cocos/ -name "*.ts" | head -20

# 统计代码行数
find cocos/ -name "*.ts" | xargs wc -l | tail -1
```

---

## 阅读流程

### 阶段一：理解入口（1-2 天）

1. 阅读 `cocos/game/game.ts`
   - 理解 `init()` 初始化流程
   - 理解 `run()` 游戏循环
   - 理解 `tick()` 帧更新

2. 阅读 `cocos/game/director.ts`
   - 理解场景管理
   - 理解系统调度

### 阶段二：理解核心（3-5 天）

1. 阅读 `cocos/core/`
   - 数学库、事件系统
   - 调度器、对象池

2. 阅读 `cocos/scene-graph/`
   - Node 节点系统
   - Component 组件系统
   - Scene 场景管理

### 阶段三：理解渲染（5-7 天）

1. 阅读 `cocos/gfx/`
   - 图形抽象层
   - WebGL 后端

2. 阅读 `cocos/rendering/`
   - 渲染管线
   - 渲染队列

### 阶段四：深入模块（按需）

根据兴趣选择：
- 动画系统
- 物理系统
- UI 系统
- 等等

---

## 常见问题

### Q1: 代码太多，从哪里开始？

**建议**：从 `game.ts` 开始，理解引擎启动流程，然后按照上面的阅读流程逐步深入。

### Q2: 某个文件太大（如 node.ts 100KB+），怎么读？

**建议**：
1. 先看类的公共方法（public）
2. 再看关键私有方法
3. 忽略细节实现，先理解整体结构

### Q3: 遇到不理解的代码怎么办？

**建议**：
1. 查看方法的调用者，理解使用场景
2. 添加日志或断点，观察运行时行为
3. 搜索官方文档或社区讨论

### Q4: 如何记住看过的内容？

**建议**：
1. 在代码中添加自己的注释
2. 整理笔记，画出架构图
3. 尝试修改代码，验证理解

### Q5: TypeScript 语法不熟悉怎么办？

**建议**：
1. 先学习 TypeScript 基础语法
2. 遇到不理解的语法，查阅 TS 文档
3. 常见语法：装饰器、泛型、接口、类型断言

---

## 阅读记录模板

建议创建一个阅读记录文件，跟踪学习进度：

```markdown
# Cocos 源码阅读记录

## 2024-01-15
- 阅读 cocos/game/game.ts
- 理解了游戏初始化流程
- 问题：tick 方法中的 dt 是怎么计算的？

## 2024-01-16
- 阅读 cocos/scene-graph/node.ts
- 理解了节点树结构
- 关键方法：addChild, removeChild, setParent

## 待阅读
- [ ] cocos/rendering/render-pipeline.ts
- [ ] cocos/animation/animation-clip.ts
```

---

## 下一步

掌握阅读方法后，开始正式学习 [核心基础层](../01-core-foundation/README.md)。
