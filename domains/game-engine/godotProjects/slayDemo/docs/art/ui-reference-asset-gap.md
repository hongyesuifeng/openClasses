# UI Reference Asset Gap

> 更新时间：2026-06-10  
> 已替换资源包：`C:\Users\Lenovo\Downloads\slaydemo_ui_assets_strict_effect_based.zip`

## 替换结果

资源包已解压覆盖到：

`client/slay-demo/assets/`

当前资源目录统计：

| 类型 | 数量 |
| --- | ---: |
| PNG | 344 |
| TTF | 3 |

## 运行时缺失扫描

已扫描 `client/slay-demo` 内 `.gd`、`.json`、`.tscn`、`.tres`、`.cfg` 中的 `res://assets/...` 引用。

| 项目 | 结果 |
| --- | --- |
| 资源引用总数 | 139 |
| 真实缺失文件 | 0 |

结论：当前代码和 manifest 实际引用到的美术资源都已经存在。

## 已完成映射

| 需求 | 当前使用路径 | 说明 |
| --- | --- | --- |
| 主菜单/地图/战斗背景 | `assets/backgrounds/*.png` | 新包已覆盖 |
| 商人立绘 | `assets/shop/merchant_portrait.png` | 新包已覆盖 |
| 按钮九宫格 | `assets/ui/buttons/*.png` | 新包已覆盖 |
| 面板九宫格 | `assets/ui/panels/ui_panel_dark.png`、`ui_panel_light.png` | 新包已覆盖 |
| 战斗 HP/格挡条 | `assets/ui/bars/*.png` | 新包已覆盖 |
| 卡牌模板与图标 | `assets/card/templates/*.png`、`assets/card/icons/*.png` | 新包已覆盖 |
| 玩家头像/待机/受击 | `assets/player/portrait/*`、`assets/player/sprites/*` | 新包已覆盖 |
| 地图节点 | `assets/ui/map/map_node_*.png` | 已更新 `map_scene.gd` 使用新包命名 |
| 金币图标 | `assets/ui/icons/icon_shop.png` | `manifest.assets.json` 中 `icons.gold` 已映射到该文件 |
| 水晶图标 | `assets/ui/icons/ui_energy_crystal.png` | `manifest.assets.json` 中 `icons.crystal` 已映射到该文件 |

## 仍可选生成/接入的资源

这些不是当前运行时缺失项，但如果要进一步贴近 6 张效果图，可以继续生成或接入：

| 建议资源 | 当前状态 | 建议 |
| --- | --- | --- |
| 独立主标题 Logo：`assets/ui/title/title_sweet_maze.png` | 新包未提供，代码当前用文字 Label | 如果希望主菜单标题完全像效果图泡泡字，可生成透明 PNG 并改 `main_menu.ui.json` 用 `TextureRect` |
| 副标题缎带：`assets/ui/title/subtitle_ribbon.png` | 新包未提供，当前用 `Panel + Label` | 可选，生成后替换副标题背景 |
| 全屏边框接入：`assets/ui/frames/ui_screen_frame.png` | 新包已提供，但当前多数 spec 仍用 `Panel` 边框 | 可将 `ScreenFrame` 节点改为 `TextureRect` 使用该资源 |
| 地图进度条：`assets/ui/progress/ui_map_progress_*.png` | 新包已提供，但当前地图进度条还未接入 | 若要还原地图底部进度条，可在 `map.ui.json` 和 `map_scene.gd` 增加显示 |
| 敌人信息框：`assets/ui/panels/ui_enemy_info_panel.png` | 新包已提供，但战斗敌人面板仍走代码样式 | 可在 `battle_scene.gd` 中替换敌人 Button 面板样式 |
| 选项卡框：`assets/ui/panels/ui_choice_card_frame.png` | 新包已提供，事件/商店目前用代码浅色样式 | 可在 `UIStyleFactory.make_choice_panel_style()` 接入贴图样式 |

## 注意

`assets/UI_ASSET_AUDIT_STRICT.md` 是资源包自带审计说明，保留在项目资源目录内，后续可用于核对 6 张目标效果图。
