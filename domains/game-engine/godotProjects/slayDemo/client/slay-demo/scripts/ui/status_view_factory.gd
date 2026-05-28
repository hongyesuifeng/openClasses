extends RefCounted
class_name StatusViewFactory

## 状态图标和颜色配置
const STATUS_CONFIG := {
	"strength": {
		"name": "力量",
		"color": Color(1.0, 0.65, 0.2),
		"icon": "⚔",
		"description": "伤害 +{stacks}"
	},
	"dexterity": {
		"name": "敏捷",
		"color": Color(0.4, 0.8, 1.0),
		"icon": "🛡",
		"description": "格挡 +{stacks}"
	},
	"vulnerable": {
		"name": "易伤",
		"color": Color(1.0, 0.3, 0.3),
		"icon": "💔",
		"description": "受伤 +50% ({stacks}回合)"
	},
	"weak": {
		"name": "无力",
		"color": Color(0.6, 0.6, 0.7),
		"icon": "💫",
		"description": "伤害 -25% ({stacks}回合)"
	},
	"frail": {
		"name": "虚弱",
		"color": Color(0.7, 0.5, 0.3),
		"icon": "🦴",
		"description": "格挡 -25% ({stacks}回合)"
	},
	"poison": {
		"name": "中毒",
		"color": Color(0.5, 0.2, 0.8),
		"icon": "☠",
		"description": "回合开始 {stacks} 伤害"
	},
	"thorns": {
		"name": "荆棘",
		"color": Color(0.3, 0.7, 0.3),
		"icon": "🌵",
		"description": "反弹 {stacks} 伤害"
	},
	"regeneration": {
		"name": "再生",
		"color": Color(0.3, 1.0, 0.4),
		"icon": "💚",
		"description": "回合开始回复 {stacks}"
	},
	"barricade": {
		"name": "堡垒",
		"color": Color(0.75, 0.9, 1.0),
		"icon": "▣",
		"description": "格挡不会在回合开始清除"
	},
}


## 创建单个状态图标标签
static func create_status_label(status_id: String, stacks: int, compact: bool = true) -> Label:
	var config: Dictionary = STATUS_CONFIG.get(status_id, {"name": status_id, "color": Color.WHITE, "icon": "?"})
	var label := Label.new()

	var text := ""
	if compact:
		text = "%s%d" % [config.get("icon", "?"), stacks]
	else:
		text = "%s %s: %d" % [config.get("icon", "?"), config.get("name", status_id), stacks]

	label.text = text
	label.add_theme_font_size_override("font_size", 14 if compact else 16)
	label.add_theme_color_override("font_color", config.get("color", Color.WHITE))
	label.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.8))
	label.add_theme_constant_override("shadow_offset_x", 1)
	label.add_theme_constant_override("shadow_offset_y", 1)

	return label


## 创建状态容器（多个状态图标横向排列）
static func create_status_row(statuses: Array, compact: bool = true) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 6)

	for status in statuses:
		var status_id := str(status.get("id", ""))
		var stacks := int(status.get("stacks", 0))
		if stacks <= 0:
			continue

		var label := create_status_label(status_id, stacks, compact)
		row.add_child(label)

	return row


## 获取状态描述文本
static func get_status_description(status_id: String, stacks: int) -> String:
	var config: Dictionary = STATUS_CONFIG.get(status_id, {"description": status_id})
	var template := str(config.get("description", status_id))
	return template.format({"stacks": stacks})


## 判断是否为负面状态
static func is_debuff(status_id: String) -> bool:
	return status_id in ["vulnerable", "weak", "frail", "poison"]
