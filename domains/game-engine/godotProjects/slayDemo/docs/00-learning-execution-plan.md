# SlayDemo 学习执行计划
## 目标：通过实践掌握游戏制作的全链路思考与执行

> **项目路径**: `C:\Users\qq691\Desktop\openClasses\domains\game-engine\godotProjects\slayDemo`
> **引擎**: Godot 4.x
> **性质**: 学习型 Demo（类杀戮尖塔 Roguelike 卡牌）
> **核心目标**: 不仅"做完"，更要"理解为什么这么做"

---

## 学习路径总览

```
阶段1: 游戏设计师视角  →  理解"做什么"与"为什么"
    (1-2天)
         ↓
阶段2: 技术架构师视角  →  理解"怎么做"与"技术选型"
    (1-2天)
         ↓
阶段3: 制作人视角     →  理解"优先级"与"风险控制"
    (1天)
         ↓
阶段4: 分角色实践      →  按里程碑动手实现 + 每日复盘
    (2-3周)
         ↓
阶段5: 总结与知识沉淀  →  输出个人知识体系
    (2-3天)
```

---

## 阶段1: 游戏设计师视角（理解设计意图）

### 学习目标
- 理解卡牌构筑 Roguelike 的核心循环
- 理解 MVP 范围裁剪的决策逻辑
- 理解数值平衡的设计思路

### 核心文档阅读清单
| 文档 | 重点思考问题 |
|------|-------------|
| `design/01-game-design-overview.md` | 为什么选这4个设计理念？MVP 砍掉了什么？为什么？ |
| `design/02-card-design.md` | 初始12张牌为什么是这12张？费用曲线如何设计？ |
| `design/03-enemy-design.md` | 敌人难度梯度如何设置？Boss 分阶段的意义？ |
| `design/04-map-and-progression.md` | 地图生成规则背后的体验目标是什么？ |
| `design/05-reward-and-economy.md` | 经济系统如何驱动玩家决策？ |
| `design/06-status-and-buff-system.md` | 状态效果如何创造策略深度？ |
| `design/07-combat-encounter-design.md` | 遭遇设计如何控制难度曲线？ |

### 输出要求
**写一篇设计解读文档**（`docs/learning/designer-notes.md`），回答：
1. 这个Demo的核心乐趣是什么？
2. 如果只能保留3个系统，保留哪3个？为什么？
3. 初始牌组12张牌的设计逻辑是什么？
4. 你发现的设计漏洞或潜在风险是什么？

### 验收标准
- [ ] 读完所有 design/ 文档
- [ ] 输出 designer-notes.md（不少于500字）
- [ ] 能向他人清晰地讲解这个游戏的核心循环

---

## 阶段2: 技术架构师视角（理解技术决策）

### 学习目标
- 理解四层架构分层的决策逻辑
- 理解 Godot Resource 驱动的数据设计
- 理解战斗状态机的设计思路

### 核心文档阅读清单
| 文档 | 重点思考问题 |
|------|-------------|
| `tech/01-architecture-overview.md` | 为什么分四层？每层职责边界在哪里？ |
| `tech/02-battle-system-tech.md` | 为什么用状态机？状态转移条件是什么？ |
| `tech/03-card-effect-system.md` | 为什么用 EffectAction 体系？扩展性如何？ |
| `tech/04-enemy-ai-system.md` | 行为模式和权重池的选择理由？ |
| `tech/05-status-system.md` | 状态叠加/消退/触发的统一抽象如何设计？ |
| `tech/06-data-management.md` | 为什么用 Resource？懒加载的必要性？ |
| `tech/07-map-generation.md` | DAG 算法的选择理由？路径验证为什么重要？ |
| `tech/08-scene-and-flow.md` | 场景管理的职责如何分配？ |
| `tech/09-ui-system.md` | UI 与逻辑分离的设计思路？ |
| `tech/10-save-and-testing.md` | 存档系统设计的核心考量？ |

### 输出要求
**写一篇技术解读文档**（`docs/learning/tech-notes.md`），回答：
1. 四层架构中，如果合并其中两层会出什么问题？
2. CardEffectEngine 如何支持未来扩展新卡牌效果？
3. 敌人 AI 设计中，固定序列 vs 权重池各适合什么场景？
4. 如果要做多人联机，当前架构需要改哪些部分？

### 验收标准
- [ ] 读完所有 tech/ 文档
- [ ] 输出 tech-notes.md（不少于500字）
- [ ] 能画出系统架构图（手写照片或数字图均可）

---

## 阶段3: 制作人视角（理解项目管理）

### 学习目标
- 理解 MVP 范围控制的决策逻辑
- 理解任务优先级排序的方法
- 理解风险识别与缓解策略

### 核心文档
- `00-demo-implementation-plan.md`（实施计划）
- `00-learning-execution-plan.md`（本文档）

### 重点思考
1. **范围控制**: 为什么初始只做1个角色？只做6-8个敌人？
2. **优先级**: M1→M2→M3 的依赖关系为什么这样排？
3. **风险**: R01（卡牌效果引擎复杂）的缓解策略是否合理？
4. **并行**: 哪些任务可以并行？为什么？

### 输出要求
**写一篇制作人笔记**（`docs/learning/producer-notes.md`），包含：
1. 当前计划的优先级排序是否合理？如果不合理，你会怎么调整？
2. 你识别出的前3大风险是什么？如何缓解？
3. 如果只有7天时间，你会砍掉哪些功能？
4. 每日站会应该问哪3个问题？

### 验收标准
- [ ] 输出 producer-notes.md（不少于500字）
- [ ] 能解释当前6阶段路线的合理性
- [ ] 能提出至少2个计划改进建议

---

## 阶段4: 分角色实践（动手实现 + 每日复盘）

### 实践节奏
```
每日循环:
  上午: 实现具体功能（按里程碑分解）
  下午: 调试 + 自我测试
  晚上: 日记式总结（学到了什么？遇到了什么问题？如何解决？）
```

### 里程碑与实践重点

#### M1: 项目骨架（预计2-3天）
**实践重点**: 理解 Godot 项目结构、Autoload 机制、场景切换
**决策思考**:
- 为什么用 SceneRouter 而不是 get_tree().change_scene_to_file()？
- Autoload 单例的选择标准是什么？

**每日输出**: `docs/learning/m1-daily-log.md`

---

#### M2: 数据层（预计2-3天）
**实践重点**: 理解 Godot Resource、数据驱动设计
**决策思考**:
- 为什么用 .tres 而不是 JSON/CSV？
- DataLoader 的缓存策略如何设计？

**每日输出**: `docs/learning/m2-daily-log.md`

---

#### M3: 战斗闭环（预计4-6天）⭐ 核心阶段
**实践重点**: 状态机、卡牌效果解析、敌人AI
**决策思考**:
- 战斗状态机的状态划分是否完整？
- 卡牌效果引擎如何避免硬编码？
- 敌人意图展示的时机如何控制？

**每日输出**: `docs/learning/m3-daily-log.md`

---

#### M4: UI与地图（预计3-5天）
**实践重点**: UI编程、地图生成算法
**决策思考**:
- 手牌排列为什么用扇形而不是直接排列？
- 地图生成的 DAG 算法如何保证可玩性？

**每日输出**: `docs/learning/m4-daily-log.md`

---

#### M5: 存档与测试（预计2-3天）
**实践重点**: 序列化、回归测试
**决策思考**:
- 存档系统的版本管理为什么重要？
- 如何设计有效的测试用例？

**每日输出**: `docs/learning/m5-daily-log.md`

---

#### M6: 美术集成（预计2-3天）
**实践重点**: 资源替换、动效实现
**决策思考**:
- 占位美术 vs 正式美术的切换策略？
- 动效的性能考量？

**每日输出**: `docs/learning/m6-daily-log.md`

---

### 每日复盘模板（必须填写）

保存路径: `docs/learning/daily/YYYY-MM-DD.md`

```markdown
# YYYY-MM-DD 学习日志

## 今日完成
- [ ] 具体完成了什么功能/任务

## 核心决策与思考
- 今天做的最重要的决策是什么？为什么这样选？
- 遇到了什么设计/技术难题？如何解决？

## 新知识
- 今天学到了什么新概念/新方法？

## 疑问与待查
- 还有哪些不清楚的地方？

## 明日计划
- 明天准备做什么？
```

---

## 阶段5: 总结与知识沉淀

### 输出要求

完成所有里程碑后，输出以下文档：

1. **`docs/learning/final-retrospective.md`** - 项目复盘
   - 哪些决策是正确的？哪些是错误的？
   - 如果重新做这个项目，会怎么改进？
   - 掌握了哪些可迁移的知识/方法？

2. **`docs/learning/knowledge-map.md`** - 个人知识体系图
   - 游戏设计知识
   - 技术架构知识
   - 项目管理知识
   - 工具使用知识

3. **`docs/learning/next-steps.md`** - 下一步学习计划
   - 如果要继续扩展这个项目，下一个功能是什么？
   - 如果要学习其他类型游戏，如何迁移这些知识？

### 验收标准
- [ ] 输出3份总结文档
- [ ] 能做30分钟的项目复盘分享（可录屏）
- [ ] 清晰地知道自己的知识盲点在哪里

---

## 学习资源补充

### Godot 引擎学习
- 官方文档: https://docs.godotengine.org/
- GDScript 基础: https://docs.godotengine.org/en/stable/getting_started/scripting/gdscript/

### 游戏设计学习
- 《杀戮尖塔》GDC 分享: https://www.gdcvault.com/
- 卡牌平衡设计: https://www.eurogamer.net/balancing-slay-the-spire

### 项目管理学习
- MVP 设计原则: https://www.agilealliance.org/glossary/mvp/
- 风险矩阵: https://www.projectmanagement.com/

---

## 群内协作规则

### 每日流程
1. **上午**: 在群里同步今日目标（@游戏制作人 汇报）
2. **下午**: 遇到问题在群里提问（附上代码/截图）
3. **晚上**: 在群里分享今日总结链接

### 每周流程
1. **周一**: 规划本周里程碑
2. **周五**: 周总结（完成了什么？遇到什么阻碍？）

### Agent 分工
| Agent | 角色 | 职责 |
|-------|------|------|
| 游戏制作人（我） | Producer | 优先级决策、范围控制、风险识别 |
| 游戏多agent协调者 | Coordinator | 任务分配、进度跟踪、Agent 协作 |
| （你） | Developer + Designer | 具体实现、设计思考 |

---

## 立即行动（第1天）

### 今天的目标
1. [ ] 读完 `design/01-game-design-overview.md`
2. [ ] 读完 `design/02-card-design.md`
3. [ ] 创建 `docs/learning/` 目录
4. [ ] 开始写 `designer-notes.md`
5. [ ] 在群里同步今日进度

### 预计时间
- 阅读: 1-2小时
- 写笔记: 1小时
- 总计: 2-3小时

---

> 最后更新: 2026-05-17
> 维护者: 游戏制作人 Agent
