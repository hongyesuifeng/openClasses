# slayDemo - 项目开发规则

> 类《杀戮尖塔》卡牌 Roguelike 游戏，使用 Godot 4.x 开发。

---

## 🚨 核心开发规则

### 规则 1: 测试驱动交付（强制）

**每次完成功能或模块开发后，必须运行单元测试，所有测试通过后才算交付完成。**

#### 工作流

```
开发新功能 → 编写/更新测试 → 运行测试 → 全部通过 → 提交代码
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
cmd.exe /c "C:\Users\Lenovo\Downloads\Godot_v4.6.2-stable_win64.exe --headless --path D:\openClass\openClasses\domains\game-engine\godotProjects\slayDemo\client\slay-demo res://tests/test_runner.tscn"
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
│   ├── data/                 # JSON 数据文件
│   ├── scripts/              # GDScript 代码
│   │   ├── autoload/         # 全局单例
│   │   ├── battle/           # 战斗系统
│   │   ├── scenes/           # 场景脚本
│   │   ├── ui/               # UI 组件
│   │   ├── vfx/              # 特效系统
│   │   ├── event/            # 事件系统
│   │   ├── relic/            # 遗物系统
│   │   └── map/              # 地图系统
│   ├── scenes/               # .tscn 场景文件
│   ├── tests/                # 测试目录
│   │   ├── unit/             # 单元测试
│   │   └── integration/      # 集成测试
│   └── assets/               # 资源文件
├── docs/                     # 设计与技术文档
│   ├── design/               # 游戏设计文档
│   ├── tech/                 # 技术实现文档
│   ├── art/                  # 美术风格文档
│   └── implementation-log/   # 实现日志
└── CLAUDE.md                 # 本文件
```

---

## 🎯 当前里程碑进度

| 里程碑 | 状态 |
|--------|------|
| M1 项目骨架 | ✅ |
| M2 数据层 | ✅ |
| M3 战斗闭环 | ✅ |
| M4 地图与流程 | ✅ |
| M5 存档系统 | ❌ 待实现 |
| M6 视觉打磨 | ⏳ 进行中 |

---

## 🔧 开发约定

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

- ✅ 战斗状态机 + 卡牌效果引擎
- ✅ 敌人 AI（权重池/Boss阶段/条件分支/召唤）
- ✅ 地图系统（DAG 随机生成）
- ✅ 事件系统（选牌子流程）
- ✅ 经济系统（战斗金币掉落 + 楼层加成）
- ✅ 遗物系统
- ✅ 战斗动画（VFXManager）

---

> 最后更新: 2026-06-01
