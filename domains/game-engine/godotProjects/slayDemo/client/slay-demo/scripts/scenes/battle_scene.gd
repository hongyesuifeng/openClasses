extends Control

const BattleControllerScript := preload("res://scripts/battle/battle_controller.gd")
const CardViewFactoryScript := preload("res://scripts/ui/card_view_factory.gd")
const StatusViewFactoryScript := preload("res://scripts/ui/status_view_factory.gd")
const RelicViewFactoryScript := preload("res://scripts/ui/relic_view_factory.gd")
const PotionViewFactoryScript := preload("res://scripts/ui/potion_view_factory.gd")
const PotionServiceScript := preload("res://scripts/potion/potion_service.gd")

const PLAYER_ART := "res://assets/player/sprites/player_warrior_idle.png"
const BACKGROUND_NORMAL := "res://assets/backgrounds/bg_battle_dungeon.png"
const BACKGROUND_BOSS := "res://assets/backgrounds/bg_battle_boss.png"

const ENEMY_ART_BY_KEY := {
	"enemy_slime": "res://assets/enemies/slime/enemy_slime_idle.png",
	"enemy_bat": "res://assets/enemies/bat/enemy_bat_idle.png",
	"enemy_mushroom": "res://assets/enemies/mushroom/enemy_mushroom_idle.png",
	"enemy_gargoyle": "res://assets/enemies/gargoyle/enemy_gargoyle_idle.png",
	"enemy_shadow_mage": "res://assets/enemies/shadow_mage/enemy_shadow_mage_idle.png",
	"enemy_skeleton": "res://assets/enemies/skeleton/enemy_skeleton_idle.png",
	"enemy_corrupted_knight": "res://assets/enemies/corrupted_knight/enemy_corrupted_knight_idle.png",
	"enemy_ancient_dragon": "res://assets/enemies/ancient_dragon/enemy_ancient_dragon_idle.png"
}

const INTENT_ICON_BY_TYPE := {
	"attack": "res://assets/ui/intents/intent_sword.png",
	"defend": "res://assets/ui/intents/intent_shield.png",
	"buff": "res://assets/ui/intents/intent_buff.png",
	"debuff": "res://assets/ui/intents/intent_debuff.png",
	"stun": "res://assets/ui/intents/intent_stun.png"
}

var _battle := BattleControllerScript.new()
var _selected_card_index := -1
var _header_label: Label
var _enemy_row: HBoxContainer
var _hand_row: HBoxContainer
var _pile_label: Label
var _log_label: RichTextLabel
var _status_label: Label
var _player_panel: PanelContainer
var _hp_bar: TextureProgressBar
var _block_bar: TextureProgressBar
var _energy_label: Label
var _enemy_buttons: Array[Button] = []
var _enemy_art_paths: Array[String] = []
var _hand_buttons: Array[Button] = []
var _messages: Array[String] = []
var _last_player_hp := -1
var _last_player_block := -1
var _last_phase := ""
var _banner_queue: Array[Dictionary] = []
var _banner_playing := false
var _player_status_row: HBoxContainer  # 玩家状态栏
var _relic_row: HBoxContainer
var _potion_row: HBoxContainer


func _ready() -> void:
	_build()
	_battle.state_changed.connect(_on_state_changed)
	_battle.message_logged.connect(_on_message_logged)
	_battle.combat_event.connect(_on_combat_event)
	_battle.combat_won.connect(_on_combat_won)
	_battle.combat_lost.connect(_on_combat_lost)

	var game_state: Variant = _autoload("GameState")
	var run_controller: Variant = _autoload("RunController")
	var player_state := {
		"hp": game_state.player_hp,
		"max_hp": game_state.player_max_hp,
		"energy_per_turn": game_state.energy_per_turn,
		"draw_per_turn": game_state.draw_per_turn,
		"relic_ids": game_state.owned_relic_ids
	}
	_battle.setup(run_controller.get_current_encounter_id(), game_state.master_deck, player_state)
	_battle.start_combat()

	## 精英/Boss 战覆盖 BGM（scene_router 已切换到 "battle"，这里细化）
	var data_loader: Variant = _autoload("DataLoader")
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null and data_loader != null:
		var encounter_id: String = str(run_controller.get_current_encounter_id())
		var encounter: Dictionary = data_loader.get_encounter(str(encounter_id))
		var encounter_type := str(encounter.get("encounter_type", "normal"))
		if encounter_type == "elite":
			audio_manager.play_bgm("battle_elite")
		elif encounter_type == "boss":
			audio_manager.play_bgm("battle_boss")


func _build() -> void:
	var run_controller: Variant = _autoload("RunController")
	var encounter_id := str(run_controller.get_current_encounter_id()) if run_controller != null else ""

	var background := TextureRect.new()
	background.texture = load(BACKGROUND_BOSS if encounter_id == "v1_boss_01" else BACKGROUND_NORMAL)
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	add_child(background)

	var tint := ColorRect.new()
	tint.color = Color(0.035, 0.032, 0.038, 0.42)
	tint.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(tint)

	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.offset_left = 18
	root.offset_top = 12
	root.offset_right = -18
	root.offset_bottom = -12
	root.add_theme_constant_override("separation", 8)
	add_child(root)

	_player_panel = PanelContainer.new()
	_player_panel.add_theme_stylebox_override("panel", _panel_style(Color(0.08, 0.075, 0.07, 0.86)))
	root.add_child(_player_panel)

	var top_row := HBoxContainer.new()
	top_row.add_theme_constant_override("separation", 14)
	_player_panel.add_child(top_row)

	var portrait := TextureRect.new()
	portrait.texture = load(PLAYER_ART)
	portrait.custom_minimum_size = Vector2(72, 68)
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	top_row.add_child(portrait)

	var player_stats := VBoxContainer.new()
	player_stats.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	player_stats.add_theme_constant_override("separation", 5)
	top_row.add_child(player_stats)

	_header_label = Label.new()
	_header_label.add_theme_font_size_override("font_size", 20)
	_header_label.add_theme_color_override("font_color", Color(0.98, 0.92, 0.82))
	player_stats.add_child(_header_label)

	_hp_bar = _make_bar("res://assets/ui/bars/ui_hp_bar_bg.png", "res://assets/ui/bars/ui_hp_bar_fill.png")
	player_stats.add_child(_hp_bar)

	_block_bar = _make_bar("res://assets/ui/bars/ui_hp_bar_bg.png", "res://assets/ui/bars/ui_block_bar_fill.png")
	player_stats.add_child(_block_bar)

	var energy_box := HBoxContainer.new()
	energy_box.alignment = BoxContainer.ALIGNMENT_END
	energy_box.custom_minimum_size = Vector2(132, 64)
	top_row.add_child(energy_box)

	var energy_icon := TextureRect.new()
	energy_icon.texture = load("res://assets/ui/icons/ui_energy_crystal.png")
	energy_icon.custom_minimum_size = Vector2(36, 36)
	energy_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	energy_box.add_child(energy_icon)

	_energy_label = Label.new()
	_energy_label.add_theme_font_size_override("font_size", 24)
	_energy_label.add_theme_color_override("font_color", Color(0.72, 0.94, 1.0))
	energy_box.add_child(_energy_label)

	_relic_row = HBoxContainer.new()
	_relic_row.name = "BattleRelicRow"
	_relic_row.add_theme_constant_override("separation", 6)
	player_stats.add_child(_relic_row)
	_render_relics()

	_potion_row = HBoxContainer.new()
	_potion_row.name = "BattlePotionRow"
	_potion_row.add_theme_constant_override("separation", 6)
	player_stats.add_child(_potion_row)
	_render_potions()

	_status_label = Label.new()
	_status_label.add_theme_font_size_override("font_size", 16)
	_status_label.add_theme_color_override("font_color", Color(0.94, 0.88, 0.78))
	root.add_child(_status_label)

	# 玩家状态栏
	_player_status_row = HBoxContainer.new()
	_player_status_row.add_theme_constant_override("separation", 8)
	root.add_child(_player_status_row)

	_enemy_row = HBoxContainer.new()
	_enemy_row.custom_minimum_size = Vector2(0, 270)
	_enemy_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_enemy_row.add_theme_constant_override("separation", 20)
	root.add_child(_enemy_row)

	var lower := HBoxContainer.new()
	lower.size_flags_vertical = Control.SIZE_EXPAND_FILL
	lower.custom_minimum_size = Vector2(0, 210)
	lower.add_theme_constant_override("separation", 16)
	root.add_child(lower)

	_log_label = RichTextLabel.new()
	_log_label.custom_minimum_size = Vector2(240, 0)
	_log_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_log_label.fit_content = true
	_log_label.add_theme_color_override("default_color", Color(0.92, 0.86, 0.76))
	lower.add_child(_log_label)

	var hand_panel := VBoxContainer.new()
	hand_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hand_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	hand_panel.add_theme_constant_override("separation", 6)
	lower.add_child(hand_panel)

	_pile_label = Label.new()
	_pile_label.add_theme_color_override("font_color", Color(0.94, 0.88, 0.78))
	hand_panel.add_child(_pile_label)

	var hand_controls := HBoxContainer.new()
	hand_controls.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hand_controls.size_flags_vertical = Control.SIZE_EXPAND_FILL
	hand_controls.alignment = BoxContainer.ALIGNMENT_CENTER
	hand_controls.add_theme_constant_override("separation", 10)
	hand_panel.add_child(hand_controls)

	var hand_scroll := ScrollContainer.new()
	hand_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hand_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	hand_scroll.custom_minimum_size = Vector2(0, 196)
	hand_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	hand_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	hand_controls.add_child(hand_scroll)

	_hand_row = HBoxContainer.new()
	_hand_row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_hand_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_hand_row.add_theme_constant_override("separation", 8)
	hand_scroll.add_child(_hand_row)

	var end_turn_button := Button.new()
	end_turn_button.text = "结束回合"
	end_turn_button.custom_minimum_size = Vector2(128, 50)
	end_turn_button.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	end_turn_button.pressed.connect(_on_end_turn_pressed)
	hand_controls.add_child(end_turn_button)


func _on_state_changed(snapshot: Dictionary) -> void:
	var player_hp := int(snapshot.get("player_hp", 0))
	var player_max_hp := int(snapshot.get("player_max_hp", 0))
	var player_block := int(snapshot.get("player_block", 0))
	var energy := int(snapshot.get("energy", 0))
	var energy_per_turn := int(snapshot.get("energy_per_turn", 0))

	_header_label.text = "HP %d/%d  格挡 %d  力量 %d  回合 %d" % [
		player_hp,
		player_max_hp,
		player_block,
		int(snapshot.get("player_strength", 0)),
		int(snapshot.get("turn_number", 0))
	]
	_hp_bar.max_value = maxi(1, player_max_hp)
	_hp_bar.value = player_hp
	_block_bar.max_value = maxi(1, player_max_hp)
	_block_bar.value = player_block
	_energy_label.text = "%d/%d" % [energy, energy_per_turn]

	if (_last_player_hp >= 0 and player_hp != _last_player_hp) or (_last_player_block >= 0 and player_block != _last_player_block):
		_flash_player_panel()
	_last_player_hp = player_hp
	_last_player_block = player_block

	var phase := str(snapshot.get("phase", ""))
	if _selected_card_index >= 0:
		_status_label.text = "已选择卡牌，点击一个敌人。"
	else:
		_status_label.text = "选择攻击牌后点击目标。当前阶段: %s" % phase

	## 检测回合切换并播放提示
	if _last_phase != phase and not _last_phase.is_empty():
		if phase == "player":
			_queue_turn_banner("玩家回合", Color(0.4, 0.85, 1.0))
		elif phase == "enemy":
			_queue_turn_banner("敌人回合", Color(1.0, 0.55, 0.4))
	_last_phase = phase

	_render_enemies(snapshot.get("enemies", []))
	_render_hand(snapshot.get("hand", []), phase)
	_render_player_statuses(snapshot.get("player_statuses", []))

	var piles: Dictionary = snapshot.get("piles", {})
	_pile_label.text = "抽牌堆 %d | 手牌 %d | 弃牌堆 %d | 消耗 %d" % [
		int(piles.get("draw", 0)),
		int(piles.get("hand", 0)),
		int(piles.get("discard", 0)),
		int(piles.get("exhaust", 0))
	]


func _render_enemies(enemies: Array) -> void:
	_clear_children(_enemy_row)
	_enemy_buttons.clear()
	_enemy_art_paths.clear()
	for index in range(enemies.size()):
		var enemy := enemies[index] as Dictionary
		var intent: Dictionary = enemy.get("intent", {})
		var art_path := str(ENEMY_ART_BY_KEY.get(str(enemy.get("art_key", "")), ENEMY_ART_BY_KEY["enemy_slime"]))
		var button := Button.new()
		button.custom_minimum_size = Vector2(260, 252)
		button.text = ""
		button.clip_contents = true
		button.add_theme_stylebox_override("normal", _panel_style(Color(0.08, 0.065, 0.055, 0.82)))
		button.add_theme_stylebox_override("hover", _panel_style(Color(0.12, 0.09, 0.07, 0.92)))
		button.add_theme_stylebox_override("pressed", _panel_style(Color(0.16, 0.11, 0.08, 0.96)))
		button.pressed.connect(_on_enemy_pressed.bind(index))
		button.pivot_offset = Vector2(130, 126)

		var sprite := TextureRect.new()
		sprite.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		sprite.position = Vector2(29, 0)
		sprite.size = Vector2(202, 165)
		sprite.custom_minimum_size = Vector2.ZERO
		sprite.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		sprite.mouse_filter = Control.MOUSE_FILTER_IGNORE
		sprite.z_index = 2
		sprite.texture = load(art_path)
		sprite.set_deferred("size", Vector2(202, 165))
		button.add_child(sprite)

		var name_label := _make_label(str(enemy.get("name", "")), 18, HORIZONTAL_ALIGNMENT_CENTER)
		name_label.anchor_left = 0.08
		name_label.anchor_top = 0.70
		name_label.anchor_right = 0.92
		name_label.anchor_bottom = 0.79
		button.add_child(name_label)

		var hp := _make_label("HP %d/%d  格挡 %d" % [
			int(enemy.get("hp", 0)),
			int(enemy.get("max_hp", 0)),
			int(enemy.get("block", 0))
		], 14, HORIZONTAL_ALIGNMENT_CENTER)
		hp.anchor_left = 0.05
		hp.anchor_top = 0.80
		hp.anchor_right = 0.95
		hp.anchor_bottom = 0.88
		button.add_child(hp)

		var intent_icon := TextureRect.new()
		intent_icon.texture = load(str(INTENT_ICON_BY_TYPE.get(str(intent.get("type", "")), "res://assets/ui/intents/intent_question.png")))
		intent_icon.anchor_left = 0.18
		intent_icon.anchor_top = 0.89
		intent_icon.anchor_right = 0.34
		intent_icon.anchor_bottom = 1.0
		intent_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		intent_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
		button.add_child(intent_icon)

		var intent_text := _make_label("%s %d" % [str(intent.get("name", "")), int(intent.get("value", 0))], 14, HORIZONTAL_ALIGNMENT_LEFT)
		intent_text.anchor_left = 0.36
		intent_text.anchor_top = 0.90
		intent_text.anchor_right = 0.92
		intent_text.anchor_bottom = 1.0
		button.add_child(intent_text)

		# 敌人状态显示
		var enemy_statuses: Array = enemy.get("statuses", [])
		if not enemy_statuses.is_empty():
			var status_row := StatusViewFactoryScript.create_status_row(
				enemy_statuses, true, Callable(self, "_on_status_pressed"))
			status_row.anchor_left = 0.05
			status_row.anchor_top = 0.94
			status_row.anchor_right = 0.95
			status_row.anchor_bottom = 1.0
			status_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
			button.add_child(status_row)

		_enemy_row.add_child(button)
		_enemy_buttons.append(button)
		_enemy_art_paths.append(art_path)


func _render_player_statuses(statuses: Array) -> void:
	_clear_children(_player_status_row)
	if statuses.is_empty():
		return

	for status in statuses:
		var status_id := str(status.get("id", ""))
		var stacks := int(status.get("stacks", 0))
		if stacks <= 0:
			continue
		var label := StatusViewFactoryScript.create_status_label(
			status_id, stacks, false, Callable(self, "_on_status_pressed"))
		_player_status_row.add_child(label)


func _render_relics() -> void:
	if _relic_row == null:
		return
	_clear_children(_relic_row)
	var game_state: Variant = _autoload("GameState")
	var relics: Array = game_state.get_owned_relics() if game_state != null else []
	var row := RelicViewFactoryScript.create_relic_row(relics, Callable(self, "_on_relic_pressed"))
	for child in row.get_children():
		row.remove_child(child)
		_relic_row.add_child(child)
	row.queue_free()


func _on_relic_pressed(relic: Dictionary) -> void:
	_status_label.text = RelicViewFactoryScript.detail_text(relic)


func _on_status_pressed(status_id: String, stacks: int) -> void:
	_status_label.text = StatusViewFactoryScript.get_status_description(status_id, stacks)


func _render_potions() -> void:
	if _potion_row == null:
		return
	_clear_children(_potion_row)
	var game_state: Variant = _autoload("GameState")
	if game_state == null:
		return
	var label := Label.new()
	label.text = "药水:"
	label.add_theme_font_size_override("font_size", 14)
	label.add_theme_color_override("font_color", Color(0.90, 0.82, 0.68))
	_potion_row.add_child(label)
	for slot in range(game_state.MAX_POTION_SLOTS):
		var potion_entry: Dictionary = game_state.get_potion_at(slot)
		if potion_entry.is_empty():
			_potion_row.add_child(PotionViewFactoryScript.create_empty_slot())
		else:
			var data_loader: Variant = _autoload("DataLoader")
			var potion: Dictionary = data_loader.get_potion(str(potion_entry.get("id", "")))
			var btn := PotionViewFactoryScript.create_potion_button(
				potion, Callable(self, "_on_potion_pressed").bind(slot))
			_potion_row.add_child(btn)


func _on_potion_pressed(slot: int) -> void:
	var game_state: Variant = _autoload("GameState")
	var data_loader: Variant = _autoload("DataLoader")
	if game_state == null or _battle == null:
		return
	if PotionServiceScript.use_potion(slot, game_state, _battle, data_loader):
		var audio_manager: Variant = _autoload("AudioManager")
		if audio_manager != null:
			audio_manager.play_sfx("potion")
		_render_potions()


func _render_hand(hand: Array, phase: String) -> void:
	_clear_children(_hand_row)
	_hand_buttons.clear()
	for index in range(hand.size()):
		var card := hand[index] as Dictionary
		var button: Button = CardViewFactoryScript.create_card_button(card, Vector2(132, 183), index == _selected_card_index, phase != "player")
		button.pressed.connect(_on_card_pressed.bind(index))
		## 添加悬浮放大效果
		button.mouse_entered.connect(_on_card_hover.bind(button))
		button.mouse_exited.connect(_on_card_unhover.bind(button))
		_hand_row.add_child(button)
		_hand_buttons.append(button)


## 卡牌悬浮放大
func _on_card_hover(button: Button) -> void:
	if not is_instance_valid(button) or button.disabled:
		return
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(button, "scale", Vector2(1.12, 1.12), 0.12)
	tween.tween_property(button, "position:y", button.position.y - 8.0, 0.12)


## 卡牌取消悬浮
func _on_card_unhover(button: Button) -> void:
	if not is_instance_valid(button):
		return
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(button, "scale", Vector2.ONE, 0.12)
	tween.tween_property(button, "position:y", 0.0, 0.12)


func _on_card_pressed(index: int) -> void:
	var snapshot := _battle.get_snapshot()
	var hand: Array = snapshot.get("hand", [])
	if index < 0 or index >= hand.size():
		return

	var card := hand[index] as Dictionary
	if str(card.get("target", "")) == "single_enemy":
		_selected_card_index = index
		_status_label.text = "已选择 %s，点击一个敌人。" % str(card.get("name", ""))
		_render_hand(hand, str(snapshot.get("phase", "")))
	else:
		_spawn_card_echo(card, index)
		var played := _battle.play_card(index)
		if played:
			_play_card_feedback()
			_flash_player_panel()


func _on_enemy_pressed(index: int) -> void:
	if _selected_card_index < 0:
		return

	var hand_index := _selected_card_index
	var snapshot := _battle.get_snapshot()
	var hand: Array = snapshot.get("hand", [])
	var card: Dictionary = {}
	if hand_index >= 0 and hand_index < hand.size():
		card = hand[hand_index] as Dictionary
	_spawn_card_echo(card, hand_index)
	_selected_card_index = -1
	var played := _battle.play_card(hand_index, index)
	if played:
		_play_card_feedback()


func _on_end_turn_pressed() -> void:
	_selected_card_index = -1
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null:
		audio_manager.play_sfx("button")
	_battle.end_player_turn()


func _on_message_logged(message: String) -> void:
	_messages.append(message)
	if _messages.size() > 10:
		_messages.pop_front()
	_log_label.text = "\n".join(_messages)


func _on_combat_event(event: Dictionary) -> void:
	var vfx_manager: Variant = _autoload("VFXManager")
	var audio_manager: Variant = _autoload("AudioManager")
	if vfx_manager != null:
		vfx_manager.set_current_scene(self)

	match str(event.get("type", "")):
		"enemy_damage":
			var enemy_index := int(event.get("enemy_index", -1))
			var damage := int(event.get("value", 0))
			var blocked := int(event.get("blocked", 0))
			_hit_enemy_feedback(enemy_index)
			_spawn_enemy_damage_text(enemy_index, damage, blocked)
			if vfx_manager != null and damage > 0:
				vfx_manager.play_attack_effect("slash", _get_enemy_center(enemy_index))
			if audio_manager != null:
				audio_manager.play_sfx("hit" if blocked == 0 else "block")
		"player_damage":
			_flash_player_panel()
			var damage := int(event.get("value", 0))
			_spawn_player_damage_text(damage, int(event.get("blocked", 0)))
			if vfx_manager != null and damage > 0:
				vfx_manager.play_attack_effect("slash", _get_player_center())
			if audio_manager != null:
				audio_manager.play_sfx("player_hurt")
		"block_gained":
			if vfx_manager != null:
				var pos: Vector2
				if str(event.get("target", "")) == "player":
					pos = _get_player_center()
				else:
					pos = _get_enemy_center(int(event.get("enemy_index", -1)))
				vfx_manager.play_block_effect(pos, int(event.get("value", 0)))
			if audio_manager != null and str(event.get("target", "")) == "player":
				audio_manager.play_sfx("block")
		"status_applied":
			if vfx_manager != null:
				var pos: Vector2
				if str(event.get("target", "")) == "player":
					pos = _get_player_center()
				else:
					pos = _get_enemy_center(int(event.get("target_index", -1)))
				vfx_manager.play_status_effect(str(event.get("status_id", "")), pos)
			if audio_manager != null:
				const StatusViewFactoryScript2 := preload("res://scripts/ui/status_view_factory.gd")
				var sfx_key := "status_debuff" if StatusViewFactoryScript2.is_debuff(str(event.get("status_id", ""))) else "status_buff"
				audio_manager.play_sfx(sfx_key)
		"heal":
			if vfx_manager != null:
				var pos: Vector2
				if str(event.get("target", "")) == "player":
					pos = _get_player_center()
				else:
					pos = _get_enemy_center(int(event.get("enemy_index", -1)))
				vfx_manager.play_heal_effect(pos)
			if audio_manager != null and str(event.get("target", "")) == "player":
				audio_manager.play_sfx("heal")
		"enemy_died":
			if vfx_manager != null:
				var enemy_index := int(event.get("enemy_index", -1))
				var pos := _get_enemy_center(enemy_index)
				if pos != Vector2.ZERO:
					vfx_manager.play_death_effect(pos)
			if audio_manager != null:
				audio_manager.play_sfx("enemy_die")


## 获取敌人中心位置
func _get_enemy_center(enemy_index: int) -> Vector2:
	if enemy_index < 0 or enemy_index >= _enemy_buttons.size():
		return Vector2.ZERO
	var btn := _enemy_buttons[enemy_index]
	if not is_instance_valid(btn):
		return Vector2.ZERO
	return btn.global_position + btn.size * 0.5


## 获取玩家面板中心位置
func _get_player_center() -> Vector2:
	if _player_panel == null or not is_instance_valid(_player_panel):
		return Vector2.ZERO
	return _player_panel.global_position + _player_panel.size * 0.5


func _on_combat_won(remaining_hp: int) -> void:
	_status_label.text = "战斗胜利"
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null:
		audio_manager.play_sfx("victory")
	var run_controller: Variant = _autoload("RunController")
	run_controller.call_deferred("on_battle_won", remaining_hp)


func _on_combat_lost() -> void:
	_status_label.text = "战斗失败"
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null:
		audio_manager.play_sfx("defeat")
	var run_controller: Variant = _autoload("RunController")
	run_controller.call_deferred("on_battle_lost")


func _play_card_feedback() -> void:
	var audio_manager: Variant = _autoload("AudioManager")
	if audio_manager != null:
		audio_manager.play_sfx("card_place")


func _spawn_card_echo(card: Dictionary, hand_index: int) -> void:
	if card.is_empty() or hand_index < 0 or hand_index >= _hand_buttons.size():
		return
	var source := _hand_buttons[hand_index]
	if not is_instance_valid(source):
		return
	var echo: Button = CardViewFactoryScript.create_card_button(card, source.size)
	echo.disabled = true
	echo.global_position = source.global_position
	echo.z_index = 20
	add_child(echo)
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(echo, "global_position:y", echo.global_position.y - 26.0, 0.18)
	tween.tween_property(echo, "modulate:a", 0.0, 0.18)
	tween.finished.connect(echo.queue_free)


func _hit_enemy_feedback(enemy_index: int) -> void:
	if enemy_index < 0 or enemy_index >= _enemy_buttons.size():
		return
	var target := _enemy_buttons[enemy_index]
	if not is_instance_valid(target):
		return

	var original_x := target.position.x
	var shake_tween := create_tween()
	shake_tween.tween_property(target, "position:x", original_x + 10.0, 0.035)
	shake_tween.tween_property(target, "position:x", original_x - 8.0, 0.04)
	shake_tween.tween_property(target, "position:x", original_x + 5.0, 0.035)
	shake_tween.tween_property(target, "position:x", original_x, 0.04)

	var color_tween := create_tween()
	color_tween.tween_property(target, "modulate", Color(1.35, 0.58, 0.48, 1.0), 0.05)
	color_tween.tween_property(target, "modulate", Color.WHITE, 0.12)


func _spawn_enemy_damage_text(enemy_index: int, damage: int, blocked: int) -> void:
	if enemy_index < 0 or enemy_index >= _enemy_buttons.size():
		return
	var target := _enemy_buttons[enemy_index]
	if not is_instance_valid(target):
		return
	_spawn_damage_text(_damage_text(damage, blocked), target.global_position + Vector2(target.size.x * 0.5 - 26.0, 28.0), false)


func _spawn_player_damage_text(damage: int, blocked: int) -> void:
	if _player_panel == null or not is_instance_valid(_player_panel):
		return
	_spawn_damage_text(_damage_text(damage, blocked), _player_panel.global_position + Vector2(_player_panel.size.x * 0.5 - 26.0, 22.0), true)


func _damage_text(damage: int, blocked: int) -> String:
	if damage > 0:
		return "-%d" % damage
	if blocked > 0:
		return "格挡"
	return "0"


func _spawn_damage_text(text: String, start_position: Vector2, is_player: bool) -> void:
	var label := Label.new()
	label.text = text
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.custom_minimum_size = Vector2(72, 30)
	label.size = Vector2(72, 30)
	label.add_theme_font_size_override("font_size", 24)
	label.add_theme_color_override("font_color", Color(1.0, 0.35, 0.24) if not is_player else Color(1.0, 0.82, 0.36))
	label.add_theme_color_override("font_shadow_color", Color(0.05, 0.02, 0.01, 0.95))
	label.add_theme_constant_override("shadow_offset_x", 2)
	label.add_theme_constant_override("shadow_offset_y", 2)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.global_position = start_position
	label.z_index = 40
	add_child(label)

	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(label, "global_position:y", start_position.y - 42.0, 0.42).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tween.tween_property(label, "modulate:a", 0.0, 0.42).set_delay(0.08)
	tween.finished.connect(label.queue_free)


func _flash_player_panel() -> void:
	if _player_panel == null or not is_instance_valid(_player_panel):
		return
	var tween := create_tween()
	tween.tween_property(_player_panel, "modulate", Color(1.35, 1.22, 0.86, 1.0), 0.08)
	tween.tween_property(_player_panel, "modulate", Color.WHITE, 0.18)


func _make_bar(under_path: String, progress_path: String) -> TextureProgressBar:
	var bar := TextureProgressBar.new()
	bar.custom_minimum_size = Vector2(300, 24)
	bar.texture_under = load(under_path)
	bar.texture_progress = load(progress_path)
	bar.nine_patch_stretch = true
	bar.stretch_margin_left = 12
	bar.stretch_margin_right = 12
	bar.stretch_margin_top = 6
	bar.stretch_margin_bottom = 6
	bar.max_value = 1
	bar.value = 1
	return bar


func _make_label(text: String, font_size: int, align: HorizontalAlignment) -> Label:
	var label := Label.new()
	label.text = text
	label.horizontal_alignment = align
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", Color(0.96, 0.9, 0.78))
	label.add_theme_color_override("font_shadow_color", Color(0.06, 0.04, 0.025, 0.9))
	label.add_theme_constant_override("shadow_offset_x", 1)
	label.add_theme_constant_override("shadow_offset_y", 1)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return label


func _panel_style(color: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.border_color = Color(0.42, 0.31, 0.17, 0.9)
	style.set_border_width_all(1)
	style.set_corner_radius_all(8)
	style.content_margin_left = 10
	style.content_margin_top = 8
	style.content_margin_right = 10
	style.content_margin_bottom = 8
	return style


func _clear_children(node: Node) -> void:
	for child in node.get_children():
		child.queue_free()


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)


## 回合切换横幅提示
func _queue_turn_banner(text: String, color: Color) -> void:
	_banner_queue.append({"text": text, "color": color})
	if not _banner_playing:
		_play_next_banner()


func _play_next_banner() -> void:
	if _banner_queue.is_empty():
		_banner_playing = false
		return
	_banner_playing = true
	var entry: Dictionary = _banner_queue.pop_front()
	_spawn_turn_banner(entry["text"], entry["color"])


func _spawn_turn_banner(text: String, color: Color) -> void:
	var label := Label.new()
	label.text = text
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 48)
	label.add_theme_color_override("font_color", color)
	label.add_theme_color_override("font_shadow_color", Color(0.05, 0.02, 0.0, 0.95))
	label.add_theme_constant_override("shadow_offset_x", 3)
	label.add_theme_constant_override("shadow_offset_y", 3)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE

	## 居中显示
	label.set_anchors_preset(Control.PRESET_CENTER)
	label.size = Vector2(400, 80)
	label.position = -label.size * 0.5
	label.z_index = 80
	label.modulate = Color(color.r, color.g, color.b, 0.0)
	add_child(label)

	## 淡入 -> 停留 -> 淡出
	var tween := create_tween()
	tween.tween_property(label, "modulate:a", 1.0, 0.2)
	tween.tween_interval(0.6)
	tween.tween_property(label, "modulate:a", 0.0, 0.3)
	tween.finished.connect(label.queue_free)
	tween.finished.connect(_play_next_banner)
