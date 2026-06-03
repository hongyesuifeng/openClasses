# slayDemo 美术资源优化包

> 打包日期: 2026-06-04  
> 用途: 供 AI Agent 进行美术资源优化

---

## 📁 目录结构

```
slaydemo_assets_optimize/
├── README.txt (本文件)
├── intents/        # 意图图标 (6个) - 需要升级 32×32 → 48×48
├── status/         # 状态图标 (8个) - 需要升级 32×32 → 40×40
├── templates/      # 卡牌模板 (5个) - 需要转 RGB→RGBA
├── player_portrait.png  # 玩家头像 - 需要升级 64×64 → 96×96
├── icon_draw_pile.png   # 抽牌堆图标 - 需要升级 32×32 → 40×40
├── icon_discard_pile.png # 弃牌堆图标 - 需要升级 32×32 → 40×40
├── bars/           # 血条/能量条 (3个) - 需要高分辨率版本
├── buttons/        # 按钮资源 (4个) - 需要转 colormap→RGBA
└── panels/         # 面板资源 (2个) - 需要转 colormap→RGBA
```

---

## 🎯 优化任务清单

### P0 - 立即执行（高优先级）

#### 1. 意图图标升级 (6个文件)

**目录**: `intents/`

| 文件 | 当前 | 目标 |
|------|------|------|
| intent_sword.png | 32×32 | 48×48 |
| intent_shield.png | 32×32 | 48×48 |
| intent_buff.png | 32×32 | 48×48 |
| intent_debuff.png | 32×32 | 48×48 |
| intent_stun.png | 32×32 | 48×48 |
| intent_question.png | 32×32 | 48×48 |

**优化指令**: 将所有意图图标从 32×32 升级至 48×48，保持原风格。

---

#### 2. 状态图标升级 (8个文件)

**目录**: `status/`

| 文件 | 当前 | 目标 |
|------|------|------|
| status_strength.png | 32×32 | 40×40 |
| status_dexterity.png | 32×32 | 40×40 |
| status_vulnerable.png | 32×32 | 40×40 |
| status_weak.png | 32×32 | 40×40 |
| status_poison.png | 32×32 | 40×40 |
| status_thorns.png | 32×32 | 40×40 |
| status_regeneration.png | 32×32 | 40×40 |
| status_fortify.png | 32×32 | 40×40 |

**优化指令**: 将所有状态图标从 32×32 升级至 40×40，保持原风格。

---

#### 3. 卡牌模板转 RGBA (5个文件)

**目录**: `templates/`

| 文件 | 当前格式 | 目标格式 |
|------|---------|---------|
| card_template_common.png | RGB | RGBA |
| card_template_uncommon.png | RGB | RGBA |
| card_template_rare.png | RGB | RGBA |
| card_template_legendary.png | RGB | RGBA |
| card_back.png | RGB | RGBA |

**优化指令**: 将所有卡牌模板从 RGB 格式转换为 RGBA 格式，添加 Alpha 通道。

---

#### 4. 玩家头像升级 (1个文件)

**文件**: `player_portrait.png`

| 属性 | 当前 | 目标 |
|------|------|------|
| 尺寸 | 64×64 | 96×96 |
| 格式 | RGBA | RGBA |

**优化指令**: 将玩家头像从 64×64 升级至 96×96，保持原风格和角色特征。

---

### P1 - 第一批（中优先级）

#### 5. 牌堆图标升级 (2个文件)

**文件**: `icon_draw_pile.png`, `icon_discard_pile.png`

| 属性 | 当前 | 目标 |
|------|------|------|
| 尺寸 | 32×32 | 40×40 |

**优化指令**: 将牌堆图标从 32×32 升级至 40×40。

---

#### 6. 血条高分辨率 (3个文件)

**目录**: `bars/`

| 文件 | 当前 | 目标 |
|------|------|------|
| ui_hp_bar_bg.png | 256×24 | 512×48 |
| ui_hp_bar_fill.png | 256×24 | 512×48 |
| ui_block_bar_fill.png | 256×24 | 512×48 |

**优化指令**: 创建高分辨率版本，保持原渐变色和样式。

---

#### 7. 按钮/面板转 RGBA (6个文件)

**目录**: `buttons/` 和 `panels/`

**buttons/** (4个文件):
- ui_btn_normal.png
- ui_btn_hover.png
- ui_btn_pressed.png
- ui_btn_disabled.png

**panels/** (2个文件):
- ui_panel_dark.png
- ui_panel_light.png

**优化指令**: 将所有文件从 8-bit colormap 转换为 RGBA 格式。

---

## 📊 优化统计

| 优先级 | 任务数 | 文件数 |
|--------|--------|--------|
| P0 | 4 | 20 |
| P1 | 3 | 11 |
| **总计** | **7** | **31** |

---

## 🔧 优化后处理

优化完成后，将文件放回原位置：

```
client/slay-demo/assets/
├── ui/intents/     → 意图图标
├── ui/status/      → 状态图标
├── ui/bars/        → 血条
├── ui/buttons/     → 按钮
├── ui/panels/      → 面板
├── ui/icons/       → 牌堆图标
├── card/templates/ → 卡牌模板
└── player/portrait/ → 玩家头像
```

---

## 🤖 AI Agent 使用提示

### 批量处理示例

**意图图标升级**:
```
对 intents/ 目录下所有 png 文件：
1. 读取文件
2. 从 32×32 升级至 48×48
3. 保持 RGBA 格式
4. 保持原风格和颜色
5. 保存为同名文件
```

**卡牌模板转 RGBA**:
```
对 templates/ 目录下所有 png 文件：
1. 读取文件
2. 添加 Alpha 通道（如果缺失）
3. 确保输出为 RGBA 格式
4. 保持原颜色和样式
5. 保存为同名文件
```

---

> 详细说明请参考项目文档: docs/art/12-art-resource-issues.md
