# SlayDemo 项目现状记录（P3 完成版）

> 记录日期: 2026-06-03（最后更新：P3 全部接通后）
> 项目路径: domains/game-engine/godotProjects/slayDemo
> 性质: 类《杀戮尖塔》卡牌 Roguelike，Godot 4.x，学习型 MVP Demo

---

## 📊 整体进度

```
策划完成度  ████████████████████░░  约 92%
           核心玩法设计完整，新手引导/卡牌描述规范待完善

开发完成度  ████████████████████░░  约 90%
           所有核心系统完成，遗物图标/确认弹窗/升级对比 UI 待做

美术完成度  ████████████░░░░░░░░░░  约 55%
           VFX/BGM/SFX 全覆盖，遗物图标（16 个仅 5 个有图标）
```

---

## ✅ 已完成里程碑

| 里程碑 | 状态 | 核心交付 |
|--------|------|----------|
| M1 项目骨架 | ✅ | AppRoot + SceneRouter + GameState + UIManager |
| M2 数据层 | ✅ | DataLoader + JSON 配置 + 数据校验 |
| M3 战斗闭环 | ✅ | 战斗状态机 + 卡牌效果引擎 + 伤害计算 |
| M4 地图与流程 | ✅ | 随机 DAG 地图 + 事件/商店/休息/宝箱 + 事件选牌 UI |
| M5 存档系统 | ✅ | SaveService 完整实现 + 自动存档 + 继续游戏入口 |
| M6 视觉打磨 | ⏳ | VFX/BGM/SFX 全场景覆盖；遗物图标待补全 |
| M7 日志系统 | ✅ | Universal Logger（双格式输出 + AI 可解析 JSON） |
| **P3 内容扩充** | ✅ | 卡牌 52 张 / 遗物 16 个 / 药水 8 种 / 精英 4 个 |

---

## 🎯 当前内容规模

| 内容类型 | 数量 | 说明 |
|----------|------|------|
| 卡牌 | 52 张 | 攻击 / 技能 / 能力，含升级版本 |
| 敌人 | 14 种 | 普通 8 / 精英 4 / Boss 2 |
| 遭遇 | 16 个 | 含 Boss 三阶段遭遇 + 4 个精英遭遇 |
| 遗物 | 16 个 | 含 retain/philosopher_stone 等机制 |
| 药水 | 8 种 | 治疗/力量/敏捷/洞察/活力/爆炎/钢铁/毒雾 |
| 状态 | 13 种 | 含 ritual/metallicize 新增状态 |
| 脚本文件 | 33 个 | GDScript（不含测试） |
| 测试脚本 | 29 个 | 单元测试 + 集成测试 |

---

## 📝 最近完成的工作（2026-06-03，P3 冲刺）

### 提交记录（时间倒序）

```
1e89928d  feat: P3 接通 + 测试补全 + VFX tag 扩充
          - map_generator: 精英池加入 v1_elite_03/04，4 个精英均可出现
          - p3_features_test: 29 条新断言（ritual/metallicize/philosopher_stone/药水池）
          - cards.json: reaper/thunderclap/shockwave → magic tag，venomous_stab → poison tag
          - 测试: Assertions 514 / Failures 0

1f8dfa7b  feat: P3-A/B - 药水奖励池 + ritual/metallicize 卡牌 + 精英扩充
          - potion_service: 按稀有度权重随机奖励池（common 50% / uncommon 35% / rare 15%）
          - cards.json: 新增「仪式」「金属化」两张 Power 牌 + 升级版本
          - battle_controller: philosopher_stone 特判（持有时敌人回合开始获得 1 层力量）
          - enemies.json: 新增诅咒法师 + 石像哨兵（各含 2 阶段 AI）
          - encounters.json: 新增 v1_elite_03 / v1_elite_04

fdd54ce0  feat: VFX/SFX polish + 药水扩充 3→8 + ritual/metallicize 状态
          - battle_scene: heal/block_gained 浮动数字（绿/蓝色）
          - battle_controller: 按卡牌 tag(poison/fire/magic) 推断 vfx_type
          - 新增状态：ritual（每回合结束 +1 力量）/ metallicize（每回合结束获得格挡）
          - potions.json: 新增 5 种药水，总计 8 种

4a58b87a  feat: 补全所有场景 BGM 调用
71cffae7  feat: P1/P2 - 音频补全 + 卡牌扩充 50 张 + 遗物扩充 16 个 + retain 机制
1ccd3041  feat: AudioManager 音频系统 + 完整音效/BGM 资产
1cd57179  feat: 状态 tooltip + 遗物扩充(5→11) + 卡牌扩充(25→37) + 测试覆盖
```

---

## 🏗️ 核心架构

### 五层架构

```
表现层     Scene UI / CardView / EnemyView / VFX
               ↓ 只订阅信号，不直接改战斗状态
应用服务层  UIManager / AudioManager
               ↓
流程层     GameState / SceneRouter / RunController
               ↓
玩法逻辑层  BattleController / EffectRunner / EnemyAI / MapGenerator
               ↓ 只读
数据层     DataLoader + JSON (cards / enemies / encounters / rewards / relics / potions)
```

### 关键模块关系

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
                           (UI + SFX)    (特效播放)
```

---

## 🧪 测试状态

| 指标 | 数值 |
|------|------|
| 断言数 | **514** |
| 失败数 | **0** |
| 测试脚本 | 29 个 |
| 测试类型 | 单元测试 + 集成测试 + 场景运行时测试 |

### 运行测试

```powershell
# Windows PowerShell
C:\Users\Lenovo\Downloads\Godot_v4.6.2-stable_win64.exe --headless --path client/slay-demo res://tests/test_runner.tscn

# WSL/Linux
cmd.exe /c "C:\Users\Lenovo\Downloads\Godot_v4.6.2-stable_win64.exe --headless --path client/slay-demo res://tests/test_runner.tscn"
```

---

## 🔴 当前已知风险

| 风险 | 等级 | 说明 |
|------|------|------|
| **rare 卡描述与实现不符** | 🔴 高 | `腐化` 描述"技能0费"实际是"力量+3"；`双重点击` 描述"攻击再触发"实际是"抽1张"。玩家信任问题 |
| **遗物图标覆盖率低** | 🔴 高 | 16 个遗物只有 5 个有图标，Boss 遗物全无图标 |
| 商店误删牌 | 🟡 中 | 删牌无确认弹窗，误操作影响本局体验 |
| 敌人图片语义错位 | 🟡 中 | 史莱姆王显示蘑菇、盾卫显示骷髅 |
| 复玩性不足 | 🟡 中 | 当前内容约支撑 1~2 局后玩家流失 |

---

## 🚀 V1.0 Demo 交付清单（当前目标）

### P0 必须（阻断发布）

- [ ] 卡牌描述与效果对齐（腐化、双重点击等 rare 卡）
- [ ] 遗物图标 × 16（当前 5/16）
- [ ] 商店删牌二次确认弹窗
- [ ] 全量测试 Failures: 0（当前已满足）

### P1 强烈建议

- [ ] 3 个状态图标补全（frail / ritual / metallicize）
- [ ] 敌人 art_key 语义修正（亡灵法师/狂战士图片对应关系）
- [ ] 升级前后效果对比显示
- [ ] 新手引导（第一战操作提示）

### P2 锦上添花

- [ ] 结算界面得分/评价
- [ ] 场景切换淡入淡出
- [ ] 毒流/格挡流卡组完善（+10 张卡）

---

## 🔄 版本路线图

### V1.0 Demo（当前目标，约 2 周）

1. 修复卡牌描述与实现的不一致（腐化/双重点击）
2. 完成遗物图标 × 16
3. 商店确认弹窗
4. 新手引导脚本
5. 测试覆盖目标：断言 600+

### V1.5（+4 周）

- 毒流/格挡流卡组完善（+10 张卡）
- 第 3 个 Boss
- 角色选择 UI 框架
- 技术债清理（seed 确定性、遗物互动效果）

### V2.0（+8 周）

- 第二角色（不同卡池）
- Act 2（新地图、新敌人、新 Boss）
- 成就系统
- 诅咒卡机制

---

## 📦 美术资源状态

| 资源类别 | 数量 | 状态 |
|----------|------|------|
| 场景背景图 | 5 张 | ✅ 覆盖主要场景 |
| 敌人立绘 | 8 个 | ✅ 仅静态 idle（语义对应待修正） |
| 玩家角色 | 2 张 | ✅ idle + portrait |
| 卡牌模板 | 4 种 | ✅ 全稀有度完整 |
| 卡牌图标 | 7 种 | ✅ |
| UI 图标 | 10+ | ✅ 含意图、状态、遗物（部分） |
| 遗物图标 | 5/16 | ⏳ 覆盖率 31%，待补全 |
| 状态图标 | 10/13 | ⏳ frail/ritual/metallicize 缺失 |
| 字体 | 2 种 | ✅ 中英文 |
| 音效 | 8+ 个 | ✅ 已接入 AudioManager |
| BGM | 5 首 | ✅ 全场景覆盖 |

---

## 📋 开发约定

### 日志驱动调试（规则 0）

```gdscript
ULogger.battle("战斗开始", {"enemies": 3})
ULogger.skill("技能释放", {"skill_id": id})
ULogger.ai("敌人决策", {"action": action})
ULogger.ui("UI更新", {"hp": current})
```

### 测试驱动交付（规则 1）

每次功能完成后必须运行测试，全部通过才交付（当前 514 断言 / Failures 0）。

---

## 🎯 关键决策记录

1. **五层架构** — 清晰分层，低耦合
2. **数据驱动** — JSON 配置所有游戏数据（含 VFX tag 标记）
3. **信号通信** — UI 只订阅 combat_event，不直接调用业务逻辑
4. **Universal Logger** — 双格式输出，AI 可解析
5. **稀有度权重药水奖励池** — common 50% / uncommon 35% / rare 15%
6. **VFX tag 系统** — 卡牌携带 tag(poison/fire/magic)，战斗时自动推断特效类型

---

> 最后更新: 2026-06-03（P3 全部接通，514 断言通过）
> 下次审查: V1.0 Demo 交付前，或完成 P0 修复后
