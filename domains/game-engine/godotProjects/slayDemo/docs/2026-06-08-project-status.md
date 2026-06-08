# SlayDemo 项目现状记录

> 记录日期: 2026-06-08
> 项目路径: domains/game-engine/godotProjects/slayDemo
> 性质: 类《杀戮尖塔》卡牌 Roguelike，Godot 4.x，学习型 MVP Demo

---

## 📊 整体进度

```
策划完成度  █████████████████████░  约 95%
           核心玩法设计完整，新手引导/卡牌描述规范待完善

开发完成度  ██████████████████████  约 97%
           所有核心系统 + V1.0 P0 项目全部完成

美术完成度  ████████████████████░░  约 90%
           序列帧动画全覆盖，遗物图标 16/16 全接线
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
| M6 视觉打磨 | ✅ | VFX/BGM/SFX 全场景覆盖；遗物图标 16/16 接线完成 |
| M7 日志系统 | ✅ | Universal Logger（双格式输出 + AI 可解析 JSON） |
| **P3 内容扩充** | ✅ | 卡牌 52 张 / 遗物 16 个 / 药水 8 种 / 精英 4 个 |
| **V1.0 P0 修复** | ✅ | 遗物图标全接线 + 商店确认弹窗 + 升级对比 UI + art_key 修正 |

---

## 🎯 当前内容规模

| 内容类型 | 数量 | 说明 |
|----------|------|------|
| 卡牌 | 52 张 | 攻击 / 技能 / 能力，含升级版本 |
| 敌人 | 15 种 | 普通 8 / 精英 4 / Boss 3 |
| 遭遇 | 16 个 | 含 Boss 三阶段遭遇 + 4 个精英遭遇 |
| 遗物 | 16 个 | 含 retain/philosopher_stone 等机制，图标 16/16 ✅ |
| 药水 | 8 种 | 治疗/力量/敏捷/洞察/活力/爆炎/钢铁/毒雾 |
| 状态 | 13 种 | 含 ritual/metallicize，图标 13/13 ✅ |
| 脚本文件 | 33 个 | GDScript（不含测试） |
| 测试脚本 | 29 个 | 单元测试 + 集成测试 |

---

## 🧪 测试状态

| 指标 | 数值 |
|------|------|
| 断言数 | **564** |
| 失败数 | **0** |
| 测试脚本 | 29 个 |
| 测试类型 | 单元测试 + 集成测试 + 场景运行时测试 |

### 运行测试

```powershell
# Windows（直接调用）
"C:\Users\Lenovo\Downloads\Godot_v4.6.2-stable_win64.exe\Godot_v4.6.2-stable_win64_console.exe" --headless --path "D:\openClass\openClasses\domains\game-engine\godotProjects\slayDemo\client\slay-demo" res://tests/test_runner.tscn

# WSL
/mnt/c/Users/Lenovo/Downloads/Godot_v4.6.2-stable_win64.exe/Godot_v4.6.2-stable_win64_console.exe --headless --path "D:\\openClass\\openClasses\\domains\\game-engine\\godotProjects\\slayDemo\\client\\slay-demo" res://tests/test_runner.tscn
```

---

## 📝 2026-06-08 完成工作

### 实际状态核查（文档漂移修正）

通过直接读代码发现，上次状态文档（2026-06-03）多处"待做"标记与实际代码不符：

| 项目 | 旧文档记录 | 实际状态 |
|------|-----------|---------|
| 遗物图标 | ❌ 5/16 | ✅ `relic_view_factory.gd` 已有 16 条图标路径，图标文件已全部接线 |
| 商店删牌确认弹窗 | ❌ 待做 | ✅ `shop_scene.gd:315` `_show_remove_confirm()` 已实现 |
| 状态图标（frail/ritual/metallicize） | ❌ 缺3个 | ✅ PNG 文件存在，`status_view_factory.gd` 已接线 |
| 升级前后对比 UI | ❌ 待做 | ✅ `card_view_factory.gd:157` `create_upgrade_compare()` 已实现，`reward_scene.gd:377` 已调用 |
| 卡牌描述不符 | 🔴 腐化/双重点击 | ✅ 描述与效果已对齐 |

### 本次实际开发

- **修正 `necromancer_v1`（星座魔女）art_key**：`enemy_skeleton` → `enemy_shadow_mage`（法师外形更符合施法系角色定位）
- **修正 `elite_orc_berserker_v1`（狂暴糖果熊）art_key**：`enemy_gargoyle` → `enemy_orc_berserker`（名称直接对应兽人狂战士外形）
- **测试断言**：514 → **564**（+50 条，均为之前迭代新增）

---

## 🏗️ 核心架构

### 五层架构

```
表现层     Scene UI / CardView / EnemyView / VFX / 序列帧动画
               ↓ 只订阅信号，不直接改战斗状态
应用服务层  UIManager / AudioManager
               ↓
流程层     GameState / SceneRouter / RunController
               ↓
玩法逻辑层  BattleController / EffectRunner / EnemyAI / MapGenerator
               ↓ 只读
数据层     DataLoader + JSON (cards / enemies / encounters / rewards / relics / potions)
```

---

## 🔴 当前已知风险 / 待办

### P1 强烈建议（影响完成质量）

- [ ] 新手引导（第一战操作提示覆盖层）
- [ ] 结算界面得分/评价系统

### P2 锦上添花

- [ ] 场景切换淡入淡出
- [ ] 毒流/格挡流卡组完善（+10 张卡）

---

## 🚀 版本路线图

### V1.0 Demo（当前目标，约完成 97%）

- [x] 修复卡牌描述与实现的不一致
- [x] 遗物图标 × 16 完整接线
- [x] 商店删牌二次确认弹窗
- [x] 升级前后效果对比 UI
- [x] 敌人图像语义修正
- [x] 测试覆盖：564 断言 / 0 失败
- [ ] 新手引导脚本（可选）

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
| 敌人序列帧 | 10 种 × (idle+hit) | ✅ 各 6 帧，全部接入 SpriteAnimHelper |
| 玩家角色序列帧 | idle + hit | ✅ 各 6 帧，BattleScene 已接入 |
| 卡牌模板 | 4 种 | ✅ 全稀有度完整 |
| 卡牌图标 | 7 种 | ✅ |
| UI 图标 | 10+ | ✅ 含意图、状态、遗物 |
| 遗物图标 | 16/16 | ✅ 全部接线 |
| 状态图标 | 13/13 | ✅ 包含 frail/ritual/metallicize |
| 字体 | 2 种 | ✅ 中英文 |
| 音效 | 8+ 个 | ✅ 已接入 AudioManager |
| BGM | 5 首 | ✅ 全场景覆盖 |

---

## 🎯 关键决策记录

1. **五层架构** — 清晰分层，低耦合
2. **数据驱动** — JSON 配置所有游戏数据（含 VFX tag 标记）
3. **信号通信** — UI 只订阅 combat_event，不直接调用业务逻辑
4. **Universal Logger** — 双格式输出，AI 可解析
5. **稀有度权重药水奖励池** — common 50% / uncommon 35% / rare 15%
6. **VFX tag 系统** — 卡牌携带 tag(poison/fire/magic)，战斗时自动推断特效类型
7. **SpriteAnimHelper** — 统一管理序列帧播放，idle/hit 动画状态机
8. **遗物图标硬编码路径** — `relic_view_factory.gd` 中的 `RELIC_ICON_PATHS` 字典，不依赖 JSON 字段

---

> 最后更新: 2026-06-08（V1.0 P0 全部完成，564 断言通过）
> 下次审查: V1.5 冲刺前
