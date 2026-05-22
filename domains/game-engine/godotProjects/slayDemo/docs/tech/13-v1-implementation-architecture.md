# 13 - V1 垂直切片实现架构图与说明

> 生成日期: 2026-05-23
> 基准: `docs/tech/12-v1-vertical-slice-architecture.md`、当前 `client/slay-demo/` 实际代码
> 引擎: Godot 4.x
> 定位: 当前 MVP 切片的实际实现快照，反映代码中真实存在的模块与数据流

---

## 1. 系统总览

SlayDemo V1 是一个类杀戮尖塔的卡牌构筑 Roguelike 垂直切片。玩家通过固定序列（3 场普通战斗 + Boss），在回合制卡牌战斗中击败敌人，每次胜利后选择卡牌奖励来构筑牌组。

**已完成的核心闭环:**

```
开始新局 → 战斗1 → 奖励 → 战斗2 → 奖励 → 战斗3 → 奖励 → Boss战 → 结算
```

---

## 2. 系统技术架构图

### 2.1 五层分层架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        表现层 Presentation                              │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│   │ MainMenuScene│ │ BattleScene  │ │ RewardScene  │ │ ResultScene  │  │
│   └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘  │
├─────────┼─────────────────┼─────────────────┼─────────────────┼─────────┤
│         │          应用服务层 App Services                       │         │
│         │   ┌──────────────────────────────────────────────┐   │         │
│         └──►│              SceneRouter                     │◄──┘         │
│             └──────────────────────┬───────────────────────┘             │
├────────────────────────────────────┼────────────────────────────────────┤
│                              流程层 Flow                                │
│   ┌──────────────┐       ┌─────────▼────────┐       ┌──────────────┐    │
│   │   GameState  │◄─────►│  RunController   │──────►│RewardService │    │
│   └──────┬───────┘       └─────────┬────────┘       └──────────────┘    │
├─────────┼─────────────────────────┼──────────────────────────────────────┤
│         │                玩法逻辑层 Gameplay          │                    │
│         │   ┌─────────────────────▼──────────────────────┐              │
│         └──►│           BattleController                 │              │
│             └──┬──────────┬──────────────┬──────────────┘              │
│                │          │              │                              │
│    ┌───────────▼──┐ ┌─────▼──────┐ ┌────▼──────────┐                   │
│    │ DeckRuntime  │ │EffectRunner│ │   EnemyAI     │                   │
│    └──────────────┘ └────────────┘ └───────────────┘                   │
├─────────────────────────────────────────────────────────────────────────┤
│                            数据层 Data                                  │
│   ┌──────────────┐   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│   │  DataLoader  │   │cards    │ │enemies  │ │encounter│ │rewards  │  │
│   │  (autoload)  │   │  .json  │ │  .json  │ │  s.json │ │  .json  │  │
│   └──────────────┘   └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                        ┌─────────┐                      │
│                                        │run_v1   │                      │
│                                        │  .json  │                      │
│                                        └─────────┘                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 模块依赖关系图

```
                         ┌──────────────┐
                         │   AppRoot    │ 入口节点
                         │  (场景根)    │
                         └──────┬───────┘
                                │ _ready() 时加载/校验数据
                 ┌──────────────▼──────────────┐
                 │         DataLoader          │
                 │       (autoload)            │
                 │  ┌─ load_all()              │
                 │  ├─ validate_all()          │
                 │  ├─ get_card(id)            │
                 │  ├─ get_enemy(id)           │
                 │  ├─ create_card_instance()  │
                 │  └─ resolve_card_instance() │
                 └──────┬──────────┬───────────┘
                        │          │
            ┌───────────▼──┐  ┌───▼──────────────┐
            │  GameState   │  │   SceneRouter     │
            │  (autoload)  │  │   (autoload)      │
            │              │  │                   │
            │ player_hp    │  │ go_to(scene_key)  │
            │ master_deck  │  └───┬───────────────┘
            │ run_nodes    │      │ 场景切换
            │ battle_wins  │      │
            └──────┬───────┘      │
                   │              │
            ┌──────▼──────────────▼───────┐
            │       RunController         │
            │         (autoload)          │
            │                             │
            │  start_new_run()            │
            │  enter_current_node() ──────┼──► SceneRouter.go_to()
            │  on_battle_won()            │
            │  on_battle_lost()           │
            │  complete_reward()          │
            └──────┬──────────────────────┘
                   │ 创建/协调
                   │
      ┌────────────▼────────────────────────────────────┐
      │              BattleController                    │
      │            (RefCounted, 非节点)                   │
      │                                                  │
      │  信号:                                           │
      │    state_changed(snapshot) ──► BattleScene       │
      │    message_logged(message)  ──► BattleScene      │
      │    combat_won(remaining_hp)  ──► RunController   │
      │    combat_lost               ──► RunController   │
      │                                                  │
      │  状态机: setup → player ↔ enemy → won/lost       │
      └───┬────────────┬──────────────┬─────────────────┘
          │            │              │
   ┌──────▼──┐  ┌──────▼──────┐  ┌───▼────────┐
   │Deck     │  │Effect       │  │EnemyAI     │
   │Runtime  │  │Runner       │  │            │
   │         │  │             │  │initialize  │
   │draw     │  │apply_effects│  │_enemy()    │
   │discard  │  │             │  │advance     │
   │exhaust  │  │             │  │_intent()   │
   └─────────┘  └─────────────┘  └────────────┘
```

### 2.3 场景切换与流程图

```
                    ┌─────────────┐
                    │   AppRoot   │
                    │  (入口场景)  │
                    └──────┬──────┘
                           │ load_all() + validate()
                           ▼
                    ┌─────────────┐
                    │  MainMenu   │◄─────────────────────────────┐
                    │   Scene     │                               │
                    └──────┬──────┘                               │
                           │ "开始新局"                            │
                           ▼                                      │
              ┌────────────────────────┐                         │
              │    RunController       │                         │
              │  读取 run_v1.json      │                         │
              │  节点: node_01(battle) │                         │
              └────────────┬───────────┘                         │
                           ▼                                      │
          ┌────────────────────────────────┐                     │
          │        BattleScene (1)         │                     │
          │   遭遇: v1_normal_01           │                     │
          │   敌人: 小史莱姆               │                     │
          └────────────┬───────────────────┘                     │
                       │ combat_won                             │
                       ▼                                        │
          ┌────────────────────────────────┐                     │
          │        RewardScene (1)         │                     │
          │   3选1 卡牌奖励，可跳过         │                     │
          └────────────┬───────────────────┘                     │
                       │ complete_reward                        │
                       ▼                                        │
          ┌────────────────────────────────┐                     │
          │        BattleScene (2)         │                     │
          │   遭遇: v1_normal_02           │                     │
          │   敌人: 暗影信徒               │                     │
          └────────────┬───────────────────┘                     │
                       │ combat_won                             │
                       ▼                                        │
          ┌────────────────────────────────┐                     │
          │        RewardScene (2)         │                     │
          └────────────┬───────────────────┘                     │
                       │                                        │
                       ▼                                        │
          ┌────────────────────────────────┐                     │
          │        BattleScene (3)         │                     │
          │   遭遇: v1_normal_03           │                     │
          │   敌人: 小史莱姆 + 盾卫         │                     │
          └────────────┬───────────────────┘                     │
                       │ combat_won                             │
                       ▼                                        │
          ┌────────────────────────────────┐                     │
          │        RewardScene (3)         │                     │
          └────────────┬───────────────────┘                     │
                       │                                        │
                       ▼                                        │
          ┌────────────────────────────────┐                     │
          │        BattleScene (4)         │                     │
          │   遭遇: v1_boss_01             │                     │
          │   敌人: 腐化骑士 (Boss)         │                     │
          └───────┬────────────┬───────────┘                     │
                  │            │                                  │
           combat_won    combat_lost                     任意战斗失败
                  │            │                                  │
                  ▼            └──────────────────────────────────►│
          ┌─────────────┐                                        │
          │ResultScene  │◄───────────────────────────────────────┘
          │  胜利/失败   │──── "返回主菜单" ────────────────────────┘
          └─────────────┘
              │
              └── "重新开始" ──► RunController.start_new_run()
```

---

## 3. 战斗系统状态机

### 3.1 BattleController 状态机

```
                    ┌─────────┐
                    │  setup  │ 初始化遭遇、敌人、牌堆
                    └────┬────┘
                         │ start_combat()
                         ▼
              ┌─────────────────────┐
         ┌──►│     player          │◄──────────────┐
         │   │  玩家回合            │                │
         │   │                     │                │
         │   │  - 能量重置为 3      │                │
         │   │  - 格挡清零         │                │
         │   │  - 抽 5 张牌        │                │
         │   │  - 等待出牌/结束     │                │
         │   └──────┬──────────────┘                │
         │          │                               │
         │          │ play_card()                   │
         │          ├──── 验证费用和目标              │
         │          ├──── 扣除能量                   │
         │          ├──── EffectRunner 执行效果      │
         │          ├──── 卡牌进入弃牌堆             │
         │          ├──── 检查敌人存活 ──► 全灭?     │
         │          │                    │           │
         │          │               ┌────▼────┐     │
         │          │               │  won    │     │
         │          │               │ emit    │     │
         │          │               │combat_  │     │
         │          │               │won      │     │
         │          │               └─────────┘     │
         │          │                               │
         │          │ end_player_turn()              │
         │          ▼                               │
         │   ┌─────────────────────┐                │
         │   │     enemy           │                │
         │   │  敌人回合            │                │
         │   │                     │                │
         │   │  - 手牌全部弃掉      │                │
         │   │  - 遍历存活敌人      │                │
         │   │  - 执行当前意图      │                │
         │   │  - 推进下一意图      │                │
         │   └──────┬──────────────┘                │
         │          │                               │
         │          ├──── 玩家 HP ≤ 0?              │
         │          │         │                     │
         │          │    ┌────▼────┐                 │
         │          │    │  lost   │                 │
         │          │    │ emit    │                 │
         │          │    │combat_  │                 │
         │          │    │lost     │                 │
         │          │    └─────────┘                 │
         │          │                               │
         └──────────┴──── 敌人存活 ─────────────────┘
```

### 3.2 牌组流转 (DeckRuntime)

```
              初始状态
              ┌──────────────────────────────────────────┐
              │                                          │
    master_deck ──► draw_pile (洗牌)                     │
    [3张打击,     [随机排列的卡牌实例]                    │
     2张防御]                                          │
              │                                          │
              │ draw(5)                                  │
              ▼                                          │
    ┌────────────────────┐                               │
    │     hand           │  手牌上限: 无硬限制            │
    │  [最多10张卡牌]     │  每回合抽: 5 张               │
    └────────┬───────────┘                               │
             │                                           │
             ├── 出牌后 ──► discard_pile (弃牌堆)         │
             │                               │           │
             │                  draw_pile    │ 洗牌      │
             │                  为空时 ◄─────┘           │
             │                                           │
             ├── 消耗牌 ──► exhaust_pile (消耗堆)        │
             │              (本局战斗永久移除)             │
             │                                           │
             └── 回合结束 ──► 全部手牌进入 discard_pile   │
```

---

## 4. 数据驱动架构

### 4.1 JSON 数据文件关系图

```
run_v1.json                    cards.json
┌───────────────────┐          ┌──────────────────┐
│ id: v1_fixed_run  │     ┌──►│ id: strike       │
│                   │     │   │ name: 打击        │
│ start_deck ───────┼─────┤   │ type: attack     │
│  [strike x3,      │     │   │ cost: 1          │
│   defend x2]      │     │   │ effects: [...]   │
│                   │     │   └──────────────────┘
│ nodes:            │     │
│  node_01(battle)──┼──┐  │   enemies.json
│  node_02(reward)  │  │  │   ┌──────────────────┐
│  node_03(battle)──┼──┤  │   │ id: slime_small  │
│  node_04(reward)  │  │  │   │ max_hp: 18       │
│  node_05(battle)──┼──┤  │   │ actions: [...]   │
│  node_06(reward)  │  │  │   └──────────────────┘
│  node_07(battle)──┼──┤  │
│  node_08(result)  │  │  │   encounters.json
└───────────────────┘  │  │   ┌──────────────────┐
                       │  │   │ id: v1_normal_01 │
                       │  └──►│ enemy_ids ───────┼──► enemies.json
                       │      │ reward_profile_id┼──┐
                       │      └──────────────────┘  │
                       │                            │
                       │      rewards.json          │
                       │      ┌──────────────────┐  │
                       │      │ id: normal_card  │◄─┘
                       │      │  _reward         │
                       │      │ card_choices: 3  │
                       │      │ rarity_weights   │
                       │      └──────────────────┘
                       │
                       └──► encounters.json
                            ┌──────────────────┐
                            │ v1_normal_01     │ slime_small_v1
                            │ v1_normal_02     │ cultist_v1
                            │ v1_normal_03     │ slime + shield_guard
                            │ v1_boss_01       │ boss_knight_v1
                            └──────────────────┘
```

### 4.2 DataLoader 校验链路

```
load_all()
    │
    ├── _load_collection("data/cards.json", "cards")
    │       ├── 读取 JSON 文件
    │       ├── 按 id 建立缓存 Dictionary
    │       └── 重复 id 检测
    │
    ├── _load_collection("data/enemies.json", "enemies")
    ├── _load_collection("data/encounters.json", "encounters")
    ├── _load_collection("data/rewards.json", "reward_profiles")
    └── _load_collection("data/run_v1.json", "runs")

validate_all()
    │
    ├── _validate_cards()
    │       ├── 必填字段: id, name, description, type, rarity, cost, target, effects
    │       ├── 枚举校验: type, rarity, target
    │       └── effects 数组中每个 effect 的 type 校验
    │
    ├── _validate_enemies()
    │       ├── 必填字段: id, name, max_hp, actions
    │       └── 每个 action 的 id, effects 校验
    │
    ├── _validate_encounters()
    │       ├── encounter_type 枚举校验
    │       ├── enemy_ids 跨表引用 → enemies.json
    │       └── reward_profile_id 跨表引用 → rewards.json
    │
    ├── _validate_rewards()
    │       └── 必填字段: id, card_choices
    │
    └── _validate_runs()
            ├── start_deck 中每个 card_id → cards.json
            └── 每个 node 的 encounter_id → encounters.json
                reward_profile_id → rewards.json
```

---

## 5. 核心模块说明

### 5.1 Autoload 单例 (4 个全局服务)

| 单例 | 文件 | 职责 | 关键方法 |
|------|------|------|---------|
| **DataLoader** | `autoload/data_loader.gd` | JSON 数据加载、校验、查询 | `load_all()`, `validate_all()`, `get_card()`, `create_card_instance()` |
| **GameState** | `autoload/game_state.gd` | 跨场景运行时状态 | `start_new_run()`, `add_card_to_deck()`, `apply_post_battle_hp()` |
| **RunController** | `autoload/run_controller.gd` | 游戏流程控制 | `start_new_run()`, `enter_current_node()`, `on_battle_won()` |
| **SceneRouter** | `autoload/scene_router.gd` | 场景切换 | `go_to(scene_key)` |

### 5.2 战斗系统 (4 个纯逻辑类)

| 类 | 文件 | 基类 | 职责 |
|----|------|------|------|
| **BattleController** | `battle/battle_controller.gd` | RefCounted | 战斗状态机、回合管理、伤害结算 |
| **DeckRuntime** | `battle/deck_runtime.gd` | RefCounted | 抽牌堆/手牌/弃牌堆/消耗堆管理 |
| **EffectRunner** | `battle/effect_runner.gd` | RefCounted | 卡牌/敌人效果执行 (damage/block/draw/strength) |
| **EnemyAI** | `battle/enemy_ai.gd` | RefCounted | 敌人意图初始化与推进 |

### 5.3 奖励系统

| 类 | 文件 | 职责 |
|----|------|------|
| **RewardService** | `reward/reward_service.gd` | 根据 profile 生成 3 张候选卡牌，按稀有度和已有数量评分 |

### 5.4 UI 场景控制器 (4 个)

| 场景 | 脚本 | 功能 |
|------|------|------|
| **MainMenuScene** | `scenes/main_menu_scene.gd` | "开始新局" 和 "校验数据" 按钮 |
| **BattleScene** | `scenes/battle_scene.gd` | 战斗 UI：敌人区、手牌区、状态栏、日志、结束回合 |
| **RewardScene** | `scenes/reward_scene.gd` | 3 张卡牌选择 + 跳过按钮 |
| **ResultScene** | `scenes/result_scene.gd` | 胜利/失败结算统计，重新开始/返回菜单 |

---

## 6. 游戏内容清单 (当前实现)

### 6.1 卡牌 (6 张)

| ID | 名称 | 类型 | 费用 | 目标 | 效果 | 稀有度 |
|----|------|------|------|------|------|--------|
| strike | 打击 | attack | 1 | 单体敌人 | 造成 6 伤害 | starter |
| defend | 防御 | skill | 1 | 自身 | 获得 5 格挡 | starter |
| heavy_strike | 重击 | attack | 2 | 单体敌人 | 造成 12 伤害 | common |
| quick_guard | 快速格挡 | skill | 0 | 自身 | 获得 3 格挡 | common |
| battle_focus | 战斗专注 | skill | 1 | 自身 | 抽 2 张牌 | common |
| inflame | 燃起斗志 | skill | 1 | 自身 | 获得 2 力量 | uncommon |

### 6.2 敌人 (4 个)

| ID | 名称 | 类型 | HP | 行为模式 |
|----|------|------|-----|---------|
| slime_small_v1 | 小史莱姆 | normal | 18 | 循环: 撞击(5伤害) |
| cultist_v1 | 暗影信徒 | normal | 28 | 咏唱(+2力量) → 暗影打击(8伤害) → 循环 |
| shield_guard_v1 | 盾卫 | normal | 34 | 举盾(6格挡) → 盾击(7伤害) → 循环 |
| boss_knight_v1 | 腐化骑士 | boss | 90 | 蓄势(+2力量) → 斩击(12伤害) → 防御(10格挡) → 重斩(18伤害) → 循环 |

### 6.3 遭遇 (4 场)

| 节点 | 遭遇 ID | 敌人 | 类型 |
|------|---------|------|------|
| 1 | v1_normal_01 | 小史莱姆 | 普通 |
| 2 | v1_normal_02 | 暗影信徒 | 普通 |
| 3 | v1_normal_03 | 小史莱姆 + 盾卫 | 普通 |
| 4 | v1_boss_01 | 腐化骑士 | Boss |

### 6.4 初始配置

| 属性 | 值 |
|------|-----|
| 初始 HP | 60 |
| 每回合能量 | 3 |
| 每回合抽牌 | 5 张 |
| 初始牌组 | 3x打击 + 2x防御 (共5张) |

---

## 7. 信号与数据流

### 7.1 核心信号连接

```
BattleController ──── state_changed(snapshot) ────► BattleScene._on_state_changed()
                    │                                    │
                    │                              重渲染:
                    │                              - HP/格挡/力量/能量/回合
                    │                              - 敌人列表 (HP/意图)
                    │                              - 手牌 (费用/名称/描述)
                    │                              - 牌堆计数
                    │
                    ├──── message_logged(message) ──► BattleScene._on_message_logged()
                    │                                    │
                    │                              追加战斗日志 (保留最近10条)
                    │
                    ├──── combat_won(remaining_hp) ──► BattleScene._on_combat_won()
                    │                                    │
                    │                              RunController.on_battle_won()
                    │                                    │
                    │                              GameState.apply_post_battle_hp()
                    │                              GameState.record_battle_win()
                    │                              GameState.advance_node()
                    │                              RunController.enter_current_node()
                    │                                    │
                    │                              SceneRouter.go_to("reward" 或 "result")
                    │
                    └──── combat_lost ──────────────► BattleScene._on_combat_lost()
                                                     │
                                               RunController.on_battle_lost()
                                                     │
                                               GameState.finish_run(false)
                                               SceneRouter.go_to("result")
```

### 7.2 战斗数据快照结构 (get_snapshot)

```gdscript
{
    phase: "player" | "enemy" | "won" | "lost",
    turn_number: int,
    player_hp: int,
    player_max_hp: int,
    player_block: int,
    player_strength: int,
    energy: int,
    energy_per_turn: int,
    hand: [
        # 每张手牌已解析为完整卡牌数据
        { instance_id, card_id, name, cost, type, target, description, effects }
    ],
    piles: {
        draw: int,
        hand: int,
        discard: int,
        exhaust: int
    },
    enemies: [
        { id, name, hp, max_hp, block, strength, intent: { id, name, type, value } }
    ]
}
```

---

## 8. 效果系统 (EffectRunner)

### 8.1 已实现的效果类型

| type | 作用 | 参数 |
|------|------|------|
| `damage` | 对目标造成伤害 (受力量加成) | `value`, `target` |
| `block` | 获得格挡 | `value`, `target` |
| `draw` | 抽牌 | `value` |
| `gain_strength` | 获得力量 | `value` |
| `apply_status` | 施加状态 (当前仅代理到 gain_strength) | `status_id`, `value` |

### 8.2 伤害计算公式

```
实际伤害 = max(0, 原始伤害 + 力量 - 目标格挡)
目标格挡 = min(目标.block, 原始伤害 + 力量)
目标剩余格挡 = 目标.block - 实际吸收量
```

---

## 9. 关键设计决策

### 9.1 RefCounted vs Node

`BattleController`、`DeckRuntime`、`EffectRunner`、`EnemyAI`、`RewardService` 均继承 `RefCounted` 而非 `Node`。

**原因:** 这些是纯逻辑对象，不需要进入场景树，不需要 `_process`，不需要子节点。`RefCounted` 自动管理内存，避免手动 `queue_free`。

### 9.2 Dictionary 作为数据载体

运行时数据（卡牌实例、敌人状态、快照）全部使用 `Dictionary` 而非自定义 Resource。

**原因:** JSON 数据天然映射为 Dictionary，V1 阶段避免创建大量 GDScript class 开销。Dictionary 的 `.duplicate(true)` 提供深拷贝，保证各模块间无共享状态污染。

### 9.3 数据驱动 vs 硬编码

所有卡牌、敌人、遭遇、奖励、关卡序列均定义在 JSON 文件中。代码只负责加载、校验和运行时逻辑。

**收益:** 新增卡牌/敌人只需编辑 JSON，零代码改动。校验链路保证数据完整性。

### 9.4 UI 纯代码构建

所有场景的 UI 均在脚本 `_ready()` 中通过代码创建（`Button.new()`, `Label.new()` 等），不依赖 `.tscn` 编辑器布局。

**原因:** V1 原型阶段快速迭代，UI 结构简单，代码构建更灵活。后续可迁移到 .tscn 编辑器布局。

---

## 10. 当前实现文件清单

```
client/slay-demo/
├── data/
│   ├── cards.json                 # 6 张卡牌定义
│   ├── enemies.json               # 4 个敌人定义
│   ├── encounters.json            # 4 场遭遇定义
│   ├── rewards.json               # 1 个奖励配置
│   └── run_v1.json                # 固定关卡序列
│
├── scripts/
│   ├── autoload/
│   │   ├── data_loader.gd         # 309 行 — JSON 加载/校验引擎
│   │   ├── game_state.gd          #  80 行 — 跨场景运行状态
│   │   ├── run_controller.gd      #  82 行 — 关卡流程控制
│   │   └── scene_router.gd        #  29 行 — 场景切换
│   │
│   ├── battle/
│   │   ├── battle_controller.gd   # 215 行 — 战斗状态机
│   │   ├── deck_runtime.gd        #  92 行 — 牌堆管理
│   │   ├── effect_runner.gd       #  80 行 — 效果执行器
│   │   └── enemy_ai.gd            #  61 行 — 敌人 AI
│   │
│   ├── reward/
│   │   └── reward_service.gd      #  57 行 — 奖励生成
│   │
│   └── scenes/
│       ├── app_root.gd            #  19 行 — 入口
│       ├── main_menu_scene.gd     #  67 行 — 主菜单
│       ├── battle_scene.gd        # 210 行 — 战斗 UI
│       ├── reward_scene.gd        #  77 行 — 奖励 UI
│       └── result_scene.gd        #  68 行 — 结算 UI
│
├── scenes/
│   ├── app/app_root.tscn          # 根场景节点
│   ├── battle/battle_scene.tscn   # 战斗场景节点
│   ├── main_menu/main_menu_scene.tscn
│   ├── reward/reward_scene.tscn
│   └── result/result_scene.tscn
│
└── addons/
    ├── godot_mcp_runtime/         # MCP 运行时桥接
    └── godot_mcp_editor/          # MCP 编辑器插件
```

**代码总量:** ~13 个 GDScript 文件，约 1,346 行代码

---

## 11. 已验证的闭环路径

| 路径 | 状态 |
|------|------|
| 启动 → 数据加载/校验 → 主菜单 | ✅ 已实现 |
| 主菜单 → 新局 → 战斗1(小史莱姆) → 胜利 → 奖励 | ✅ 已实现 |
| 战斗1奖励 → 战斗2(暗影信徒) → 胜利 → 奖励 | ✅ 已实现 |
| 战斗2奖励 → 战斗3(史莱姆+盾卫) → 胜利 → 奖励 | ✅ 已实现 |
| 战斗3奖励 → Boss(腐化骑士) → 胜利 → 结算 | ✅ 已实现 |
| 任意战斗失败 → 失败结算 | ✅ 已实现 |
| 结算 → 重新开始 / 返回主菜单 | ✅ 已实现 |
| 出牌 → 选择目标 → 效果结算 → 弃牌 | ✅ 已实现 |
| 结束回合 → 敌人行动 → 新回合 | ✅ 已实现 |
| 牌堆耗尽 → 弃牌堆洗入抽牌堆 | ✅ 已实现 |

---

## 12. 暂未实现 (V2+ 候选)

| 功能 | 当前状态 |
|------|---------|
| 状态效果 (易伤、虚弱) | 字段已预留，EffectRunner 仅代理到 gain_strength |
| 卡牌升级 | JSON 已定义 upgrade 字段，运行时未使用 |
| 精英战斗 | 数据结构和代码已支持，缺少数据和节点 |
| 商店系统 | 暂缓 |
| 遗物系统 | 暂缓 |
| 药水系统 | 暂缓 |
| 存档/读档 | 暂缓 |
| 随机地图生成 | V1 使用固定序列 |
| 动画/VFX | 暂缓，UI 纯文本 |
| 本地化 | 文案直接来自 JSON |
