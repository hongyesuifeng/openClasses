extends RefCounted
class_name MapGenerator

## 地图生成器 - 使用 DAG 算法生成随机地图

const ROOM_TYPES := ["battle", "event", "shop", "rest", "elite", "chest", "boss"]
const MIN_FLOORS := 8
const MAX_FLOORS := 15
const MIN_NODES_PER_FLOOR := 2
const MAX_NODES_PER_FLOOR := 4


## 生成完整的地图配置
static func generate_map(rng_seed: int = 0, floors: int = 10) -> Dictionary:
	if rng_seed != 0:
		seed(rng_seed)

	var map_data := _create_empty_map(floors)
	_populate_nodes(map_data)
	_connect_nodes(map_data)
	_assign_room_types(map_data)
	_validate_paths(map_data)

	return _to_map_config(map_data)


## 创建空地图结构
static func _create_empty_map(floors: int) -> Dictionary:
	var map_data := {
		"floors": floors,
		"nodes": [],
		"floor_nodes": {}  ## floor_index -> [node_indices]
	}

	for i in range(floors):
		map_data["floor_nodes"][i] = []

	return map_data


## 填充节点
static func _populate_nodes(map_data: Dictionary) -> void:
	var floors: int = map_data["floors"]
	var nodes: Array = map_data["nodes"]
	var floor_nodes: Dictionary = map_data["floor_nodes"]

	for floor_index in range(floors):
		var num_nodes := _get_nodes_count_for_floor(floor_index, floors)

		for i in range(num_nodes):
			var node_id := "map_%s_%s" % [floor_index + 1, char(97 + i)]  ## map_1_a, map_1_b, ...
			var node := {
				"id": node_id,
				"floor": floor_index + 1,
				"type": "battle",  ## 默认类型，后续会调整
				"next_nodes": []
			}

			var node_index := nodes.size()
			nodes.append(node)
			floor_nodes[floor_index].append(node_index)


## 获取每层的节点数量
static func _get_nodes_count_for_floor(floor_index: int, total_floors: int) -> int:
	## 第一层和最后一层固定 1 个节点
	if floor_index == 0 or floor_index == total_floors - 1:
		return 1

	## 倒数第二层固定 1 个节点（Boss 前的休息点）
	if floor_index == total_floors - 2:
		return 1

	## 其他层随机 2-4 个节点
	return randi_range(MIN_NODES_PER_FLOOR, MAX_NODES_PER_FLOOR)


## 连接节点形成 DAG
static func _connect_nodes(map_data: Dictionary) -> void:
	var nodes: Array = map_data["nodes"]
	var floor_nodes: Dictionary = map_data["floor_nodes"]
	var floors: int = map_data["floors"]

	for floor_index in range(floors - 1):
		var current_floor_nodes: Array = floor_nodes[floor_index]
		var next_floor_nodes: Array = floor_nodes[floor_index + 1]

		if current_floor_nodes.is_empty() or next_floor_nodes.is_empty():
			continue

		## 确保每个节点至少有一个出口
		for node_idx in current_floor_nodes:
			var node: Dictionary = nodes[node_idx]
			var next_indices := _select_next_nodes(next_floor_nodes, nodes)
			for next_idx in next_indices:
				var next_node: Dictionary = nodes[next_idx]
				node["next_nodes"].append(next_node["id"])

		## 确保下一层的每个节点至少有一个入口
		for next_idx in next_floor_nodes:
			var next_node: Dictionary = nodes[next_idx]
			var has_incoming := false
			for node_idx in current_floor_nodes:
				var node: Dictionary = nodes[node_idx]
				if node["next_nodes"].has(next_node["id"]):
					has_incoming = true
					break

			if not has_incoming and current_floor_nodes.size() > 0:
				## 强制连接一个随机上游节点
				var random_upstream: int = int(current_floor_nodes[randi() % current_floor_nodes.size()])
				var upstream_node: Dictionary = nodes[random_upstream]
				upstream_node["next_nodes"].append(next_node["id"])


## 选择下一层的连接节点
static func _select_next_nodes(next_floor_nodes: Array, _nodes: Array) -> Array:
	var result: Array = []
	var num_connections := randi_range(1, mini(2, next_floor_nodes.size()))

	var indices := next_floor_nodes.duplicate()
	indices.shuffle()

	for i in range(mini(num_connections, indices.size())):
		result.append(indices[i])

	return result


## 分配房间类型
static func _assign_room_types(map_data: Dictionary) -> void:
	var nodes: Array = map_data["nodes"]
	var floors: int = map_data["floors"]
	var floor_nodes: Dictionary = map_data["floor_nodes"]

	## 第一层固定为带遭遇的普通战斗，避免开局战斗没有敌人。
	var first_floor_nodes: Array = floor_nodes[0]
	if not first_floor_nodes.is_empty():
		var first_node: Dictionary = nodes[first_floor_nodes[0]]
		first_node["type"] = "battle"
		first_node["encounter_id"] = "v1_normal_01"

	## 最后一个节点是 Boss
	var last_floor_nodes: Array = floor_nodes[floors - 1]
	if not last_floor_nodes.is_empty():
		var boss_node: Dictionary = nodes[last_floor_nodes[0]]
		boss_node["type"] = "battle"
		boss_node["is_final"] = true
		boss_node["encounter_id"] = "v1_boss_02"

	## 倒数第二层是休息点
	if floors >= 2:
		var rest_floor_nodes: Array = floor_nodes[floors - 2]
		if not rest_floor_nodes.is_empty():
			var rest_node: Dictionary = nodes[rest_floor_nodes[0]]
			rest_node["type"] = "rest"
			rest_node["heal_percent"] = 0.3

	## 分配其他房间类型
	var shop_placed := false
	var elite_count := 0
	var event_count := 0
	var chest_count := 0

	for floor_index in range(1, floors - 2):
		var floor_node_indices: Array = floor_nodes[floor_index]

		for node_idx in floor_node_indices:
			var node: Dictionary = nodes[node_idx]

			## 根据楼层和概率分配类型
			var roll := randf()

			if not shop_placed and floor_index >= 3 and roll < 0.15:
				node["type"] = "shop"
				shop_placed = true
			elif floor_index >= 5 and elite_count < 2 and roll < 0.2:
				node["type"] = "battle"
				node["encounter_id"] = _random_elite_encounter()
				elite_count += 1
			elif event_count < 3 and roll < 0.25:
				node["type"] = "event"
				_assign_random_event(node)
				event_count += 1
			elif chest_count < 2 and floor_index >= 2 and roll < 0.15:
				node["type"] = "chest"
				node["gold"] = randi_range(30, 60)
				chest_count += 1
			else:
				node["type"] = "battle"
				_assign_random_encounter(node, floor_index)


## 分配随机事件
static func _assign_random_event(node: Dictionary) -> void:
	var events := [
		{
			"title": "破损祭坛",
			"description": "一座古老祭坛仍在发光。你可以付出一点代价，换取继续前进的优势。",
			"choices": [
				{
					"label": "献血换金币",
					"description": "失去 6 点生命，获得 75 金币。",
					"effects": [
						{ "type": "lose_hp", "value": 6 },
						{ "type": "gain_gold", "value": 75 }
					]
				},
				{
					"label": "净化牌组",
					"description": "失去 5 点生命，选择一张卡牌移除。",
					"effects": [
						{ "type": "lose_hp", "value": 5 },
						{ "type": "remove_card", "requires_selection": true }
					]
				},
				{
					"label": "祭坛祝福",
					"description": "选择一张卡牌进行升级。",
					"effects": [
						{ "type": "upgrade_card", "requires_selection": true }
					]
				}
			]
		},
		{
			"title": "流浪商人",
			"description": "一个神秘的商人在路边摆摊。他看起来很急切地想要成交。",
			"choices": [
				{
					"label": "购买神秘卡牌",
					"description": "花费 50 金币，获得一张卡牌。",
					"effects": [
						{ "type": "gain_gold", "value": -50 },
						{ "type": "gain_card", "card_id": "cleave" }
					]
				},
				{
					"label": "出售生命精华",
					"description": "失去 8 点生命，获得 100 金币。",
					"effects": [
						{ "type": "lose_hp", "value": 8 },
						{ "type": "gain_gold", "value": 100 }
					]
				},
				{
					"label": "离开",
					"description": "不进行交易。",
					"effects": []
				}
			]
		},
		{
			"title": "远古图书馆",
			"description": "你在废墟中发现了一座保存完好的图书馆。",
			"choices": [
				{
					"label": "研读武技",
					"description": "选择一张卡牌进行升级。",
					"effects": [
						{ "type": "upgrade_card", "requires_selection": true }
					]
				},
				{
					"label": "寻找财宝",
					"description": "获得 50 金币，但失去 3 点生命。",
					"effects": [
						{ "type": "gain_gold", "value": 50 },
						{ "type": "lose_hp", "value": 3 }
					]
				},
				{
					"label": "撕毁典籍",
					"description": "移除一张卡牌，获得 30 金币。",
					"effects": [
						{ "type": "remove_card", "requires_selection": true },
						{ "type": "gain_gold", "value": 30 }
					]
				}
			]
		},
		{
			"title": "神秘泉水",
			"description": "一眼散发着奇异光芒的泉水。",
			"choices": [
				{
					"label": "饮用泉水",
					"description": "恢复 15 点生命。",
					"effects": [
						{ "type": "lose_hp", "value": -15 }
					]
				},
				{
					"label": "装瓶带走",
					"description": "获得 50 金币。",
					"effects": [
						{ "type": "gain_gold", "value": 50 }
					]
				},
				{
					"label": "洗炼卡牌",
					"description": "选择一张卡牌移除，获得新卡牌。",
					"effects": [
						{ "type": "transform_card", "requires_selection": true, "to_card_id": "cleave" }
					]
				}
			]
		}
	]

	var selected_event: Dictionary = events[randi() % events.size()]
	node.merge(selected_event)


## 分配随机遭遇
static func _assign_random_encounter(node: Dictionary, floor_index: int) -> void:
	## 根据楼层选择遭遇难度
	var encounter_pool := []

	if floor_index <= 3:
		encounter_pool = ["v1_normal_01", "v1_normal_02", "v1_normal_04"]
	elif floor_index <= 6:
		encounter_pool = ["v1_normal_03", "v1_normal_05", "v1_normal_06", "v1_normal_08"]
	else:
		encounter_pool = ["v1_normal_07", "v1_normal_09", "v1_normal_10"]

	node["encounter_id"] = encounter_pool[randi() % encounter_pool.size()]


static func _random_elite_encounter() -> String:
	var encounter_pool := ["v1_elite_01", "v1_elite_02"]
	return encounter_pool[randi() % encounter_pool.size()]


## 验证路径可达性
static func _validate_paths(map_data: Dictionary) -> bool:
	var nodes: Array = map_data["nodes"]
	if nodes.is_empty():
		return false

	## BFS 检查从起点到终点的可达性
	var start_node: Dictionary = nodes[0]
	var end_node: Dictionary = nodes[nodes.size() - 1]

	var visited: Dictionary = {}
	var queue: Array = [start_node["id"]]

	while not queue.is_empty():
		var current_id: String = queue.pop_front()
		if visited.has(current_id):
			continue
		visited[current_id] = true

		## 找到当前节点
		for node in nodes:
			var node_dict: Dictionary = node
			if node_dict["id"] == current_id:
				for next_id in node_dict.get("next_nodes", []):
					if not visited.has(next_id):
						queue.append(next_id)
				break

	return visited.has(end_node["id"])


## 转换为地图配置格式
static func _to_map_config(map_data: Dictionary) -> Dictionary:
	var nodes: Array = map_data["nodes"]

	return {
		"id": "generated_map_run",
		"start_deck": ["strike", "strike", "strike", "defend", "defend", "bash"],
		"player": {
			"max_hp": 80,
			"gold": 120,
			"energy_per_turn": 3,
			"draw_per_turn": 5
		},
		"map_nodes": nodes
	}
