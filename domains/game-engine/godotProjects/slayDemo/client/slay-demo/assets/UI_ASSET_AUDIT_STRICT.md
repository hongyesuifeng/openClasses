# UI 资源严格还原检查与补充报告

本压缩包基于你提供的 **6 张目标 UI 效果图** 进行重新检查与补充，目标是 **严格围绕这 6 张效果图还原所需 UI 资源**，不再混入与目标图不一致的“浮空岛地图背景”等偏差素材。

## 处理原则

1. 以 6 张目标 UI 效果图为唯一视觉基准。
2. 对现有资源包中与目标图风格不一致的关键资源进行替换。
3. 对现有资源包中缺失、但 6 张效果图明显需要的资源进行补充拆分。
4. 原包中已可复用且风格不冲突的资源保留。

## 本次重点修正

### 已替换的关键背景
- `backgrounds/bg_main_menu.png`
- `backgrounds/bg_map.png`
- `backgrounds/bg_battle_dungeon.png`
- `shop/merchant_portrait.png`

### 已新增的关键拆分资源
- `ui/map/map_node_battle.png`
- `ui/map/map_node_elite.png`
- `ui/map/map_node_event.png`
- `ui/map/map_node_shop.png`
- `ui/map/map_node_rest.png`
- `ui/map/map_node_boss.png`
- `ui/map/map_player_start_marker.png`
- `ui/progress/ui_map_progress_bg.png`
- `ui/progress/ui_map_progress_fill.png`
- `ui/progress/ui_map_progress_star.png`
- `ui/frames/ui_screen_frame.png`
- `ui/panels/ui_enemy_info_panel.png`
- `ui/panels/ui_choice_card_frame.png`
- `card/templates/card_template_common.png`
- `card/templates/card_template_uncommon.png`
- `card/templates/card_template_rare.png`
- `card/templates/card_back.png`
- `card/templates/cost_crystal.png`
- `card/icons/card_icon_attack.png`
- `card/icons/card_icon_defend.png`
- `card/icons/card_icon_skill.png`
- `card/icons/card_icon_buff.png`
- `card/icons/card_icon_power.png`（由技能图标复制，便于占位）
- `card/icons/card_icon_strike.png`（由攻击图标复制，便于占位）
- `card/icons/card_icon_debuff.png`（由 buff 图标复制，便于占位）

## 说明
- `docs/ui_reference_effects/` 中放入了 6 张目标 UI 效果图，便于后续 Coding Agent / 美术继续核对。
- 这次已明确修正之前不合理的 `bg_map.png`：新的 `bg_map.png` 为 **城堡花园/广场纯背景**，不含地图路线与节点。
- 原包中未涉及的复杂动态资源（例如完整敌人序列帧、完整特效序列帧）本次未重做，仍沿用原包内容。

## 建议优先使用的路径
- 主菜单：`backgrounds/bg_main_menu.png`
- 地图/商店/奖励/升级：`backgrounds/bg_map.png`
- 战斗：`backgrounds/bg_battle_dungeon.png`
- 商店立绘：`shop/merchant_portrait.png`
- 地图节点：`ui/map/*.png`
- 地图进度条：`ui/progress/*.png`
- 战斗敌人信息框：`ui/panels/ui_enemy_info_panel.png`
- 奖励/商店选项卡框：`ui/panels/ui_choice_card_frame.png`
- 卡牌：`card/templates/*` 与 `card/icons/*`
