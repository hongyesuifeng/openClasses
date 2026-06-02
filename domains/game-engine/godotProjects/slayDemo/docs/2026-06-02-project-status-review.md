# SlayDemo 项目现状全景分析

> 分析日期: 2026-06-02  
> 项目路径: domains/game-engine/godotProjects/slayDemo  
> 性质: 类《杀戮尖塔》卡牌 Roguelike，Godot 4.x，学习型 MVP Demo

---

## 一、策划视角

### 1.1 已完成的事情

**核心玩法设计文档（7 份）已全部落地：**

| 设计文档 | 内容 | 状态 |
|----------|------|------|
| 游戏设计总览 | 核心概念、战斗循环、地图推进循环、数值框架 | ✅ 完成 |
| 卡牌系统设计 | 初始牌组 12 张 + 扩展池 28 张（共 30 种），升级路径 | ✅ 完成 |
| 敌人设计 | 4 普通 + 2 精英 + 1 Boss，含三阶段 Boss 深渊领主 | ✅ 完成 |
| 地图与推进 | DAG 生成、节点类型（战/精/商/休/Boss/事件/宝箱） | ✅ 完成 |
| 奖励与经济 | 战斗奖励、商店、经济平衡 | ✅ 完成 |
| 状态与 Buff | 力量/敏捷/易伤/虚弱/中毒/荆棘/再生/堡垒 | ✅ 完成 |
| 战斗遭遇设计 | 遭遇规则、敌人组合 | ✅ 完成 |

**已落地的当前内容规模：**

| 内容 | 数量 |
|------|------|
| 卡牌 | 25 张（攻击 12 / 技能 12 / 能力 1） |
| 敌人 | 12 个（普通 8 / 精英 2 / Boss 2） |
| 遭遇 | 14 个 |
| 遗物 | 5 个 |

**关键玩法约定（已设计并实现）：**

- **战斗循环**：`PLAYER_TURN` → `PLAYER_RESOLVE` → `ENEMY_TURN` → 回合结束 → 胜负判定
- **能量系统**：基础 3 点/回合，出牌消耗，不足灰显
- **牌组流转**：抽牌堆 → 手牌 → 弃牌堆 → 洗牌 → 循环，消耗堆独立
- **地图循环**：选房间 → 完成事件 → 获奖励 → 选下一房间 → Boss → 结算

### 1.2 模块系统之间的关系

```
策划文档体系

  卡牌设计 ─────→ 效果执行器 ─────→ 状态系统
       ↓               ↓               ↓
  卡牌升级 ←──── 奖励/休息点 ←──── 战斗控制器
                                       ↓
  敌人设计 ─────→ 敌人 AI ──────→ 意图显示


  主菜单 → 地图节点选择 → 战斗 → 奖励 → 商店/休息/精英 → Boss → 结算
```

### 1.3 策划视角——还要做的事情

**P1（影响可玩性）：**

- [ ] **事件节点选牌 UI**：删牌/升级时应让玩家手动选择，当前自动选第一张，破坏了"取舍决策"体验
- [ ] **精英奖励 UI 呈现**：遗物奖励缺乏明确可见反馈（当前仅打日志）
- [ ] **地图路线随机生成**：完善随机 DAG 算法，当前是静态配置地图

**P2（经济平衡）：**

- [ ] **正式经济曲线**：战斗金币掉落差异、精英/Boss 奖励差异、商店价格随层数调整
- [ ] **商店遗物商品**：遗物目前只能通过宝箱/精英获得，商店缺货
- [ ] **删牌价格递增持久化**

**P3（待立项）：**

- [ ] **存档系统**（M5 里程碑）
- [ ] **药水系统**：设计文档规划 2~3 种基础药水，尚未立项

---

## 二、开发视角

### 2.1 已完成的事情

**里程碑进度：**

| 里程碑 | 状态 | 核心交付 |
|--------|------|----------|
| M1 项目骨架 | ✅ | AppRoot + SceneRouter + GameState + UIManager |
| M2 数据层 | ✅ | DataLoader + JSON 配置 + 数据校验 |
| M3 战斗闭环 | ✅ | 战斗状态机 + 卡牌效果引擎 + 伤害计算 |
| M4 地图与流程 | ✅ | 地图生成 + 事件/商店/休息 |
| M5 存档系统 | ❌ | 待实现 |
| M6 视觉打磨 | ⏳ | 部分（VFXManager 已实现） |
| M7 日志系统 | ✅ | Universal Logger（双格式输出 + AI 可解析 JSON） |

**脚本文件清单（29+ 文件）：**

```
autoload/
├── data_loader.gd      # 数据加载/缓存/校验
├── game_state.gd       # 跨场景 run 状态
├── run_controller.gd   # run 推进控制
└── scene_router.gd     # 统一场景切换（唯一入口）

battle/
├── battle_controller.gd  # 战斗状态机（回合控制）
├── deck_runtime.gd       # 抽/弃/洗牌堆管理
├── effect_runner.gd      # 效果执行管线
├── enemy_ai.gd           # 权重池 + Boss 三阶段 + 条件分支
├── status_manager.gd     # 状态挂载/触发/消退
└── upgrade_service.gd    # 卡牌升级服务

scenes/
├── app_root.gd           battle_scene.gd     chest_scene.gd
├── event_scene.gd        main_menu_scene.gd  map_scene.gd
├── rest_scene.gd         result_scene.gd     reward_scene.gd
└── shop_scene.gd

event/event_service.gd      # 事件服务
map/map_generator.gd        # 地图生成
relic/relic_service.gd      # 遗物效果
reward/reward_service.gd    # 奖励生成
shop/shop_service.gd        # 商店购买/删牌
ui/card_view_factory.gd     relic_view_factory.gd   status_view_factory.gd
vfx/vfx_manager.gd          # 特效创建与集成
```

**五层架构（清晰分层，低耦合）：**

```
表现层     Scene UI / CardView / EnemyView / VFX
               ↓ 只订阅信号，不直接改战斗状态
应用服务层  UIManager / AudioManager
               ↓
流程层     GameState / SceneRouter / RunController
               ↓
玩法逻辑层  BattleController / EffectRunner / EnemyAI / MapGenerator
               ↓ 只读
数据层     DataLoader + JSON (cards / enemies / encounters / rewards / relics)
```

**测试体系**：18+ 测试脚本，当前 **176 断言通过**（单元测试 + 集成测试）

### 2.2 模块系统之间的关系

```
GameState ←──── RunController ←──── SceneRouter
    ↓                ↓                   ↓
DataLoader      BattleController     各场景脚本
    ↓                ↓
JSON 数据       DeckRuntime
               EffectRunner ──→ StatusManager
               EnemyAI ───────→ BattleController 事件
                                       ↓
                               combat_event 信号
                                   ↙       ↘
                           BattleScene   VFXManager
                           (UI 订阅)     (特效播放)
```

**关键信号通信约定：**
- 战斗层用 `combat_event` 信号传递所有战斗事件（伤害/状态/胜负）
- UI 层只订阅信号，不持有也不调用业务逻辑对象
- 跨系统广播通过 EventBus 扩展（当前战斗内部用直接信号）

### 2.3 开发视角——还要做的事情

**P1（影响体验流程）：**

- [ ] **事件选牌 UI**：`event_scene.gd` 中删牌/升级时的卡牌选择交互
- [ ] **精英遗物奖励 UI**：获得遗物时展示选择/确认界面
- [ ] **地图路线随机生成**：`map_generator.gd` 从静态节点数组升级到随机 DAG

**P2（完善系统）：**

- [ ] **经济曲线调整**：当前 V2 初始金币偏测试用途，需正式化
- [ ] **商店遗物商品**：扩展 `shop_service.gd`

**P3（存档与表现）：**

- [ ] **存档系统（M5）**：保存/加载 run 状态（hp/gold/deck/map/relics）
- [ ] **AudioManager 完善**：音效/背景音乐（框架已有，内容待填充）
- [ ] **战斗动画细化**：VFXManager 框架已就绪，动画内容待扩展
- [ ] **地图节点图标与路径线视觉优化**
- [ ] **状态 tooltip 系统**

---

## 三、美术视角

### 3.1 已完成的事情

**已整理的资源目录（`assets/`）：**

| 资源类别 | 已有文件 | 状态 |
|----------|----------|------|
| 场景背景图 | bg_battle_boss / bg_battle_cave / bg_battle_dungeon / bg_main_menu / bg_map | ✅ 5 张，覆盖主要场景 |
| 敌人立绘 | ancient_dragon / bat / corrupted_knight / gargoyle / mushroom / shadow_mage / skeleton / slime | ✅ 8 个，仅静态 idle |
| 玩家角色 | player_warrior_idle.png + player_portrait.png | ✅ 仅 idle 状态 |
| 卡牌模板 | card_template_common / uncommon / rare / legendary + card_back | ✅ 4 种稀有度完整 |
| 卡牌类型图标 | attack / buff / debuff / defend / power / skill / strike | ✅ 7 种 |
| 费用水晶 | cost_crystal.png | ✅ |
| UI 按钮 | normal / hover / pressed / disabled | ✅ 4 态完整 |
| 血量/格挡条 | ui_hp_bar_bg / fill + ui_block_bar_fill | ✅ |
| UI 功能图标 | audio_on / audio_off / boss / close / elite / question / settings | ✅ 7 个 |
| 字体 | ChakraPetch-Bold/Regular（英文）+ NotoSansSC（中文） | ✅ |
| 音效 | card_place_1.ogg + card_slide_1.ogg | ✅ 2 个基础音效 |

**美术风格定义（已有完整设计文档）：**

- **风格**：扁平手绘风（Flat Hand-drawn）
- **主色调**：暗色奇幻——深蓝紫 `#1a1a2e` 为底，暖色点缀
- **功能色编码**：红=攻击 `#ff4444`、蓝=格挡 `#4488ff`、绿=技能 `#44cc88`（贯穿全局）
- **字号规范**：标题 32px / 正文 18px / 小字 14px / 卡牌描述 12px

### 3.2 美术资源系统关系

```
assets/ 目录
    ↓ art_key 映射
AssetRegistry（autoload）
    ↓
CardViewFactory ←── 卡牌图标 / 模板
RelicViewFactory ←── 遗物图标
StatusViewFactory ←── 状态图标
VFXManager ────────── 粒子纹理 / 特效
各 .tscn 场景 ─────── 背景图 / 角色图
```

**当前已知问题：**

1. **敌人命名不一致**：`design/03-enemy-design.md` 使用中文名（绿皮小怪、尖刺兽、暗影法师...），而 `assets/enemies/` 目录用英文文件名（slime/skeleton/mushroom...），两套命名需要在 `EnemyData.art_key` 对接前统一
2. **敌人只有静态图**：所有敌人均为单张 idle 图，攻击/受伤/死亡动画当前用 Godot Tween 代替
3. **部分 tech 文档路径引用旧格式**：与当前 `assets/` 目录结构不符

### 3.3 美术视角——还要做的事情

**P0（功能可运行，当前缺失）：**

- [ ] **意图图标**（攻击/防御/增益/Debuff/特殊）——缺失，严重影响战斗可读性
- [ ] **状态效果图标**（力量/中毒/易伤/虚弱/护盾/敏捷）——缺失
- [ ] **抽牌堆/弃牌堆图标**——缺失

**P1（体验提升）：**

- [ ] **敌人动画帧**（攻击/受伤/死亡）——当前用 Tween 替代
- [ ] **玩家动画帧**（攻击/受伤/格挡）——当前仅 idle
- [ ] **地图节点完整图标**（战斗/商店/休息/宝箱节点图标缺失，boss/elite/question 已有）
- [ ] **遗物图标**（5 个遗物各需一个独立图标）
- [ ] **能量 HUD 完整图**（战斗界面能量显示区视觉待完善）

**P2（锦上添花）：**

- [ ] 粒子特效纹理（闪光/火焰/毒雾/护盾粒子）
- [ ] 主菜单正式美术
- [ ] 背景音乐（BGM）
- [ ] 更多音效（攻击命中/状态施加/回合切换/胜负）

**待对齐：**

- [ ] 统一敌人命名（design doc 中文名 ↔ art 文件英文名 ↔ EnemyData.id）
- [ ] 资源路径统一走 `AssetRegistry` 的 key 映射，禁止场景脚本硬编码路径

---

## 四、三视角综合总结

### 当前项目进度

```
策划完成度  ████████████████████░░  约 90%
           核心玩法设计完整，事件选牌/药水待细化

开发完成度  ████████████████░░░░░░  约 75%
           核心系统完整，存档/随机地图/UI 交互补齐待做

美术完成度  ████████░░░░░░░░░░░░░░  约 40%
           静态资源到位，动画帧/意图图标/状态图标缺失较多
```

### 离"可试玩 MVP"最近的四步

| 优先级 | 工作 | 视角 | 说明 |
|--------|------|------|------|
| 1 | **补意图图标** | 美术 | 战斗可读性最关键的 P0 资源，目前完全缺失 |
| 2 | **补事件选牌 UI** | 开发 + 策划 | 当前自动选第一张，破坏取舍决策体验 |
| 3 | **补精英遗物奖励 UI** | 开发 + 美术 | 当前靠打日志反馈，玩家无感知 |
| 4 | **调整初始经济曲线** | 策划 + 开发 | 让正式流程金币/商店/奖励平衡跑通 |
