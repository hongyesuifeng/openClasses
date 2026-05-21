# 美术实施时间线

> 适用项目：SlayDemo — 类《杀戮尖塔》卡牌 Roguelike Demo
> 文档版本：v1.0

---

## 一、项目阶段与美术对齐

本项目开发分为 6 个阶段，美术工作紧密对齐：

| 项目阶段 | 主要开发内容 | 美术交付重点 |
|----------|-------------|-------------|
| 阶段 1：项目启动 | 项目搭建、核心架构 | 美术方向确定、资源目录创建 |
| 阶段 2：最小闭环 | 单张卡牌 vs 单个敌人可打一回合 | 最小可用视觉（占位美术 + 基础特效） |
| 阶段 3：数据层 | 卡牌系统、敌人数据、奖励系统 | 资源规范确立、批量资源导入 |
| 阶段 4：UI 与地图 | 战斗 UI、地图界面、奖励界面 | 完整 UI 美术、界面动效 |
| 阶段 5：调试发布 | 平衡调整、Bug 修复、打磨 | 最终润色、特效完善 |
| 阶段 6：扩展（可选） | 新内容、优化 | 高级美术效果 |

---

## 二、阶段 1：项目启动（第 1-2 天）

### 美术目标

确定美术方向，建立资源管理基础设施。

### 交付物

| 交付物 | 说明 | 时间 |
|--------|------|------|
| 美术方向文档 | 01-art-direction.md | 已完成 |
| 资源清单文档 | 02-resource-inventory.md | 已完成 |
| 免费资源指南 | 03-free-resource-guide.md | 已完成 |
| 卡牌模板文档 | 04-card-art-template.md | 已完成 |
| 角色设计文档 | 05-character-design.md | 已完成 |
| UI 设计文档 | 06-ui-design-guide.md | 已完成 |
| 特效文档 | 07-vfx-and-animation.md | 已完成 |
| 本文档 | 08-implementation-timeline.md | 已完成 |

### 目录结构创建

```
slayDemo/
├── assets/
│   ├── card/
│   │   ├── templates/       # 卡牌模板
│   │   ├── icons/           # 卡牌中心图标（25-30个）
│   │   └── frames/          # 卡牌边框（按稀有度）
│   ├── enemies/
│   │   ├── slime/
│   │   ├── skeleton/
│   │   ├── mushroom/
│   │   ├── bat/
│   │   ├── gargoyle/
│   │   ├── shadow_mage/
│   │   ├── corrupted_knight/
│   │   └── ancient_dragon/
│   ├── player/
│   │   ├── sprites/
│   │   └── portrait/
│   ├── ui/
│   │   ├── buttons/
│   │   ├── panels/
│   │   ├── bars/
│   │   ├── icons/
│   │   └── intents/
│   ├── backgrounds/
│   │   ├── battle_dungeon.png
│   │   ├── battle_cave.png
│   │   ├── battle_boss.png
│   │   ├── main_menu.png
│   │   └── map.png
│   ├── vfx/
│   │   ├── particles/
│   │   └── effects/
│   ├── fonts/
│   │   ├── ChakraPetch-Bold.ttf
│   │   ├── ChakraPetch-Regular.ttf
│   │   ├── Roboto-Bold.ttf
│   │   └── NotoSansSC-Bold.ttf
│   └── LICENSES.txt          # 资源授权记录
├── resources/
│   ├── ui_theme.tres         # Godot 全局 UI Theme
│   └── color_tokens.tres     # 色彩常量
└── scenes/
    └── components/
        ├── Card.tscn         # 卡牌模板场景
        ├── EnemyUnit.tscn    # 敌人显示组件
        └── DamageNumber.tscn # 伤害数字组件
```

### 本阶段美术工时

**约 2-3 小时**（文档编写 + 目录创建 + 初始资源搜索）

---

## 三、阶段 2：最小闭环（第 3-7 天）

### 美术目标

实现"能打一回合"的最小视觉效果。使用占位美术即可，重点是**功能可用**。

### 交付物

| 交付物 | 规格要求 | 优先级 | 时间 |
|--------|----------|--------|------|
| 卡牌占位模板 | 最简版：色块 + 文字，无图标 | P0 | 1h |
| 1 张攻击卡牌数据 | CardData .tres | P0 | 10min |
| 1 张防御卡牌数据 | CardData .tres | P0 | 10min |
| 史莱姆静态图 | 96x96px，最简几何体 | P0 | 30min |
| 玩家静态图 | 128x128px，最简剪影 | P0 | 30min |
| 纯色战斗背景 | 深蓝渐变，1920x1080 | P0 | 15min |
| HP 条（代码） | ProgressBar + StyleBoxFlat | P0 | 30min |
| 能量显示（代码） | Label + 简单底板 | P0 | 15min |
| 基础伤害数字 | Label + Tween 上浮淡出 | P0 | 30min |
| 受击闪白 | modulate 闪白代码 | P0 | 15min |
| 结束回合按钮 | Button + Theme | P0 | 15min |

### 阶段 2 最小美术时间

**约 3-4 小时**

### 验收标准

- [ ] 玩家能看到自己的角色和敌人
- [ ] 手牌中能看到 2 张卡牌的文字信息
- [ ] 能点击卡牌打出
- [ ] 打出后能看到伤害数字弹出
- [ ] 敌人 HP 条会减少
- [ ] 敌人回合能攻击玩家
- [ ] 玩家 HP 条会减少
- [ ] 整个流程视觉上不会令人困惑

> **本阶段不追求好看，只追求可理解。**

---

## 四、阶段 3：数据层（第 8-14 天）

### 美术目标

确立资源规范，批量导入和组织美术资源，替换占位美术。

### 交付物

#### 第 1 批：卡牌资源

| 交付物 | 数量 | 时间 | 说明 |
|--------|------|------|------|
| 卡牌正式模板场景 | 1 | 2h | 含边框、分区、BBCode 描述 |
| 卡牌中心图标 | 25-30 | 2-3h | 从 Game-Icons.net 批量下载 |
| CardData .tres 文件 | 25-30 | 2-3h | 数据录入 |
| 卡牌背面 | 1 | 30min | 简单图案 |

#### 第 2 批：角色资源

| 交付物 | 数量 | 时间 | 说明 |
|--------|------|------|------|
| 玩家角色正式图 | 1 | 1h | 替换占位版 |
| 敌人正式图 | 8 | 3-4h | 可用免费精灵图或自制 |
| 敌人意图图标 | 4 | 30min | 从 Game-Icons.net 获取 |
| 玩家肖像 | 1 | 30min | HP 条旁小头像 |

#### 第 3 批：UI 资源

| 交付物 | 数量 | 时间 | 说明 |
|--------|------|------|------|
| 按钮样式（四态） | 1 套 | 30min | 用 StyleBoxFlat 实现 |
| 面板背景 | 2 | 30min | 九宫格或 StyleBoxFlat |
| HP 条样式 | 1 套 | 30min | 红色/蓝色 |
| 状态效果图标 | 8-10 | 1h | 从 Game-Icons.net 获取 |
| 金币图标 | 1 | 10min | — |

#### 第 4 批：背景资源

| 交付物 | 数量 | 时间 | 说明 |
|--------|------|------|------|
| 地牢战斗背景 | 1 | 1h | 免费资源或自制渐变 |
| Boss 战斗背景 | 1 | 1h | 氛围更暗更紧张 |

#### 资源规范

| 交付物 | 说明 |
|--------|------|
| 命名规范确认 | 所有资源按 `类别_子类_名称_变体` 命名 |
| 授权记录 | LICENSES.txt 填写所有第三方资源 |
| Godot 导入设置 | 所有 PNG 设置正确的过滤模式 |

### 阶段 3 美术工时

**约 15-20 小时**（含资源搜索、下载、调整、导入、测试）

---

## 五、阶段 4：UI 与地图（第 15-21 天）

### 美术目标

完善所有界面美术，实现界面动效，地图节点视觉。

### 交付物

| 交付物 | 规格 | 时间 | 说明 |
|--------|------|------|------|
| 完整 Godot Theme | .tres 文件 | 2h | 统一按钮、标签、面板样式 |
| 主菜单界面美术 | 1920x1080 | 2h | 背景暗化 + 标题排版 + 按钮布局 |
| 战斗 UI 完善版 | — | 3h | 能量水晶、手牌区背景、牌堆图标 |
| 地图节点图标 | 6个, 32x32px | 1h | 战斗/精英/Boss/商店/休息/事件 |
| 地图背景 | 1920x1080 | 1h | 羊皮纸或暗色纹理 |
| 奖励选择弹窗 | 800x500px | 1.5h | 半透明遮罩 + 卡牌选择框 |
| 通用弹窗模板 | 三种尺寸 | 1h | 小/中/大弹窗 |
| 界面过渡动画 | — | 1.5h | 淡入淡出、弹窗出现/消失 |
| 地图节点动画 | — | 1h | 当前节点脉动、已走过变暗 |
| UI 音效配合 | — | 1h | 按钮点击、弹窗开关（配合音频） |

### 阶段 4 美术工时

**约 15 小时**

---

## 六、阶段 5：调试发布（第 22-28 天）

### 美术目标

打磨视觉细节，完善特效，修复美术 Bug。

### 交付物

| 交付物 | 规格 | 时间 | 说明 |
|--------|------|------|------|
| 粒子特效完善 | GPUParticles2D | 3h | 命中闪光、中毒泡泡、护盾光效 |
| 屏幕震动优化 | Camera2D | 1h | 调整不同攻击的震动参数 |
| Hit Stop 实现 | get_tree().paused | 30min | 命中停顿，增加打击感 |
| 卡牌动画优化 | Tween | 2h | 抽牌/弃牌/打出动画打磨 |
| 死亡动画 | Tween + 粒子 | 1h | 敌人倒下效果 |
| 稀有卡牌光效 | Shader/动画 | 1h | 蓝色发光脉动 |
| 色彩一致性检查 | 全局 | 1h | 确保所有界面配色统一 |
| 字体显示检查 | 全局 | 1h | 确保所有文字清晰可读 |
| 分辨率适配测试 | 1920x1080/2560x1440 | 1h | 多分辨率测试 |
| 截图和视频素材 | PNG/GIF | 1h | README 和展示用 |

### 阶段 5 美术工时

**约 12 小时**

---

## 七、总工时汇总

| 阶段 | 内容 | 工时 | 累计 |
|------|------|------|------|
| 阶段 1 | 文档 + 基础设施 | 3h | 3h |
| 阶段 2 | 最小闭环美术 | 4h | 7h |
| 阶段 3 | 数据层资源批量导入 | 18h | 25h |
| 阶段 4 | UI 界面完善 | 15h | 40h |
| 阶段 5 | 打磨润色 | 12h | 52h |

### 优化方案

| 场景 | 总工时 | 说明 |
|------|--------|------|
| **推荐方案** | **30-35h** | 大量使用免费资源 + 模板化生产，省去手绘 |
| 极简方案 | 15-20h | 全部用占位色块 + 代码动画，仅做 P0 |
| 完整方案 | 50-60h | 自制部分美术 + 完整特效 + Shader |

---

## 八、美术资产命名和目录规范

### 8.1 文件命名规则

```
{类别}_{子类}_{名称}_{变体/状态}.{扩展名}
```

#### 类别前缀

| 前缀 | 含义 | 示例 |
|------|------|------|
| `card_` | 卡牌 | `card_icon_slash.png`, `card_frame_rare.png` |
| `enemy_` | 敌人 | `enemy_slime_idle.png`, `enemy_dragon_atk_01.png` |
| `player_` | 玩家 | `player_warrior_idle.png`, `player_portrait.png` |
| `ui_` | UI 元素 | `ui_btn_normal.png`, `ui_panel_dark.png` |
| `bg_` | 背景 | `bg_battle_dungeon.png`, `bg_map.png` |
| `icon_` | 图标 | `icon_status_poison.png`, `icon_node_battle.png` |
| `vfx_` | 特效 | `vfx_particle_spark.png`, `vfx_hit_flash.tscn` |
| `font_` | 字体 | `font_chakra_bold.ttf` |

#### 变体后缀

| 后缀 | 含义 | 示例 |
|------|------|------|
| `_idle` | 待机动画帧 | `enemy_slime_idle.png` |
| `_atk` | 攻击动画帧 | `enemy_slime_atk_01.png` |
| `_hit` | 受击 | `enemy_slime_hit.png` |
| `_death` | 死亡动画帧 | `enemy_slime_death_01.png` |
| `_normal` | 按钮正常态 | `ui_btn_normal.png` |
| `_hover` | 按钮悬停态 | `ui_btn_hover.png` |
| `_pressed` | 按钮按下态 | `ui_btn_pressed.png` |
| `_disabled` | 按钮禁用态 | `ui_btn_disabled.png` |
| `_common` | 普通稀有度 | `card_frame_common.png` |
| `_rare` | 稀有稀有度 | `card_frame_rare.png` |

### 8.2 Godot 资源命名

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 场景 (.tscn) | PascalCase | `CardScene.tscn`, `BattleUI.tscn` |
| 脚本 (.gd) | snake_case | `card_data.gd`, `screen_shake.gd` |
| 资源 (.tres) | snake_case | `ui_theme.tres`, `warrior_data.tres` |
| Shader (.gdshader) | snake_case | `card_glow.gdshader` |

### 8.3 目录规范

```
assets/
├── card/                      # 卡牌美术
│   ├── templates/             # 卡牌模板场景
│   ├── icons/                 # 卡牌中心图标（25-30个PNG）
│   └── frames/                # 卡牌边框（按稀有度）
│       ├── card_frame_common.png
│       ├── card_frame_uncommon.png
│       ├── card_frame_rare.png
│       └── card_frame_curse.png
│
├── enemies/                   # 敌人美术（按敌人分目录）
│   ├── slime/
│   │   └── enemy_slime_idle.png
│   ├── skeleton/
│   │   └── enemy_skeleton_idle.png
│   └── ...
│
├── player/                    # 玩家角色美术
│   └── player_warrior_idle.png
│
├── ui/                        # UI 美术
│   ├── buttons/               # 按钮素材
│   ├── panels/                # 面板背景
│   ├── bars/                  # HP/能量条
│   ├── icons/                 # UI 图标
│   │   ├── icon_gold.png
│   │   ├── icon_settings.png
│   │   └── ...
│   ├── intents/               # 敌人意图图标
│   │   ├── icon_intent_attack.png
│   │   ├── icon_intent_defend.png
│   │   └── ...
│   └── nodes/                 # 地图节点图标
│       ├── icon_node_battle.png
│       ├── icon_node_elite.png
│       └── ...
│
├── backgrounds/               # 场景背景
│   ├── bg_battle_dungeon.png
│   ├── bg_battle_cave.png
│   ├── bg_battle_boss.png
│   ├── bg_main_menu.png
│   └── bg_map.png
│
├── vfx/                       # 特效资源
│   ├── particles/             # 粒子纹理
│   │   ├── vfx_particle_spark.png
│   │   ├── vfx_particle_fire.png
│   │   └── ...
│   └── effects/               # 特效场景
│       ├── vfx_hit_flash.tscn
│       └── vfx_damage_number.tscn
│
├── fonts/                     # 字体
│   ├── font_chakra_bold.ttf
│   ├── font_chakra_regular.ttf
│   ├── font_roboto_bold.ttf
│   └── font_notosanssc_bold.ttf
│
└── LICENSES.txt               # 第三方资源授权记录
```

### 8.4 Godot 导入设置

对于所有 PNG 资源，建议统一设置：

```
[resource]
texture/import_mode = 0        # 导入为纹理
texture/filtering = 0          # 关闭过滤（像素风）或 1（平滑）
texture/compress = 0           # 无压缩（小项目不需要）
```

> 如果使用扁平/矢量风格而非像素风，建议开启纹理过滤（filtering = 1）以获得平滑边缘。

---

## 九、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 找不到合适的免费敌人精灵图 | 延迟阶段 3 | 用几何形状自制，30 分钟一个 |
| 美术风格不统一 | 视觉混乱 | 严格遵循色彩方案和三个一致原则 |
| 在美术上花太多时间 | 项目延期 | 设定每阶段美术时间上限，到时切换到占位版 |
| 免费资源授权不明确 | 法律风险 | 只使用 CC0 或确认过授权的资源 |
| 中文字体文件太大 | 包体积大 | 使用字体子集化，只包含游戏使用的字符 |
| 多分辨率显示异常 | UI 错位 | 基准 1920x1080 设计，使用 anchor + container |

---

## 十、总结：美术工作优先级排序

```
必须做（P0，约 15-20h）：
  1. 卡牌模板 + 数据驱动（让卡牌能显示）
  2. 基础角色图（玩家 + 2-3 个敌人）
  3. 战斗 UI（HP 条、能量、手牌区、结束回合按钮）
  4. 伤害数字和受击反馈
  5. 1-2 张战斗背景

应该做（P1，约 10-15h）：
  6. 全部卡牌图标
  7. 全部敌人图
  8. 完整 UI Theme
  9. 地图节点图标和布局
  10. 奖励/弹窗界面
  11. 状态效果图标
  12. 基础粒子特效

可以做（P2，约 5-10h）：
  13. 稀有卡牌发光效果
  14. 角色帧动画
  15. 高级 Shader 效果
  16. 界面过渡动画
  17. 更多背景变体
```

**核心原则：信息传达 > 视觉美化。只要玩家能理解当前发生了什么，美术就是合格的。**
