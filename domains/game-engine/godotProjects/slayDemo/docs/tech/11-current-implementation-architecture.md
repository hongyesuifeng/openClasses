# 11 - 当前实施技术架构设计

> 生成日期: 2026-05-22  
> 基准输入: `docs/requirements/01~06`  
> 目标工程: `client/slay-demo/`  
> 引擎: Godot 4.x  
> 定位: 面向 M1-M4 实施的架构基准文档

## 1. 架构目标

本架构服务 SlayDemo 首版 MVP:

```text
主菜单 -> 地图节点选择 -> 战斗 -> 奖励 -> 地图推进 -> 商店/休息点/精英 -> Boss -> 结算
```

技术目标不是一次性做大系统，而是建立后续可复用的基础框架:

- 场景流转可复用: 主菜单、地图、战斗、奖励、商店、休息点、结算统一由场景路由管理。
- UI 管理可复用: HUD、弹窗、遮罩、提示、卡牌视图、状态图标统一挂在 UI 管理框架下。
- 资源管理可复用: 卡牌、敌人、遭遇、奖励、商店、药水、遗物、状态全部通过数据层加载。
- 战斗逻辑可测试: 战斗状态机、卡牌效果、敌人行动、状态结算尽量不直接依赖 UI 节点。
- 数据驱动优先: 新增卡牌、敌人行动、地图节点、奖励权重时优先改 Resource/配置，而不是改业务代码。

## 2. 当前项目状态判断

当前 Godot 工程已经初始化，已有插件、资产和需求文档，但正式业务系统尚未落地。

| 模块 | 当前状态 | 下一步 |
|------|----------|--------|
| Godot 工程 | 已存在 `project.godot` | 设置主场景和项目目录 |
| 资产 | `assets/` 已整理为可用资源 | 通过 `AssetRegistry` 或数据字段引用 |
| 需求文档 | `requirements/01~06` 已定案 | 作为实施输入 |
| 业务脚本 | 尚未创建 | 先搭 M1 基础框架 |
| 游戏数据 | 尚无 `.tres` | M2 创建 Resource 类和最小数据 |
| 正式场景 | 尚无主菜单/地图/战斗 | M1 创建占位场景 |

因此最新实施顺序应为:

```text
M1 工程骨架 -> M2 数据层最小切片 -> M3 战斗闭环 -> M4 UI/地图/奖励
```

## 3. 总体分层

项目采用五层结构，避免 UI、流程和战斗逻辑混在一起。

```text
┌─────────────────────────────────────────────┐
│ 表现层 Presentation                         │
│ Scene UI / CardView / EnemyView / Popups    │
├─────────────────────────────────────────────┤
│ 应用服务层 App Services                      │
│ UIManager / AudioManager / AssetRegistry    │
├─────────────────────────────────────────────┤
│ 流程层 Flow                                  │
│ GameState / SceneRouter / RunController     │
├─────────────────────────────────────────────┤
│ 玩法逻辑层 Gameplay                          │
│ Battle / Card Effects / Enemy AI / Map      │
├─────────────────────────────────────────────┤
│ 数据层 Data                                  │
│ CardData / EnemyData / EncounterData / etc. │
└─────────────────────────────────────────────┘
```

依赖原则:

- 表现层可以读数据、监听逻辑信号，但不能直接改战斗核心状态。
- 玩法逻辑层不能持有具体 UI 节点。
- 流程层负责切换场景和保存当前 run 状态。
- 应用服务层提供可复用能力，例如弹窗、音频、资源路径、输入锁。
- 数据层只描述静态配置，不承载运行时状态。

## 4. 目录结构设计

建议在 `client/slay-demo/` 下采用以下结构:

```text
client/slay-demo/
├── project.godot
├── assets/
├── resources/
│   ├── cards/
│   ├── enemies/
│   ├── encounters/
│   ├── rewards/
│   ├── shops/
│   ├── statuses/
│   ├── relics/
│   ├── potions/
│   └── ui_theme.tres
├── scenes/
│   ├── app/
│   │   ├── app_root.tscn
│   │   └── main_menu.tscn
│   ├── map/
│   │   ├── map_scene.tscn
│   │   ├── rest_scene.tscn
│   │   └── shop_scene.tscn
│   ├── battle/
│   │   └── battle_scene.tscn
│   ├── reward/
│   │   └── reward_scene.tscn
│   ├── result/
│   │   └── result_scene.tscn
│   └── ui/
│       ├── card_view.tscn
│       ├── enemy_view.tscn
│       ├── status_icon.tscn
│       ├── pile_popup.tscn
│       └── deck_view_popup.tscn
├── scripts/
│   ├── autoload/
│   ├── app/
│   ├── data/
│   ├── battle/
│   ├── map/
│   ├── reward/
│   ├── shop/
│   ├── ui/
│   └── utils/
└── tests/
    ├── unit/
    └── smoke/
```

说明:

- `assets/` 只放图片、字体、音频等外部资源。
- `resources/` 只放 Godot Resource 数据和 Theme。
- `scripts/data/` 放 Resource 类定义，不放 `.tres`。
- `scripts/autoload/` 放全局单例。
- `scripts/app/` 放应用启动、根节点、场景生命周期协调。

## 5. Autoload 与基础服务

首版建议注册以下 Autoload:

| 名称 | 文件 | 职责 | 是否 M1 必做 |
|------|------|------|-------------|
| `GameState` | `scripts/autoload/game_state.gd` | 当前 run 状态、玩家 HP/金币/牌组、输入锁 | 是 |
| `SceneRouter` | `scripts/autoload/scene_router.gd` | 统一场景切换、切换中防重复点击 | 是 |
| `DataLoader` | `scripts/autoload/data_loader.gd` | 加载/缓存 Resource 数据、数据校验入口 | 是 |
| `UIManager` | `scripts/autoload/ui_manager.gd` | 全局弹窗、遮罩、提示、UI 层级 | 是 |
| `EventBus` | `scripts/autoload/event_bus.gd` | 跨系统广播轻量事件 | M2 后引入 |
| `AudioManager` | `scripts/autoload/audio_manager.gd` | 播放 UI/卡牌/战斗音效 | M3 后引入 |
| `AssetRegistry` | `scripts/autoload/asset_registry.gd` | 根据 `art_key/icon_key` 解析资源路径 | M2 后引入 |

### 5.1 GameState

`GameState` 只存跨场景、跨系统的运行态，不处理战斗细节。

首版字段:

```text
current_phase
current_floor
player_max_hp
player_hp
player_gold
master_deck: Array[CardInstance]
current_map
current_node_id
last_encounter_tags
remove_card_count
input_locks
```

职责边界:

- 可以创建新局。
- 可以记录地图进度。
- 可以保存玩家总牌组、金币、血量。
- 不负责抽牌、出牌、敌人行动。
- 不直接操作 UI 节点。

### 5.2 SceneRouter

`SceneRouter` 是唯一场景切换入口。

场景 key:

```text
main_menu
map
battle
reward
shop
rest
result
```

能力:

- 防止重复切场景。
- 提供淡入淡出过渡。
- 切场景时锁输入。
- 在切换完成后广播 `scene_changed`。

### 5.3 DataLoader

`DataLoader` 负责数据加载、缓存和校验。

首版接口:

```text
load_all_cards() -> Dictionary
get_card(id) -> CardData
load_all_enemies() -> Dictionary
get_enemy(id) -> EnemyData
load_all_encounters() -> Dictionary
get_encounter(id) -> EncounterData
get_reward_profile(id) -> RewardProfile
get_shop_profile(id) -> ShopProfile
validate_all() -> PackedStringArray
clear_cache()
```

实现原则:

- 缓存按 `id` 索引，不按文件名索引。
- 缓存中保存静态 Resource，运行时使用 `duplicate(true)` 生成实例数据。
- 校验错误只阻断 debug 构建，不阻断发布构建。

### 5.4 UIManager

`UIManager` 是后续复用价值最高的基础服务之一。

职责:

- 管理全局 UI 层级: transition、modal、tooltip、toast、debug。
- 打开/关闭弹窗。
- 统一输入锁，例如弹窗打开、动画播放、场景切换。
- 提供卡牌预览、牌堆查看、确认弹窗等公共能力。

建议 `AppRoot` 中常驻一个 `GlobalUI`，`UIManager` 在启动时绑定它:

```text
AppRoot
├── SceneContainer
└── GlobalUI
    ├── TransitionLayer
    ├── ModalLayer
    ├── TooltipLayer
    ├── ToastLayer
    └── DebugLayer
```

### 5.5 AssetRegistry

数据文档中使用 `art_key`、`icon_key`，不建议每个数据文件直接写死完整资源路径。

`AssetRegistry` 负责:

- `get_card_art(art_key)`
- `get_enemy_art(art_key)`
- `get_status_icon(icon_key)`
- `get_intent_icon(intent_type)`
- `get_map_node_icon(node_type)`
- `get_sfx(sfx_key)`

好处:

- 美术替换时不用改所有 `.tres`。
- 可集中处理缺图 fallback。
- 后续可接皮肤、语言、本地化资源。

## 6. 数据模型

数据层以 `docs/requirements/06-data-config-requirements.md` 为基准。

### 6.1 静态数据 Resource

| Resource | 文件 | 作用 |
|----------|------|------|
| `CardData` | `scripts/data/card_data.gd` | 卡牌静态定义 |
| `EffectAction` | `scripts/data/effect_action.gd` | 卡牌/敌人/药水/遗物共用效果动作 |
| `EnemyData` | `scripts/data/enemy_data.gd` | 敌人静态定义 |
| `EnemyActionData` | `scripts/data/enemy_action_data.gd` | 敌人行动 |
| `EncounterData` | `scripts/data/encounter_data.gd` | 遭遇配置 |
| `RewardProfile` | `scripts/data/reward_profile.gd` | 奖励权重与金币/遗物/药水概率 |
| `ShopProfile` | `scripts/data/shop_profile.gd` | 商店槽位、价格与权重 |
| `MapNodeData` | `scripts/data/map_node_data.gd` | 地图节点配置 |
| `StatusData` | `scripts/data/status_data.gd` | 状态静态定义 |
| `RelicData` | `scripts/data/relic_data.gd` | 遗物定义 |
| `PotionData` | `scripts/data/potion_data.gd` | 药水定义 |

### 6.2 运行时实例

静态 Resource 不直接承载运行时变化。需要单独定义运行时实例:

| Runtime 类 | 建议位置 | 作用 |
|------------|----------|------|
| `CardInstance` | `scripts/battle/card_instance.gd` | 当前局内一张卡，记录是否升级、临时费用等 |
| `BattleEntity` | `scripts/battle/battle_entity.gd` | 玩家/敌人战斗实体，记录 HP、格挡、状态 |
| `StatusInstance` | `scripts/battle/status_instance.gd` | 某个实体身上的状态层数/持续时间 |
| `EnemyRuntime` | `scripts/battle/enemy_runtime.gd` | 敌人行动序列索引、阶段、召唤状态 |
| `RunMap` | `scripts/map/run_map.gd` | 当前局地图节点与路径状态 |

原则:

- `CardData` 是模板，`CardInstance` 是当前局的一张卡。
- `EnemyData` 是模板，`EnemyRuntime` 是场上敌人的状态。
- 存档时保存 runtime 状态和静态数据 id，不保存完整 Resource。

## 7. 战斗系统架构

### 7.1 核心模块

| 模块 | 职责 |
|------|------|
| `BattleManager` | 战斗状态机、胜负判定、模块协调 |
| `DeckManager` | 抽牌堆、手牌、弃牌堆、消耗区 |
| `EnergySystem` | 每回合能量恢复、消耗检查 |
| `CardEffectEngine` | 执行 `EffectAction` |
| `TargetResolver` | 根据目标类型解析目标 |
| `StatusManager` | 状态挂载、触发、消退、伤害修正 |
| `EnemyAI` | 生成敌人意图、执行敌人行动 |
| `SummonManager` | Boss 召唤物管理 |

### 7.2 战斗状态机

```text
INIT
-> BATTLE_START
-> PLAYER_TURN_START
-> PLAYER_TURN
-> PLAYER_CARD_RESOLVE
-> PLAYER_TURN_END
-> ENEMY_TURN_START
-> ENEMY_ACTION_RESOLVE
-> ENEMY_TURN_END
-> CHECK_BATTLE_END
-> PLAYER_TURN_START 或 BATTLE_END
```

为什么拆得稍细:

- `PLAYER_CARD_RESOLVE` 可锁输入，避免动画/效果未结束又打下一张牌。
- `ENEMY_ACTION_RESOLVE` 可逐个敌人行动，Boss 召唤和仆从攻击更清楚。
- `CHECK_BATTLE_END` 是统一胜负出口，避免散落判断。

### 7.3 效果执行管线

`EffectAction` 被卡牌、敌人行动、药水、遗物共用。

```text
source + action + target
-> TargetResolver
-> ConditionChecker
-> EffectExecutor
-> StatusManager 修正
-> BattleEntity 修改 HP/Block/Status
-> EventBus / Signal 广播
-> UI 表现层播放反馈
```

首版必须支持:

```text
damage
multi_hit_damage
aoe_damage
block
draw
discard
exhaust
gain_strength
apply_status
add_status_card
retain_block_modifier
conditional_bonus_block
damage_by_current_block_ratio
random_enemy_damage
summon_enemy
command_summons_attack
```

### 7.4 状态结算

状态系统至少覆盖:

```text
strength
block
weak
vulnerable
poison
retain_block_modifier
```

伤害计算顺序:

```text
基础伤害
-> 加力量
-> 攻击者无力修正
-> 目标易伤修正
-> 多段攻击逐段计算
-> 扣格挡
-> 扣 HP
-> 触发命中后效果
```

防御反击流规则边界必须落在代码里:

- `retain_block_modifier` 只影响回合开始/结束格挡清空规则。
- `block_trigger` 只响应玩家打出技能牌获得格挡。
- 由 `稳固阵线` 等被动额外获得的格挡不触发 `反击姿态`。

## 8. 地图、奖励与商店架构

### 8.1 地图系统

核心模块:

| 模块 | 职责 |
|------|------|
| `MapGenerator` | 生成 15 层 Act 节奏图 |
| `MapProgression` | 判断可选节点、记录已走路径 |
| `MapNodeView` | 地图节点 UI 表现 |
| `EncounterSelector` | 根据节点和层数选择遭遇 |

首版可以先用半固定配置图，而不是完全随机 DAG。

推荐策略:

- M1/M2: 用固定 15 层节点配置。
- M4: 做 2-3 条分支路线。
- 后续: 再抽象为随机 DAG。

这样可以优先验证核心闭环，不把时间耗在生成算法上。

### 8.2 奖励系统

模块:

| 模块 | 职责 |
|------|------|
| `RewardGenerator` | 生成战斗奖励 |
| `RewardWeightResolver` | 根据最近遭遇、地图阶段、Boss 前状态调整权重 |
| `DeckAnalyzer` | 统计当前牌组标签 |
| `RewardSceneController` | 展示三选一和跳过 |

奖励原则:

- 只调权重，不保底给答案。
- 奖励 UI 可显示牌组统计，但不显示推荐。
- 第 1 层奖励可使用半引导固定三选一。

权重输入:

```text
base rarity weight
card tag weight
last encounter tags
current floor
boss_prep flag
deck tag stats
```

### 8.3 商店系统

模块:

| 模块 | 职责 |
|------|------|
| `ShopInventoryGenerator` | 生成商品 |
| `PriceResolver` | 根据稀有度、商品类型、删牌次数定价 |
| `ShopService` | 执行购买、删牌、金币扣除 |
| `ShopSceneController` | 商店 UI |

商店必须支持:

- 固定删牌服务。
- 3 张卡牌。
- 2 个药水。
- 1 个遗物或特殊服务。
- Boss 前权重调整。

## 9. UI 管理系统

UI 架构遵循一个原则:

> UI 展示状态、提交意图，不拥有核心规则。

### 9.1 UI 分层

```text
AppRoot
├── SceneContainer
└── GlobalUI
    ├── TransitionLayer
    ├── ModalLayer
    ├── TooltipLayer
    ├── ToastLayer
    └── DebugLayer
```

场景内部再分层:

```text
BattleScene
├── BackgroundLayer
├── EntityLayer
├── CardLayer
├── HUDLayer
└── ScenePopupAnchor
```

全局弹窗归 `UIManager`，战斗局部 UI 归 `BattleSceneController`。

### 9.2 UIManager 接口

建议接口:

```text
show_modal(scene_path, payload = {})
close_modal()
show_tooltip(anchor, text)
hide_tooltip()
show_toast(text)
fade_in()
fade_out()
block_input(reason)
unblock_input(reason)
show_deck_view(cards, title)
show_card_preview(card)
```

### 9.3 可复用 UI 组件

| 组件 | 复用场景 |
|------|----------|
| `CardView` | 手牌、奖励、商店、牌组查看、升级选择 |
| `StatusIcon` | 玩家、敌人、卡牌 tooltip |
| `IntentDisplay` | 普通敌人、Boss、召唤物 |
| `DeckViewPopup` | 抽牌堆、弃牌堆、删牌服务、奖励界面牌组查看 |
| `ConfirmPopup` | 删牌确认、退出确认 |
| `PriceTag` | 商店商品、删牌服务 |
| `RewardCardChoice` | 奖励三选一、商店卡牌商品 |

### 9.4 输入管理

输入锁使用引用计数/原因字典，避免某个系统提前解锁:

```text
input_locks = {
  "scene_transition": true,
  "modal_open": true,
  "card_resolving": true
}
```

只有所有锁都移除时，玩家输入才恢复。

## 10. 资源管理系统

### 10.1 资源引用策略

静态数据中使用 key:

```text
art_key: "enemy_slime"
icon_key: "status_vulnerable"
intent_icon_set: "default"
sfx_key: "card_slide"
```

`AssetRegistry` 统一解析:

```text
enemy_slime -> res://assets/enemies/slime/enemy_slime_idle.png
status_vulnerable -> res://assets/ui/icons/icon_vulnerable.png
intent_attack -> res://assets/ui/intents/intent_sword.png
card_slide -> res://assets/audio/sfx/card_slide_1.ogg
```

### 10.2 fallback 规则

- 找不到卡牌图: 使用卡牌类型默认图标。
- 找不到敌人图: 使用通用敌人占位图。
- 找不到状态图标: 使用问号图标。
- 找不到音效: 静默，不报错阻断流程。

### 10.3 与 DataLoader 的关系

- `DataLoader` 加载游戏数据。
- `AssetRegistry` 加载表现资源。
- `CardData.art_key` 交给 `AssetRegistry` 转成 Texture。
- 逻辑层不直接写图片路径。

## 11. 事件与信号

### 11.1 局部信号

模块内部或父子节点之间使用 Godot signal:

```text
BattleManager.state_changed
DeckManager.hand_changed
EnergySystem.energy_changed
EnemyRuntime.intent_changed
BattleEntity.hp_changed
```

### 11.2 全局事件

跨多个系统需要监听时使用 `EventBus`:

```text
card_played(card, source, targets)
entity_damaged(entity, amount, source)
entity_block_changed(entity, amount)
status_applied(entity, status_id, stacks)
enemy_summoned(enemy)
reward_selected(reward)
shop_item_purchased(item)
```

使用约束:

- 不要把所有调用都塞进 EventBus。
- 两个对象有明确父子/持有关系时，直接调用或 signal 更清楚。
- EventBus 主要用于 UI 表现、音效、统计、调试日志。

## 12. 存档与调试边界

首版不做复杂存档，但需要提前设计数据边界。

### 12.1 可保存内容

```text
run_seed
current_floor
player_hp
player_gold
master_deck: [{ card_id, upgraded }]
current_map node states
current_node_id
remove_card_count
owned_relic_ids
potion_ids
```

### 12.2 不建议保存

- 当前战斗中每一步动画状态。
- UI 弹窗状态。
- Resource 对象本身。
- 节点路径。

### 12.3 调试工具

建议 M2 后加入:

- `DataValidator`: 校验 Resource 完整性。
- `DebugOverlay`: 显示当前 phase、floor、scene、hand/draw/discard 数量。
- `BattleLog`: 记录卡牌、伤害、状态和敌人行动。
- `CheatPanel`: debug 构建下跳转场景、加金币、抽指定卡。

## 13. M1-M4 实施拆分

### M1: 工程骨架

目标: 能从主菜单进入地图占位场景。

交付:

- `AppRoot`
- `SceneRouter`
- `GameState`
- `UIManager`
- `DataLoader` 空实现
- `MainMenu`, `MapScene`, `BattleScene`, `RewardScene`, `ShopScene`, `RestScene`, `ResultScene` 占位
- `scripts/` 和 `resources/` 目录

验收:

- 项目运行进入主菜单。
- 点击开始新局后进入地图。
- SceneRouter 切换时不会重复触发。

### M2: 数据层最小切片

目标: 可以通过 `.tres` 加载最小战斗数据。

交付:

- `CardData`, `EffectAction`, `EnemyData`, `EnemyActionData`, `EncounterData`, `StatusData`
- 5 张卡: 打击、防御、重击、快速斩击、战吼
- 2 个敌人: 地穴爬虫、黏液怪
- 3 个状态: 格挡、力量、易伤
- `DataValidator`

验收:

- `DataLoader.validate_all()` 无严重错误。
- UI 能从 `CardData` 显示卡牌基本信息。

### M3: 战斗闭环

目标: 能完成一场最小战斗。

交付:

- `BattleManager`
- `DeckManager`
- `EnergySystem`
- `CardEffectEngine`
- `StatusManager`
- `EnemyAI`
- `BattleEntity`
- 基础 `BattleScene`

验收:

- 抽 5 张牌。
- 3 能量出牌。
- 敌人显示意图并行动。
- 玩家能胜利或失败。

### M4: 地图、奖励、商店 UI

目标: 接近 MVP 核心循环。

交付:

- 15 层半固定地图。
- 战斗后奖励三选一。
- 商店购买与删牌。
- 休息点回血/升级。
- Boss 前权重调整雏形。

验收:

- 玩家可以连续推进多层。
- 奖励能加入牌组。
- 商店能扣金币并购买/删牌。
- 休息点能影响 HP 或卡牌升级。

## 14. 风险与约束

| 风险 | 表现 | 架构处理 |
|------|------|----------|
| UI 直接改战斗状态 | 后续难测、难修 | UI 只调用 BattleManager 公开命令 |
| 每张牌写脚本 | 文件爆炸、难平衡 | `EffectAction` 数据驱动 |
| Resource 被直接改坏 | 多场景共享污染 | 运行时用实例类或深拷贝 |
| 场景切换散落 | 软锁、重复切换 | SceneRouter 唯一入口 |
| 弹窗输入冲突 | 打牌/购买误触 | UIManager 输入锁 |
| 资源路径散落 | 美术替换成本高 | AssetRegistry key 映射 |
| 地图生成过早复杂 | 拖慢核心闭环 | 先半固定配置，后随机 DAG |

## 15. 与需求文档的对应关系

| 需求文档 | 架构承接 |
|----------|----------|
| `01-mvp-gameplay-requirements.md` | GameState, SceneRouter, RunController, M1-M4 路线 |
| `02-card-archetype-requirements.md` | CardData, EffectAction, CardEffectEngine, DeckAnalyzer |
| `03-enemy-encounter-requirements.md` | EnemyData, EnemyAI, SummonManager, EncounterData |
| `04-map-reward-shop-requirements.md` | MapGenerator, RewardGenerator, ShopService |
| `05-ui-art-requirements.md` | UIManager, CardView, IntentDisplay, AssetRegistry |
| `06-data-config-requirements.md` | DataLoader, Resource 类, DataValidator |

## 16. 第一批代码落地建议

建议先按这个顺序创建文件，不要同时开太多系统:

```text
1. scripts/autoload/game_state.gd
2. scripts/autoload/scene_router.gd
3. scripts/autoload/ui_manager.gd
4. scripts/autoload/data_loader.gd
5. scenes/app/app_root.tscn
6. scenes/app/main_menu.tscn
7. scenes/map/map_scene.tscn
8. scripts/data/effect_action.gd
9. scripts/data/card_data.gd
10. scripts/data/enemy_data.gd
```

完成以上内容后，再进入数据与战斗逻辑。这样项目会先有一个稳固的壳，后续任何系统都能挂进去。

