# SlayDemo 项目现状记录

> 记录日期: 2026-06-09（UI Builder 框架 + 单元测试完成）
> 项目路径: domains/game-engine/godotProjects/slayDemo
> 性质: 类《杀戮尖塔》卡牌 Roguelike，Godot 4.x，学习型 MVP Demo

---

## 📊 整体进度

```
策划完成度  ██████████████████████  约 100%
开发完成度  ██████████████████████  约 100%
           V1.0 + V1.5 + UI Builder 框架全部完成
美术完成度  ████████████████████░░  约 90%
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
| M6 视觉打磨 | ✅ | VFX/BGM/SFX + 遗物/状态图标全接线 + 场景切换淡入淡出 |
| M7 日志系统 | ✅ | Universal Logger（双格式输出 + AI 可解析 JSON） |
| P3 内容扩充 | ✅ | 卡牌 55 张 / 遗物 16 个 / 药水 8 种 / 精英 4 个 / Boss 3 个 |
| V1.0 P0 修复 | ✅ | 遗物图标全接线 + 商店确认弹窗 + 升级对比 UI + art_key 修正 |
| V1.5 内容扩充 | ✅ | 毒流/格挡流 +10 张卡（共 65 张基础卡）+ 新手引导 + 结算评价 |
| **UI Builder 框架** | ✅ | **数据驱动 UI 生成框架 + 完整单元测试（132 条断言）** |

---

## 🎯 当前内容规模

| 内容类型 | 数量 | 说明 |
|----------|------|------|
| 卡牌（基础） | 65 张 | 攻击 / 技能 / 能力，含升级版本 |
| 敌人 | 15 种 | 普通 8 / 精英 4 / Boss 3 |
| 遗物 | 16 个 | 图标 16/16 ✅ |
| 药水 | 8 种 | |
| 状态 | 13 种 | 图标 13/13 ✅ |
| 脚本文件 | 33+ 个 | GDScript（不含测试） |
| 测试脚本 | 30 个 | 单元测试 + 集成测试 |

---

## 🧪 测试状态

| 指标 | 数值 |
|------|------|
| 断言数 | **733** |
| 失败数 | **0** |
| 测试脚本 | 30 个 |

### 运行测试（WSL）

```bash
cmd.exe /c "C:\Users\Lenovo\Downloads\Godot_v4.6.2-stable_win64.exe\Godot_v4.6.2-stable_win64_console.exe --headless --path D:\openClass\openClasses\domains\game-engine\godotProjects\slayDemo\client\slay-demo res://tests/test_runner.tscn"
```

---

## 🏗️ UI Builder 框架（2026-06-09 新增）

### 框架位置

```
addons/ui_builder/
├── ui_builder.gd           ← 核心：JSON Spec → 节点树
├── ui_style_resolver.gd    ← 样式解析：style_key → StyleBox/Color
├── ui_asset_loader.gd      ← 资源加载：asset_key → Texture2D
├── ui_action_binder.gd     ← Action 冒泡绑定
├── ui_data_binder.gd       ← 数据绑定（手动刷新模式）
└── base_components/        ← 跨游戏通用组件
    ├── BaseButton.gd
    └── BasePanel.gd

ui_manifest/
├── manifest.assets.json    ← 资源 key → 实际路径
└── manifest.styles.json    ← style_key → 视觉配置

ui_specs/
└── demo.ui.json            ← 框架验证 Demo
```

### 测试覆盖（tests/unit/ui_builder_test.gd）

| 模块 | 断言 |
|------|------|
| UIBuilder 节点构建 | 节点类型、text/action/bind/visible/children |
| Layout Preset（15种） | full_rect/absolute_rect/top_full/bottom_full/left_full/right_full/center/top_left/top_right/top_center/bottom_left/bottom_right/bottom_center/left_center/right_center |
| UIStyleResolver | has_style/get_stylebox/颜色/字号/progress/fallback |
| UIAssetLoader | resolve_path/nine_patch/missing_key |
| UIActionBinder | bind_all 不崩溃/信号连接验证 |
| UIDataBinder | Label/ProgressBar/Button 更新/不匹配路径 |

### 关键设计决策

- **headless 兼容**：框架内部用 `preload` 而非 `class_name` 全局引用，避免 headless 测试时插件未加载导致的编译错误
- **AI 友好**：AI 只改 `ui_specs/*.ui.json` 和 `ui_manifest/`，不碰 `.tscn`
- **语义化样式**：`style_key` 换游戏只改 manifest，Spec 代码零改动

---

> 最后更新: 2026-06-09（UI Builder 框架完成，733 断言通过）
> 下次审查: V2.0 冲刺前
