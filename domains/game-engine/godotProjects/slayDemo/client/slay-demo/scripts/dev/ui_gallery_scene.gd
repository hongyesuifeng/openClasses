## UIGallery — 可视化 UI 预览系统
## 启动方式：
##   Godot_v4.6.2-stable_win64.exe --path <project_path> --scene res://scenes/dev/ui_gallery_scene.tscn
## 用途：校验美术资源、UI 尺寸、颜色、字体在真实 Godot 渲染下的表现

extends Control

const CardViewFactoryScript    := preload("res://scripts/ui/card_view_factory.gd")
const RelicViewFactoryScript   := preload("res://scripts/ui/relic_view_factory.gd")
const StatusViewFactoryScript  := preload("res://scripts/ui/status_view_factory.gd")
const PotionViewFactoryScript  := preload("res://scripts/ui/potion_view_factory.gd")
const UILayoutStoreScript      := preload("res://scripts/ui/ui_layout_store.gd")
const UILayoutEditorScript     := preload("res://scripts/dev/ui_layout_editor.gd")
const SpriteAnimHelperScript   := preload("res://scripts/vfx/sprite_anim_helper.gd")
const _UIBuilder               := preload("res://addons/ui_builder/ui_builder.gd")
const _UISpecEditor            := preload("res://addons/ui_builder/ui_spec_editor.gd")

const TABS := [
	{"key": "specs",    "label": "📄 Spec JSON"},
	{"key": "cards",    "label": "卡牌"},
	{"key": "relics",   "label": "遗物"},
	{"key": "statuses", "label": "状态"},
	{"key": "theme",    "label": "字体/色彩"},
	{"key": "anim",     "label": "🎬 动画"},
]

const RARITY_COLORS := {
	"starter":  Color(0.60, 0.70, 0.80),
	"common":   Color(0.85, 0.85, 0.85),
	"uncommon": Color(0.40, 0.80, 1.00),
	"rare":     Color(1.00, 0.75, 0.20),
	"boss":     Color(1.00, 0.35, 0.35),
}

var _content_area: Control
var _active_tab := ""
var _tab_buttons: Dictionary = {}
var _anim_helpers: Array = []
var _live_editor: Control = null  ## 复用同一个 live 编辑器，避免叠加


func _process(delta: float) -> void:
	for helper in _anim_helpers:
		if helper != null:
			helper.update(delta)


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)

	var data_loader: Variant = _autoload("DataLoader")
	if data_loader != null:
		data_loader.load_all()
		var run_config: Dictionary = data_loader.get_run_config("act1_map_run")
		var game_state: Variant = _autoload("GameState")
		if game_state != null and not run_config.is_empty():
			game_state.start_new_run(run_config)

	_build_chrome()
	_switch_tab("specs")


func _build_chrome() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.07, 0.075, 0.085)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var layout := VBoxContainer.new()
	layout.set_anchors_preset(Control.PRESET_FULL_RECT)
	layout.add_theme_constant_override("separation", 0)
	add_child(layout)

	## ── 顶部整体行：固定按钮 + 可滚动 Tab 区 ──────────────────
	var top_row := HBoxContainer.new()
	top_row.custom_minimum_size = Vector2(0, 44)
	top_row.add_theme_constant_override("separation", 0)
	layout.add_child(top_row)

	## 背景色
	var bar_bg := ColorRect.new()
	bar_bg.color = Color(0.10, 0.10, 0.12)
	bar_bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bar_bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top_row.add_child(bar_bg)

	## 固定在左侧的「布局编辑器」按钮（不随 Tab 滚动）
	var editor_btn := Button.new()
	editor_btn.text = "布局编辑器"
	editor_btn.tooltip_text = "打开当前标签页第一个可编辑元素；也可右键任意预览元素"
	editor_btn.custom_minimum_size = Vector2(120, 44)
	editor_btn.pressed.connect(_open_first_editable)
	top_row.add_child(editor_btn)

	## 分隔竖线
	var vsep := ColorRect.new()
	vsep.color = Color(0.28, 0.30, 0.34)
	vsep.custom_minimum_size = Vector2(2, 44)
	top_row.add_child(vsep)

	## ◀ 向左箭头
	var left_btn := Button.new()
	left_btn.text = "◀"
	left_btn.custom_minimum_size = Vector2(32, 44)
	left_btn.flat = true
	top_row.add_child(left_btn)

	## 可水平滚动的 Tab 区
	var tab_scroll := ScrollContainer.new()
	tab_scroll.name = "TabScroll"
	tab_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	tab_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_NEVER
	tab_scroll.vertical_scroll_mode   = ScrollContainer.SCROLL_MODE_DISABLED
	tab_scroll.custom_minimum_size    = Vector2(0, 44)
	top_row.add_child(tab_scroll)

	var tab_bar := HBoxContainer.new()
	tab_bar.add_theme_constant_override("separation", 2)
	tab_bar.custom_minimum_size = Vector2(0, 44)
	tab_scroll.add_child(tab_bar)

	## ▶ 向右箭头
	var right_btn := Button.new()
	right_btn.text = "▶"
	right_btn.custom_minimum_size = Vector2(32, 44)
	right_btn.flat = true
	top_row.add_child(right_btn)

	## 箭头按钮连接滚动（step = 330px ≈ 3 个 Tab 按钮宽）
	const SCROLL_STEP := 330
	left_btn.pressed.connect(func() -> void:
		tab_scroll.scroll_horizontal = maxi(0, tab_scroll.scroll_horizontal - SCROLL_STEP)
	)
	right_btn.pressed.connect(func() -> void:
		tab_scroll.scroll_horizontal += SCROLL_STEP
	)

	for tab in TABS:
		var btn := Button.new()
		btn.text = str(tab["label"])
		btn.custom_minimum_size = Vector2(110, 44)
		btn.pressed.connect(_switch_tab.bind(str(tab["key"])))
		tab_bar.add_child(btn)
		_tab_buttons[str(tab["key"])] = btn

	## 分隔线
	var sep := ColorRect.new()
	sep.color = Color(0.22, 0.24, 0.28)
	sep.custom_minimum_size = Vector2(0, 2)
	layout.add_child(sep)

	## 内容区（滚动）
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	layout.add_child(scroll)

	_content_area = VBoxContainer.new()
	_content_area.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_content_area.add_theme_constant_override("separation", 16)
	scroll.add_child(_content_area)


func _switch_tab(tab_key: String) -> void:
	_active_tab = tab_key
	_anim_helpers.clear()
	for child in _content_area.get_children():
		child.queue_free()

	for key in _tab_buttons:
		var btn := _tab_buttons[key] as Button
		var style := StyleBoxFlat.new()
		if key == tab_key:
			style.bg_color = Color(0.20, 0.34, 0.54)
		else:
			style.bg_color = Color(0.14, 0.14, 0.18)
		style.set_corner_radius_all(4)
		btn.add_theme_stylebox_override("normal", style)

	match tab_key:
		"cards":    _build_cards_tab()
		"relics":   _build_relics_tab()
		"statuses": _build_statuses_tab()
		"theme":    _build_theme_tab()
		"anim":     _build_anim_tab()
		"specs":    _build_specs_tab()
	call_deferred("_register_editable_inputs")


## ─────────────────────────────────────────────────────────────
## Tab 1: 卡牌
## ─────────────────────────────────────────────────────────────

func _build_cards_tab() -> void:
	var data_loader: Variant = _autoload("DataLoader")
	if data_loader == null:
		_add_error_label("DataLoader 未初始化")
		return

	var all_cards: Array = data_loader.get_all_cards()
	_add_section_title("卡牌预览  共 %d 张  （点击可切换选中状态）" % all_cards.size())

	for rarity in ["starter", "common", "uncommon", "rare"]:
		var group: Array = []
		for c in all_cards:
			if str((c as Dictionary).get("rarity", "")) == rarity:
				group.append(c)
		if group.is_empty():
			continue

		var color: Color = RARITY_COLORS.get(rarity, Color.WHITE)
		_add_rarity_label(rarity, color, group.size())

		var flow := _make_flow_container()
		_content_area.add_child(flow)

		for card in group:
			var card_dict := card as Dictionary
			## 普通版
			var btn: Button = CardViewFactoryScript.create_card_button(card_dict, Vector2(120, 168))
			btn.pressed.connect(_toggle_card_selected.bind(btn, card_dict))
			flow.add_child(btn)

			## 升级版（如果有独立 upgrade.effects）
			if card_dict.has("upgrade"):
				var upgraded := card_dict.duplicate(true)
				var upgrade_patch := card_dict["upgrade"] as Dictionary
				for key in upgrade_patch:
					upgraded[key] = upgrade_patch[key]
				var btn2: Button = CardViewFactoryScript.create_card_button(upgraded, Vector2(120, 168))
				btn2.modulate = Color(1.0, 1.0, 0.82)
				flow.add_child(btn2)

	## 尺寸参考行
	_add_section_title("尺寸参考（hand=132×183 / reward=180×250 / shop=144×200）")
	var size_row := HBoxContainer.new()
	size_row.add_theme_constant_override("separation", 16)
	_content_area.add_child(size_row)
	var sample_card: Dictionary = {}
	var all: Array = data_loader.get_all_cards()
	if not all.is_empty():
		sample_card = all[0] as Dictionary
	for sz in [Vector2(132, 183), Vector2(180, 250), Vector2(144, 200)]:
		var vbox := VBoxContainer.new()
		vbox.add_theme_constant_override("separation", 4)
		size_row.add_child(vbox)
		var lbl := Label.new()
		lbl.text = "%dx%d" % [int(sz.x), int(sz.y)]
		lbl.add_theme_font_size_override("font_size", 13)
		lbl.add_theme_color_override("font_color", Color(0.70, 0.70, 0.70))
		vbox.add_child(lbl)
		if not sample_card.is_empty():
			vbox.add_child(CardViewFactoryScript.create_card_button(sample_card, sz))


func _toggle_card_selected(btn: Button, card: Dictionary) -> void:
	var currently: bool = btn.get_meta("_selected", false)
	var new_val: bool = not currently
	btn.set_meta("_selected", new_val)
	var new_btn: Button = CardViewFactoryScript.create_card_button(card, Vector2(120, 168), new_val)
	new_btn.pressed.connect(_toggle_card_selected.bind(new_btn, card))
	var parent: Node = btn.get_parent()
	var idx: int = btn.get_index()
	btn.queue_free()
	parent.add_child(new_btn)
	parent.move_child(new_btn, idx)


## ─────────────────────────────────────────────────────────────
## Tab 2: 遗物
## ─────────────────────────────────────────────────────────────

func _build_relics_tab() -> void:
	var data_loader: Variant = _autoload("DataLoader")
	if data_loader == null:
		_add_error_label("DataLoader 未初始化")
		return

	var all_relics: Array = data_loader.get_all_relics()
	_add_section_title("遗物预览  共 %d 个" % all_relics.size())

	for rarity in ["starter", "common", "uncommon", "rare", "boss"]:
		var group: Array = []
		for r in all_relics:
			if str((r as Dictionary).get("rarity", "")) == rarity:
				group.append(r)
		if group.is_empty():
			continue

		var color: Color = RARITY_COLORS.get(rarity, Color.WHITE)
		_add_rarity_label(rarity, color, group.size())

		var flow := _make_flow_container()
		_content_area.add_child(flow)

		for relic in group:
			var relic_dict := relic as Dictionary
			var relic_id := str(relic_dict.get("id", ""))

			var container := VBoxContainer.new()
			container.add_theme_constant_override("separation", 4)
			container.custom_minimum_size = Vector2(88, 0)
			flow.add_child(container)

			var btn: Button = RelicViewFactoryScript.create_relic_button(relic_dict)
			container.add_child(btn)

			## 检查图标是否真的加载到了（判断 TextureRect 子节点）
			var has_icon := false
			for child in btn.get_children():
				if child is TextureRect and (child as TextureRect).texture != null:
					has_icon = true
					break
			if not has_icon:
				var warn := Label.new()
				warn.text = "⚠ 无图标"
				warn.add_theme_font_size_override("font_size", 11)
				warn.add_theme_color_override("font_color", Color(1.0, 0.4, 0.3))
				warn.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
				container.add_child(warn)

			var name_lbl := Label.new()
			name_lbl.text = str(relic_dict.get("name", relic_id))
			name_lbl.add_theme_font_size_override("font_size", 12)
			name_lbl.add_theme_color_override("font_color", Color(0.88, 0.82, 0.70))
			name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			name_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			name_lbl.custom_minimum_size = Vector2(88, 0)
			container.add_child(name_lbl)


## ─────────────────────────────────────────────────────────────
## Tab 3: 状态
## ─────────────────────────────────────────────────────────────

func _build_statuses_tab() -> void:
	_add_section_title("状态图标预览  共 11 种  （⚠ = 无图标资源，使用 emoji 降级）")

	var all_statuses := [
		"strength", "dexterity", "vulnerable", "weak", "frail",
		"poison", "thorns", "regeneration", "barricade", "ritual", "metallicize"
	]

	var grid := GridContainer.new()
	grid.columns = 4
	grid.add_theme_constant_override("h_separation", 20)
	grid.add_theme_constant_override("v_separation", 16)
	_content_area.add_child(grid)

	for status_id in all_statuses:
		var card := PanelContainer.new()
		var panel_style := StyleBoxFlat.new()
		panel_style.bg_color = Color(0.11, 0.12, 0.15)
		panel_style.set_border_width_all(1)
		panel_style.border_color = Color(0.22, 0.25, 0.30)
		panel_style.set_corner_radius_all(6)
		card.add_theme_stylebox_override("panel", panel_style)
		card.custom_minimum_size = Vector2(260, 0)
		grid.add_child(card)

		var inner := VBoxContainer.new()
		inner.add_theme_constant_override("separation", 6)
		card.add_child(inner)

		## 状态名称
		var title := Label.new()
		title.text = status_id
		title.add_theme_font_size_override("font_size", 13)
		title.add_theme_color_override("font_color", Color(0.70, 0.72, 0.78))
		inner.add_child(title)

		## 三种叠层
		var stacks_row := HBoxContainer.new()
		stacks_row.add_theme_constant_override("separation", 12)
		inner.add_child(stacks_row)

		var has_png := _status_has_icon(status_id)
		for stacks in [1, 3, 5]:
			var widget := StatusViewFactoryScript.create_status_label(status_id, stacks, false)
			stacks_row.add_child(widget)

		## 无图标警告
		if not has_png:
			var warn_row := HBoxContainer.new()
			inner.add_child(warn_row)
			var warn := Label.new()
			warn.text = "⚠ 缺少 PNG 图标文件，使用 emoji 降级显示"
			warn.add_theme_font_size_override("font_size", 11)
			warn.add_theme_color_override("font_color", Color(1.0, 0.55, 0.25))
			warn_row.add_child(warn)

			## 红框标记
			panel_style.border_color = Color(0.8, 0.25, 0.18)
			panel_style.set_border_width_all(2)


func _status_has_icon(status_id: String) -> bool:
	var path := "res://assets/ui/status/status_%s.png" % status_id
	return ResourceLoader.exists(path, "Texture2D")


## ─────────────────────────────────────────────────────────────
## Tab 4: 战斗 UI
## ─────────────────────────────────────────────────────────────

func _build_battle_tab() -> void:
	_add_section_title("战斗 UI 组件预览（Mock 数据，不启动战斗逻辑）")

	## 背景展示
	_add_section_title("─ 战斗背景图")
	var bg_row := HBoxContainer.new()
	bg_row.add_theme_constant_override("separation", 12)
	_content_area.add_child(bg_row)
	for bg_info in [
		{"path": "res://assets/backgrounds/bg_battle_dungeon.png", "label": "普通战斗\nbg_battle_dungeon"},
		{"path": "res://assets/backgrounds/bg_battle_boss.png",    "label": "Boss战\nbg_battle_boss"},
		{"path": "res://assets/backgrounds/bg_battle_cave.png",    "label": "洞穴（未使用）\nbg_battle_cave"},
	]:
		_add_background_preview(bg_row, str(bg_info["path"]), str(bg_info["label"]))

	## 进度条展示
	_add_section_title("─ HP 条 / 格挡条（256×24，RGB 无透明通道）")
	var bar_panel := PanelContainer.new()
	bar_panel.custom_minimum_size = Vector2(400, 0)
	_content_area.add_child(bar_panel)
	var bar_vbox := VBoxContainer.new()
	bar_vbox.add_theme_constant_override("separation", 8)
	bar_panel.add_child(bar_vbox)
	for bar_info in [
		{"bg": "res://assets/ui/bars/ui_hp_bar_bg.png",     "fill": "res://assets/ui/bars/ui_hp_bar_fill.png",    "label": "HP 条  75%",   "value": 0.75},
		{"bg": "res://assets/ui/bars/ui_hp_bar_bg.png",     "fill": "res://assets/ui/bars/ui_block_bar_fill.png", "label": "格挡条 40%",   "value": 0.40},
	]:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		bar_vbox.add_child(row)
		var lbl := Label.new()
		lbl.text = str(bar_info["label"])
		lbl.custom_minimum_size = Vector2(100, 0)
		lbl.add_theme_font_size_override("font_size", 14)
		lbl.add_theme_color_override("font_color", Color(0.88, 0.82, 0.70))
		row.add_child(lbl)
		var bar := TextureProgressBar.new()
		bar.custom_minimum_size = Vector2(280, 24)
		bar.texture_under = load(str(bar_info["bg"]))
		bar.texture_progress = load(str(bar_info["fill"]))
		bar.nine_patch_stretch = true
		bar.stretch_margin_left = 12
		bar.stretch_margin_right = 12
		bar.stretch_margin_top = 6
		bar.stretch_margin_bottom = 6
		bar.max_value = 1.0
		bar.value = float(bar_info["value"])
		row.add_child(bar)

	## 能量水晶
	_add_section_title("─ 能量水晶图标（36×36）")
	var crystal_row := HBoxContainer.new()
	crystal_row.add_theme_constant_override("separation", 6)
	_content_area.add_child(crystal_row)
	var crystal := TextureRect.new()
	crystal.texture = load("res://assets/ui/icons/ui_energy_crystal.png")
	crystal.custom_minimum_size = Vector2(36, 36)
	crystal.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	crystal_row.add_child(crystal)
	var crystal_lbl := Label.new()
	crystal_lbl.text = "3/3"
	crystal_lbl.add_theme_font_size_override("font_size", 24)
	crystal_lbl.add_theme_color_override("font_color", Color(0.72, 0.94, 1.0))
	crystal_row.add_child(crystal_lbl)

	## 意图图标
	_add_section_title("─ 敌人意图图标（32×32）")
	var intent_row := HBoxContainer.new()
	intent_row.add_theme_constant_override("separation", 14)
	_content_area.add_child(intent_row)
	for intent_info in [
		{"path": "res://assets/ui/intents/intent_sword.png",    "label": "attack"},
		{"path": "res://assets/ui/intents/intent_shield.png",   "label": "defend"},
		{"path": "res://assets/ui/intents/intent_buff.png",     "label": "buff"},
		{"path": "res://assets/ui/intents/intent_debuff.png",   "label": "debuff"},
		{"path": "res://assets/ui/intents/intent_stun.png",     "label": "stun"},
		{"path": "res://assets/ui/intents/intent_question.png", "label": "?"},
	]:
		var vbox := VBoxContainer.new()
		vbox.alignment = BoxContainer.ALIGNMENT_CENTER
		intent_row.add_child(vbox)
		var icon := TextureRect.new()
		icon.texture = load(str(intent_info["path"]))
		icon.custom_minimum_size = Vector2(32, 32)
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		vbox.add_child(icon)
		var lbl := Label.new()
		lbl.text = str(intent_info["label"])
		lbl.add_theme_font_size_override("font_size", 12)
		lbl.add_theme_color_override("font_color", Color(0.78, 0.75, 0.68))
		lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(lbl)

	## 玩家头像
	_add_section_title("─ 玩家精灵（128×128）")
	var player_row := HBoxContainer.new()
	player_row.add_theme_constant_override("separation", 12)
	_content_area.add_child(player_row)
	var portrait := TextureRect.new()
	portrait.texture = load("res://assets/player/sprites/player_warrior_idle.png")
	portrait.custom_minimum_size = Vector2(128, 128)
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	player_row.add_child(portrait)
	var portrait2 := TextureRect.new()
	portrait2.texture = load("res://assets/player/portrait/player_portrait.png")
	portrait2.custom_minimum_size = Vector2(64, 64)
	portrait2.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	player_row.add_child(portrait2)
	var player_note := Label.new()
	player_note.text = "左：sprites/player_warrior_idle.png (128×128)\n右：portrait/player_portrait.png (64×64)\n战斗场景实际显示尺寸为 72×68"
	player_note.add_theme_font_size_override("font_size", 13)
	player_note.add_theme_color_override("font_color", Color(0.72, 0.72, 0.72))
	player_row.add_child(player_note)

	## 敌人精灵尺寸对比
	_add_section_title("─ 敌人精灵（尺寸不统一：128/160/200px）")
	var enemy_row := HBoxContainer.new()
	enemy_row.add_theme_constant_override("separation", 12)
	_content_area.add_child(enemy_row)
	for enemy_info in [
		{"path": "res://assets/enemies/slime/enemy_slime_idle.png",             "label": "slime\n128×128"},
		{"path": "res://assets/enemies/orc_berserker/enemy_orc_berserker_idle.png", "label": "orc_berserker\n160×160"},
		{"path": "res://assets/enemies/ancient_dragon/enemy_ancient_dragon_idle.png","label": "ancient_dragon\n200×200"},
		{"path": "res://assets/enemies/slime_king/enemy_slime_king_idle.png",   "label": "slime_king\n160×160"},
	]:
		var vbox := VBoxContainer.new()
		vbox.alignment = BoxContainer.ALIGNMENT_CENTER
		enemy_row.add_child(vbox)
		var sprite := TextureRect.new()
		sprite.texture = load(str(enemy_info["path"]))
		sprite.custom_minimum_size = Vector2(100, 100)
		sprite.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		vbox.add_child(sprite)
		var lbl := Label.new()
		lbl.text = str(enemy_info["label"])
		lbl.add_theme_font_size_override("font_size", 12)
		lbl.add_theme_color_override("font_color", Color(0.78, 0.75, 0.68))
		lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(lbl)

	## Mock 手牌
	_add_section_title("─ 手牌区（实际渲染尺寸 132×183）")
	var hand_row := HBoxContainer.new()
	hand_row.add_theme_constant_override("separation", 8)
	_content_area.add_child(hand_row)
	var data_loader: Variant = _autoload("DataLoader")
	if data_loader != null:
		var cards: Array = data_loader.get_all_cards()
		var sample_ids := ["strike", "defend", "bash", "cleave", "inflame"]
		for sid in sample_ids:
			for c in cards:
				if str((c as Dictionary).get("id", "")) == sid:
					hand_row.add_child(CardViewFactoryScript.create_card_button(c as Dictionary, Vector2(132, 183)))
					break


## ─────────────────────────────────────────────────────────────
## Tab 5: 地图
## ─────────────────────────────────────────────────────────────

func _build_map_tab() -> void:
	_add_section_title("地图场景预览（嵌入真实 MapScene）")

	var game_state: Variant = _autoload("GameState")
	if game_state == null:
		_add_error_label("GameState 未就绪")
		return

	## 背景图对比
	_add_section_title("─ 非战斗场景背景（6 个场景共用 bg_map.png，以下为全部可用背景）")
	var bg_row := HBoxContainer.new()
	bg_row.add_theme_constant_override("separation", 12)
	_content_area.add_child(bg_row)
	for bg_info in [
		{"path": "res://assets/backgrounds/bg_map.png",      "label": "bg_map\n（地图/商店/休息/事件/\n奖励/宝箱 共用）"},
		{"path": "res://assets/backgrounds/bg_main_menu.png","label": "bg_main_menu\n（有资源但未使用）"},
	]:
		_add_background_preview(bg_row, str(bg_info["path"]), str(bg_info["label"]))

	## 地图节点图标
	_add_section_title("─ 地图节点图标（32×32）")
	var icon_row := HBoxContainer.new()
	icon_row.add_theme_constant_override("separation", 14)
	_content_area.add_child(icon_row)
	for icon_info in [
		{"path": "res://assets/ui/icons/icon_battle.png",   "label": "battle"},
		{"path": "res://assets/ui/icons/icon_shop.png",     "label": "shop"},
		{"path": "res://assets/ui/icons/icon_chest.png",    "label": "chest"},
		{"path": "res://assets/ui/icons/icon_question.png", "label": "event"},
		{"path": "res://assets/ui/icons/icon_rest.png",     "label": "rest"},
		{"path": "res://assets/ui/icons/icon_boss.png",     "label": "result/boss"},
		{"path": "res://assets/ui/icons/icon_elite.png",    "label": "elite"},
	]:
		var vbox := VBoxContainer.new()
		vbox.alignment = BoxContainer.ALIGNMENT_CENTER
		icon_row.add_child(vbox)
		var icon := TextureRect.new()
		icon.texture = load(str(icon_info["path"]))
		icon.custom_minimum_size = Vector2(32, 32)
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		vbox.add_child(icon)
		var lbl := Label.new()
		lbl.text = str(icon_info["label"])
		lbl.add_theme_font_size_override("font_size", 12)
		lbl.add_theme_color_override("font_color", Color(0.78, 0.75, 0.68))
		lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(lbl)

	## 嵌入 MapScene
	_add_section_title("─ 真实地图场景嵌入渲染（act1_map_run）")
	var map_wrapper := SubViewportContainer.new()
	map_wrapper.custom_minimum_size = Vector2(0, 640)
	map_wrapper.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	map_wrapper.stretch = true
	_content_area.add_child(map_wrapper)

	var viewport := SubViewport.new()
	viewport.size = Vector2i(1280, 640)
	viewport.transparent_bg = false
	map_wrapper.add_child(viewport)

	var map_scene: Node = load("res://scenes/map/map_scene.tscn").instantiate()
	viewport.add_child(map_scene)


## ─────────────────────────────────────────────────────────────
## Tab 6: 字体/色彩
## ─────────────────────────────────────────────────────────────

func _build_theme_tab() -> void:
	_add_section_title("字体规格  （当前：Godot 内置默认字体，ChakraPetch/NotoSansSC 已下载但未接入）")

	var font_sizes := [12, 13, 14, 16, 17, 18, 20, 22, 24, 30, 32, 34, 38, 48]
	var font_panel := PanelContainer.new()
	_content_area.add_child(font_panel)
	var font_vbox := VBoxContainer.new()
	font_vbox.add_theme_constant_override("separation", 8)
	font_panel.add_child(font_vbox)

	for size in font_sizes:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 16)
		font_vbox.add_child(row)
		var size_lbl := Label.new()
		size_lbl.text = "%2dpx" % size
		size_lbl.custom_minimum_size = Vector2(48, 0)
		size_lbl.add_theme_font_size_override("font_size", 13)
		size_lbl.add_theme_color_override("font_color", Color(0.56, 0.58, 0.62))
		row.add_child(size_lbl)
		var sample_zh := Label.new()
		sample_zh.text = "中文：打击 防御 休息 商店 事件 遗物 药水"
		sample_zh.add_theme_font_size_override("font_size", size)
		sample_zh.add_theme_color_override("font_color", Color(0.92, 0.84, 0.72))
		row.add_child(sample_zh)
		var sample_en := Label.new()
		sample_en.text = "EN: HP 80/80  Gold 120  +3 STR"
		sample_en.add_theme_font_size_override("font_size", size)
		sample_en.add_theme_color_override("font_color", Color(0.72, 0.94, 1.0))
		row.add_child(sample_en)

	_add_section_title("色彩调色板  （从代码中提取的实际使用颜色）")

	var color_data := [
		{"color": Color(0.92, 0.84, 0.72), "usage": "正文描述  ×11处（最多）"},
		{"color": Color(0.98, 0.90, 0.72), "usage": "场景标题"},
		{"color": Color(0.94, 0.84, 0.54), "usage": "金币/强调"},
		{"color": Color(0.72, 0.94, 1.00), "usage": "能量/蓝色数值"},
		{"color": Color(0.40, 0.85, 1.00), "usage": "uncommon/玩家回合"},
		{"color": Color(0.52, 0.82, 1.00), "usage": "格挡浮字"},
		{"color": Color(0.42, 0.96, 0.52), "usage": "回血浮字"},
		{"color": Color(1.00, 0.35, 0.24), "usage": "敌方伤害浮字（红）"},
		{"color": Color(1.00, 0.82, 0.36), "usage": "玩家伤害浮字（黄）"},
		{"color": Color(1.00, 0.55, 0.40), "usage": "敌人回合横幅"},
		{"color": Color(0.96, 0.86, 0.68), "usage": "label 次要文字"},
		{"color": Color(0.07, 0.075, 0.085),"usage": "主背景色"},
		{"color": Color(0.08, 0.075, 0.07), "usage": "玩家面板背景"},
	]

	var color_flow := _make_flow_container()
	_content_area.add_child(color_flow)

	for entry in color_data:
		var c: Color = entry["color"] as Color
		var usage: String = str(entry["usage"])
		var swatch := VBoxContainer.new()
		swatch.custom_minimum_size = Vector2(180, 0)
		swatch.add_theme_constant_override("separation", 4)
		color_flow.add_child(swatch)

		var rect := ColorRect.new()
		rect.color = c
		rect.custom_minimum_size = Vector2(180, 36)
		swatch.add_child(rect)

		var hex_lbl := Label.new()
		hex_lbl.text = "rgb(%.2f,%.2f,%.2f)" % [c.r, c.g, c.b]
		hex_lbl.add_theme_font_size_override("font_size", 11)
		hex_lbl.add_theme_color_override("font_color", Color(0.62, 0.62, 0.62))
		swatch.add_child(hex_lbl)

		var usage_lbl := Label.new()
		usage_lbl.text = usage
		usage_lbl.add_theme_font_size_override("font_size", 12)
		usage_lbl.add_theme_color_override("font_color", Color(0.82, 0.80, 0.76))
		usage_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		usage_lbl.custom_minimum_size = Vector2(180, 0)
		swatch.add_child(usage_lbl)

	_add_section_title("背景图总览  （1920×1080，RGB 无透明通道）")
	var all_bg_row := HBoxContainer.new()
	all_bg_row.add_theme_constant_override("separation", 12)
	_content_area.add_child(all_bg_row)
	for bg_info in [
		{"path": "res://assets/backgrounds/bg_map.png",          "label": "bg_map\n（6场景共用）"},
		{"path": "res://assets/backgrounds/bg_battle_dungeon.png","label": "bg_battle_dungeon\n（普通战斗）"},
		{"path": "res://assets/backgrounds/bg_battle_boss.png",   "label": "bg_battle_boss\n（Boss战 v1_boss_01）"},
		{"path": "res://assets/backgrounds/bg_main_menu.png",     "label": "bg_main_menu\n（有资源未使用）"},
		{"path": "res://assets/backgrounds/bg_battle_cave.png",   "label": "bg_battle_cave\n（有资源未使用）"},
	]:
		_add_background_preview(all_bg_row, str(bg_info["path"]), str(bg_info["label"]))


## ─────────────────────────────────────────────────────────────
## 工具函数
## ─────────────────────────────────────────────────────────────

func _add_section_title(text: String) -> void:
	var lbl := Label.new()
	lbl.text = text
	lbl.add_theme_font_size_override("font_size", 15)
	lbl.add_theme_color_override("font_color", Color(0.68, 0.74, 0.84))
	lbl.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.6))
	lbl.add_theme_constant_override("shadow_offset_y", 1)
	UILayoutStoreScript.apply_gallery_layout(lbl, "gallery.section_title")
	_content_area.add_child(lbl)


func _add_rarity_label(rarity: String, color: Color, count: int) -> void:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	_content_area.add_child(row)

	var dot := ColorRect.new()
	dot.color = color
	dot.custom_minimum_size = Vector2(12, 12)
	dot.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(dot)

	var lbl := Label.new()
	lbl.text = "%s  (%d张)" % [rarity.to_upper(), count]
	lbl.add_theme_font_size_override("font_size", 14)
	lbl.add_theme_color_override("font_color", color)
	UILayoutStoreScript.apply_gallery_layout(lbl, "gallery.rarity_label")
	row.add_child(lbl)


func _add_error_label(text: String) -> void:
	var lbl := Label.new()
	lbl.text = "⚠ " + text
	lbl.add_theme_font_size_override("font_size", 16)
	lbl.add_theme_color_override("font_color", Color(1.0, 0.4, 0.3))
	_content_area.add_child(lbl)


func _make_flow_container() -> HFlowContainer:
	var flow := HFlowContainer.new()
	flow.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	flow.add_theme_constant_override("h_separation", 8)
	flow.add_theme_constant_override("v_separation", 8)
	return flow


func _add_background_preview(parent: Node, path: String, label_text: String) -> void:
	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)
	parent.add_child(vbox)

	var tex_rect := TextureRect.new()
	if ResourceLoader.exists(path, "Texture2D"):
		tex_rect.texture = load(path)
		tex_rect.custom_minimum_size = Vector2(320, 180)
		tex_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	else:
		tex_rect.custom_minimum_size = Vector2(320, 180)
		var placeholder := ColorRect.new()
		placeholder.color = Color(0.3, 0.15, 0.15)
		placeholder.set_anchors_preset(Control.PRESET_FULL_RECT)
		tex_rect.add_child(placeholder)
		var miss := Label.new()
		miss.text = "文件不存在"
		miss.add_theme_color_override("font_color", Color(1.0, 0.4, 0.3))
		miss.set_anchors_preset(Control.PRESET_CENTER)
		tex_rect.add_child(miss)
	vbox.add_child(tex_rect)
	UILayoutStoreScript.apply_layout(tex_rect, "background.preview", path)

	var lbl := Label.new()
	lbl.text = label_text
	lbl.add_theme_font_size_override("font_size", 12)
	lbl.add_theme_color_override("font_color", Color(0.72, 0.70, 0.65))
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(lbl)


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)


## ─────────────────────────────────────────────────────────────
## 通用场景嵌入框架
## ─────────────────────────────────────────────────────────────

## 嵌入真实场景到 SubViewport，交互层捕获右键打开 live 编辑器
## mock_fn: 在场景实例化前注入所需 GameState 数据
func _build_scene_tab(scene_path: String, mock_fn: Callable) -> void:
	var hint := Label.new()
	hint.text = "右键任意 UI 元素 → 打开实时编辑器（属性面板在右侧，背景即为实时预览）"
	hint.add_theme_font_size_override("font_size", 13)
	hint.add_theme_color_override("font_color", Color(0.52, 0.82, 1.0))
	_content_area.add_child(hint)

	if not ResourceLoader.exists(scene_path):
		_add_error_label("场景文件不存在：%s" % scene_path)
		return

	## 调用 mock 注入，准备 GameState
	mock_fn.call()

	## SubViewportContainer 固定 16:9 高度
	var container := SubViewportContainer.new()
	container.stretch = true
	container.custom_minimum_size = Vector2(0, 620)
	container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_content_area.add_child(container)

	var viewport := SubViewport.new()
	viewport.size = Vector2i(1280, 720)
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	container.add_child(viewport)

	## 实例化场景，标记 gallery_preview 让 _ready 跳过业务逻辑
	var scene_res: PackedScene = load(scene_path)
	var scene_node: Node = scene_res.instantiate()
	scene_node.set_meta("gallery_preview", true)
	viewport.add_child(scene_node)
	## 暂停 _process 避免战斗/动画逻辑持续运行（序列帧动画除外）
	scene_node.set_process(false)
	scene_node.set_physics_process(false)

	## 透明交互层：捕获鼠标，不阻断 SubViewport 内部
	var overlay := Control.new()
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	container.add_child(overlay)

	overlay.gui_input.connect(func(event: InputEvent) -> void:
		if not event is InputEventMouseButton:
			return
		var mouse := event as InputEventMouseButton
		if not (mouse.pressed and mouse.button_index == MOUSE_BUTTON_RIGHT):
			return
		## 坐标从 overlay 空间映射到 viewport 空间
		var scale_x := float(viewport.size.x) / maxf(container.size.x, 1.0)
		var scale_y := float(viewport.size.y) / maxf(container.size.y, 1.0)
		var vp_pos := mouse.position * Vector2(scale_x, scale_y)
		var hit := _pick_layout_node(scene_node, vp_pos)
		if hit != null:
			_open_live_editor(hit, scene_node, container, Vector2(viewport.size))
		else:
			hint.text = "未找到可编辑元素（需要 layout_element_id meta）— 右键其他位置再试"
	)


## 在 Viewport 树里找有 layout_element_id 且矩形包含 vp_pos 的节点
## 逆序遍历保证后渲染（上层）节点优先命中
func _pick_layout_node(root: Node, vp_pos: Vector2) -> Control:
	var candidates: Array[Control] = []
	_collect_layout_controls(root, candidates)
	candidates.reverse()
	for node in candidates:
		if node.get_global_rect().has_point(vp_pos):
			return node
	return null


func _collect_layout_controls(root: Node, result: Array[Control]) -> void:
	if root is Control and (root as Control).has_meta("layout_element_id"):
		result.append(root as Control)
	for child in root.get_children():
		_collect_layout_controls(child, result)


func _open_live_editor(control: Control, scene_root: Node, preview_container: Control, viewport_size: Vector2) -> void:
	## 复用已有编辑器：右键新节点时直接切换，不叠加新面板
	if _live_editor != null and is_instance_valid(_live_editor):
		_live_editor.open(control, true, scene_root, preview_container, viewport_size)
		return
	var editor := UILayoutEditorScript.new()
	_live_editor = editor
	add_child(editor)
	editor.open(control, true, scene_root, preview_container, viewport_size)
	editor.closed.connect(func(_saved: bool) -> void:
		_live_editor = null
	)


## ─────────────────────────────────────────────────────────────
## Mock 数据注入（各场景）
## ─────────────────────────────────────────────────────────────

func _mock_base() -> void:
	var data_loader: Variant = _autoload("DataLoader")
	var game_state: Variant = _autoload("GameState")
	if data_loader == null or game_state == null:
		return
	data_loader.load_all()
	var run_config: Dictionary = data_loader.get_run_config("act1_map_run")
	if not run_config.is_empty():
		game_state.start_new_run(run_config)


func _mock_battle() -> void:
	_mock_base()
	## 战斗场景 _ready 里会检查 gallery_preview meta 跳过 start_combat


func _mock_map() -> void:
	_mock_base()


func _mock_shop() -> void:
	_mock_base()
	var game_state: Variant = _autoload("GameState")
	if game_state != null:
		game_state.player_gold = 999


func _mock_reward() -> void:
	_mock_base()


func _mock_event() -> void:
	_mock_base()


func _mock_rest() -> void:
	_mock_base()


func _mock_result() -> void:
	_mock_base()
	var game_state: Variant = _autoload("GameState")
	if game_state != null:
		game_state.battle_wins = 3

## 所有有序列帧的动画条目：[folder_name, frame_prefix, label]
const ANIM_ENTRIES := [
	["slime",            "enemy_slime",            "布丁怪"],
	["slime_king",       "enemy_slime_king",       "史莱姆王"],
	["bat",              "enemy_bat",              "吸血蝙蝠"],
	["mushroom",         "enemy_mushroom",         "蘑菇精"],
	["gargoyle",         "enemy_gargoyle",         "石像鬼"],
	["shadow_mage",      "enemy_shadow_mage",      "影法师"],
	["skeleton",         "enemy_skeleton",         "骷髅兵"],
	["corrupted_knight", "enemy_corrupted_knight", "堕落骑士"],
	["orc_berserker",    "enemy_orc_berserker",    "兽人狂战士"],
	["ancient_dragon",   "enemy_ancient_dragon",   "远古巨龙"],
]

func _build_anim_tab() -> void:
	_add_section_title("序列帧动画预览 — 点击格子切换 idle / hit，红色边框 = 素材有问题")

	var help := Label.new()
	help.text = "每格显示动画名 / 帧数 / FPS。⚠ = 无序列帧文件（仅静态图）。"
	help.add_theme_font_size_override("font_size", 13)
	help.add_theme_color_override("font_color", Color(0.72, 0.82, 0.94))
	_content_area.add_child(help)

	var flow := _make_flow_container()
	flow.add_theme_constant_override("h_separation", 20)
	flow.add_theme_constant_override("v_separation", 20)
	_content_area.add_child(flow)

	for entry in ANIM_ENTRIES:
		var folder: String = str(entry[0])
		var prefix: String = str(entry[1])
		var label_text: String = str(entry[2])
		var base_dir := "res://assets/enemies/%s" % folder

		## 外框卡片
		var card := PanelContainer.new()
		var card_style := StyleBoxFlat.new()
		card_style.bg_color = Color(0.10, 0.11, 0.14)
		card_style.set_corner_radius_all(8)
		card_style.set_border_width_all(2)
		card_style.border_color = Color(0.28, 0.32, 0.40)
		card.add_theme_stylebox_override("panel", card_style)
		card.custom_minimum_size = Vector2(172, 0)
		flow.add_child(card)

		var vbox := VBoxContainer.new()
		vbox.add_theme_constant_override("separation", 6)
		card.add_child(vbox)

		## 怪物名称
		var name_lbl := Label.new()
		name_lbl.text = label_text
		name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		name_lbl.add_theme_font_size_override("font_size", 14)
		name_lbl.add_theme_color_override("font_color", Color(0.92, 0.84, 0.70))
		vbox.add_child(name_lbl)

		## idle / hit 两排
		for anim_name in ["idle", "hit"]:
			var rect := TextureRect.new()
			rect.custom_minimum_size = Vector2(160, 140)
			rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
			rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
			rect.mouse_filter = Control.MOUSE_FILTER_STOP

			var helper: Variant = SpriteAnimHelperScript.new(rect, base_dir, prefix)
			var has: bool = helper.has_frames(anim_name)

			## 状态标签（显示在图片下方）
			var stat_lbl := Label.new()
			stat_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			stat_lbl.add_theme_font_size_override("font_size", 11)

			if has:
				helper.play(anim_name, Callable(), 6.0, 0, true)
				_anim_helpers.append(helper)
				## 统计帧数
				var anim_dir := "%s/%s" % [base_dir, anim_name]
				var count := 0
				while ResourceLoader.exists(
					"%s/%s_%s_%03d.png" % [anim_dir, prefix, anim_name, count], "Texture2D"):
					count += 1
				stat_lbl.text = "%s  %d帧 / 6fps" % [anim_name, count]
				stat_lbl.add_theme_color_override("font_color", Color(0.62, 0.90, 0.62))
			else:
				## 无序列帧，显示静态图 + 警告
				var static_path := "res://assets/enemies/%s/%s_%s.png" % [folder, prefix, anim_name]
				if ResourceLoader.exists(static_path, "Texture2D"):
					rect.texture = load(static_path)
				stat_lbl.text = "⚠ %s  无序列帧" % anim_name
				stat_lbl.add_theme_color_override("font_color", Color(1.0, 0.55, 0.25))
				card_style.border_color = Color(0.82, 0.28, 0.20)

			var anim_wrap := VBoxContainer.new()
			anim_wrap.add_theme_constant_override("separation", 2)
			vbox.add_child(anim_wrap)
			anim_wrap.add_child(rect)
			anim_wrap.add_child(stat_lbl)




func _register_editable_inputs() -> void:
	if _content_area == null:
		return
	for control in _editable_controls(_content_area):
		if control.get_meta("_layout_editor_input_registered", false):
			continue
		control.set_meta("_layout_editor_input_registered", true)
		control.gui_input.connect(_on_editable_gui_input.bind(control))


func _editable_controls(root: Control) -> Array[Control]:
	var result: Array[Control] = []
	if root.has_meta("layout_element_id"):
		result.append(root)
	for child in root.get_children():
		if child is Control:
			result.append_array(_editable_controls(child as Control))
	return result


func _on_editable_gui_input(event: InputEvent, control: Control) -> void:
	if event is InputEventMouseButton:
		var mouse := event as InputEventMouseButton
		if mouse.pressed and mouse.button_index == MOUSE_BUTTON_RIGHT:
			_open_layout_editor(control)


func _open_first_editable() -> void:
	var controls := _editable_controls(_content_area)
	for preferred_id in ["card.root", "relic.root", "status.root", "background.preview", "gallery.section_title"]:
		for control in controls:
			if str(control.get_meta("layout_element_id", "")) == preferred_id:
				_open_layout_editor(control)
				return


func _open_layout_editor(control: Control) -> void:
	var editor := UILayoutEditorScript.new()
	add_child(editor)
	editor.open(control)
	editor.closed.connect(_on_layout_editor_closed)


func _on_layout_editor_closed(saved: bool) -> void:
	if saved:
		_switch_tab(_active_tab)


## ─────────────────────────────────────────────────────────────
## Tab: Spec JSON 查看 / 编辑
## 左侧：spec 文件列表；右侧：预览 + JSON 文本编辑器
## ─────────────────────────────────────────────────────────────

func _build_specs_tab() -> void:
	var specs := _UISpecEditor.list_specs()
	if specs.is_empty():
		_add_error_label("未找到任何 ui_specs/*.ui.json 文件")
		return

	## 顶层：左右水平分栏，占满内容区剩余高度
	var split := HSplitContainer.new()
	split.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	split.size_flags_vertical   = Control.SIZE_EXPAND_FILL
	split.custom_minimum_size   = Vector2(0, 640)
	split.split_offset          = 320   ## 左侧文件列表默认宽度
	_content_area.add_child(split)

	## ── 左侧：文件列表 ───────────────────────────────────────────
	var file_panel := VBoxContainer.new()
	file_panel.custom_minimum_size = Vector2(180, 0)
	file_panel.add_theme_constant_override("separation", 3)
	split.add_child(file_panel)

	var file_title := Label.new()
	file_title.text = "📄 Spec 文件"
	file_title.add_theme_font_size_override("font_size", 13)
	file_title.add_theme_color_override("font_color", Color(0.52, 0.82, 1.0))
	file_panel.add_child(file_title)

	## ── 右侧：上下两半（预览 / JSON 编辑器）──────────────────────
	var right_split := VSplitContainer.new()
	right_split.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right_split.size_flags_vertical   = Control.SIZE_EXPAND_FILL
	right_split.split_offset          = 400   ## 预览区默认高度
	split.add_child(right_split)

	## ── 预览区：SubViewport 渲染完整 1280×720 ─────────────────────
	var preview_outer := VBoxContainer.new()
	preview_outer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	preview_outer.size_flags_vertical   = Control.SIZE_EXPAND_FILL
	preview_outer.add_theme_constant_override("separation", 4)
	right_split.add_child(preview_outer)

	var preview_toolbar := HBoxContainer.new()
	preview_toolbar.add_theme_constant_override("separation", 8)
	preview_outer.add_child(preview_toolbar)

	var preview_title := Label.new()
	preview_title.text = "预览（1280×720）"
	preview_title.add_theme_font_size_override("font_size", 13)
	preview_title.add_theme_color_override("font_color", Color(0.72, 0.72, 0.72))
	preview_title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	preview_toolbar.add_child(preview_title)

	var mock_btn := Button.new()
	mock_btn.text = "注入 Mock 数据"
	mock_btn.tooltip_text = "为场景预览注入 GameState mock，使场景内容正常显示"
	mock_btn.custom_minimum_size = Vector2(130, 28)
	preview_toolbar.add_child(mock_btn)

	## SubViewportContainer：自动按容器大小缩放 1280×720 内容
	var preview_container := SubViewportContainer.new()
	preview_container.stretch = true
	preview_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	preview_container.size_flags_vertical   = Control.SIZE_EXPAND_FILL
	preview_outer.add_child(preview_container)

	var preview_vp := SubViewport.new()
	preview_vp.name = "SpecPreviewViewport"
	preview_vp.size = Vector2i(1280, 720)
	preview_vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	preview_container.add_child(preview_vp)

	## ── JSON 编辑器区 ─────────────────────────────────────────────
	var editor_panel := VBoxContainer.new()
	editor_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	editor_panel.size_flags_vertical   = Control.SIZE_EXPAND_FILL
	editor_panel.add_theme_constant_override("separation", 4)
	right_split.add_child(editor_panel)

	## 编辑器工具栏
	var edit_toolbar := HBoxContainer.new()
	edit_toolbar.add_theme_constant_override("separation", 6)
	editor_panel.add_child(edit_toolbar)

	var path_label := Label.new()
	path_label.text = "—"
	path_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	path_label.add_theme_font_size_override("font_size", 13)
	path_label.add_theme_color_override("font_color", Color(0.88, 0.72, 0.40))
	edit_toolbar.add_child(path_label)

	var status_lbl := Label.new()
	status_lbl.text = ""
	status_lbl.custom_minimum_size = Vector2(180, 0)
	status_lbl.add_theme_font_size_override("font_size", 13)
	status_lbl.add_theme_color_override("font_color", Color(0.52, 0.94, 0.52))
	edit_toolbar.add_child(status_lbl)

	## JSON TextEdit
	var text_edit := TextEdit.new()
	text_edit.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	text_edit.size_flags_vertical   = Control.SIZE_EXPAND_FILL
	text_edit.syntax_highlighter    = CodeHighlighter.new()
	text_edit.add_theme_font_size_override("font_size", 13)
	text_edit.add_theme_color_override("background_color", Color(0.06, 0.065, 0.075))
	text_edit.add_theme_color_override("font_color",       Color(0.88, 0.88, 0.88))
	editor_panel.add_child(text_edit)

	## 按钮行
	var btn_row := HBoxContainer.new()
	btn_row.add_theme_constant_override("separation", 8)
	editor_panel.add_child(btn_row)

	var apply_btn := Button.new()
	apply_btn.text = "▶ 应用预览"
	apply_btn.tooltip_text = "把当前 JSON 渲染到左上方预览区（不写磁盘）"
	apply_btn.custom_minimum_size = Vector2(120, 32)
	btn_row.add_child(apply_btn)

	var save_btn := Button.new()
	save_btn.text = "💾 保存"
	save_btn.tooltip_text = "保存到 res://ui_specs/ 对应文件"
	save_btn.custom_minimum_size = Vector2(90, 32)
	btn_row.add_child(save_btn)

	var save_apply_btn := Button.new()
	save_apply_btn.text = "💾 保存 + 预览"
	save_apply_btn.tooltip_text = "保存到文件并刷新预览"
	save_apply_btn.custom_minimum_size = Vector2(130, 32)
	btn_row.add_child(save_apply_btn)

	var fmt_btn := Button.new()
	fmt_btn.text = "整理"
	fmt_btn.custom_minimum_size = Vector2(60, 32)
	btn_row.add_child(fmt_btn)

	var validate_btn := Button.new()
	validate_btn.text = "验证"
	validate_btn.custom_minimum_size = Vector2(60, 32)
	btn_row.add_child(validate_btn)

	## ── 状态辅助函数 ──────────────────────────────────────────────
	var current_spec_path := ""

	var _set_status := func(msg: String, ok: bool) -> void:
		status_lbl.text = msg
		status_lbl.add_theme_color_override("font_color",
			Color(0.52, 0.94, 0.52) if ok else Color(1.0, 0.4, 0.3))

	## ── 预览重建 ──────────────────────────────────────────────────
	var _rebuild_preview := func(spec_path: String) -> void:
		for c in preview_vp.get_children():
			c.queue_free()
		if not FileAccess.file_exists(spec_path):
			return
		var ui := _UIBuilder.build(spec_path)
		if ui != null:
			preview_vp.add_child(ui)
		preview_title.text = "预览：%s（1280×720）" % spec_path.get_file()

	## ── 加载 spec 到编辑器 ──────────────────────────────────────
	var _load_spec := func(spec_path: String) -> void:
		current_spec_path = spec_path
		path_label.text = spec_path.get_file()
		status_lbl.text = ""
		var spec := _UISpecEditor.read_spec(spec_path)
		text_edit.text = JSON.stringify(spec, "\t") if not spec.is_empty() else "{}"
		_rebuild_preview.call(spec_path)

	## ── 应用预览（临时文件，不改磁盘）──────────────────────────
	var _apply_preview := func() -> void:
		var parsed := JSON.new()
		if parsed.parse(text_edit.text) != OK:
			_set_status.call("❌ JSON 错误（行 %d）" % parsed.get_error_line(), false)
			return
		var tmp := "user://spec_preview_tmp.ui.json"
		var f := FileAccess.open(tmp, FileAccess.WRITE)
		f.store_string(text_edit.text)
		f.close()
		for c in preview_vp.get_children():
			c.queue_free()
		var ui := _UIBuilder.build(tmp)
		if ui != null:
			preview_vp.add_child(ui)
		DirAccess.remove_absolute(tmp)
		_set_status.call("✅ 预览已更新", true)

	## ── 保存到文件 ───────────────────────────────────────────────
	var _save_spec := func() -> bool:
		if current_spec_path.is_empty():
			_set_status.call("❌ 未选中文件", false)
			return false
		var parsed := JSON.new()
		if parsed.parse(text_edit.text) != OK:
			_set_status.call("❌ JSON 错误，未保存", false)
			return false
		var err := _UISpecEditor.write_spec(current_spec_path, parsed.data)
		if err == OK:
			_set_status.call("✅ 已保存 %s" % current_spec_path.get_file(), true)
			return true
		_set_status.call("❌ 写入失败 (err=%d)" % err, false)
		return false

	## ── 按钮连接 ─────────────────────────────────────────────────
	apply_btn.pressed.connect(func() -> void: _apply_preview.call())

	save_btn.pressed.connect(func() -> void: _save_spec.call())

	save_apply_btn.pressed.connect(func() -> void:
		if _save_spec.call():
			_rebuild_preview.call(current_spec_path)
	)

	fmt_btn.pressed.connect(func() -> void:
		var parsed := JSON.new()
		if parsed.parse(text_edit.text) != OK:
			_set_status.call("❌ JSON 错误（行 %d）" % parsed.get_error_line(), false)
			return
		text_edit.text = JSON.stringify(parsed.data, "\t")
		_set_status.call("✅ 格式整理完成", true)
	)

	validate_btn.pressed.connect(func() -> void:
		var parsed := JSON.new()
		if parsed.parse(text_edit.text) == OK:
			_set_status.call("✅ JSON 语法正确", true)
		else:
			_set_status.call("❌ 第 %d 行：%s" % [parsed.get_error_line(), parsed.get_error_message()], false)
	)

	mock_btn.pressed.connect(func() -> void:
		_mock_base()
		_rebuild_preview.call(current_spec_path)
		_set_status.call("✅ Mock 数据已注入，预览已刷新", true)
	)

	## ── 文件列表 ─────────────────────────────────────────────────
	for spec_path in specs:
		var btn := Button.new()
		btn.text = spec_path.get_file().replace(".ui.json", "")
		btn.custom_minimum_size = Vector2(175, 30)
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn.pressed.connect(_load_spec.bind(spec_path))
		file_panel.add_child(btn)

	## 初始加载第一个 spec
	if not specs.is_empty():
		_load_spec.call(specs[0])
