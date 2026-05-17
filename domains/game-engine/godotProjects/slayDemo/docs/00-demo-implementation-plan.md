# SlayDemo 实施计划 -- 从文档到可运行 Demo

> 目标项目路径: `client/slay-demo/`
> 引擎: Godot 4.x
> 文档基准: 本文件整合 `docs/design/` `docs/tech/` `docs/art/` 三目录下的全部设计文档
> 语言: 中文 (Chinese), 标点使用 ASCII 半角符号

---

## 一、项目目标与范围

### 1.1 一句话目标

构建一款类《杀戮尖塔》的单人卡牌构筑 Roguelike 最小可玩原型 (MVP), 支持完整的 "选图 -> 战斗 -> 奖励 -> 推进 -> Boss 战 -> 通关结算" 循环。

### 1.2 Demo 范围边界 (来自 docs/design/01-game-design-overview.md)

| 维度 | MVP 包含 | MVP 不包含 |
|------|---------|-----------|
| 角色 | 1 个 (战士/铁甲) | 多角色、多职业 |
| 卡牌 | 20~30 张 (初始12 + 奖励池28) | 75+ 完整卡池 |
| 敌人 | 6~8 个 (4普通 + 2精英 + 1Boss) | 多 Act 敌人库 |
| 地图 | 1 个 Act, 15 层 | 多章节、分支叙事 |
| 状态效果 | 10 种 (力量/敏捷/易伤/虚弱/中毒/格挡/荆棘/生命链接/护盾/无力) | 复杂状态交互 |
| 遗物 | 3~5 个 (有余力时) | 100+ 遗物系统 |
| 事件 | 2~3 个文本事件 | 完整事件网络 |
| 药水 | 3 种 (治疗/力量/格挡) | 完整药水系统 |
| 商店 | 有 (2 个位置: 层5、层12) | 多商店类型 |
| 休息点 | 有 (层14 Boss 前) | 多休息点 |
| Meta 进度 | 无 | 解锁系统、成就 |
| 在线功能 | 无 | 排行榜、联机 |

### 1.3 核心设计理念

1. **决策密度优先**: 每回合的选择都有意义, 不存在 "无脑最优解"
2. **可读性至上**: 敌人意图提前展示, 卡牌效果关键词高亮
3. **涌现式策略**: 通过卡牌组合与状态交互产生意外而有趣的战术
4. **短反馈循环**: 单局 20~40 分钟, 每次选择在几秒内看到结果

---

## 二、文档地图 (Documentation Map)

以下为当前 `docs/` 目录的完整文档索引, 供开发者快速定位参考文档:

### 2.1 设计文档 (docs/design/)

| 编号 | 文件 | 内容 | 实施参考价值 |
|------|------|------|-------------|
| 01 | [docs/design/01-game-design-overview.md](design/01-game-design-overview.md) | 游戏总览、核心循环、受众分析 | **必读 -- 确定 MVP 边界** |
| 02 | [docs/design/02-card-design.md](design/02-card-design.md) | 卡牌分类、初始牌组(12张)、奖励卡池(28张)、升级路径 | **必读 -- 卡牌数据来源** |
| 03 | [docs/design/03-enemy-design.md](design/03-enemy-design.md) | 4普通敌人 + 2精英 + 1Boss 的完整行为表 | **必读 -- 敌人数据来源** |
| 04 | [docs/design/04-map-and-progression.md](design/04-map-and-progression.md) | 15层地图结构、7种房间类型、生成规则 | **必读 -- 地图参数** |
| 05 | [docs/design/05-reward-and-economy.md](design/05-reward-and-economy.md) | 金币/卡牌/药水奖励、商店定价、移除卡牌 | **必读 -- 经济参数** |
| 06 | [docs/design/06-status-and-buff-system.md](design/06-status-and-buff-system.md) | 10种状态效果详细公式与交互 | **必读 -- 状态计算** |
| 07 | [docs/design/07-combat-encounter-design.md](design/07-combat-encounter-design.md) | Easy/Medium/Hard 遭遇池、难度系数 | **必读 -- 遭遇配置** |

### 2.2 技术文档 (docs/tech/)

| 编号 | 文件 | 内容 | 实施参考价值 |
|------|------|------|-------------|
| 01 | [docs/tech/01-architecture-overview.md](tech/01-architecture-overview.md) | 四层架构、模块通信方式 | **必读 -- 架构约束** |
| 02 | [docs/tech/02-battle-system-tech.md](tech/02-battle-system-tech.md) | 战斗状态机(FSM)、回合流程、卡组流转 | 核心实现参考 |
| 03 | [docs/tech/03-card-effect-system.md](tech/03-card-effect-system.md) | CardData Resource 结构、EffectAction 体系 | 数据定义参考 |
| 04 | [docs/tech/04-enemy-ai-system.md](tech/04-enemy-ai-system.md) | EnemyData、行为模式、意图枚举 | AI 实现参考 |
| 05 | [docs/tech/05-status-system.md](tech/05-status-system.md) | StatusData、叠加/消退/触发时机 | 状态实现参考 |
| 06 | [docs/tech/06-data-management.md](tech/06-data-management.md) | Resource 目录结构、DataLoader 加载策略 | 数据管理参考 |
| 07 | [docs/tech/07-map-generation.md](tech/07-map-generation.md) | DAG 地图生成算法、路径验证 | 地图实现参考 |
| 08 | [docs/tech/08-scene-and-flow.md](tech/08-scene-and-flow.md) | 场景树、SceneRouter、CanvasLayer 分层 | 场景架构参考 |
| 09 | [docs/tech/09-ui-system.md](tech/09-ui-system.md) | CardView、HandLayout、UI 主题 | UI 实现参考 |
| 10 | [docs/tech/10-save-and-testing.md](tech/10-save-and-testing.md) | 存档系统、SaveData 结构、单元测试 | 存档与测试参考 |

### 2.3 美术文档 (docs/art/)

| 编号 | 文件 | 内容 | 实施参考价值 |
|------|------|------|-------------|
| 01 | [docs/art/01-art-direction.md](art/01-art-direction.md) | 扁平手绘风、暗色奇幻调色板、功能色定义 | **必读 -- 美术风格** |
| 02 | [docs/art/02-resource-inventory.md](art/02-resource-inventory.md) | 资源清单与缺口分析 | 资源盘点 |
| 03 | [docs/art/03-free-resource-guide.md](art/03-free-resource-guide.md) | 免费资源获取渠道与授权 | 资源获取 |
| 04 | [docs/art/04-card-art-template.md](art/04-card-art-template.md) | 卡牌视觉模板规范 | 卡牌 UI 实现 |
| 05 | [docs/art/05-character-design.md](art/05-character-design.md) | 角色视觉设计 | 角色实现 |
| 06 | [docs/art/06-ui-design-guide.md](art/06-ui-design-guide.md) | UI 布局与交互规范 | UI 布局参考 |
| 07 | [docs/art/07-vfx-and-animation.md](art/07-vfx-and-animation.md) | 特效与动画方案 | 动效实现 |
| 08 | [docs/art/08-implementation-timeline.md](art/08-implementation-timeline.md) | 美术阶段对齐计划 | 工期参考 |

---

## 三、MVP 验收标准 (Acceptance Criteria)

| 编号 | 验收项 | 通过条件 | 对应文档 |
|------|--------|---------|---------|
| AC-01 | 主菜单可进入游戏 | 点击 "开始游戏" 进入地图界面 | [tech/08](tech/08-scene-and-flow.md) |
| AC-02 | 完整地图展示 | 显示 15 层 DAG 地图, 可点击选择路径, 节点类型用不同图标区分 | [design/04](design/04-map-and-progression.md), [tech/07](tech/07-map-generation.md) |
| AC-03 | 战斗可执行 | 进入战斗 -> 抽牌5张 -> 出牌消耗能量 -> 结束回合 -> 敌人行动 -> 循环至胜负 | [design/01](design/01-game-design-overview.md), [tech/02](tech/02-battle-system-tech.md) |
| AC-04 | 初始牌组可用 | 12张初始牌 (5打击+4防御+1重击+1旋风斩+1战嚎) 效果正确 | [design/02](design/02-card-design.md) |
| AC-05 | 全部卡牌效果正确 | 28张奖励可抽卡牌效果按文档执行, 升级后效果变化正确 | [design/02](design/02-card-design.md), [tech/03](tech/03-card-effect-system.md) |
| AC-06 | 敌人 AI 正确 | 6~8个敌人按行为模式行动, 意图正确展示, Boss 有阶段切换 | [design/03](design/03-enemy-design.md), [tech/04](tech/04-enemy-ai-system.md) |
| AC-07 | 状态效果正确 | 10种状态叠加/消退/触发时机按文档公式计算 | [design/06](design/06-status-and-buff-system.md), [tech/05](tech/05-status-system.md) |
| AC-08 | 战斗奖励可领取 | 胜利后展示3选1卡牌 + 金币获得, 可选跳过 | [design/05](design/05-reward-and-economy.md) |
| AC-09 | 商店可交易 | 可购买卡牌/药水, 可移除卡牌 | [design/05](design/05-reward-and-economy.md) |
| AC-10 | 休息点可操作 | 可升级1张牌 或 回复30% HP | [design/04](design/04-map-and-progression.md) |
| AC-11 | Boss 战可通关 | 击败 Boss 后显示通关结算 | [design/03](design/03-enemy-design.md) |
| AC-12 | 存档/读档可用 | 战斗后自动存档, 主菜单可继续游戏, 读档后状态一致 | [tech/10](tech/10-save-and-testing.md) |
| AC-13 | 无阻断性 Bug | 从主菜单到通关完整一局无崩溃或软锁 | 全局 |

---

## 四、分阶段路线图 (Phased Roadmap)

### 总览

```
阶段1: 项目骨架    阶段2: 数据层      阶段3: 战斗闭环
    (2-3天)          (2-3天)            (4-6天)
       |               |                  |
       v               v                  v
  [项目创建]  ->  [全部 .tres]  ->  [可打一回合]
  目录结构        资源就绪          战斗循环完整
  Autoload        数据加载          卡牌效果引擎
  场景路由        卡组管理          敌人 AI


阶段4: UI + 地图    阶段5: 存档 + 测试      阶段6: 美术集成
    (3-5天)           (2-3天)               (2-3天)
       |               |                     |
       v               v                     v
  [完整可玩]  ->  [可存档读档]  ->  [视觉完整]
  地图生成          自动存档            占位美术替换
  手牌 UI           回归测试            视觉打磨
  奖励/商店界面      Bug 修复           动效添加
```

### 阶段 1: 项目骨架 (预计 2-3 天)

**目标**: 创建 Godot 项目, 搭建分层架构骨架, 场景可以切换。

**交付物**:
- Godot 项目创建 (`client/slay-demo/project.godot`)
- 项目设置 (窗口大小 1920x1080, 渲染器, 输入映射)
- Autoload 单例注册: `GameState`, `SceneRouter`, `DataLoader`
- 基础场景创建: `MainMenu`, `MapScene`, `BattleScene`, `RewardScene`, `RestScene`
- SceneRouter 实现场景切换 (带 Fade 过渡)
- 四层目录结构: `scripts/`, `scenes/`, `resources/`, `assets/`
- `resources/ui_theme.tres` 基础主题 (色板来自 [art/01](art/01-art-direction.md))
- 基础脚本 stub: `battle_manager.gd`, `card_data.gd`, `enemy_data.gd`, `status_data.gd`

**参考文档**: [tech/01](tech/01-architecture-overview.md), [tech/08](tech/08-scene-and-flow.md), [art/01](art/01-art-direction.md)

---

### 阶段 2: 数据层 (预计 2-3 天)

**目标**: 创建全部游戏数据的 `.tres` 资源文件, 实现 DataLoader 加载与缓存。

**交付物**:

- **卡牌数据** (40 张 .tres):
  - `resources/cards/red/strike.tres` ~ `demonic_form.tres` (初始12 + 奖励28)
  - 每张卡牌包含: id, cost, card_type, rarity, effects[], target_type, 升级后 effects[]
  - 参考 [design/02](design/02-card-design.md) 完整卡牌表, [tech/03](tech/03-card-effect-system.md) CardData 结构

- **敌人数据** (7 个 .tres):
  - `resources/enemies/act1/green_slime.tres` (绿皮小怪)
  - `resources/enemies/act1/spiky_beast.tres` (尖刺兽)
  - `resources/enemies/act1/shadow_cultist.tres` (暗影法师)
  - `resources/enemies/act1/shell_turtle.tres` (石壳龟)
  - `resources/enemies/act1/corrupted_knight.tres` (堕落骑士 -- 精英)
  - `resources/enemies/act1/ancient_golem.tres` (远古魔像 -- 精英)
  - `resources/enemies/boss/abyss_lord.tres` (深渊领主 -- Boss)
  - 参考 [design/03](design/03-enemy-design.md), [tech/04](tech/04-enemy-ai-system.md)

- **状态数据** (10 个 .tres):
  - `resources/statuses/strength.tres`, `dexterity.tres`, `vulnerable.tres`, `frail.tres`, `poison.tres`, `block.tres`, `thorns.tres`, `regeneration.tres`, `shield.tres`, `weak.tres`
  - 参考 [design/06](design/06-status-and-buff-system.md), [tech/05](tech/05-status-system.md)

- **遭遇数据** (约 12 个 .tres):
  - Easy 池 (层1~4): E-01~E-04
  - Medium 池 (层5~9): M-01~M-04
  - Hard 池 (层10~14): H-01~H-02
  - 精英: elite_corrupted_knight, elite_ancient_golem
  - Boss: boss_abyss_lord
  - 参考 [design/07](design/07-combat-encounter-design.md)

- **DataLoader** 实现:
  - 懒加载 + 缓存机制
  - `get_card(id)`, `get_enemy(id)`, `get_status(id)`, `get_encounter(id)`
  - 参考 [tech/06](tech/06-data-management.md)

**参考文档**: [design/02](design/02-card-design.md), [design/03](design/03-enemy-design.md), [design/06](design/06-status-and-buff-system.md), [design/07](design/07-combat-encounter-design.md), [tech/03](tech/03-card-effect-system.md), [tech/04](tech/04-enemy-ai-system.md), [tech/05](tech/05-status-system.md), [tech/06](tech/06-data-management.md)

---

### 阶段 3: 战斗闭环 (预计 4-6 天)

**目标**: 实现完整战斗循环, 包括抽牌/出牌/弃牌/敌人行动/胜负判定。

**交付物**:

- **BattleManager** (战斗状态机):
  - 状态: BATTLE_START -> PLAYER_TURN -> PLAYER_RESOLVE -> ENEMY_TURN -> ENEMY_RESOLVE -> (循环) -> BATTLE_END
  - 信号: `state_changed`, `battle_started`, `battle_ended`
  - 参考 [tech/02](tech/02-battle-system-tech.md)

- **DeckManager** (卡组流转):
  - 抽牌堆 (draw_pile) -> 手牌 (hand, 上限10) -> 弃牌堆 (discard_pile)
  - 弃牌堆洗回抽牌堆 (当抽牌堆空时)
  - 参考 [tech/02](tech/02-battle-system-tech.md)

- **EnergySystem** (能量系统):
  - 每回合 3 能量, 回合结束清零
  - 消耗检查: `can_play_card(cost) -> bool`

- **CardEffectEngine** (卡牌效果引擎):
  - 解析 EffectAction 队列并顺序执行
  - 支持: damage, block, draw, apply_status, heal, exhaust, aoe
  - 力量/敏捷/易伤/虚弱 公式计算
  - 目标选择: SINGLE_ENEMY, ALL_ENEMIES, SELF, RANDOM_ENEMY
  - 参考 [tech/03](tech/03-card-effect-system.md)

- **EnemyAI** (敌人 AI):
  - 行为模式: 固定序列 (FIXED_SEQUENCE) + 权重池 (WEIGHTED_POOL)
  - 意图生成与展示
  - Boss 分阶段 (HP < 50% 切换)
  - 参考 [tech/04](tech/04-enemy-ai-system.md)

- **StatusManager** (状态管理器):
  - 状态挂载/叠加/消退/触发
  - 回合开始/结束时处理所有实体状态
  - 参考 [tech/05](tech/05-status-system.md)

**参考文档**: [design/01](design/01-game-design-overview.md), [design/06](design/06-status-and-buff-system.md), [tech/02](tech/02-battle-system-tech.md), [tech/03](tech/03-card-effect-system.md), [tech/04](tech/04-enemy-ai-system.md), [tech/05](tech/05-status-system.md)

---

### 阶段 4: UI 与地图 (预计 3-5 天)

**目标**: 实现地图选择界面、战斗 UI (手牌/敌人/玩家状态)、奖励界面、商店界面、休息点界面。

**交付物**:

- **MapScene 与地图生成**:
  - 15 层 DAG 地图生成算法
  - 节点类型区分 (战斗/精英/Boss/商店/事件/休息)
  - 玩家路径选择交互
  - 参考 [design/04](design/04-map-and-progression.md), [tech/07](tech/07-map-generation.md)

- **BattleScene 战斗 UI**:
  - 手牌区域 (HandArea + HandLayout): 扇形排列, 悬浮放大, 拖拽出牌
  - CardView 组件: 费用/名称/描述/类型标签/稀有度标记
  - 敌人区域: 立绘 + HP 条 + 意图图标+数值 + 状态图标
  - 玩家区域: HP 条 + 格挡数值 + 能量显示 + 状态图标
  - 抽牌堆/弃牌堆按钮
  - 结束回合按钮
  - 参考 [tech/09](tech/09-ui-system.md), [art/06](art/06-ui-design-guide.md)

- **RewardScene 奖励界面**:
  - 3 选 1 卡牌展示 (含跳过按钮)
  - 金币获得动画
  - 参考 [design/05](design/05-reward-and-economy.md)

- **商店界面**:
  - 5 张卡牌 + 2 瓶药水 展示
  - 移除卡牌选项 (75G)
  - 金币余额显示
  - 参考 [design/05](design/05-reward-and-economy.md)

- **休息点界面**:
  - 休息 (回复 30% HP) 或 锻造 (升级 1 张牌) 二选一
  - 参考 [design/04](design/04-map-and-progression.md)

- **事件界面** (2~3 个文本事件):
  - 事件文本展示 + 2~3 个选项按钮
  - 选项有不同的风险和回报

**参考文档**: [design/04](design/04-map-and-progression.md), [design/05](design/05-reward-and-economy.md), [tech/07](tech/07-map-generation.md), [tech/08](tech/08-scene-and-flow.md), [tech/09](tech/09-ui-system.md)

---

### 阶段 5: 存档与测试 (预计 2-3 天)

**目标**: 实现自动存档/读档, 完成核心流程回归测试, 修复阻断性 Bug。

**交付物**:

- **SaveManager** (存档系统):
  - SaveData Resource 结构
  - 自动存档触发点: 每场战斗后、每层地图选择后
  - 读档: 主菜单 "继续游戏" 按钮
  - 参考 [tech/10](tech/10-save-and-testing.md)

- **GameState** (全局状态):
  - 玩家 HP/金币/牌组/已升级卡牌索引
  - 地图种子/当前节点/已访问节点
  - 当前楼层/Act
  - 参考 [tech/01](tech/01-architecture-overview.md), [tech/10](tech/10-save-and-testing.md)

- **回归测试 checklist** (手动执行):
  - AC-01 ~ AC-13 逐项验证
  - 边界情况: 手牌满、牌组空、金币不足、HP 为 0、Boss 阶段切换
  - 软锁检查: 无可用操作时是否有合理的默认行为

**参考文档**: [tech/10](tech/10-save-and-testing.md), [tech/01](tech/01-architecture-overview.md)

---

### 阶段 6: 美术集成与打磨 (预计 2-3 天)

**目标**: 替换占位美术, 添加基础动效, 视觉打磨至可用状态。

**交付物**:

- **占位美术替换**:
  - 卡牌: 应用卡牌模板 + 类型图标 (来自 [art/04](art/04-card-art-template.md))
  - 敌人: 使用免费资源或几何占位图 (来自 [art/03](art/03-free-resource-guide.md))
  - 玩家: 角色立绘 (来自 [art/05](art/05-character-design.md))
  - UI: 应用全局 Theme (来自 [art/06](art/06-ui-design-guide.md))
  - 背景: 战斗背景 / 地图背景 / 主菜单背景

- **基础动效**:
  - 卡牌打出: 移动 + 缩放 (Tween)
  - 伤害数字: 弹出 + 淡出 (来自 [art/07](art/07-vfx-and-animation.md))
  - 格挡获得: 盾牌闪烁
  - 状态施加: 图标弹出
  - 场景切换: 淡入淡出
  - 敌人死亡: 溶解/缩小

- **视觉打磨**:
  - 颜色一致性检查 (色板来自 [art/01](art/01-art-direction.md))
  - 文字对比度检查
  - 分辨率适配

**参考文档**: [art/01](art/01-art-direction.md), [art/04](art/04-card-art-template.md), [art/06](art/06-ui-design-guide.md), [art/07](art/07-vfx-and-animation.md), [art/08](art/08-implementation-timeline.md)

---

## 五、里程碑任务分解 (Milestone Task Breakdown)

以下为各里程碑的关键任务, 标 `*` 为阻塞后续里程碑的硬依赖:

### M1: 项目骨架就绪 (阶段1 完成)

- [ ] M1.1  创建 Godot 项目, 设置窗口 1920x1080
- [ ] M1.2  创建目录结构 (scripts/scenes/resources/assets)
- [ ] M1.3* 注册 Autoload: GameState, SceneRouter, DataLoader
- [ ] M1.4* 实现 SceneRouter 基础切换 (Fade 过渡)
- [ ] M1.5  创建 5 个基础场景 .tscn 文件
- [ ] M1.6  创建 ui_theme.tres 基础主题
- [ ] M1.7  创建核心脚本 stub (BattleManager/CardData/EnemyData/StatusData)
- [ ] M1.8  验证: 主菜单 -> 地图场景 -> 战斗场景 可切换

### M2: 数据资产就绪 (阶段2 完成)

- [ ] M2.1  创建全部 40 张卡牌 CardData .tres 文件
- [ ] M2.2  创建全部 7 个敌人 EnemyData .tres 文件
- [ ] M2.3  创建全部 10 个状态 StatusData .tres 文件
- [ ] M2.4  创建全部约 12 个遭遇 EncounterData .tres 文件
- [ ] M2.5* 实现 DataLoader 懒加载 + 缓存
- [ ] M2.6  验证: DataLoader.get_card("strike") 返回正确的 CardData

### M3: 战斗可玩 (阶段3 完成)

- [ ] M3.1* 实现 BattleManager 状态机 (6 状态)
- [ ] M3.2* 实现 DeckManager (抽牌堆/手牌/弃牌堆 流转)
- [ ] M3.3* 实现 EnergySystem (每回合 3 能量)
- [ ] M3.4* 实现 CardEffectEngine (damage/block/draw/status/aoe)
- [ ] M3.5* 实现 EnemyAI (固定序列 + 权重池)
- [ ] M3.6* 实现 StatusManager (叠加/消退/触发公式)
- [ ] M3.7  实现 Boss 阶段切换逻辑
- [ ] M3.8  验证: 单场战斗中完成以下操作:
  - 抽牌 5 张 -> 打出打击 (伤害正确) -> 打出防御 (格挡正确) -> 结束回合
  - 敌人按意图行动 -> 新回合开始 (格挡清零) -> 状态持续回合递减

### M4: 地图与流程 (阶段4 完成)

- [ ] M4.1* 实现地图生成算法 (DAG, 15层, 2~4节点/层)
- [ ] M4.2* 实现 MapScene 节点展示与选择交互
- [ ] M4.3* 进入战斗房间 -> BattleScene -> 胜利 -> RewardScene -> 返回地图
- [ ] M4.4  实现商店界面与交易逻辑
- [ ] M4.5  实现休息点界面 (休息/锻造)
- [ ] M4.6  实现事件界面 (2~3 个文本事件)
- [ ] M4.7  实现手牌 UI 扇形排列 + 悬浮放大
- [ ] M4.8  实现 CardView 完整组件
- [ ] M4.9  验证: 从主菜单 -> 地图选节点 -> 战斗 -> 奖励 -> 地图推进 -> Boss 战 -> 通关

### M5: 存档与稳定 (阶段5 完成)

- [ ] M5.1* 实现 SaveData Resource 结构
- [ ] M5.2* 实现 SaveManager.save_game() / load_game()
- [ ] M5.3* 关键节点自动存档 (战斗后 + 地图选择后)
- [ ] M5.4  主菜单 "继续游戏" 按钮功能
- [ ] M5.5  执行 AC-01 ~ AC-13 全部验收项测试
- [ ] M5.6  修复所有阻断性 Bug
- [ ] M5.7  验证: 保存 -> 退出 -> 重新启动 -> 继续游戏 -> 状态完全一致

### M6: 视觉完整 (阶段6 完成)

- [ ] M6.1  卡牌应用模板 + 图标替换占位
- [ ] M6.2  敌人替换占位美术
- [ ] M6.3  玩家立绘替换
- [ ] M6.4  战斗背景 / 地图背景替换
- [ ] M6.5  伤害数字弹出动效
- [ ] M6.6  卡牌打出动效
- [ ] M6.7  场景切换动效
- [ ] M6.8  状态图标显示
- [ ] M6.9  验证: 一局完整游戏的视觉表现无重大缺陷

---

## 六、依赖关系图 (Dependency Order)

```
M1 (项目骨架)
 |
 +---> M2 (数据资产) -- 并行工作, 但不阻塞 M1
 |        |
 |        +---> M3 (战斗闭环) -- 依赖 M2 的数据就绪 + M1 的架构框架
 |                 |
 |                 +---> M4 (UI + 地图) -- 依赖 M3 的战斗逻辑 + M2 的数据
 |                          |
 |                          +---> M5 (存档 + 测试) -- 依赖 M4 的完整流程
 |                                   |
 |                                   +---> M6 (美术集成) -- 可与 M5 部分并行, 但最终稳定需要 M5
```

**并行策略**:
- M1 和 M2 可以部分并行: M1 完成后即可开始创建 .tres 文件
- M3 战斗闭环是核心阻塞点, 必须在 M4 之前完成
- M6 美术集成可以与 M4/M5 部分并行, 但最终替换需要等 UI 结构稳定

---

## 七、风险检查清单 (Risk Checklist)

| 编号 | 风险项 | 严重度 | 缓解策略 |
|------|--------|--------|---------|
| R01 | 卡牌效果引擎过于复杂导致实施超期 | 高 | 首版仅实现 damage/block/draw/status 四种核心效果, 其他效果 (如消耗/虚无/固有) 延后 |
| R02 | 敌人 AI 行为模式文档与实现不一致 | 中 | 每个敌人先实现最小行为 (仅攻击), 验证后再添加复杂模式 |
| R03 | 状态效果公式计算有误 | 中 | 为每种状态编写单元测试验证公式, 特别是 力量+易伤 和 敏捷+虚弱 的组合计算 |
| R04 | 地图生成算法出现不可达路径 | 中 | 生成后验证从起点到 Boss 存在至少一条路径, 否则重新生成 |
| R05 | 手牌 UI 排列算法复杂 | 中 | 首版使用简单水平排列, 扇形排列作为优化项延后 |
| R06 | Godot 4.x 版本兼容问题 | 低 | 使用 stable 版本 (4.3+), 避免 dev 版本的不稳定 API |
| R07 | 存档格式变更导致旧存档不可读 | 低 | SaveData 中记录 version 字段, 读档时做版本检查 |
| R08 | 免费美术资源授权不明确 | 低 | 所有外部资源在 LICENSES.txt 中记录来源和授权 |
| R09 | 多敌人战斗性能问题 | 低 | 敌人数量上限为 3, 同屏不超过 3 个敌人实例 |
| R10 | 事件系统复杂度超出 Demo 范围 | 低 | 事件简化为 "文本 + 2~3 选项 + 固定后果", 不做分支跳转 |

---

## 八、下一步行动清单 (Next-Action Checklist)

按优先级排序, 可直接分配给开发者或 AI Agent 执行:

### 立即执行 (本周)

1. **[P0] 创建 Godot 项目骨架**
   - 在 `client/slay-demo/` 创建 Godot 4.x 项目
   - 配置项目设置 (窗口/输入映射/渲染器)
   - 创建目录结构 (见 [art/08 目录结构](art/08-implementation-timeline.md))
   - 参考: [tech/01](tech/01-architecture-overview.md), [tech/08](tech/08-scene-and-flow.md)

2. **[P0] 注册 Autoload 并实现场景切换**
   - 创建 GameState, SceneRouter, DataLoader 三个 Autoload 脚本
   - 实现 SceneRouter 的 `go_to(scene_name, transition_type)` 方法
   - 验证: 主菜单可以切换到战斗场景

3. **[P0] 创建核心数据类 stub**
   - CardData Resource (含枚举: CardType, CardRarity, TargetType)
   - EnemyData Resource (含枚举: BehaviorType, IntentType)
   - StatusData Resource (含枚举: StackType, DecayType, TriggerTiming)
   - EncounterData Resource
   - 参考: [tech/03](tech/03-card-effect-system.md), [tech/04](tech/04-enemy-ai-system.md), [tech/05](tech/05-status-system.md)

### 本周后续 (M1 完成后)

4. **[P1] 批量创建卡牌 .tres 数据**
   - 优先: 初始 12 张牌 (strike/defend/bash/cleave/war_cry)
   - 然后: 28 张奖励卡牌 (C01~C12, U01~U10, R01~R06)
   - 每张卡牌填写: id, card_name, description, cost, card_type, rarity, effects[], target_type
   - 参考: [design/02](design/02-card-design.md) 完整卡牌表

5. **[P1] 批量创建敌人 .tres 数据**
   - 优先: 绿皮小怪 (教学敌, 固定序列)
   - 然后: 尖刺兽/暗影法师/石壳龟
   - 最后: 精英 + Boss
   - 参考: [design/03](design/03-enemy-design.md)

6. **[P1] 批量创建状态 .tres 数据**
   - 优先: 力量/敏捷/易伤/虚弱 (核心战斗状态)
   - 然后: 格挡/中毒/荆棘/生命链接/护盾/无力
   - 参考: [design/06](design/06-status-and-buff-system.md)

### 下周 (M2 完成后)

7. **[P1] 实现战斗状态机**
   - BattleManager 的 6 状态 FSM
   - DeckManager 抽牌/弃牌/洗牌逻辑
   - EnergySystem 能量消耗与回复
   - 参考: [tech/02](tech/02-battle-system-tech.md)

8. **[P1] 实现卡牌效果引擎**
   - EffectAction 解析与执行
   - 伤害/格挡/抽牌/状态施加 四种核心效果
   - 力量/敏捷/易伤/虚弱 公式计算
   - 参考: [tech/03](tech/03-card-effect-system.md), [design/06](design/06-status-and-buff-system.md)

9. **[P2] 实现敌人 AI**
   - 固定序列模式 (FIXED_SEQUENCE)
   - 权重池模式 (WEIGHTED_POOL)
   - 意图生成与展示
   - 参考: [tech/04](tech/04-enemy-ai-system.md)

### 后续 (M3 完成后)

10. **[P2] 实现地图生成**
    - DAG 算法: 15 层, 每层 2~4 节点
    - 路径可达性验证
    - 房间类型分配 (按层规则)
    - 参考: [tech/07](tech/07-map-generation.md), [design/04](design/04-map-and-progression.md)

11. **[P2] 实现完整 UI**
    - 手牌扇形排列 + CardView 组件
    - 敌人/玩家状态展示
    - 奖励界面/商店界面/休息点界面
    - 参考: [tech/09](tech/09-ui-system.md), [art/06](art/06-ui-design-guide.md)

12. **[P3] 实现存档系统**
    - SaveData Resource + SaveManager
    - 自动存档触发点
    - 主菜单 "继续游戏"
    - 参考: [tech/10](tech/10-save-and-testing.md)

13. **[P3] 回归测试 + Bug 修复**
    - AC-01 ~ AC-13 逐项验收
    - 边界情况测试
    - 阻断性 Bug 清零

14. **[P3] 美术集成**
    - 占位美术替换为实际资源
    - 基础动效添加
    - 视觉打磨
    - 参考: [art/01](art/01-art-direction.md) ~ [art/08](art/08-implementation-timeline.md)

---

## 九、附录: 关键参数速查表

### 9.1 卡牌速查

| 参数 | 值 |
|------|-----|
| 初始牌组 | 12 张 (5打击+4防御+1重击+1旋风斩+1战嚎) |
| 奖励牌池 | 28 张 (12普通+10罕见+6稀有) |
| 每回合抽牌 | 5 张 |
| 手牌上限 | 10 张 |
| 每回合能量 | 3 |
| 普通:罕见:稀有 概率 | 65%:25%:10% (奖励); 70%:25%:5% (普通战斗后) |
| 升级方式 | 休息点锻造 (1张牌) 或 事件奖励 |
| 卡牌商店价格 | 普通50G / 罕见75G / 稀有150G |
| 移除卡牌价格 | 75G |

### 9.2 敌人速查

| 敌人 | HP | 类型 | 行为模式 |
|------|-----|------|---------|
| 绿皮小怪 | 12~17 | 普通 | 固定序列 (4回合循环) |
| 尖刺兽 | 20~26 | 普通 | 权重池 |
| 暗影法师 | 18~22 | 普通 | 权重池 |
| 石壳龟 | 24~30 | 普通 | 固定序列 (3回合循环) |
| 堕落骑士 | 50~60 | 精英 | 条件分支 + 权重池 |
| 远古魔像 | 60~70 | 精英 | 固定序列 + 护盾机制 |
| 深渊领主 | 140~160 | Boss | Boss 分阶段 (2阶段) |

### 9.3 地图参数

| 参数 | 值 |
|------|-----|
| Act 数 | 1 |
| 楼层数 | 15 (层0起点 + 层1~14 + 层15 Boss) |
| 每层分支 | 3 条可选路径 |
| 最短路径 | 15 步 |
| 商店位置 | 层5, 层12 |
| 精英位置 | 层7, 层11 |
| 休息点 | 层14 (Boss 前) |
| Boss | 层15 (固定) |

### 9.4 金币经济

| 战斗类型 | 金币范围 | 平均 |
|---------|---------|------|
| 普通战斗 | 8~15 (+3 中期, +6 后期) | 12 |
| 精英 | 25~35 | 30 |
| Boss | 60~80 | 70 |

### 9.5 状态公式

| 状态 | 核心公式 |
|------|---------|
| 力量 | 最终伤害 = 基础伤害 + 力量值 |
| 敏捷 | 最终格挡 = 基础格挡 + 敏捷值 |
| 易伤 | 最终伤害 = (基础伤害 + 力量) x 1.5 (向上取整) |
| 虚弱 | 最终格挡 = floor((基础格挡 + 敏捷) x 0.75) |
| 中毒 | 回合开始: 受到 层数 点伤害, 层数 -1 |
| 格挡 | 回合结束: 清零 |
| 荆棘 | 受到攻击时: 攻击者受到 层数 点伤害 |
| 生命链接 | 回合开始: 回复 层数 点 HP |

---

> 本文档整合自 `docs/design/` `docs/tech/` `docs/art/` 共 25 份设计文档。
> 所有数值与设计细节以源文档为准, 本文仅提供实施框架与执行指引。
> 最后更新: 2026-05-17
