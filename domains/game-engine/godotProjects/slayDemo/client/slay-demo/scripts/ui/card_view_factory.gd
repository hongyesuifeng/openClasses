extends RefCounted
class_name CardViewFactory

const UIThemeScript := preload("res://scripts/ui/ui_theme.gd")
const UILayoutStoreScript := preload("res://scripts/ui/ui_layout_store.gd")

const TEMPLATE_BY_RARITY := {
	"starter": "res://assets/card/templates/card_template_common.png",
	"common": "res://assets/card/templates/card_template_common.png",
	"uncommon": "res://assets/card/templates/card_template_uncommon.png",
	"rare": "res://assets/card/templates/card_template_rare.png",
	"legendary": "res://assets/card/templates/card_template_legendary.png"
}

const ICON_BY_TYPE := {
	"attack": "res://assets/card/icons/card_icon_attack.png",
	"skill": "res://assets/card/icons/card_icon_skill.png",
	"power": "res://assets/card/icons/card_icon_power.png",
	"status": "res://assets/card/icons/card_icon_debuff.png"
}

const ICON_BY_ART_KEY := {
	"card_strike": "res://assets/card/icons/card_icon_strike.png",
	"card_attack": "res://assets/card/icons/card_icon_attack.png",
	"card_defend": "res://assets/card/icons/card_icon_defend.png",
	"card_skill": "res://assets/card/icons/card_icon_skill.png",
	"card_buff": "res://assets/card/icons/card_icon_buff.png",
	"card_debuff": "res://assets/card/icons/card_icon_debuff.png"
}


static func create_card_button(card: Dictionary, card_size := Vector2(144, 200), selected := false, disabled := false) -> Button:
	var button := Button.new()
	button.custom_minimum_size = card_size
	button.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	button.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	button.disabled = disabled
	button.clip_contents = true
	button.text = ""
	button.set_meta("card_id", str(card.get("id", "")))
	button.set_meta("card_type", str(card.get("type", "")))
	var instance_id := str(card.get("id", ""))

	var style := StyleBoxFlat.new()
	style.bg_color = Color(0, 0, 0, 0)
	style.border_color = Color(1.0, 0.86, 0.34, 1.0) if selected else Color(0.12, 0.1, 0.08, 0.85)
	style.set_border_width_all(3 if selected else 1)
	style.set_corner_radius_all(8)
	button.add_theme_stylebox_override("normal", style)
	button.add_theme_stylebox_override("hover", style)
	button.add_theme_stylebox_override("pressed", style)
	button.add_theme_stylebox_override("disabled", style)
	button.pivot_offset = card_size * 0.5
	button.scale = Vector2(1.05, 1.05) if selected else Vector2.ONE
	button.modulate = Color(1.15, 1.12, 1.02, 1.0) if selected else Color.WHITE

	var template := TextureRect.new()
	template.texture = load(str(TEMPLATE_BY_RARITY.get(str(card.get("rarity", "")), TEMPLATE_BY_RARITY["common"])))
	template.set_anchors_preset(Control.PRESET_FULL_RECT)
	template.stretch_mode = TextureRect.STRETCH_SCALE
	template.mouse_filter = Control.MOUSE_FILTER_IGNORE
	button.add_child(template)
	UILayoutStoreScript.apply_layout(template, "card.template", instance_id)

	var icon := TextureRect.new()
	icon.texture = load(_icon_path_for(card))
	icon.anchor_left = 0.18
	icon.anchor_top = 0.25
	icon.anchor_right = 0.82
	icon.anchor_bottom = 0.54
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	button.add_child(icon)
	UILayoutStoreScript.apply_layout(icon, "card.icon", instance_id)

	var cost := _label(str(card.get("cost", 0)), 22, HORIZONTAL_ALIGNMENT_CENTER)
	cost.anchor_left = 0.02
	cost.anchor_top = 0.02
	cost.anchor_right = 0.25
	cost.anchor_bottom = 0.18
	button.add_child(cost)
	UILayoutStoreScript.apply_layout(cost, "card.cost", instance_id)

	var name_label := _label(str(card.get("name", "")), 17, HORIZONTAL_ALIGNMENT_CENTER)
	name_label.anchor_left = 0.18
	name_label.anchor_top = 0.06
	name_label.anchor_right = 0.92
	name_label.anchor_bottom = 0.19
	name_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	button.add_child(name_label)
	UILayoutStoreScript.apply_layout(name_label, "card.name", instance_id)

	var type_label := _label(_type_text(str(card.get("type", ""))), 13, HORIZONTAL_ALIGNMENT_CENTER)
	type_label.anchor_left = 0.18
	type_label.anchor_top = 0.58
	type_label.anchor_right = 0.82
	type_label.anchor_bottom = 0.68
	button.add_child(type_label)
	UILayoutStoreScript.apply_layout(type_label, "card.type", instance_id)

	var description := _label(str(card.get("description", "")), 13, HORIZONTAL_ALIGNMENT_CENTER)
	description.anchor_left = 0.11
	description.anchor_top = 0.69
	description.anchor_right = 0.89
	description.anchor_bottom = 0.93
	description.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	button.add_child(description)
	UILayoutStoreScript.apply_layout(description, "card.description", instance_id)

	if disabled:
		var veil := ColorRect.new()
		veil.color = Color(0.03, 0.03, 0.035, 0.42)
		veil.set_anchors_preset(Control.PRESET_FULL_RECT)
		veil.mouse_filter = Control.MOUSE_FILTER_IGNORE
		button.add_child(veil)
		UILayoutStoreScript.apply_layout(veil, "card.disabled_veil", instance_id)

	UILayoutStoreScript.apply_layout(button, "card.root", instance_id)
	return button


static func _label(text: String, font_size: int, align: HorizontalAlignment) -> Label:
	var label := Label.new()
	label.text = text
	label.horizontal_alignment = align
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", Color(0.96, 0.91, 0.82))
	label.add_theme_color_override("font_shadow_color", Color(0.08, 0.055, 0.04, 0.9))
	label.add_theme_constant_override("shadow_offset_x", 1)
	label.add_theme_constant_override("shadow_offset_y", 1)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	UIThemeScript.apply_cn(label)
	return label


static func _icon_path_for(card: Dictionary) -> String:
	var art_key := str(card.get("art_key", ""))
	if ICON_BY_ART_KEY.has(art_key):
		return str(ICON_BY_ART_KEY[art_key])
	return str(ICON_BY_TYPE.get(str(card.get("type", "")), ICON_BY_TYPE["skill"]))


## 返回升级后的卡牌数据（合并 upgrade patch），原始数据不变
static func get_upgraded_card_data(card_data: Dictionary) -> Dictionary:
	if not card_data.has("upgrade"):
		return card_data.duplicate(true)
	var upgraded := card_data.duplicate(true)
	var patch := card_data["upgrade"] as Dictionary
	for key in patch:
		upgraded[key] = patch[key]
	return upgraded


## 生成升级前后并排对比面板
static func create_upgrade_compare(card_data: Dictionary, card_size := Vector2(132, 183)) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 12)

	## 升级前
	var before_vbox := VBoxContainer.new()
	before_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	before_vbox.add_theme_constant_override("separation", 4)
	row.add_child(before_vbox)
	var before_lbl := Label.new()
	before_lbl.text = "升级前"
	before_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	before_lbl.add_theme_font_size_override("font_size", 13)
	before_lbl.add_theme_color_override("font_color", Color(0.68, 0.64, 0.58))
	before_vbox.add_child(before_lbl)
	before_vbox.add_child(create_card_button(card_data, card_size, false, true))

	## 箭头
	var arrow := Label.new()
	arrow.text = "→"
	arrow.add_theme_font_size_override("font_size", 28)
	arrow.add_theme_color_override("font_color", Color(0.98, 0.88, 0.40))
	arrow.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	arrow.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(arrow)

	## 升级后
	var after_vbox := VBoxContainer.new()
	after_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	after_vbox.add_theme_constant_override("separation", 4)
	row.add_child(after_vbox)
	var after_lbl := Label.new()
	after_lbl.text = "升级后"
	after_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	after_lbl.add_theme_font_size_override("font_size", 13)
	after_lbl.add_theme_color_override("font_color", Color(0.52, 0.92, 0.52))
	after_vbox.add_child(after_lbl)
	after_vbox.add_child(create_card_button(get_upgraded_card_data(card_data), card_size, true))

	return row


static func _type_text(type: String) -> String:
	match type:
		"attack":
			return "攻击"
		"skill":
			return "技能"
		"power":
			return "能力"
		"status":
			return "状态"
		_:
			return type
