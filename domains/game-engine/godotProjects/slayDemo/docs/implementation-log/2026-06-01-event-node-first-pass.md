# 2026-06-01 - 事件节点首版实现记录

> 范围: `client/slay-demo`
> 目标: 为 Act 1 静态地图补上首个事件节点能力，验证事件选择、资源变化与返回地图流程。

---

## 1. 已完成内容

### 1.1 事件数据接入

Act 1 地图中新增事件分支:

- 节点: `map_03b`
- 类型: `event`
- 标题: `破损祭坛`
- 三个固定选择:
  - 失去 6 HP，获得 75 金币
  - 失去 4 HP，移除一张 `strike`
  - 获得一张 `cleave`

当前仍采用固定配置，不做随机事件池。

涉及文件:

- `data/run_v1.json`

### 1.2 数据校验

`DataLoader` 已支持 `event` 节点类型，并校验:

- `title`
- `description`
- `choices`
- choice 的 `label`、`description`、`effects`
- event effect 类型:
  - `lose_hp`
  - `gain_gold`
  - `remove_card`
  - `gain_card`
  - `upgrade_card`
- 引用卡牌必须存在。

涉及文件:

- `scripts/autoload/data_loader.gd`

### 1.3 事件结算服务

新增 `EventService`，负责执行事件选择的效果。

当前效果行为:

- `lose_hp`: 扣当前 HP，不低于 `GameState.apply_post_battle_hp` 的限制。
- `gain_gold`: 增加金币。
- `remove_card`: 移除牌组中第一张匹配 `card_id` 的牌。
- `gain_card`: 添加指定卡牌。
- `upgrade_card`: 升级第一张匹配 `card_id` 且未升级的牌。

涉及文件:

- `scripts/event/event_service.gd`

### 1.4 事件场景

新增 `EventScene`:

- 显示事件标题与描述。
- 根据当前地图节点的 `choices` 生成按钮。
- 点击后执行事件效果。
- 显示结算结果。
- 禁用按钮，避免重复选择。
- 约 1 秒后自动完成事件并返回地图。

涉及文件:

- `scenes/event/event_scene.tscn`
- `scripts/scenes/event_scene.gd`
- `scripts/autoload/scene_router.gd`
- `scripts/autoload/run_controller.gd`
- `scripts/scenes/map_scene.gd`

---

## 2. 测试覆盖

新增事件节点集成测试:

- Act 1 地图包含事件分支。
- 事件配置包含 choices。
- 事件可扣 HP、加金币。
- 事件可移除指定卡牌。
- 事件可获得指定卡牌。
- 事件场景能渲染 choice 按钮。
- 选择后会显示结果并禁用按钮。

涉及文件:

- `tests/integration/event_node_test.gd`
- `tests/integration/map_route_test.gd`
- `tests/test_runner.gd`

最近一次总测试:

```text
Assertions: 176
Failures: 0
All tests passed.
```

---

## 3. 当前限制

- 事件池还不是随机抽取。
- 当前只接入一个事件节点。
- 删除卡牌与升级卡牌暂时是自动选择第一张匹配牌，没有独立选牌界面。
- 事件视觉仍是基础按钮与文本，没有插画、动画和音效。

---

## 4. 建议下一步

建议下一步优先做两件事之一:

1. 给事件节点增加选牌型子流程，让 `remove_card` 和 `upgrade_card` 可以由玩家选择目标牌。
2. 进入经济曲线首版，补战斗金币掉落、精英/Boss 奖励差异和商店价格规则。
