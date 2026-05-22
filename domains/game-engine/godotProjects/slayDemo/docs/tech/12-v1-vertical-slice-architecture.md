# 12 - V1 垂直切片技术架构

> 生成日期: 2026-05-22  
> 基准输入: `docs/tech/11-current-implementation-architecture.md`、V1 范围确认、JSON 数据源决策  
> 目标工程: `client/slay-demo/`  
> 引擎: Godot 4.x  
> 定位: V1 实施前技术基准，供后续 agent 快速接手

## 1. V1 目标

V1 不是完整爬塔游戏，而是验证核心循环的垂直切片:

```text
开始新局
  -> 普通战斗 1
  -> 奖励
  -> 普通战斗 2
  -> 奖励
  -> 普通战斗 3
  -> 奖励
  -> Boss 战
  -> 结算
```

V1 的工程目标:

- 用最小内容跑通一局。
- 证明战斗、奖励、牌组成长、Boss、结算可以串起来。
- 建立 JSON 数据源、加载、校验、运行时实例转换的首版路径。
- 保持代码边界清晰，避免把 UI、流程、战斗规则和静态数据混在同一批脚本里。
- 为后续扩展地图、商店、遗物、药水、存档和更多卡牌留出稳定接口。

## 2. 范围

### 2.1 必做范围

| 模块 | V1 内容 |
|------|---------|
| 流程 | 新局、固定关卡序列、战斗、奖励、Boss、结算 |
| 战斗 | 玩家回合、敌人回合、抽牌、出牌、弃牌、能量、格挡、伤害、胜负判定 |
| 卡牌 | 初始牌组、攻击牌、防御牌、少量成长牌 |
| 敌人 | 3 场普通战斗需要的普通敌人、1 个 Boss |
| 奖励 | 每场普通战斗后 3 选 1 卡牌奖励，可跳过 |
| 数据 | 使用 JSON 作为主数据源，启动时由 `DataLoader` 加载并校验 |
| UI | 主入口、战斗场景、奖励场景、结算场景的可用版本 |
| 测试 | 数据校验、战斗核心单元测试、V1 流程 smoke test |

### 2.2 暂缓范围

| 模块 | 暂缓原因 |
|------|----------|
| 分支地图 | V1 使用固定序列即可验证核心循环 |
| 商店 | 需要价格、商品池、删牌服务，暂不影响核心验证 |
| 休息点 | 需要升级/回血选择，V1 可先用奖励成长代替 |
| 精英战 | Boss 已覆盖高压战斗验证 |
| 遗物 | 会显著扩大事件监听和战斗修正系统 |
| 药水 | 需要额外消耗品 UI 和战斗时机系统 |
| 存档 | V1 先验证单局闭环，不承诺跨进程恢复 |
| 复杂动画/VFX | 先保证交互和状态正确 |
| 本地化系统 | V1 文案直接来自 JSON 字段 |

## 3. 总体分层架构

V1 继续沿用当前技术文档中的五层结构，但实现优先级收缩到固定流程和战斗闭环。

```text
┌──────────────────────────────────────────────────────┐
│ 表现层 Presentation                                  │
│ BattleScene / RewardScene / ResultScene / CardView   │
├──────────────────────────────────────────────────────┤
│ 应用服务层 App Services                               │
│ UIManager / AssetRegistry / DebugOverlay              │
├──────────────────────────────────────────────────────┤
│ 流程层 Flow                                           │
│ GameState / SceneRouter / RunController               │
├──────────────────────────────────────────────────────┤
│ 玩法逻辑层 Gameplay                                   │
│ BattleController / DeckRuntime / Effects / EnemyAI    │
├──────────────────────────────────────────────────────┤
│ 数据层 Data                                           │
│ JSON files / DataLoader / Validators / Data DTOs      │
└──────────────────────────────────────────────────────┘
```

依赖规则:

- UI 可以订阅战斗信号并提交玩家意图，但不直接修改 HP、格挡、抽牌堆、弃牌堆。
- `BattleController` 不持有具体 UI 节点，只暴露状态快照和信号。
- `RunController` 决定下一场景和当前节点，不处理卡牌效果细节。
- `DataLoader` 只负责静态配置加载和校验，不保存本局运行态。
- JSON 数据先转换成只读静态数据，再按需要创建运行时实例。

## 4. 模块关系图

```text
                     ┌────────────────┐
                     │   SceneRouter  │
                     └───────┬────────┘
                             │ switches scenes
┌──────────────┐     ┌───────▼────────┐      ┌───────────────┐
│  GameState   │◄───►│ RunController  │─────►│ RewardService │
└──────┬───────┘     └───────┬────────┘      └───────┬───────┘
       │                     │                       │
       │ starts battle       │ encounter id          │ card pool
       │                     ▼                       │
       │             ┌──────────────────┐            │
       └────────────►│ BattleController │◄───────────┘
                     └───────┬──────────┘
                             │ uses
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
   ┌─────────────┐    ┌──────────────┐   ┌──────────────┐
   │ DeckRuntime │    │ EffectRunner │   │ EnemyAI      │
   └─────────────┘    └──────────────┘   └──────────────┘
          ▲                  ▲                  ▲
          └──────────────────┼──────────────────┘
                             │ reads static data
                     ┌───────▼────────┐
                     │   DataLoader   │
                     └───────┬────────┘
                             │ loads JSON
         ┌───────────────────┼────────────────────┐
         ▼                   ▼                    ▼
  cards.json          enemies.json          encounters.json
  effects schema      rewards.json          run_v1.json
```

## 5. V1 战斗流程

```text
BattleScene ready
  -> RunController provides encounter_id
  -> BattleController.setup(encounter_id, player_deck)
  -> DataLoader resolves EncounterData and EnemyData
  -> BattleController creates runtime enemies and deck piles
  -> start_combat
  -> start_player_turn
       -> gain energy
       -> clear block if rules require
       -> draw cards
       -> wait player input
       -> play card
            -> validate cost and target
            -> pay cost
            -> EffectRunner applies effects
            -> move card to discard/exhaust
            -> emit state_changed
       -> end turn
  -> start_enemy_turn
       -> resolve enemy intents
       -> apply enemy effects
       -> choose next intents
       -> check player death
  -> if enemies alive: start_player_turn
  -> if all enemies defeated:
       -> BattleController emits combat_won
       -> RunController records progress
       -> SceneRouter opens RewardScene or ResultScene
  -> if player defeated:
       -> SceneRouter opens ResultScene
```

首版只需要支持同步结算。动画可以监听信号播放，但不得成为规则结算的必要条件。

## 6. JSON 数据定义方案

### 6.1 目录建议

```text
client/slay-demo/
├── data/
│   ├── cards.json
│   ├── enemies.json
│   ├── encounters.json
│   ├── rewards.json
│   └── run_v1.json
└── schemas/
    ├── cards.schema.json
    ├── enemies.schema.json
    ├── encounters.schema.json
    ├── rewards.schema.json
    └── run.schema.json
```

说明:

- `data/` 是 V1 主数据源。
- `schemas/` 用于开发期校验，Godot 运行时可先实现轻量字段校验。
- 所有数据以 `id` 为主键。
- 引用字段必须引用已存在的 `id`。
- JSON 中不保存运行时状态，例如当前 HP、是否升级、当前手牌位置。

### 6.2 CardData 首版字段

```json
{
  "id": "strike",
  "name": "打击",
  "description": "造成 6 点伤害。",
  "type": "attack",
  "rarity": "starter",
  "cost": 1,
  "target": "single_enemy",
  "tags": ["starter", "damage"],
  "art_key": "card_strike",
  "effects": [
    {
      "type": "damage",
      "value": 6,
      "target": "selected_enemy"
    }
  ],
  "upgrade": {
    "name": "打击+",
    "description": "造成 9 点伤害。",
    "cost": 1,
    "effects": [
      {
        "type": "damage",
        "value": 9,
        "target": "selected_enemy"
      }
    ]
  }
}
```

字段约束:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 全局唯一，稳定用于存档和引用 |
| `name` | string | 是 | 显示名 |
| `description` | string | 是 | 未升级描述 |
| `type` | string | 是 | `attack`、`skill`、`power`、`status` |
| `rarity` | string | 是 | `starter`、`common`、`uncommon`、`rare`、`special` |
| `cost` | int | 是 | `-1` 可保留给 X 费，V1 可不实现 |
| `target` | string | 是 | `self`、`single_enemy`、`all_enemies`、`none` |
| `tags` | array[string] | 否 | 奖励权重和测试分类使用 |
| `art_key` | string | 否 | 由 `AssetRegistry` 解析，缺失时使用占位图 |
| `effects` | array[EffectAction] | 是 | 未升级效果 |
| `upgrade` | object | 否 | 升级信息，V1 可只读不使用 |

### 6.3 EffectAction 首版字段

```json
{
  "type": "block",
  "value": 5,
  "target": "self",
  "status_id": "",
  "duration": 0,
  "repeat": 1,
  "condition": "",
  "extra": {}
}
```

V1 必须支持的 `type`:

| type | 含义 |
|------|------|
| `damage` | 对目标造成伤害 |
| `block` | 玩家获得格挡 |
| `draw` | 抽牌 |
| `apply_status` | 施加首版状态，例如易伤、虚弱、力量 |
| `gain_strength` | 获得力量，可作为 `apply_status` 的便捷效果 |

可延后但字段预留的 `type`:

```text
multi_hit_damage
aoe_damage
discard
exhaust
add_status_card
```

### 6.4 EnemyData 首版字段

```json
{
  "id": "cultist_v1",
  "name": "暗影信徒",
  "enemy_type": "normal",
  "max_hp": 28,
  "art_key": "enemy_cultist",
  "tags": ["scaling_pressure"],
  "actions": [
    {
      "id": "chant",
      "name": "咏唱",
      "intent_type": "buff",
      "intent_value": 0,
      "effects": [
        {
          "type": "gain_strength",
          "value": 2,
          "target": "self"
        }
      ],
      "next_action_rule": "next"
    },
    {
      "id": "strike",
      "name": "打击",
      "intent_type": "attack",
      "intent_value": 8,
      "effects": [
        {
          "type": "damage",
          "value": 8,
          "target": "player"
        }
      ],
      "next_action_rule": "loop"
    }
  ]
}
```

V1 敌人行动规则先支持:

- `next`: 使用动作数组中的下一个动作。
- `loop`: 到末尾后回到第一个动作。
- `repeat`: 重复当前动作。

随机行动、条件换阶段和召唤暂缓。

### 6.5 EncounterData 首版字段

```json
{
  "id": "v1_normal_01",
  "encounter_type": "normal",
  "enemy_ids": ["slime_small_v1"],
  "reward_profile_id": "normal_card_reward",
  "tags": ["startup_pressure"]
}
```

字段约束:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 遭遇唯一 ID |
| `encounter_type` | string | 是 | `normal` 或 `boss` |
| `enemy_ids` | array[string] | 是 | 引用 `enemies.json` |
| `reward_profile_id` | string | 否 | 普通战斗胜利后使用 |
| `tags` | array[string] | 否 | 奖励权重和测试使用 |

### 6.6 RewardProfile 首版字段

```json
{
  "id": "normal_card_reward",
  "card_choices": 3,
  "allow_skip": true,
  "rarity_weights": {
    "common": 80,
    "uncommon": 20,
    "rare": 0
  },
  "tag_weight_modifiers": {
    "startup_pressure": {
      "block": 10,
      "low_cost": 10
    }
  }
}
```

V1 奖励只做卡牌奖励，不做金币、遗物、药水。

### 6.7 Run V1 首版字段

```json
{
  "id": "v1_fixed_run",
  "start_deck": [
    "strike",
    "strike",
    "strike",
    "defend",
    "defend"
  ],
  "player": {
    "max_hp": 60,
    "gold": 0,
    "energy_per_turn": 3,
    "draw_per_turn": 5
  },
  "nodes": [
    {
      "id": "node_01",
      "type": "battle",
      "encounter_id": "v1_normal_01"
    },
    {
      "id": "node_02",
      "type": "reward",
      "reward_profile_id": "normal_card_reward"
    },
    {
      "id": "node_03",
      "type": "battle",
      "encounter_id": "v1_normal_02"
    },
    {
      "id": "node_04",
      "type": "reward",
      "reward_profile_id": "normal_card_reward"
    },
    {
      "id": "node_05",
      "type": "battle",
      "encounter_id": "v1_normal_03"
    },
    {
      "id": "node_06",
      "type": "reward",
      "reward_profile_id": "normal_card_reward"
    },
    {
      "id": "node_07",
      "type": "battle",
      "encounter_id": "v1_boss_01"
    },
    {
      "id": "node_08",
      "type": "result"
    }
  ]
}
```

## 7. 核心模块职责

### 7.1 DataLoader

职责:

- 读取 `data/*.json`。
- 按 `id` 建立缓存。
- 校验必填字段、枚举值、重复 ID 和跨表引用。
- 提供只读查询接口。
- 将静态卡牌数据转换成运行时卡牌实例。

首版接口:

```text
load_all() -> void
validate_all() -> PackedStringArray
get_card(id: String) -> Dictionary
get_enemy(id: String) -> Dictionary
get_encounter(id: String) -> Dictionary
get_reward_profile(id: String) -> Dictionary
get_run_config(id: String) -> Dictionary
create_card_instance(card_id: String) -> Dictionary
```

### 7.2 GameState

职责:

- 保存本局跨场景状态。
- 记录玩家 HP、金币、当前节点索引、主牌组。
- 接收奖励选择结果并更新主牌组。
- 在结算时提供胜负和统计信息。

不负责:

- 抽牌、弃牌、手牌。
- 敌人行动选择。
- UI 节点操作。

### 7.3 RunController

职责:

- 读取 `run_v1.json` 的固定节点序列。
- 根据当前节点进入战斗、奖励或结算。
- 战斗胜利后推进节点。
- 战斗失败后直接进入结算。

### 7.4 BattleController

职责:

- 创建战斗运行时状态。
- 管理玩家/敌人回合状态机。
- 调用 `DeckRuntime`、`EffectRunner`、`EnemyAI`。
- 发送 `state_changed`、`card_played`、`turn_started`、`combat_won`、`combat_lost` 等信号。

### 7.5 DeckRuntime

职责:

- 根据主牌组创建抽牌堆、手牌、弃牌堆、消耗堆。
- 洗牌、抽牌、弃牌。
- 回合结束时移动手牌。
- 为 UI 提供牌堆数量和手牌快照。

### 7.6 EffectRunner

职责:

- 执行卡牌和敌人行动的 `EffectAction`。
- 处理目标解析、伤害、格挡、抽牌、状态。
- 只返回结算结果和状态变更，不触碰 UI。

### 7.7 EnemyAI

职责:

- 初始化敌人当前 intent。
- 按 `next_action_rule` 选择下一行动。
- 暴露 intent 给 UI 显示。

### 7.8 RewardService

职责:

- 根据 `RewardProfile` 和当前 run 状态生成卡牌奖励。
- 去重奖励选项。
- 应用跳过或选择结果。

## 8. UI 与场景方案

### 8.1 场景结构

```text
scenes/
├── app/
│   └── app_root.tscn
├── battle/
│   └── battle_scene.tscn
├── reward/
│   └── reward_scene.tscn
├── result/
│   └── result_scene.tscn
└── ui/
    ├── card_view.tscn
    ├── enemy_view.tscn
    ├── intent_view.tscn
    └── status_icon.tscn
```

### 8.2 BattleScene

首版必须呈现:

- 玩家 HP、格挡、能量。
- 敌人 HP、格挡、意图。
- 手牌区。
- 抽牌堆、弃牌堆、消耗堆数量。
- 结束回合按钮。
- 胜负后由流程层切场景，不在战斗 UI 内直接重开。

交互规则:

- 点击卡牌后，根据 `target` 决定是否需要选择敌人。
- 不合法出牌给出轻量反馈，不改变战斗状态。
- 动画期间可以暂时锁输入，但规则结算不能依赖动画回调完成。

### 8.3 RewardScene

首版必须呈现:

- 3 张卡牌奖励。
- 跳过按钮。
- 选择卡牌后加入 `GameState.master_deck`。
- 选择或跳过后进入下一个节点。

### 8.4 ResultScene

首版必须呈现:

- 胜利或失败。
- 击败战斗数。
- 最终牌组数量。
- 重新开始按钮。

## 9. 第一版内容清单

### 9.1 卡牌

建议最小卡牌池:

| id | 类型 | 费用 | 效果 |
|----|------|------|------|
| `strike` | attack | 1 | 造成 6 点伤害 |
| `defend` | skill | 1 | 获得 5 点格挡 |
| `heavy_strike` | attack | 2 | 造成 12 点伤害 |
| `quick_guard` | skill | 0 | 获得 3 点格挡 |
| `battle_focus` | skill | 1 | 抽 2 张牌 |
| `inflame` | skill | 1 | 获得 2 点力量 |

### 9.2 敌人

建议最小敌人池:

| id | 类型 | HP | 定位 |
|----|------|----|------|
| `slime_small_v1` | normal | 18 | 教学压力，稳定攻击 |
| `cultist_v1` | normal | 28 | 成长压力，先 buff 后攻击 |
| `shield_guard_v1` | normal | 34 | 防御压力，攻击和格挡交替 |
| `boss_knight_v1` | boss | 90 | Boss 压力，固定大招周期 |

### 9.3 遭遇

固定 4 场:

| 节点 | encounter_id | 内容 |
|------|--------------|------|
| 1 | `v1_normal_01` | `slime_small_v1` |
| 2 | `v1_normal_02` | `cultist_v1` |
| 3 | `v1_normal_03` | `slime_small_v1` + `shield_guard_v1` |
| 4 | `v1_boss_01` | `boss_knight_v1` |

## 10. 测试计划

### 10.1 数据测试

- `DataLoader.validate_all()` 无错误。
- 所有 JSON 文件能解析。
- 所有 `id` 唯一。
- 所有引用存在: 卡牌、敌人、遭遇、奖励、run 节点。
- 所有 effect `type` 在支持列表内。
- 所有敌人行动至少有 1 个 action。

### 10.2 战斗核心测试

- 抽牌堆不足时能洗入弃牌堆继续抽牌。
- 能量不足时不能出牌。
- 单体伤害能正确扣除敌人 HP。
- 格挡能吸收伤害并在正确时机清理。
- 敌人死亡后不会继续行动。
- 玩家死亡进入失败结算。
- 全部敌人死亡进入胜利流程。

### 10.3 流程 smoke test

手动或自动跑通:

```text
开始新局
-> 战斗 1 胜利
-> 选择奖励
-> 战斗 2 胜利
-> 选择奖励
-> 战斗 3 胜利
-> 选择奖励
-> Boss 胜利
-> 胜利结算
```

失败路径:

```text
开始新局
-> 任意战斗玩家 HP <= 0
-> 失败结算
-> 重新开始
```

## 11. 验收标准

V1 完成时必须满足:

- 从主入口可以开始新局并进入第一场战斗。
- 玩家可以完成基础出牌、选择目标、结束回合。
- 敌人能显示意图并按行动表执行。
- 三场普通战斗之间能进入奖励并更新牌组。
- Boss 战胜利后进入胜利结算。
- 玩家死亡后进入失败结算。
- 所有静态配置来自 JSON，不需要改代码新增 V1 卡牌、敌人或遭遇。
- 启动或调试入口可以执行数据校验，并输出明确错误。
- 文档中的固定内容清单与实际 JSON 数据保持一致。

## 12. 明确假设

- V1 使用固定节点序列，不生成随机地图。
- V1 奖励只给卡牌，不给金币、遗物、药水。
- V1 不实现完整升级系统，但 JSON 保留 `upgrade` 字段。
- V1 不实现复杂状态时机，只支持力量、易伤、虚弱等最小集合。
- V1 不依赖 Godot Resource 作为主配置格式。
- V1 可使用占位美术，但 `art_key` 字段应保留。

## 13. 文档与记录规范

后续文档沉淀按以下位置放置:

```text
docs/
├── tech/
│   └── 12-v1-vertical-slice-architecture.md
├── adr/
│   └── 0001-use-json-as-source-data.md
└── implementation-log/
    └── 2026-05-22-v1-architecture-and-mcp.md
```

规则:

- 技术方案放入 `docs/tech/`，按现有编号递增。
- 关键架构决策放入 `docs/adr/`，文件名使用四位序号和短标题。
- 重要执行过程放入 `docs/implementation-log/`，文件名使用日期和主题。
- 不覆盖 `docs/tech/11-current-implementation-architecture.md`，该文档保留为完整 MVP 历史基准。
