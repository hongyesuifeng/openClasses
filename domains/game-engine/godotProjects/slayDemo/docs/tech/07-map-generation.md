# 07 - 地图生成技术方案

## 1. 地图数据结构

### 1.1 整体结构

地图采用有向无环图（DAG）结构。每层有若干节点，节点之间有连线表示可达路径。玩家从底层出发，逐层向上选择路径。

```
        [Boss]
          │
     ┌────┼────┐
     ▼    ▼    ▼
   [??]  [💰]  [⚔]
     │    │    │
     └─┬──┘    │
       ▼       │
      [⚔]──────┘
       │
     ┌─┴─┐
     ▼   ▼
   [💰] [⚙]
     │   │
     └─┬─┘
       ▼
     [🏕]  ← 起点
```

### 1.2 MapNodeData 定义

```gdscript
# scripts/map/map_node_data.gd
extends Resource
class_name MapNodeData

@export var node_id: int = -1                   # 唯一编号
@export var floor: int = 0                      # 所在层（0=起点）
@export var column: int = 0                     # 列位置（用于横向排列）
@export var room_type: RoomType = RoomType.NORMAL
@export var connections: Array[int] = []         # 连接的下一层节点ID列表
@export var position: Vector2 = Vector2.ZERO     # UI 显示位置（世界坐标）
```

### 1.3 RoomType 枚举

```gdscript
enum RoomType {
    START,          # 起始房间
    NORMAL,         # 普通战斗
    ELITE,          # 精英战斗
    REST,           # 休息点（篝火）
    SHOP,           # 商店（Demo 可选）
    EVENT,          # 事件房间（Demo 可选）
    TREASURE,       # 宝箱房间
    BOSS,           # Boss 房间
}
```

### 1.4 MapData 定义

```gdscript
# scripts/map/map_data.gd
extends Resource
class_name MapData

@export var floors: int = 15                     # 总层数
@export var nodes: Array[MapNodeData] = []       # 所有节点
@export var boss_floor: int = 15                 # Boss 所在层

var _node_index: Dictionary = {}  # int(node_id) -> MapNodeData


func build_index() -> void:
    _node_index.clear()
    for node: MapNodeData in nodes:
        _node_index[node.node_id] = node


func get_node_by_id(node_id: int) -> MapNodeData:
    return _node_index.get(node_id)


func get_nodes_on_floor(floor: int) -> Array[MapNodeData]:
    var result: Array[MapNodeData] = []
    for node: MapNodeData in nodes:
        if node.floor == floor:
            result.append(node)
    return result


func get_start_node() -> MapNodeData:
    for node: MapNodeData in nodes:
        if node.room_type == RoomType.START:
            return node
    return null


func get_boss_node() -> MapNodeData:
    for node: MapNodeData in nodes:
        if node.room_type == RoomType.BOSS:
            return node
    return null
```

## 2. 地图生成算法

### 2.1 MapGenerator

```gdscript
# scripts/map/map_generator.gd
extends RefCounted

const MIN_NODES_PER_FLOOR: int = 3
const MAX_NODES_PER_FLOOR: int = 5
const TOTAL_FLOORS: int = 15
const BOSS_FLOOR: int = 15
const MIN_CONNECTIONS: int = 1
const MAX_CONNECTIONS: int = 3

var _rng: RandomNumberGenerator


func _init(seed_value: int = -1) -> void:
    _rng = RandomNumberGenerator.new()
    if seed_value >= 0:
        _rng.seed = seed_value
    else:
        _rng.randomize()
```

### 2.2 生成主流程

```gdscript
## 生成完整地图
func generate() -> MapData:
    var map := MapData.new()
    map.floors = TOTAL_FLOORS
    map.boss_floor = BOSS_FLOOR

    var next_id := 0

    # 1. 创建起始节点
    var start_node := MapNodeData.new()
    start_node.node_id = next_id
    start_node.floor = 0
    start_node.room_type = RoomType.START
    map.nodes.append(start_node)
    next_id += 1

    # 2. 生成中间层节点
    var prev_floor_nodes: Array[int] = [0]  # 起始节点ID

    for floor_num in range(1, BOSS_FLOOR):
        var node_count := _rng.randi_range(MIN_NODES_PER_FLOOR, MAX_NODES_PER_FLOOR)
        var current_floor_nodes: Array[int] = []

        for col in range(node_count):
            var node := MapNodeData.new()
            node.node_id = next_id
            node.floor = floor_num
            node.column = col
            node.room_type = _random_room_type(floor_num)
            map.nodes.append(node)
            current_floor_nodes.append(next_id)
            next_id += 1

        # 连接上下层
        _connect_layers(prev_floor_nodes, current_floor_nodes, map)

        prev_floor_nodes = current_floor_nodes

    # 3. 创建 Boss 节点
    var boss_node := MapNodeData.new()
    boss_node.node_id = next_id
    boss_node.floor = BOSS_FLOOR
    boss_node.room_type = RoomType.BOSS
    map.nodes.append(boss_node)

    # Boss 连接到上一层所有节点
    for prev_id in prev_floor_nodes:
        var prev_node: MapNodeData = map.get_node_by_id(prev_id)
        if prev_node:
            prev_node.connections.append(next_id)

    # 4. 构建索引
    map.build_index()

    # 5. 计算节点显示位置
    _calculate_positions(map)

    return map
```

### 2.3 层间连接算法

```gdscript
## 将上一层的节点连接到当前层
func _connect_layers(
    upper_nodes: Array[int],   # 上一层节点ID列表
    lower_nodes: Array[int],   # 当前层节点ID列表
    map: MapData
) -> void:
    # 规则1: 每个下层节点至少被一个上层节点连接
    # 规则2: 每个上层节点至少连接一个下层节点
    # 规则3: 连线不能交叉（列位置相近的优先连接）

    # 第一步：确保每个下层节点至少有一个入边
    for lower_id in lower_nodes:
        var lower_node: MapNodeData = map.get_node_by_id(lower_id)
        var best_upper := _find_closest_unconnected(upper_nodes, lower_node.column, map)
        if best_upper >= 0:
            var upper_node: MapNodeData = map.get_node_by_id(best_upper)
            if lower_id not in upper_node.connections:
                upper_node.connections.append(lower_id)

    # 第二步：确保每个上层节点至少有一个出边
    for upper_id in upper_nodes:
        var upper_node: MapNodeData = map.get_node_by_id(upper_id)
        if upper_node.connections.is_empty():
            var col := upper_node.column
            var lower_node: MapNodeData = map.get_node_by_id(lower_nodes[0])
            var closest_id := lower_nodes[0]
            var min_dist := abs(col - lower_node.column)
            for lid in lower_nodes:
                var ln: MapNodeData = map.get_node_by_id(lid)
                var dist := abs(col - ln.column)
                if dist < min_dist:
                    min_dist = dist
                    closest_id = lid
            upper_node.connections.append(closest_id)

    # 第三步：随机添加额外连接
    for upper_id in upper_nodes:
        var upper_node: MapNodeData = map.get_node_by_id(upper_id)
        var extra := _rng.randi_range(0, MAX_CONNECTIONS - upper_node.connections.size())
        for _i in range(extra):
            var candidate := _pick_random_lower(upper_node, lower_nodes, map)
            if candidate >= 0 and candidate not in upper_node.connections:
                upper_node.connections.append(candidate)


func _find_closest_unconnected(nodes: Array[int], target_col: int, map: MapData) -> int:
    var best_id := -1
    var best_dist := 999
    for nid in nodes:
        var node: MapNodeData = map.get_node_by_id(nid)
        var dist := abs(node.column - target_col)
        if dist < best_dist:
            best_dist = dist
            best_id = nid
    return best_id
```

### 2.4 房间类型分配

```gdscript
## 根据楼层决定房间类型
func _random_room_type(floor: int) -> RoomType:
    var roll := _rng.randf()

    # Boss 前一层不允许精英
    if floor >= BOSS_FLOOR - 1:
        if roll < 0.5:
            return RoomType.NORMAL
        else:
            return RoomType.REST

    # 前3层只有普通战斗和事件
    if floor <= 3:
        if roll < 0.6:
            return RoomType.NORMAL
        elif roll < 0.85:
            return RoomType.EVENT
        else:
            return RoomType.REST

    # 中间层
    if roll < 0.45:
        return RoomType.NORMAL
    elif roll < 0.60:
        return RoomType.ELITE
    elif roll < 0.75:
        return RoomType.REST
    elif roll < 0.88:
        return RoomType.EVENT
    elif roll < 0.95:
        return RoomType.SHOP
    else:
        return RoomType.TREASURE
```

### 2.5 节点位置计算

```gdscript
## 计算每个节点的 UI 显示坐标
func _calculate_positions(map: MapData) -> void:
    var screen_width := 600.0
    var screen_height := 800.0
    var floor_spacing := screen_height / (BOSS_FLOOR + 1)

    for floor_num in range(BOSS_FLOOR + 1):
        var nodes_on_floor := map.get_nodes_on_floor(floor_num)
        var count := nodes_on_floor.size()
        var col_spacing := screen_width / (count + 1)

        for i in range(count):
            var node: MapNodeData = nodes_on_floor[i]
            node.position = Vector2(
                col_spacing * (i + 1),
                screen_height - floor_spacing * (floor_num + 1)  # 底部为起点
            )
```

## 3. 房间类型与权重

### 3.1 房间分配权重表

```
楼层范围    普通    精英    休息    事件    商店    宝箱
1-3        60%     0%      15%     20%     0%      5%
4-7        45%     15%     15%     15%     7%      3%
8-11       40%     18%     15%     12%     10%     5%
12-14      35%     20%     20%     10%     10%     5%
Boss层      -       -       -       -       -       -
```

### 3.2 连续同类房间限制

```gdscript
## 检查是否允许在指定路径上放置此类型房间
func _is_room_type_allowed(type: RoomType, map: MapData, floor: int) -> bool:
    # 限制1: 不能连续3个精英
    # 限制2: 不能连续2个商店
    # 限制3: 前3层无精英
    # 限制4: Boss层前有休息点

    if type == RoomType.ELITE and floor <= 3:
        return false

    if type == RoomType.BOSS:
        return floor == BOSS_FLOOR

    return true
```

## 4. 地图节点 Scene 结构

### 4.1 MapNode 场景

```
MapNode (Control)
├── Background (ColorRect / NinePatchRect)  # 房间背景
├── Icon (TextureRect)                       # 房间类型图标
├── Highlight (ColorRect)                    # 选中/可交互高亮
└── Label (Label)                            # 房间类型文字（可选）
```

```gdscript
# scripts/map/map_node_view.gd
extends Control

signal node_clicked(node_data: MapNodeData)

var node_data: MapNodeData
var is_reachable: bool = false
var is_visited: bool = false
var is_current: bool = false

@onready var icon: TextureRect = $Icon
@onready var highlight: ColorRect = $Highlight
@onready var background: ColorRect = $Background


func setup(data: MapNodeData) -> void:
    node_data = data
    icon.texture = _get_room_icon(data.room_type)
    position = data.position - size / 2


func set_reachable(value: bool) -> void:
    is_reachable = value
    highlight.visible = value
    modulate = Color.WHITE if value else Color(0.5, 0.5, 0.5, 1.0)


func set_visited(value: bool) -> void:
    is_visited = value
    if value:
        modulate = Color(0.6, 0.6, 0.6, 0.7)


func _gui_input(event: InputEvent) -> void:
    if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
        if is_reachable:
            node_clicked.emit(node_data)


func _get_room_icon(type: RoomType) -> Texture2D:
    var path := "res://assets/art/map/"
    match type:
        RoomType.NORMAL:
            return load(path + "icon_battle.png")
        RoomType.ELITE:
            return load(path + "icon_elite.png")
        RoomType.REST:
            return load(path + "icon_rest.png")
        RoomType.SHOP:
            return load(path + "icon_shop.png")
        RoomType.EVENT:
            return load(path + "icon_event.png")
        RoomType.TREASURE:
            return load(path + "icon_treasure.png")
        RoomType.BOSS:
            return load(path + "icon_boss.png")
        RoomType.START:
            return load(path + "icon_start.png")
        _:
            return null
```

## 5. 地图 UI 交互实现

### 5.1 MapScene 结构

```
MapScene (Control)
├── MapContainer (Control)              # 地图容器，可滚动
│   ├── LineOverlay (Control)           # 连线绘制层
│   │   └── _draw() 绘制所有连线
│   └── NodesContainer (Control)        # 节点容器
│       ├── MapNode (实例化的 MapNodeView)
│       ├── MapNode
│       └── ...
├── PlayerInfo (HBoxContainer)          # 玩家信息条
│   ├── HPBar
│   ├── GoldLabel
│   └── FloorLabel
├── MapLegend (VBoxContainer)           # 图例（可选）
└── BackButton (Button)                 # 返回/确认按钮
```

### 5.2 MapUIController

```gdscript
# scripts/map/map_ui_controller.gd
extends Control

signal room_selected(room_type: RoomType, encounter: EncounterData)

var map_data: MapData
var current_node_id: int = -1
var visited_nodes: Dictionary = {}  # int -> bool
var node_views: Dictionary = {}     # int -> MapNodeView

@onready var nodes_container: Control = $MapContainer/NodesContainer
@onready var line_overlay: Control = $MapContainer/LineOverlay


func setup(map: MapData) -> void:
    map_data = map
    _create_node_views()
    _update_reachability()


func _create_node_views() -> void:
    var node_scene: PackedScene = preload("res://scenes/map/map_node.tscn")

    for node: MapNodeData in map_data.nodes:
        var view: Control = node_scene.instantiate()
        nodes_container.add_child(view)
        view.setup(node)
        view.node_clicked.connect(_on_node_clicked)
        node_views[node.node_id] = view


func _update_reachability() -> void:
    # 清除所有可达标记
    for view: Control in node_views.values():
        view.set_reachable(false)

    if current_node_id < 0:
        # 游戏开始，只有起始节点可达
        var start: MapNodeData = map_data.get_start_node()
        if start:
            var start_view: Control = node_views[start.node_id]
            start_view.set_reachable(true)
    else:
        # 当前节点的连接节点可达
        var current: MapNodeData = map_data.get_node_by_id(current_node_id)
        if current:
            for next_id: int in current.connections:
                var view: Control = node_views.get(next_id)
                if view and not visited_nodes.has(next_id):
                    view.set_reachable(true)
```

### 5.3 连线绘制

```gdscript
# scripts/map/line_overlay.gd
extends Control

var map_data: MapData
var node_views: Dictionary
var visited_nodes: Dictionary


func _draw() -> void:
    if map_data == null:
        return

    for node: MapNodeData in map_data.nodes:
        var from_pos: Vector2 = node.position

        for next_id: int in node.connections:
            var next_node: MapNodeData = map_data.get_node_by_id(next_id)
            if next_node == null:
                continue

            var to_pos: Vector2 = next_node.position

            # 已访问路径用亮色，未访问用暗色
            var color := Color(0.3, 0.3, 0.3, 0.5)
            if visited_nodes.has(next_id):
                color = Color(0.8, 0.8, 0.8, 0.8)

            draw_line(from_pos, to_pos, color, 2.0, true)
```

### 5.4 节点点击处理

```gdscript
func _on_node_clicked(node_data: MapNodeData) -> void:
    if not _is_reachable(node_data.node_id):
        return

    # 标记为已访问
    visited_nodes[node_data.node_id] = true
    current_node_id = node_data.node_id

    # 更新UI
    _update_reachability()

    # 根据房间类型触发流程
    match node_data.room_type:
        RoomType.NORMAL, RoomType.ELITE, RoomType.BOSS:
            var encounter := EncounterSelector.select_encounter(node_data.room_type, node_data.floor)
            room_selected.emit(node_data.room_type, encounter)
        RoomType.REST:
            _enter_rest_site()
        RoomType.SHOP:
            _enter_shop()
        RoomType.EVENT:
            _enter_event()
        RoomType.TREASURE:
            _open_treasure()
```

## 6. 存档相关考虑

### 6.1 需要保存的地图数据

```gdscript
# scripts/map/map_save_data.gd
extends Resource
class_name MapSaveData

@export var map_seed: int = 0                    # 地图种子（用于重新生成）
@export var current_node_id: int = -1
@export var visited_node_ids: Array[int] = []
@export var available_paths: Array[Dictionary] = []  # 记录分支选择
```

### 6.2 存档与恢复

```gdscript
## 保存地图状态
func save_map_state() -> MapSaveData:
    var save_data := MapSaveData.new()
    save_data.map_seed = map_data.seed_value
    save_data.current_node_id = current_node_id
    save_data.visited_node_ids = visited_nodes.keys()
    return save_data


## 从存档恢复地图
func load_map_state(save_data: MapSaveData) -> void:
    # 使用相同种子重新生成地图
    var generator := MapGenerator.new(save_data.map_seed)
    map_data = generator.generate()

    # 恢复访问状态
    current_node_id = save_data.current_node_id
    for nid: int in save_data.visited_node_ids:
        visited_nodes[nid] = true

    # 重建UI
    setup(map_data)
```
