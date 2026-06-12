# slayDemo (Cocos Creator 版) - 项目规则

> 《甜心迷宫》— 从 Godot 4.x 迁移到 Cocos Creator 3.8.x 的 Q版卡牌 Roguelike 游戏。

---

## 项目状态

| 里程碑 | 状态 | 说明 |
|-------|------|------|
| M1 骨架 + 数据层 | ✅ | project.json / tsconfig / 数据文件迁移 |
| M2 战斗核心 | ✅ | BattleController / DeckRuntime / EffectRunner / EnemyAI / StatusManager |
| M3 地图与流程 | ✅ | MapGenerator / RunController / 所有 Service 类 / SaveService |
| M4 UI 场景 | ⏳ | 需要在 Cocos Creator 3.8 IDE 中创建 9 个 .scene 文件 |
| M5 音频与打磨 | ⏳ | AudioManager / VFX |

---

## 目录结构

```
cocosProjects/slayDemo/
├── assets/
│   ├── data/            # JSON 数据（从 Godot 直接复制，结构不变）
│   ├── scripts/
│   │   ├── autoload/    # DataLoader / GameState / RunController / SceneRouter / SaveService
│   │   ├── battle/      # BattleController / DeckRuntime / EffectRunner / EnemyAI / StatusManager
│   │   ├── map/         # MapGenerator
│   │   └── services/    # RelicService / RewardService / ShopService / EventService / PotionService / UpgradeService
│   └── scenes/          # 9个 .scene 文件（需在 Cocos Creator IDE 中创建）
├── test/unit/           # Jest 单元测试（45个，全部通过）
├── package.json
├── jest.config.js
└── tsconfig.json
```

---

## 开发规则

### 规则 1: 测试驱动交付（强制）

每次完成功能后必须运行测试通过才算交付：

```bash
cd /mnt/d/openClass/openClasses/domains/game-engine/cocosProjects/slayDemo
npm test
```

**通过标准**：`Tests: N passed, 0 failed`

### 规则 2: Cocos 引擎绑定策略

**核心业务逻辑**（scripts/battle/, scripts/map/, scripts/services/）：
- 不依赖 `cc` 模块，使用纯 TypeScript
- 可以在 Jest 中直接测试

**引擎绑定层**（scripts/autoload/ 中的 Cocos Component 包装）：
- 用 `addPersistRootNode()` 实现跨场景持久化，替代 Godot Autoload
- 单例通过静态 `getInstance()` 获取

**信号系统**：
- 用本地 `EventTarget`（`emit`/`on`/`off`）替代 GDScript 信号和 Cocos `cc.EventTarget`

### 规则 3: 参考来源

Godot 原版在：`/mnt/d/openClass/openClasses/domains/game-engine/godotProjects/slayDemo/`

---

## 关键架构映射

| Godot | Cocos TypeScript |
|-------|-----------------|
| `extends Node` (Autoload) | `static getInstance()` 单例 + `addPersistRootNode` |
| `signal combat_event(...)` | `this.emit('combat_event', ...)` / `this.on(...)` |
| `get_node_or_null("/root/X")` | `GameState.getInstance()` |
| `scene_router.go_to("battle")` | `director.loadScene('BattleScene')` |
| `FileAccess` 存档 | `localStorage` |

---

## M4 下一步：创建 UI 场景

打开 Cocos Creator 3.8，导入本目录，在 `assets/scenes/` 下创建以下场景并挂载对应组件：

| 场景文件 | 挂载脚本 |
|---------|---------|
| MainMenuScene.scene | scripts/ui/MainMenuScene.ts |
| MapScene.scene | scripts/ui/MapScene.ts |
| BattleScene.scene | scripts/ui/BattleScene.ts |
| RewardScene.scene | scripts/ui/RewardScene.ts |
| RestScene.scene | scripts/ui/RestScene.ts |
| ShopScene.scene | scripts/ui/ShopScene.ts |
| ChestScene.scene | scripts/ui/ChestScene.ts |
| EventScene.scene | scripts/ui/EventScene.ts |
| ResultScene.scene | scripts/ui/ResultScene.ts |

参考 UI 规范：`godotProjects/slayDemo/client/slay-demo/ui_design_specs/*.visual.json`
参考 Mock 数据：`godotProjects/slayDemo/client/slay-demo/ui_mock_data/*.mock.json`
