# 开发视角 — 项目评审报告
> 日期：2026-06  版本：当前主分支

---

## 一、架构总览

### 1.1 分层架构

```
┌─────────────────────────────────────────────────────────┐
│  Scene Layer（scenes/）                                  │
│  battle_scene / map_scene / shop_scene / ...             │
│  纯 UI 响应，不持有业务状态                                │
├─────────────────────────────────────────────────────────┤
│  Autoload Layer（autoload/）                             │
│  DataLoader / GameState / RunController / SceneRouter    │
│  SaveService — 全局单例，跨场景持久化                      │
├─────────────────────────────────────────────────────────┤
│  Service Layer（battle/ event/ map/ shop/ reward/ ...）  │
│  纯静态函数类（RefCounted），无副作用                        │
├─────────────────────────────────────────────────────────┤
│  Data Layer（data/*.json）                               │
│  cards / relics / potions / enemies / encounters / runs  │
└─────────────────────────────────────────────────────────┘
```

**优点**：
- Scene 层不直接操作数据，通过 autoload 单例解耦——场景可以随时销毁重建
- Service 层全部为静态函数，无状态，单元测试极易编写
- 数据驱动：新增卡牌/遗物/敌人只改 JSON，代码零改动

### 1.2 核心数据流

```
DataLoader.load_all()
    ↓ 验证 JSON 格式
GameState.start_new_run(run_config)
    ↓ 初始化玩家状态、地图节点
RunController.enter_current_node()
    ↓ 根据节点类型路由
SceneRouter.go_to("battle" | "shop" | ...)
    ↓ 场景加载，从 GameState 读取状态
BattleController.setup() / .start_combat()
    ↓ 信号驱动 UI 更新
combat_event → battle_scene._on_combat_event()
```

---

## 二、各模块实现质量

### 2.1 战斗系统（battle/）

**BattleController**
- 状态机清晰（setup → player → enemy → won/lost）
- 信号通信（state_changed / combat_event / combat_won / combat_lost）解耦 UI
- **问题**：`_current_card_vfx_type` 作为成员变量传递 VFX 上下文，是典型的隐式状态传递，如果 effect_runner 在未来支持递归效果（触发器内触发器），会产生竞态

**DeckRuntime**
- retain 机制通过 `_retain_used` 字典标记实现，逻辑正确
- **问题**：`draw()` 和 `discard_hand()` 直接操作数组，没有事件通知，上层拿不到"抽了哪些牌"的信息，日后 VFX（抽牌动画）难以接入

**EffectRunner**
- 13 种效果类型，全部为静态函数，无副作用
- **问题**：`apply_effects` 接收的参数列表较长（effect, battle, source, target_index, acting_enemy_index），新增效果类型需要同步更新参数传递

**StatusManager**
- 11 种状态，`tick_turn_start` / `tick_turn_end` 返回 Dictionary，调用方按需处理
- `calculate_damage` / `calculate_block` 纯计算函数，测试友好
- **问题**：ritual 在 `tick_turn_end` 内直接调用 `apply_status("strength", ...)` 修改自身，strength 的层数累加逻辑与"施加状态覆盖"语义混用，如果未来 strength 需要"叠加"而不是"覆盖"，需要重构

### 2.2 数据层（data/）

**DataLoader**
- `validate_all()` 完整验证所有 JSON 字段，测试中自动调用
- `EFFECT_TYPES` / `POTION_EFFECT_TYPES` 常量白名单分离，防止错误效果类型混入
- **问题**：卡牌的 `upgrade.effects` 只做存在性验证，不验证升级后效果的合法性；`_apply_multi_damage` 构建的中间 Dictionary 复用了 `_apply_damage`，但绕过了 EFFECT_TYPES 白名单检查

### 2.3 地图系统（map/）

**MapGenerator**
- DAG 随机生成，`_validate_path_reachability` 确保每条路线可达
- 精英遭遇池现已包含 4 个（v1_elite_01~04）
- **问题**：`generate_map` 接受 `rng_seed` 但内部混用 `randi()`（全局随机数），导致相同 seed 不保证相同结果——影响 replay / 测试确定性

### 2.4 存档系统（autoload/save_service.gd）

- 完整序列化/反序列化：player_hp / master_deck / relics / potions / map_nodes / gold / wins
- `restore()` 支持继续游戏入口
- **问题**：存档为 JSON 明文，无校验和，玩家可手动修改；单一存档槽，没有多存档支持

### 2.5 UI 工厂（ui/）

| 工厂 | 职责 | 质量 |
|------|------|------|
| card_view_factory | 卡牌按钮渲染 | ✅ 支持 selected/disabled 状态 |
| relic_view_factory | 遗物行/详情 | ✅ |
| status_view_factory | 状态图标 + tooltip | ✅ 支持 11 种状态 |
| potion_view_factory | 药水按钮/空槽 | ✅ |

**共同问题**：所有工厂用 `Node.new()` 动态创建节点，复杂场景（如商店页面有大量卡牌）在低端设备上可能有性能问题，没有对象池或场景复用。

---

## 三、测试覆盖分析

### 3.1 测试结构

```
tests/
├── unit/（14 个文件）
│   ├── 战斗规则、状态机、卡牌运行时、地图生成器
│   ├── 各 Service 类（reward/shop/save/potion）
│   ├── UI 工厂（status_view_factory）
│   └── p3_features_test（新功能）
└── integration/（15 个文件）
    ├── v1/v2 全流程跑通
    ├── 地图路线、休息点、事件、商店、宝箱
    ├── 遗物 UI、药水奖励流程
    └── 结算界面、地图路线连线
```

**总计：514 断言，Failures: 0**

### 3.2 覆盖盲区

| 模块 | 覆盖情况 | 风险 |
|------|---------|------|
| DeckRuntime.draw() 抽牌顺序 | ⚠️ 部分 | 洗牌逻辑未测试边界 |
| EnemyAI 两阶段切换 | ❌ 无 | 敌人 HP 阈值触发未验证 |
| SaveService 损坏存档恢复 | ❌ 无 | 字段缺失时的默认值行为 |
| MapGenerator 同 seed 结果一致性 | ❌ 无 | 见上 rng_seed 问题 |
| VFXManager 特效实例化 | ❌ 无 | 依赖场景树，难以单元测试 |
| AudioManager 资源缺失静默处理 | ⚠️ 部分 | 已有基础测试 |
| 卡牌描述文字格式 | ❌ 无 | 中英文括号混用无检查 |

### 3.3 集成测试质量

V2 全流程测试（`v2_content_flow_test.gd`）是项目最有价值的安全网：
- 跑完完整 19 节点路线（含精英、商店、休息、Boss）
- AI 按优先级自动打牌，不依赖人工干预
- **脆弱点**：新增高分值卡牌会改变奖励排序，多次修复过这个问题

---

## 四、技术债务清单

### 高优先级

| 问题 | 位置 | 影响 |
|------|------|------|
| 卡牌描述硬编码，无模板系统 | cards.json | 描述不一致，本地化困难 |
| `randi()` 破坏 seed 确定性 | map_generator.gd | replay/测试不稳定 |
| `_current_card_vfx_type` 隐式状态 | battle_controller.gd | 嵌套效果时可能错误 |
| 商店删牌无二次确认 | shop_scene.gd | UX 问题 |

### 中优先级

| 问题 | 位置 | 影响 |
|------|------|------|
| 动态节点创建无对象池 | ui/ 所有工厂 | 低端设备性能 |
| 存档无校验和 | save_service.gd | 可手动作弊 |
| EnemyAI 两阶段切换无测试 | enemy_ai.gd | 回归风险 |
| 遗物效果类型与卡牌效果完全独立 | data_loader.gd | 互动型遗物难以实现 |

### 低优先级

| 问题 | 位置 | 影响 |
|------|------|------|
| 腐化/双重点击语义未真正实现 | effect_runner.gd | 卡牌描述与实际效果不符 |
| 多存档槽 | save_service.gd | 单一存档限制多人共用设备 |
| 场景加载无过渡动画 | scene_router.gd | 硬切场景略显粗糙 |

---

## 五、下一步技术路线图

### V1.0 前必须修复

1. **商店删牌确认** — shop_scene.gd 加弹窗，1 天工作量
2. **升级对比 UI** — reward_scene/rest_scene 加升级前后对比，2 天
3. **遗物图标接入** — assets/ui/relics/ 已有目录，需补充图标资源
4. **场景切换过渡** — SceneRouter 加淡入淡出，1 天

### V1.5 架构改进

1. **MapGenerator seed 确定性** — 改用 `RandomNumberGenerator` 实例，隔离全局随机数
2. **DeckRuntime 抽牌事件** — 发 `card_drawn` 信号，为抽牌动画预留接口
3. **遗物互动效果类型扩展** — 新增 `on_play_attack` / `on_turn_end` 等触发类效果类型
4. **EnemyAI 测试补全** — 两阶段切换的边界测试

### V2.0 新功能支撑

1. **角色系统** — 当前代码是战士单角色，抽象 `CharacterConfig` 层支持多角色
2. **诅咒系统** — 新增 curse 类型卡牌，DataLoader 扩展 `CARD_TYPES`
3. **Act 2/3** — 数据层扩展，map_generator 支持 act 参数
