# 2026-06-02 - M5 存档系统 + 经济曲线 + 随机地图接通

> 范围: `client/slay-demo`
> 目标: 补齐 M5 里程碑（存档）、正式化经济曲线、接通随机地图为默认流程。

---

## 1. 已完成内容

### 1.1 存档系统（M5）

新增 `SaveService`（`scripts/autoload/save_service.gd`）：

- `save(game_state, run_controller, data_loader)` — 序列化全量 run 状态为 JSON，写入 `user://save.json`
- `load_save()` — 读取并反序列化为 Dictionary
- `restore(save_data, ...)` — 将存档数据还原到 GameState / RunController / DataLoader（含 instance_id 计数器续接）
- `delete_save()` — 局结束（胜利/失败）时清档

**自动存档时机**（`run_controller.gd` 中的 `_autosave()`）：
- 战斗胜利后
- 奖励领取完成后
- 商店/休息/宝箱/事件节点完成后

**继续游戏入口**（`main_menu_scene.gd`）：
- `SaveService.has_save()` 为 true 时动态显示"继续游戏"按钮
- 点击调用 `RunController.resume_run()`，恢复上次进度并跳转地图

**存档内容字段：**
```
run_id / next_card_instance_id / player_hp / player_max_hp / player_gold /
energy_per_turn / draw_per_turn / card_removal_count / master_deck /
owned_relic_ids / completed_map_node_ids / available_map_node_ids /
current_map_node_id / pending_map_reward / battle_wins / current_phase
```

涉及文件：
- `scripts/autoload/save_service.gd`（新增）
- `scripts/autoload/run_controller.gd`（新增 `_autosave` / `resume_run`）
- `scripts/scenes/main_menu_scene.gd`（新增"继续游戏"按钮）

### 1.2 经济曲线正式化

**战斗金币楼层加成**（`run_controller.gd` `_grant_battle_gold_reward`）：
- 基础金币来自 encounter 的 `gold_reward.min / max` 随机值
- 楼层加成：`floor_index * 1.5`，后期战斗奖励明显更多

**商店价格楼层加成**（`shop_service.gd` `price_for_card`）：
- 普通卡基础价 55 / 稀有 85 / 史诗 140
- 楼层加成：`floor_index * 3`

**删牌价格递增**（`shop_service.gd` `remove_card_price`）：
- 基础价 75，每次删牌后 +25
- `GameState.card_removal_count` 跨节点持久化

涉及文件：
- `scripts/autoload/run_controller.gd`
- `scripts/shop/shop_service.gd`
- `scripts/autoload/game_state.gd`（`card_removal_count` 字段）

### 1.3 随机地图接通主流程

`RunController` 默认 `use_generated_map = true`，新游戏调用：
```gdscript
run_config = MapGeneratorScript.generate_map(randi(), 9)
```
`data/run_v1.json` 保留为测试回退（`use_generated_map = false` 时使用）。

---

## 2. 测试覆盖

新增测试：

**`tests/unit/save_service_test.gd`**：
- 无存档时 `has_save` 返回 false
- save 后 `has_save` 返回 true
- `load_save` 正确还原 hp / gold / deck_size / run_id
- delete 后 `has_save` 返回 false
- `restore` 正确还原 hp / gold / deck_size
- restore 后 deck 中 instance_id 有效
- restore 后 DataLoader instance 计数器超过最大 id

**`tests/unit/shop_service_test.gd`**：
- 楼层价格加成：floor 8 比 floor 0 贵 24 金币
- 删牌递增：首次 75 / 第二次 100 / 第三次 125
- 购买/移除 + 金币/牌组校验

---

## 3. 当前限制

- 存档只支持单槽（`user://save.json`），无多存档
- `restore` 目前从静态 run_id 加载地图节点，不支持存档随机生成地图节点（随机地图节点需要一并序列化到存档，下一步待做）
- 精英遗物奖励通过 `print` 反馈，无 UI

---

## 4. 建议下一步

1. **精英遗物奖励 UI**：在 `result` 或单独弹层展示玩家获得的遗物，遗物图标资源已存在
2. **存档内嵌地图节点**：将 `map_nodes` 数组也序列化到存档，让随机地图可以正确 restore
3. **商店遗物商品**：扩展 `shop_service.gd` 支持遗物上架
