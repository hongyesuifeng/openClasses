# slayDemo - 项目开发规则

> 类《杀戮尖塔》卡牌 Roguelike 游戏，使用 Godot 4.x 开发。

---

## 🚨 核心开发规则

### 规则 0: 日志驱动调试（新增）

**所有开发活动必须使用 Universal Logger 记录关键运行时信息。**

#### 日志系统概述

项目使用 **Universal Logger** 插件（`ULogger`）进行统一的日志记录：
- **双格式输出**：控制台（人类可读）+ 文件（AI 可解析 JSON）
- **日志级别**：DEBUG / INFO / WARN / ERROR
- **模块化**：按业务模块分类（BATTLE/SKILL/AI/UI/LIFECYCLE）

#### 日志文件位置

```
client/slay-demo/.godot/game.log          # JSON 格式日志（AI 可解析）
client/slay-demo/.godot/logger_config.yaml # 日志配置
```

#### 日志 API 使用

```gdscript
# 基础日志方法
ULogger.debug("MODULE", "调试信息", {"key": "value"})
ULogger.info("MODULE", "普通信息")
ULogger.warn("MODULE", "警告信息")
ULogger.error("MODULE", "错误信息", {"context": "额外数据"})

# 业务便捷方法（推荐）
ULogger.battle("战斗开始，敌人数量=3")
ULogger.skill("技能释放：fireball", {"target": "enemy_1", "damage": 12})
ULogger.ai("敌人决策：攻击", {"enemy": "slime", "action": "tackle"})
ULogger.ui("UI刷新：血量更新", {"hp": 45, "max_hp": 60})
ULogger.lifecycle("对象创建：enemy_1", {"position": Vector2(100, 200)})
```

#### 开发工作流

```
开发功能 → 添加日志 → 运行测试 → 查看日志 → 分析问题 → 修复 → 验证
```

**1. 添加日志**
在关键业务逻辑处添加日志：
```gdscript
func apply_damage(target, amount):
    ULogger.battle("应用伤害", {"target": target.name, "amount": amount})
    # ... 业务逻辑
```

**2. 运行测试**
```bash
cd client/slay-demo
godot --headless --path . res://tests/test_runner.tscn
```

**3. 查看日志**
```bash
# 查看 JSON 格式日志
cat .godot/game.log | jq .

# 查找特定错误
grep '"level":"ERROR"' .godot/game.log | jq .

# 查看战斗流程
grep '"module":"BATTLE"' .godot/game.log | jq -r '.msg'
```

**4. 分析问题**
根据日志信息定位问题：
- 错误发生的位置
- 相关的数据值
- 执行流程状态

**5. 修复验证**
修复后重新运行，检查：
- 错误是否消失
- 业务流程是否正常
- 日志输出是否符合预期

#### 日志记录规范

**战斗系统日志**：
```gdscript
ULogger.battle("遭遇开始", {"encounter_id": encounter_id})
ULogger.battle("回合开始", {"turn": turn_number, "phase": "player"})
ULogger.battle("卡牌打出", {"card": card_id, "cost": energy_cost})
ULogger.battle("伤害计算", {"target": target, "damage": final_damage})
ULogger.battle("敌人被击败", {"enemy": enemy_name})
```

**技能系统日志**：
```gdscript
ULogger.skill("技能释放", {"skill_id": skill_id, "caster": caster.name})
ULogger.skill("效果应用", {"effect": effect_type, "value": effect_value})
ULogger.skill("技能完成", {"success": true})
```

**AI 系统日志**：
```gdscript
ULogger.ai("决策开始", {"enemy": enemy_name})
ULogger.ai("权重计算", {"action": action_id, "weight": calculated_weight})
ULogger.ai("条件判断", {"condition": condition_id, "result": condition_result})
ULogger.ai("执行动作", {"action": final_action})
```

#### AI Agent 使用日志

Agent 可以通过日志进行智能分析和修复：

**读取并分析日志**：
```python
import json

with open('.godot/game.log') as f:
    logs = [json.loads(line) for line in f]

# 找出所有错误
errors = [log for log in logs if log['level'] == 'ERROR']

# 分析错误模式
for error in errors:
    print(f"错误: {error['msg']}")
    print(f"模块: {error['module']}")
    if 'data' in error:
        print(f"上下文: {error['data']}")
```

**根据日志定位问题**：
```python
# 查找特定错误的上下文
null_errors = [
    log for log in logs 
    if 'null' in log.get('msg', '').lower()
]

# 分析错误发生的模式
for error in null_errors:
    print(f"时间: {error['ts']}")
    print(f"模块: {error['module']}")
    print(f"消息: {error['msg']}")
```

---

### 规则 1: 测试驱动交付（强制）

**每次完成功能或模块开发后，必须同步编写对应的单元测试，运行全量测试通过后才算交付完成。**

#### 核心要求

> 新功能 / 新内容 必须有对应新测试，缺测试视为交付不完整。

| 开发内容 | 必须补充的测试 |
|---------|--------------|
| 新服务类（`*_service.gd`） | `tests/unit/*_service_test.gd`，覆盖核心逻辑、边界条件、失败路径 |
| 新 JSON 数据（cards / relics / potions） | `content_expansion_test.gd` 或对应测试，验证 validate_all 通过、关键字段可查询 |
| 新 UI 工厂（`*_view_factory.gd`） | `tests/unit/*_view_factory_test.gd`，验证返回类型、tooltip、callback 绑定 |
| 新场景流程（`*_scene.gd`） | `tests/integration/`，验证场景实例化、关键 UI 状态、流程跳转 |
| 修改现有系统 | 更新对应测试，确保改动不破坏已有断言 |

#### 工作流

```
开发新功能 → 编写对应测试 → 运行测试 → 全部通过 → 提交代码
                                ↓
                            有失败 → 修复 → 重新运行
```

#### 运行测试命令

```powershell
# Windows PowerShell
C:\Users\Lenovo\Downloads\Godot_v4.6.2-stable_win64.exe --headless --path client/slay-demo res://tests/test_runner.tscn
```

```bash
# WSL/Linux (通过 cmd.exe)
cmd.exe /c "C:\Users\Lenovo\Downloads\Godot_v4.6.2-stable_win64.exe\Godot_v4.6.2-stable_win64_console.exe --headless --path D:\openClass\openClasses\domains\game-engine\godotProjects\slayDemo\client\slay-demo res://tests/test_runner.tscn"
```

#### 测试通过的判定标准

```
Assertions: <数字>
Failures: 0
All tests passed.
```

退出码必须为 `0`。

#### 测试失败的处理

1. **不允许跳过失败的测试** - 必须修复
2. **不允许直接提交** - 测试不通过不交付
3. **可以暂时禁用** - 仅在确认是测试本身的问题，且记录在 implementation-log
4. **如果环境无法运行测试** - 必须告知用户，让用户手动运行验证

---

### 规则 2: 文档同步

每次完成重大功能，需要：

1. 在 `docs/implementation-log/` 添加实现日志（YYYY-MM-DD-feature-name.md）
2. 更新对应的技术文档（`docs/tech/`）
3. 在提交信息中清晰描述改动

---

### 规则 3: 提交规范

提交信息格式：

```
<type>: <subject>

<body>

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

`type` 取值：
- `feat`: 新功能
- `fix`: Bug 修复
- `refactor`: 重构
- `docs`: 文档变更
- `test`: 测试相关
- `style`: 代码格式

---

## 📁 项目结构

```
slayDemo/
├── client/slay-demo/         # Godot 项目主目录
│   ├── addons/              # 插件目录
│   │   └── universal_logger/ # Universal Logger 插件
│   ├── data/                 # JSON 数据文件
│   ├── scripts/              # GDScript 代码（29+ 文件）
│   │   ├── autoload/         # 全局单例
│   │   ├── battle/           # 战斗系统
│   │   ├── event/            # 事件系统
│   │   ├── map/              # 地图系统
│   │   ├── relic/            # 遗物系统
│   │   ├── reward/           # 奖励系统
│   │   ├── scenes/           # 场景脚本
│   │   ├── shop/             # 商店系统
│   │   ├── ui/               # UI 组件
│   │   └── vfx/              # 特效系统
│   ├── scenes/               # .tscn 场景文件
│   ├── tests/                # 测试目录
│   │   ├── unit/             # 单元测试（8+ 测试）
│   │   └── integration/      # 集成测试（10+ 测试）
│   └── assets/               # 资源文件
├── docs/                     # 设计与技术文档
│   ├── design/               # 游戏设计文档
│   ├── tech/                 # 技术实现文档（14+ 文档）
│   ├── art/                  # 美术风格文档
│   └── implementation-log/   # 实现日志
└── CLAUDE.md                 # 本文件
```

---

## 🎯 当前里程碑进度

| 里程碑 | 状态 | 说明 |
|--------|------|------|
| M1 项目骨架 | ✅ | 基础架构 + 测试框架 |
| M2 数据层 | ✅ | DataLoader + JSON 配置 |
| M3 战斗闭环 | ✅ | 战斗状态机 + 卡牌效果 |
| M4 地图与流程 | ✅ | 随机 DAG 地图 + 事件/商店/休息 + 事件选牌 UI |
| M5 存档系统 | ✅ | SaveService + 自动存档 + 继续游戏入口 |
| M6 视觉打磨 | ⏳ | 部分完成（VFXManager） |
| **M7 日志系统** | ✅ | **Universal Logger 插件** |

---

## 🔧 开发约定

### 日志记录规范（新增）

**使用 Universal Logger（ULogger）记录关键运行时信息**

#### 日志添加原则

1. **关键流程必记**：
   - 战斗开始/结束
   - 回合切换
   - 技能释放
   - 状态变化
   - 错误和异常

2. **数据驱动**：
   - 使用 `data` 参数传递关键信息
   - 包含足够上下文供后续分析
   - 避免敏感信息（如密码、密钥）

3. **级别选择**：
   - `DEBUG`：详细的调试信息（仅开发时）
   - `INFO`：关键业务事件（默认）
   - `WARN`：异常但可恢复的情况
   - `ERROR`：错误和失败情况

#### 各模块日志添加点

**战斗系统（BATTLE）**：
```gdscript
# 战斗流程
ULogger.battle("遭遇开始", {"encounter_id": id})
ULogger.battle("回合开始", {"turn": n, "phase": "player/enemy"})
ULogger.battle("回合结束", {"turn": n})

# 卡牌操作
ULogger.battle("抽牌", {"count": n, "hand_size": hand.size()})
ULogger.battle("出牌", {"card": card_id, "cost": cost})
ULogger.battle("弃牌", {"card": card_id, "reason": reason})

# 伤害结算
ULogger.battle("伤害计算", {"attacker": source, "target": target, "damage": dmg})
ULogger.battle("格挡计算", {"block": block_value, "damage": actual_dmg})

# 状态变化
ULogger.battle("敌人死亡", {"enemy": enemy_name})
ULogger.battle("战斗胜利", {"turns": turn_count})
ULogger.battle("战斗失败", {"reason": reason})
```

**技能系统（SKILL）**：
```gdscript
ULogger.skill("技能验证", {"skill_id": id, "can_cast": result})
ULogger.skill("技能释放", {"skill_id": id, "caster": name})
ULogger.skill("效果应用", {"effect": type, "targets": [target_names]})
ULogger.skill("技能完成", {"success": true})
```

**AI 系统（AI）**：
```gdscript
ULogger.ai("决策开始", {"enemy": name, "turn": turn})
ULogger.ai("权重计算", {"action": action, "weight": weight})
ULogger.ai("条件判断", {"condition": id, "result": bool})
ULogger.ai("动作选择", {"action": selected_action})
```

**UI 系统（UI）**：
```gdscript
ULogger.ui("血量更新", {"hp": current, "max": max})
ULogger.ui("能量更新", {"energy": current, "max": max})
ULogger.ui("手牌更新", {"hand_size": count})
ULogger.ui("弃牌堆更新", {"discard_size": count})
```

**生命周期（LIFECYCLE）**：
```gdscript
ULogger.lifecycle("场景创建", {"scene": scene_name})
ULogger.lifecycle("对象创建", {"object": object_name})
ULogger.lifecycle("对象销毁", {"object": object_name})
ULogger.lifecycle("信号连接", {"signal": signal_name})
```

#### 错误日志规范

```gdscript
# 空引用检查
if target == null:
    ULogger.error("BATTLE", "目标为空", {"action": "apply_damage", "target": null})

# 数组越界检查
if index < 0 or index >= array.size():
    ULogger.error("BATTLE", "数组越界", {"index": index, "size": array.size()})

# 数据验证失败
if not card_data:
    ULogger.error("SKILL", "卡牌数据不存在", {"card_id": card_id})
```

#### 日志分析示例

Agent 可以通过日志快速定位问题：

**查找战斗相关错误**：
```bash
grep '"module":"BATTLE".*"level":"ERROR"' .godot/game.log | jq .
```

**分析技能释放流程**：
```bash
grep '"module":"SKILL"' .godot/game.log | jq -r '.msg' | head -20
```

**统计错误类型**：
```python
import json
from collections import Counter

with open('.godot/game.log') as f:
    logs = [json.loads(line) for line in f]

errors = [log['msg'] for log in logs if log['level'] == 'ERROR']
error_counts = Counter(errors)

for error, count in error_counts.most_common(10):
    print(f"{error}: {count} 次")
```

---

### 代码风格

- **GDScript 缩进**: 使用 Tab（项目默认）
- **变量命名**: snake_case
- **类名**: PascalCase
- **常量**: SCREAMING_SNAKE_CASE
- **私有方法**: `_method_name` 前缀
- **类型标注**: 尽量添加，提升可读性

### 数据驱动

- 卡牌、敌人、遭遇、奖励、遗物均通过 JSON 配置
- 修改数据后必须运行测试，确保 DataLoader 验证通过
- 新增字段时同步更新 DataLoader 验证逻辑

### 信号通信

- 战斗层使用 `combat_event` 信号传递事件
- UI 层订阅信号，与业务逻辑解耦
- 新增事件类型需要更新 BattleScene 的 `_on_combat_event` 处理

---

## 📝 已完成的核心系统

### 核心玩法系统
- ✅ **日志系统**（Universal Logger）：双格式输出 + AI 友好 JSON + 模式识别
- ✅ **战斗系统**：战斗状态机 + 卡牌效果引擎 + 伤害计算
- ✅ **敌人 AI**：权重池 + Boss 阶段 + 条件分支 + 召唤机制
- ✅ **地图系统**：DAG 随机生成 + 路线算法 + 节点类型
- ✅ **事件系统**：选牌子流程 + 事件结果计算
- ✅ **商店系统**：卡牌购买 + 移除 + 价格算法
- ✅ **奖励系统**：战斗奖励 + 宝箱开启 + 遗物选择
- ✅ **遗物系统**：遗物效果 + UI 显示 + 集成

### 开发工具系统
- ✅ **测试框架**：自定义测试框架 + 单元测试 + 集成测试
- ✅ **数据驱动**：DataLoader + JSON 配置 + 数据验证
- ✅ **状态管理**：GameState + 场景路由 + 自动加载
- ✅ **特效系统**：VFXManager + 特效创建 + 场景集成

### 代码统计
- **脚本文件**：29+ GDScript 文件
- **测试文件**：18+ 测试脚本
- **技术文档**：14+ 技术文档
- **设计文档**：7+ 设计文档

---

## 🛠️ 开发工具

### Universal Logger 插件

**位置**：`client/slay-demo/addons/universal_logger/`

**功能**：
- 双格式日志输出（控制台 + JSON 文件）
- 模块化日志级别控制
- AI 友好的结构化日志
- 运行时配置热加载

**日志文件**：
- `.godot/game.log` - JSON 格式，AI 可解析
- `.godot/logger_config.yaml` - 日志配置

**使用示例**：
```gdscript
// 在战斗脚本中
ULogger.battle("战斗开始", {"enemies": 3})
ULogger.battle("卡牌打出", {"card": "strike", "cost": 1})

// Agent 读取日志
cat .godot/game.log | jq .
```

---

> 最后更新: 2026-06-01 (包含 Universal Logger 日志系统)
