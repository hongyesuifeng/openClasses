# 附录

附录包含核心文件参考、设计模式总结和知识点索引。

## 目录

- [01-核心文件参考](./01-core-files-reference.md) - 关键源文件清单
- [02-设计模式](./02-design-patterns.md) - 引擎中使用的设计模式
- [03-知识点索引](./03-knowledge-points.md) - 按主题分类的知识点

---

## 快速参考

### 核心文件优先级

| 优先级 | 文件 | 说明 |
|--------|------|------|
| ⭐⭐⭐ | `cocos/scene-graph/node.ts` | 节点系统（~108KB） |
| ⭐⭐⭐ | `cocos/core/scheduler.ts` | 调度器（~46KB） |
| ⭐⭐⭐ | `cocos/animation/animation-clip.ts` | 动画剪辑（~56KB） |
| ⭐⭐⭐ | `cocos/rendering/define.ts` | 渲染定义（~51KB） |
| ⭐⭐⭐ | `cocos/game/game.ts` | 游戏主控制器 |
| ⭐⭐⭐ | `cocos/game/director.ts` | 导演类 |
| ⭐⭐ | `cocos/2d/renderer/batcher-2d.ts` | 2D 批处理（~48KB） |
| ⭐⭐ | `cocos/rendering/render-pipeline.ts` | 渲染管线（~34KB） |

### 常用设计模式

| 模式 | 应用场景 |
|------|----------|
| 组件模式 | Node-Component 架构 |
| 观察者模式 | 事件系统 |
| 对象池模式 | 内存管理 |
| 策略模式 | 多后端适配 |
| 工厂模式 | 资源创建 |
| 单例模式 | Director, AssetManager |

---

## 下一步

根据需要查阅各附录文档。
